"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import { ImageViewer } from "@/components/review/ImageViewer";
import { EntryTable, type ReviewEntry } from "@/components/review/EntryTable";
import type { ProcessedEntry } from "@/lib/ai/schemas";

interface ReviewData {
  entries: ProcessedEntry[];
  warnings: string[];
  imageDataUrl: string;
}

/**
 * Review page — shows the original ledger image alongside an editable table
 * of extracted entries. The user can fix errors, approve entries, and save.
 *
 * Data flow:
 * 1. Home page extracts entries → stores in sessionStorage
 * 2. This page reads from sessionStorage and displays for review
 * 3. User edits/approves → "Save All" writes to IndexedDB (Phase 3)
 */
export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const pageId = params.pageId as string;

  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [entries, setEntries] = useState<ReviewEntry[]>([]);
  const [saved, setSaved] = useState(false);

  // Load review data from sessionStorage
  useEffect(() => {
    const key = `review-${pageId}`;
    const raw = sessionStorage.getItem(key);

    if (!raw) {
      // No data — maybe the user navigated here directly
      router.push("/");
      return;
    }

    try {
      const data: ReviewData = JSON.parse(raw);
      setReviewData(data);

      // Convert ProcessedEntries to ReviewEntries with temp IDs
      setEntries(
        data.entries.map((entry) => ({
          ...entry,
          tempId: nanoid(),
          approved: !entry.needsReview, // Auto-approve high-confidence entries
        })),
      );
    } catch {
      router.push("/");
    }
  }, [pageId, router]);

  const handleUpdate = useCallback((tempId: string, updates: Partial<ReviewEntry>) => {
    setEntries((prev) =>
      prev.map((e) => (e.tempId === tempId ? { ...e, ...updates } : e)),
    );
  }, []);

  const handleDelete = useCallback((tempId: string) => {
    setEntries((prev) => prev.filter((e) => e.tempId !== tempId));
  }, []);

  const handleApprove = useCallback((tempId: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.tempId === tempId ? { ...e, approved: true, needsReview: false } : e)),
    );
  }, []);

  const handleApproveAll = useCallback(() => {
    setEntries((prev) => prev.map((e) => ({ ...e, approved: true, needsReview: false })));
  }, []);

  const handleSaveAll = useCallback(async () => {
    // For now, just mark as saved. In Phase 3, this writes to IndexedDB
    // with customer name matching and linking.
    setSaved(true);

    // Store the reviewed entries for Phase 3 to pick up
    sessionStorage.setItem(
      `reviewed-${pageId}`,
      JSON.stringify(entries.map(({ tempId, approved, ...entry }) => entry)),
    );
  }, [entries, pageId]);

  if (!reviewData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-200 border-t-blue-600 rounded-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6">
      {/* Page header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Review Extracted Data</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Check the AI&apos;s work — edit any mistakes, then save.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 text-sm rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            ← Back
          </button>
          {!saved ? (
            <button
              onClick={handleSaveAll}
              className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors shadow-sm"
            >
              💾 Save All ({entries.length})
            </button>
          ) : (
            <button
              onClick={() => router.push("/customers")}
              className="px-4 py-2 text-sm rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors shadow-sm"
            >
              ✓ Saved — View Customers
            </button>
          )}
        </div>
      </div>

      {/* Warnings */}
      {reviewData.warnings.length > 0 && (
        <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
          <h3 className="font-medium text-amber-800 dark:text-amber-300 text-sm mb-1">
            ⚠️ Warnings
          </h3>
          <ul className="text-sm text-amber-700 dark:text-amber-400 list-disc list-inside">
            {reviewData.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Saved confirmation */}
      {saved && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300 text-sm">
          ✓ Entries saved successfully! Customer matching and balance computation will be available in the next update.
        </div>
      )}

      {/* Main content: image + table side by side (stacked on mobile) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Original image */}
        <div>
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            Original Page
          </h2>
          <ImageViewer src={reviewData.imageDataUrl} />
        </div>

        {/* Right: Editable table */}
        <div>
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            Extracted Entries
          </h2>
          <EntryTable
            entries={entries}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onApprove={handleApprove}
            onApproveAll={handleApproveAll}
          />

          {/* Raw text toggle (for debugging / viva) */}
          <details className="mt-4">
            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300">
              Show raw AI output
            </summary>
            <div className="mt-2 text-xs bg-gray-50 dark:bg-gray-900 rounded-lg p-3 space-y-1 max-h-48 overflow-y-auto">
              {entries.map((e) => (
                <div key={e.tempId} className="text-gray-500 dark:text-gray-400">
                  <span className="text-gray-700 dark:text-gray-300">{e.customerName}:</span>{" "}
                  {e.rawText}
                </div>
              ))}
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
