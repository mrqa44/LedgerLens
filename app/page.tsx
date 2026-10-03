"use client";

import { ScanWidget } from "@/components/scan/ScanWidget";
import type { ProcessedEntry } from "@/lib/ai/schemas";
import { useRouter } from "next/navigation";
import { db } from "@/lib/db";
import { nanoid } from "nanoid";
import { useState } from "react";

/**
 * Home / Scan page — the main entry point.
 * After extraction, saves the page to IndexedDB and navigates to review.
 */
export default function HomePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleExtracted = async (data: {
    entries: ProcessedEntry[];
    warnings: string[];
    imageDataUrl: string;
    thumbnailDataUrl: string;
  }) => {
    try {
      // Create a new LedgerPage in IndexedDB
      const pageId = nanoid();
      await db.pages.add({
        id: pageId,
        createdAt: new Date().toISOString(),
        thumbnailDataUrl: data.thumbnailDataUrl,
        notes: data.warnings.join("\n"),
      });

      // Store extracted entries temporarily in sessionStorage for the review page
      // (they haven't been saved to IndexedDB yet — the user reviews first)
      sessionStorage.setItem(
        `review-${pageId}`,
        JSON.stringify({
          entries: data.entries,
          warnings: data.warnings,
          imageDataUrl: data.imageDataUrl,
        }),
      );

      // Navigate to the review screen
      router.push(`/review/${pageId}`);
    } catch (err) {
      console.error("Failed to save page:", err);
      setError("Failed to save the scanned page. Please try again.");
    }
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">LedgerLens</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Digitize your handwritten shop ledger with AI
        </p>
      </div>

      <ScanWidget onExtracted={handleExtracted} />

      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm text-center">
          {error}
        </div>
      )}

      {/* Quick stats — how many pages scanned so far */}
      <div className="mt-12 text-center text-sm text-gray-400">
        <p>Your data stays in this browser. Nothing is stored on our servers.</p>
      </div>
    </div>
  );
}
