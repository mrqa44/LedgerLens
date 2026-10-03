import { EmptyState } from "@/components/shared/EmptyState";

/** Dashboard page — built out in Phase 4. */
export default function DashboardPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <EmptyState
        icon="📊"
        title="No Data to Display"
        description="Your business overview will appear here once you have scanned some ledger pages."
      />
    </div>
  );
}
