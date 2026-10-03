import { EmptyState } from "@/components/shared/EmptyState";

/** Settings page — built out in Phase 4. */
export default function SettingsPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {/* Privacy notice — always visible */}
      <div className="rounded-xl border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950 p-4 mb-6">
        <h2 className="font-semibold text-green-800 dark:text-green-300 mb-1">🔒 Your Data is Private</h2>
        <p className="text-sm text-green-700 dark:text-green-400">
          All your ledger data is stored only in this browser using IndexedDB. Nothing is sent to
          any server or cloud database. Only ledger images are temporarily sent to the AI for text
          extraction — they are never stored on our servers.
        </p>
      </div>

      <p className="text-sm text-gray-400">Full settings coming in Phase 4.</p>
    </div>
  );
}
