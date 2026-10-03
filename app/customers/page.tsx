import { EmptyState } from "@/components/shared/EmptyState";

/** Customer list page — built out in Phase 3. */
export default function CustomersPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Customers</h1>
      <EmptyState
        icon="👥"
        title="No Customers Yet"
        description="Customers will appear here once you scan and save a ledger page."
      />
    </div>
  );
}
