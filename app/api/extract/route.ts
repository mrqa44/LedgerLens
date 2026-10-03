import { NextRequest } from "next/server";
import { createExtractor } from "@/lib/ai/extractor";
import { processEntries, checkArithmetic } from "@/lib/ai/postprocess";
import type { ExtractAPIResponse } from "@/lib/ai/schemas";

// ---------------------------------------------------------------------------
// Simple in-memory rate limiter — per IP, max 10 requests per minute.
// Good enough for a hackathon; production would use Redis or Vercel KV.
// ---------------------------------------------------------------------------

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT;
}

// ---------------------------------------------------------------------------
// Allowed image MIME types and max size.
// ---------------------------------------------------------------------------

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// ---------------------------------------------------------------------------
// POST /api/extract — accepts a base64 image, returns structured entries.
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<Response> {
  try {
    // Rate limiting
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    if (isRateLimited(ip)) {
      return Response.json(
        {
          success: false,
          error: "Too many requests. Please wait a minute before trying again.",
        } satisfies ExtractAPIResponse,
        { status: 429 },
      );
    }

    // Parse request body
    const body = await request.json().catch(() => null);
    if (!body || typeof body.image !== "string") {
      return Response.json(
        {
          success: false,
          error: "Request must include an 'image' field with a base64-encoded image.",
        } satisfies ExtractAPIResponse,
        { status: 400 },
      );
    }

    const { image, mimeType = "image/jpeg" } = body as {
      image: string;
      mimeType?: string;
    };

    // Validate MIME type
    if (!ALLOWED_TYPES.has(mimeType)) {
      return Response.json(
        {
          success: false,
          error: `Unsupported image type: ${mimeType}. Use JPEG, PNG, or WebP.`,
        } satisfies ExtractAPIResponse,
        { status: 400 },
      );
    }

    // Validate image size (base64 is ~33% larger than the binary)
    const estimatedBytes = (image.length * 3) / 4;
    if (estimatedBytes > MAX_IMAGE_SIZE_BYTES) {
      return Response.json(
        {
          success: false,
          error: "Image is too large. Please use an image under 5 MB.",
        } satisfies ExtractAPIResponse,
        { status: 400 },
      );
    }

    // Call AI extractor
    const extractor = createExtractor();
    const result = await extractor.extract(image, mimeType);

    // Post-process entries
    const processed = processEntries(result.entries);

    // Arithmetic check (if page total hint exists in warnings)
    const warnings = [...result.warnings];
    const arithmeticWarning = checkArithmetic(processed);
    if (arithmeticWarning) {
      warnings.push(arithmeticWarning);
    }

    return Response.json({
      success: true,
      entries: processed,
      warnings,
    } satisfies ExtractAPIResponse);
  } catch (err) {
    // Never leak internal errors to the client
    console.error("Extraction error:", err);

    const message =
      err instanceof Error && err.message.includes("GEMINI_API_KEY")
        ? "AI service is not configured. Please set the GEMINI_API_KEY."
        : "Failed to extract data from the image. Please try again with a clearer photo.";

    return Response.json(
      { success: false, error: message } satisfies ExtractAPIResponse,
      { status: 500 },
    );
  }
}
