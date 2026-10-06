"use client";

import { useState } from "react";
import { db } from "@/lib/db";
import { exportToExcel, exportToCSV } from "@/lib/utils/export";

export default function SettingsPage() {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteData = async () => {
    if (window.confirm("Are you ABSOLUTELY sure? This will delete all your ledger pages, customers, and transactions. This cannot be undone.")) {
      if (window.confirm("Please confirm one more time. Delete everything?")) {
        setIsDeleting(true);
        try {
          await db.pages.clear();
          await db.customers.clear();
          await db.entries.clear();
          alert("All data has been deleted.");
          window.location.href = "/";
        } catch (err) {
          console.error(err);
          alert("Failed to delete data.");
          setIsDeleting(false);
        }
      }
    }
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="space-y-6">
        {/* Export Data */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-2xl">
          <h2 className="text-lg font-semibold mb-2">Export Data</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Download all your customers, balances, and transactions for backup or analysis.
          </p>
          <div className="flex gap-3">
            <button
              onClick={exportToExcel}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              Export as Excel (.xlsx)
            </button>
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-medium rounded-lg transition-colors"
            >
              Export as CSV
            </button>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-2xl">
          <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <span>🔒</span> Privacy & Data Security
          </h2>
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <p>
              <strong>Local-First:</strong> All your customer records, balances, and transaction history are stored <em>exclusively</em> on this device in your browser's IndexedDB. We do not have a central database.
            </p>
            <p>
              <strong>AI Extraction:</strong> When you scan a page, the image is temporarily sent to Google's Gemini AI to extract the text. The image is <em>not</em> stored on our servers.
            </p>
            <p>
              This means if you clear your browser data or switch devices without exporting, your data will be lost. We recommend exporting backups regularly.
            </p>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-6 rounded-2xl">
          <h2 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">Danger Zone</h2>
          <p className="text-sm text-red-600/80 dark:text-red-400/80 mb-4">
            Permanently delete all your local data. This action cannot be reversed.
          </p>
          <button
            onClick={handleDeleteData}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-100 dark:bg-red-900/50 hover:bg-red-200 dark:hover:bg-red-900 text-red-700 dark:text-red-300 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Delete All My Data"}
          </button>
        </div>
      </div>
    </div>
  );
}
