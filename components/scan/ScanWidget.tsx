"use client";

import { useRef, useState, useCallback, type ChangeEvent, type DragEvent } from "react";
import { resizeImage, dataUrlToBase64, createThumbnail } from "@/lib/utils/image";
import type { ExtractAPIResponse, ProcessedEntry } from "@/lib/ai/schemas";

interface ScanWidgetProps {
  /** Called when extraction is complete with processed entries and page thumbnail. */
  onExtracted: (data: {
    entries: ProcessedEntry[];
    warnings: string[];
    imageDataUrl: string;
    thumbnailDataUrl: string;
  }) => void;
}

type ScanState = "idle" | "preview" | "uploading" | "error";

const FRIENDLY_MESSAGES = [
  "Reading your handwriting…",
  "Decoding the numbers…",
  "Matching customer names…",
  "Almost there…",
];

/**
 * Combined scan widget: camera capture, file upload, and drag-and-drop.
 * Handles image resize, API call, and shows progress states.
 */
export function ScanWidget({ onExtracted }: ScanWidgetProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<ScanState>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progressMsg, setProgressMsg] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  // Track the raw file for resubmission
  const selectedFileRef = useRef<File | null>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (JPEG, PNG, or WebP).");
      setState("error");
      return;
    }

    selectedFileRef.current = file;

    // Generate preview
    const preview = await resizeImage(file);
    setPreviewUrl(preview);
    setState("preview");
    setError(null);
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset so the same file can be re-selected
    e.target.value = "";
  };

  // Drag and drop handlers
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleExtract = async () => {
    const file = selectedFileRef.current;
    if (!file || !previewUrl) return;

    setState("uploading");
    setError(null);

    // Show rotating progress messages
    let msgIndex = 0;
    setProgressMsg(FRIENDLY_MESSAGES[0]);
    const interval = setInterval(() => {
      msgIndex = (msgIndex + 1) % FRIENDLY_MESSAGES.length;
      setProgressMsg(FRIENDLY_MESSAGES[msgIndex]);
    }, 2500);

    try {
      // Resize and compress
      const resizedDataUrl = await resizeImage(file);
      const base64 = dataUrlToBase64(resizedDataUrl);
      const thumbnailDataUrl = await createThumbnail(file);

      // Call extraction API
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64,
          mimeType: "image/jpeg",
        }),
      });

      const data: ExtractAPIResponse = await response.json();

      if (!data.success || !data.entries) {
        throw new Error(data.error || "Extraction failed");
      }

      onExtracted({
        entries: data.entries,
        warnings: data.warnings ?? [],
        imageDataUrl: resizedDataUrl,
        thumbnailDataUrl,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setState("error");
    } finally {
      clearInterval(interval);
    }
  };

  const handleReset = () => {
    setState("idle");
    setPreviewUrl(null);
    setError(null);
    selectedFileRef.current = null;
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* ── Idle state: upload/capture buttons ── */}
      {(state === "idle" || state === "error") && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${
            isDragging
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
              : "border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600"
          }`}
        >
          <span className="text-5xl mb-4 block">📷</span>
          <h2 className="text-xl font-semibold mb-2">Scan Your Ledger Page</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
            Take a photo or upload an image of your handwritten ledger
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {/* Camera capture (shows camera UI on mobile) */}
            <button
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.accept = "image/*";
                  fileInputRef.current.capture = "environment";
                  fileInputRef.current.click();
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-xl transition-colors shadow-sm text-lg"
            >
              📷 Take Photo
            </button>

            {/* File upload */}
            <button
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.removeAttribute("capture");
                  fileInputRef.current.accept = "image/jpeg,image/png,image/webp";
                  fileInputRef.current.click();
                }
              }}
              className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium px-6 py-3 rounded-xl transition-colors text-lg"
            >
              📁 Upload Image
            </button>
          </div>

          <p className="text-xs text-gray-400 mt-4">
            Or drag and drop an image here • JPEG, PNG, WebP
          </p>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleInputChange}
          />

          {/* Error message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}
        </div>
      )}

      {/* ── Preview state: show image and confirm ── */}
      {state === "preview" && previewUrl && (
        <div className="space-y-4">
          <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800">
            <img
              src={previewUrl}
              alt="Ledger page preview"
              className="w-full h-auto max-h-[60vh] object-contain bg-gray-50 dark:bg-gray-900"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="flex-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium py-3 rounded-xl transition-colors"
            >
              ← Retake
            </button>
            <button
              onClick={handleExtract}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors shadow-sm"
            >
              ✨ Extract Data
            </button>
          </div>
        </div>
      )}

      {/* ── Uploading state: show progress ── */}
      {state === "uploading" && (
        <div className="text-center py-12">
          <div className="animate-spin h-12 w-12 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4" />
          <p className="text-lg font-medium mb-1">Extracting data…</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm animate-pulse">
            {progressMsg}
          </p>
        </div>
      )}
    </div>
  );
}
