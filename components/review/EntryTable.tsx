"use client";

import { useState, useCallback } from "react";
import type { ProcessedEntry } from "@/lib/ai/schemas";
import { ConfidenceBadge } from "@/components/shared/ConfidenceBadge";

/** An entry being reviewed — adds an `approved` flag and a temp `id`. */
export interface ReviewEntry extends ProcessedEntry {
  tempId: string;
  approved: boolean;
}

interface EntryTableProps {
  entries: ReviewEntry[];
  onUpdate: (tempId: string, updates: Partial<ReviewEntry>) => void;
  onDelete: (tempId: string) => void;
  onApprove: (tempId: string) => void;
  onApproveAll: () => void;
}

/**
 * Editable table of extracted ledger entries.
 * - Low-confidence rows are highlighted in amber.
 * - Each cell is click-to-edit.
 * - Keyboard: Tab moves between cells, Enter saves.
 */
export function EntryTable({ entries, onUpdate, onDelete, onApprove, onApproveAll }: EntryTableProps) {
  const [editingCell, setEditingCell] = useState<{ tempId: string; field: string } | null>(null);

  const unapprovedCount = entries.filter((e) => !e.approved).length;

  return (
    <div className="w-full">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {entries.length} {entries.length === 1 ? "entry" : "entries"} extracted
          {unapprovedCount > 0 && (
            <span className="ml-1 text-amber-600 dark:text-amber-400">
              • {unapprovedCount} to review
            </span>
          )}
        </p>
        {unapprovedCount > 0 && (
          <button
            onClick={onApproveAll}
            className="text-sm px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
          >
            ✓ Approve All
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900 text-left">
              <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-400">Date</th>
              <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-400">Customer</th>
              <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-400 hidden sm:table-cell">Description</th>
              <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-400 text-right">Amount</th>
              <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-400">Type</th>
              <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-400 text-center">Conf.</th>
              <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-400 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {entries.map((entry) => (
              <EntryRow
                key={entry.tempId}
                entry={entry}
                editingCell={editingCell}
                onStartEdit={(field) => setEditingCell({ tempId: entry.tempId, field })}
                onEndEdit={() => setEditingCell(null)}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onApprove={onApprove}
              />
            ))}
          </tbody>
        </table>
      </div>

      {entries.length === 0 && (
        <p className="text-center text-gray-400 py-8">No entries extracted from this page.</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Individual row component
// ---------------------------------------------------------------------------

interface EntryRowProps {
  entry: ReviewEntry;
  editingCell: { tempId: string; field: string } | null;
  onStartEdit: (field: string) => void;
  onEndEdit: () => void;
  onUpdate: (tempId: string, updates: Partial<ReviewEntry>) => void;
  onDelete: (tempId: string) => void;
  onApprove: (tempId: string) => void;
}

function EntryRow({ entry, editingCell, onStartEdit, onEndEdit, onUpdate, onDelete, onApprove }: EntryRowProps) {
  const isEditing = (field: string) =>
    editingCell?.tempId === entry.tempId && editingCell?.field === field;

  const rowClass = entry.approved
    ? "bg-green-50/50 dark:bg-green-950/30"
    : entry.needsReview
      ? "bg-amber-50/50 dark:bg-amber-950/30"
      : "";

  return (
    <tr className={`${rowClass} hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors`}>
      {/* Date */}
      <td className="px-3 py-2">
        <EditableCell
          value={entry.date ?? "—"}
          isEditing={isEditing("date")}
          onStartEdit={() => onStartEdit("date")}
          onSave={(val) => {
            onUpdate(entry.tempId, { date: val || null });
            onEndEdit();
          }}
          onCancel={onEndEdit}
          className="w-24"
        />
      </td>

      {/* Customer Name */}
      <td className="px-3 py-2 font-medium">
        <EditableCell
          value={entry.customerName}
          isEditing={isEditing("customerName")}
          onStartEdit={() => onStartEdit("customerName")}
          onSave={(val) => {
            onUpdate(entry.tempId, { customerName: val });
            onEndEdit();
          }}
          onCancel={onEndEdit}
          className="w-32"
        />
      </td>

      {/* Description (hidden on small screens) */}
      <td className="px-3 py-2 text-gray-500 dark:text-gray-400 hidden sm:table-cell">
        <EditableCell
          value={entry.description || "—"}
          isEditing={isEditing("description")}
          onStartEdit={() => onStartEdit("description")}
          onSave={(val) => {
            onUpdate(entry.tempId, { description: val });
            onEndEdit();
          }}
          onCancel={onEndEdit}
          className="w-40"
        />
      </td>

      {/* Amount */}
      <td className="px-3 py-2 text-right tabular-nums">
        <EditableCell
          value={entry.amount.toString()}
          isEditing={isEditing("amount")}
          onStartEdit={() => onStartEdit("amount")}
          onSave={(val) => {
            const num = parseFloat(val);
            if (!isNaN(num) && num >= 0) {
              onUpdate(entry.tempId, { amount: Math.round(num * 100) / 100 });
            }
            onEndEdit();
          }}
          onCancel={onEndEdit}
          className="w-24 text-right"
          inputType="number"
        />
      </td>

      {/* Direction */}
      <td className="px-3 py-2">
        <button
          onClick={() =>
            onUpdate(entry.tempId, {
              direction: entry.direction === "credit_given" ? "payment_received" : "credit_given",
            })
          }
          className={`text-xs px-2 py-1 rounded-full font-medium ${
            entry.direction === "credit_given"
              ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
              : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
          }`}
          title="Click to toggle direction"
        >
          {entry.direction === "credit_given" ? "Credit" : "Paid"}
        </button>
      </td>

      {/* Confidence */}
      <td className="px-3 py-2 text-center">
        <ConfidenceBadge confidence={entry.confidence} />
      </td>

      {/* Actions */}
      <td className="px-3 py-2 text-center">
        <div className="flex items-center justify-center gap-1">
          {!entry.approved && (
            <button
              onClick={() => onApprove(entry.tempId)}
              className="p-1 rounded hover:bg-green-100 dark:hover:bg-green-900 text-green-600 dark:text-green-400"
              title="Approve this entry"
              aria-label="Approve entry"
            >
              ✓
            </button>
          )}
          <button
            onClick={() => onDelete(entry.tempId)}
            className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900 text-red-500 dark:text-red-400"
            title="Delete this entry"
            aria-label="Delete entry"
          >
            ✕
          </button>
        </div>
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Editable cell — click to edit, Enter/Tab to save, Escape to cancel
// ---------------------------------------------------------------------------

interface EditableCellProps {
  value: string;
  isEditing: boolean;
  onStartEdit: () => void;
  onSave: (value: string) => void;
  onCancel: () => void;
  className?: string;
  inputType?: "text" | "number";
}

function EditableCell({
  value,
  isEditing,
  onStartEdit,
  onSave,
  onCancel,
  className = "",
  inputType = "text",
}: EditableCellProps) {
  const [draft, setDraft] = useState(value);

  if (isEditing) {
    return (
      <input
        autoFocus
        type={inputType}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => onSave(draft)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === "Tab") {
            e.preventDefault();
            onSave(draft);
          }
          if (e.key === "Escape") {
            setDraft(value);
            onCancel();
          }
        }}
        className={`border border-blue-400 dark:border-blue-600 rounded px-1.5 py-0.5 text-sm bg-white dark:bg-gray-900 outline-none focus:ring-2 focus:ring-blue-300 ${className}`}
      />
    );
  }

  return (
    <span
      onClick={() => {
        setDraft(value);
        onStartEdit();
      }}
      className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950 px-1 py-0.5 rounded -mx-1 transition-colors"
      title="Click to edit"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          setDraft(value);
          onStartEdit();
        }
      }}
    >
      {value}
    </span>
  );
}
