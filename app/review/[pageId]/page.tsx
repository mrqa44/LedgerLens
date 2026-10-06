"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import { db, type Customer } from "@/lib/db";
import { findMatchingCustomer } from "@/lib/utils/nameMatch";
import { ImageViewer } from "@/components/review/ImageViewer";
import { EntryTable, type ReviewEntry } from "@/components/review/EntryTable";
import { MergeDialog } from "@/components/review/MergeDialog";
import type { ProcessedEntry } from "@/lib/ai/schemas";

interface ReviewData {
  entries: ProcessedEntry[];
  warnings: string[];
  imageDataUrl: string;
}

type DialogAction = 
  | { type: "merge"; addAlias: boolean }
  | { type: "create" }
  | { type: "skip" };

interface MergeDialogState {
  entryName: string;
  matchedCustomer: Customer;
  matchScore: number;
  resolve: (action: DialogAction) => void;
}

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const pageId = params.pageId as string;

  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [entries, setEntries] = useState<ReviewEntry[]>([]);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // State for the modal
  const [dialogState, setDialogState] = useState<MergeDialogState | null>(null);

  // Load review data from sessionStorage
  useEffect(() => {
    const key = `review-${pageId}`;
    const raw = sessionStorage.getItem(key);

    if (!raw) {
      router.push("/");
      return;
    }

    try {
      const data: ReviewData = JSON.parse(raw);
      setReviewData(data);

      setEntries(
        data.entries.map((entry) => ({
          ...entry,
          tempId: nanoid(),
          approved: !entry.needsReview,
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

  // Helper to await user input from the dialog
  const promptMerge = (entryName: string, matchedCustomer: Customer, matchScore: number): Promise<DialogAction> => {
    return new Promise((resolve) => {
      setDialogState({
        entryName,
        matchedCustomer,
        matchScore,
        resolve: (action) => {
          setDialogState(null);
          resolve(action);
        },
      });
    });
  };

  const handleSaveAll = async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      // 1. Filter to approved entries only
      const approvedEntries = entries.filter((e) => e.approved);
      if (approvedEntries.length === 0) {
        setSaved(true);
        return;
      }

      // 2. Process sequentially to handle name matching logic properly
      for (const entry of approvedEntries) {
        if (!entry.customerName.trim()) continue;

        // Fetch latest customers (needed inside the loop because we might create one during it)
        const allCustomers = await db.customers.toArray();
        const match = findMatchingCustomer(entry.customerName, allCustomers);

        let finalCustomerId: string | null = null;

        if (match.customer && match.autoLink) {
          // It's a confident match
          finalCustomerId = match.customer.id;
        } else if (match.customer && match.ambiguous) {
          // Ambiguous — prompt the user
          const action = await promptMerge(entry.customerName, match.customer, match.score);
          
          if (action.type === "skip") {
            continue; // Ignore this entry completely
          } else if (action.type === "merge") {
            finalCustomerId = match.customer.id;
            if (action.addAlias) {
              const newAliases = [...new Set([...match.customer.aliases, entry.customerName.trim()])];
              await db.customers.update(finalCustomerId, { aliases: newAliases });
            }
          } else if (action.type === "create") {
            // User chose "Different Person"
            finalCustomerId = nanoid();
            await db.customers.add({
              id: finalCustomerId,
              name: entry.customerName.trim(),
              aliases: [],
              createdAt: new Date().toISOString(),
            });
          }
        } else {
          // No match at all — auto create
          finalCustomerId = nanoid();
          await db.customers.add({
            id: finalCustomerId,
            name: entry.customerName.trim(),
            aliases: [],
            createdAt: new Date().toISOString(),
          });
        }

        // Save the ledger entry to DB
        if (finalCustomerId) {
          await db.entries.add({
            id: nanoid(),
            pageId,
            customerId: finalCustomerId,
            date: entry.date,
            description: entry.description,
            amount: entry.amount,
            direction: entry.direction,
            currency: "PKR", // Could be configurable in settings later
            confidence: entry.confidence,
            needsReview: false, // It's approved now
            rawText: entry.rawText,
            createdAt: new Date().toISOString(),
          });
        }
      }

      // 3. Mark as saved and clear session storage
      setSaved(true);
      sessionStorage.removeItem(`review-${pageId}`);
      
    } catch (err) {
      console.error("Error saving entries:", err);
      alert("Failed to save some entries. Check console for details.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!reviewData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-200 border-t-blue-600 rounded-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6">
      {dialogState && (
        <MergeDialog
          entryName={dialogState.entryName}
          matchedCustomer={dialogState.matchedCustomer}
          matchScore={dialogState.matchScore}
          onMerge={(customerId, addAlias) => dialogState.resolve({ type: "merge", addAlias })}
          onCreateNew={() => dialogState.resolve({ type: "create" })}
          onSkip={() => dialogState.resolve({ type: "skip" })}
        />
      )}

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
            className="px-4 py-2 text-sm rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            disabled={isSaving}
          >
            ← Back
          </button>
          {!saved ? (
            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full" />
                  Saving...
                </>
              ) : (
                <>💾 Save All ({entries.filter(e => e.approved).length})</>
              )}
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
      {reviewData.warnings.length > 0 && !saved && (
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
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-xl">
          <h3 className="text-green-800 dark:text-green-300 font-semibold mb-1">
            ✓ Entries saved successfully!
          </h3>
          <p className="text-green-700 dark:text-green-400 text-sm">
            Customer balances have been updated. You can now view them on the Customers page.
          </p>
        </div>
      )}

      {/* Main content: image + table side by side (stacked on mobile) */}
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${saved ? 'opacity-50 pointer-events-none' : ''}`}>
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
