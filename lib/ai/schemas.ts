import { z } from "zod";

// ---------------------------------------------------------------------------
// Schema for a single raw entry as returned by the AI vision model.
// This is what the model outputs — before our post-processing.
// ---------------------------------------------------------------------------

export const RawEntrySchema = z.object({
  date: z
    .string()
    .nullable()
    .optional()
    .describe("Date of the transaction as written, or null if not visible"),
  customerName: z
    .string()
    .describe("Customer name as written on the ledger"),
  description: z
    .string()
    .optional()
    .default("")
    .describe("Description of goods/services, empty if not specified"),
  amount: z
    .union([z.number(), z.string()])
    .nullable()
    .optional()
    .describe("Transaction amount as a number or string, null if illegible"),
  direction: z
    .enum(["credit_given", "payment_received"])
    .describe("credit_given if customer owes, payment_received if customer paid"),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe("Confidence score 0-1 for this entry"),
  rawText: z
    .string()
    .describe("The original text of this line as read from the ledger"),
});

export type RawEntry = z.infer<typeof RawEntrySchema>;

// ---------------------------------------------------------------------------
// Schema for the full AI extraction response (array of entries + warnings).
// ---------------------------------------------------------------------------

export const ExtractionResponseSchema = z.object({
  entries: z
    .array(RawEntrySchema)
    .describe("Array of extracted ledger entries, one per line"),
  warnings: z
    .array(z.string())
    .optional()
    .default([])
    .describe("Page-level warnings like 'blurry photo' or 'bottom cut off'"),
});

export type ExtractionResponse = z.infer<typeof ExtractionResponseSchema>;

// ---------------------------------------------------------------------------
// Schema for the processed entry we return to the client.
// This is after normalization, validation, and review flagging.
// ---------------------------------------------------------------------------

export const ProcessedEntrySchema = z.object({
  date: z.string().nullable(),
  customerName: z.string(),
  description: z.string(),
  amount: z.number().nonnegative(),
  direction: z.enum(["credit_given", "payment_received"]),
  confidence: z.number().min(0).max(1),
  needsReview: z.boolean(),
  rawText: z.string(),
});

export type ProcessedEntry = z.infer<typeof ProcessedEntrySchema>;

// ---------------------------------------------------------------------------
// Schema for the full API response sent to the client.
// ---------------------------------------------------------------------------

export const ExtractAPIResponseSchema = z.object({
  success: z.boolean(),
  entries: z.array(ProcessedEntrySchema).optional(),
  warnings: z.array(z.string()).optional(),
  error: z.string().optional(),
});

export type ExtractAPIResponse = z.infer<typeof ExtractAPIResponseSchema>;

// ---------------------------------------------------------------------------
// JSON schema for Gemini structured output (plain object, not Zod).
// Gemini's response_schema needs a plain JSON Schema object.
// ---------------------------------------------------------------------------

export const GEMINI_RESPONSE_SCHEMA = {
  type: "object" as const,
  properties: {
    entries: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          date: { type: "string" as const, nullable: true, description: "Date as written, null if not visible" },
          customerName: { type: "string" as const, description: "Customer name as written" },
          description: { type: "string" as const, description: "Goods/services description" },
          amount: { type: "number" as const, nullable: true, description: "Amount as a number, null if illegible" },
          direction: { type: "string" as const, enum: ["credit_given", "payment_received"], description: "credit_given or payment_received" },
          confidence: { type: "number" as const, description: "Confidence 0-1" },
          rawText: { type: "string" as const, description: "Original text of this line" },
        },
        required: ["customerName", "direction", "confidence", "rawText"],
      },
      description: "One entry per ledger line",
    },
    warnings: {
      type: "array" as const,
      items: { type: "string" as const },
      description: "Page-level warnings",
    },
  },
  required: ["entries", "warnings"],
};
