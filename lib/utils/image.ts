/**
 * Client-side image resizing and compression.
 *
 * Why: Vercel has a ~4.5 MB request body limit. A phone camera photo can be
 * 5-10 MB. We resize to max 1600px on the longest side and compress to JPEG
 * quality 0.8, which typically yields 200-400 KB — well within limits and
 * still good enough for AI vision models to read handwriting.
 */

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.8;

/**
 * Resize an image File/Blob to fit within MAX_DIMENSION and return as a
 * base64 data URL (JPEG).
 *
 * This runs entirely in the browser using the Canvas API — no server needed.
 */
export async function resizeImage(file: File | Blob): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;

  // Calculate new dimensions maintaining aspect ratio
  let newWidth = width;
  let newHeight = height;

  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    if (width > height) {
      newWidth = MAX_DIMENSION;
      newHeight = Math.round((height / width) * MAX_DIMENSION);
    } else {
      newHeight = MAX_DIMENSION;
      newWidth = Math.round((width / height) * MAX_DIMENSION);
    }
  }

  // Draw onto an OffscreenCanvas (if available) or regular canvas
  const canvas = document.createElement("canvas");
  canvas.width = newWidth;
  canvas.height = newHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas 2D context");

  ctx.drawImage(bitmap, 0, 0, newWidth, newHeight);
  bitmap.close();

  // Convert to JPEG base64
  const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  return dataUrl;
}

/**
 * Extract the raw base64 string from a data URL.
 * "data:image/jpeg;base64,/9j/4AAQ..." → "/9j/4AAQ..."
 */
export function dataUrlToBase64(dataUrl: string): string {
  const commaIndex = dataUrl.indexOf(",");
  if (commaIndex === -1) return dataUrl;
  return dataUrl.substring(commaIndex + 1);
}

/**
 * Create a smaller thumbnail for the page list (400px max).
 */
export async function createThumbnail(file: File | Blob): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;

  const MAX_THUMB = 400;
  let newWidth = width;
  let newHeight = height;

  if (width > MAX_THUMB || height > MAX_THUMB) {
    if (width > height) {
      newWidth = MAX_THUMB;
      newHeight = Math.round((height / width) * MAX_THUMB);
    } else {
      newHeight = MAX_THUMB;
      newWidth = Math.round((width / height) * MAX_THUMB);
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = newWidth;
  canvas.height = newHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas 2D context");

  ctx.drawImage(bitmap, 0, 0, newWidth, newHeight);
  bitmap.close();

  return canvas.toDataURL("image/jpeg", 0.6);
}
