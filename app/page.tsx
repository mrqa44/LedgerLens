import { EmptyState } from "@/components/shared/EmptyState";
import Link from "next/link";

/**
 * Home / Scan page — the main entry point for shopkeepers.
 * In Phase 1, this will have the camera capture and image upload.
 * For now, it shows a placeholder with the scan button.
 */
export default function HomePage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <EmptyState
        icon="📷"
        title="Scan Your Ledger"
        description="Take a photo of your handwritten ledger page and let AI extract the data for you."
      >
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-xl text-lg transition-colors shadow-sm"
          disabled
        >
          📷 Scan Ledger Page
        </button>
        <p className="text-sm text-gray-400 mt-3">Camera capture coming in Phase 1</p>
      </EmptyState>
    </div>
  );
}
