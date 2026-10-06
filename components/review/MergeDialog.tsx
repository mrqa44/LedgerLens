"use client";

import { useState } from "react";
import type { Customer } from "@/lib/db";

interface MergeDialogProps {
  /** The name as written on the ledger. */
  entryName: string;
  /** The existing customer that fuzzy-matched. */
  matchedCustomer: Customer;
  /** Match score (0 = perfect match). */
  matchScore: number;
  /** Called when user chooses to link to the existing customer. */
  onMerge: (customerId: string, addAlias: boolean) => void;
  /** Called when user chooses to create a new customer. */
  onCreateNew: () => void;
  /** Called to dismiss without choosing. */
  onSkip: () => void;
}

/**
 * Dialog that appears when a customer name is ambiguously matched.
 * Asks the user: "Is this the same customer?" with merge or create options.
 */
export function MergeDialog({
  entryName,
  matchedCustomer,
  matchScore,
  onMerge,
  onCreateNew,
  onSkip,
}: MergeDialogProps) {
  const [addAlias, setAddAlias] = useState(true);
  const similarityPct = Math.round((1 - matchScore) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold mb-2">Similar Customer Found</h3>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          The name <strong className="text-gray-900 dark:text-gray-100">&ldquo;{entryName}&rdquo;</strong>{" "}
          looks similar to an existing customer ({similarityPct}% match):
        </p>

        {/* Existing customer card */}
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4">
          <p className="font-semibold text-blue-900 dark:text-blue-200">
            {matchedCustomer.name}
          </p>
          {matchedCustomer.aliases.length > 0 && (
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              Also known as: {matchedCustomer.aliases.join(", ")}
            </p>
          )}
        </div>

        {/* Add alias checkbox */}
        <label className="flex items-center gap-2 text-sm mb-6 cursor-pointer">
          <input
            type="checkbox"
            checked={addAlias}
            onChange={(e) => setAddAlias(e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-gray-600 dark:text-gray-400">
            Save &ldquo;{entryName}&rdquo; as an alternate spelling
          </span>
        </label>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => onMerge(matchedCustomer.id, addAlias)}
            className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
          >
            Same Customer
          </button>
          <button
            onClick={onCreateNew}
            className="flex-1 py-2.5 px-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl font-medium transition-colors"
          >
            Different Person
          </button>
          <button
            onClick={onSkip}
            className="py-2.5 px-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm transition-colors"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
