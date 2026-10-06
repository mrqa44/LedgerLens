"use client";

import { useParams, useRouter } from "next/navigation";
import { useCustomer, useCustomerEntries } from "@/lib/db/hooks";
import { calculateBalance } from "@/lib/utils/balance";
import { EmptyState } from "@/components/shared/EmptyState";

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;

  const customer = useCustomer(customerId);
  const entries = useCustomerEntries(customerId);

  if (customer === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-200 border-t-blue-600 rounded-full" />
      </div>
    );
  }

  if (customer === null) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <EmptyState
          icon="🤷"
          title="Customer Not Found"
          description="This customer does not exist or has been deleted."
        />
        <div className="mt-4 text-center">
          <button
            onClick={() => router.push("/customers")}
            className="text-blue-600 hover:underline"
          >
            ← Back to Customers
          </button>
        </div>
      </div>
    );
  }

  const balance = calculateBalance(entries);

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/customers")}
          className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 mb-4 transition-colors"
        >
          ← Back to Customers
        </button>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800">
          <div>
            <h1 className="text-2xl font-bold">{customer.name}</h1>
            {customer.aliases.length > 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Also known as: {customer.aliases.join(", ")}
              </p>
            )}
            <p className="text-xs text-gray-400 mt-2">
              Added: {new Date(customer.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Balance</p>
            <p
              className={`text-3xl font-bold ${
                balance > 0
                  ? "text-red-600 dark:text-red-400"
                  : balance < 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-gray-500"
              }`}
            >
              Rs. {Math.abs(balance).toFixed(2)}
            </p>
            <p className="text-xs font-medium mt-1 uppercase tracking-wider">
              {balance > 0 ? "You are owed" : balance < 0 ? "You owe them" : "Settled"}
            </p>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <h2 className="text-lg font-semibold mb-4">Transaction History</h2>

      {entries.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No transactions recorded yet.</p>
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {entries.map((entry) => (
              <li key={entry.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium mr-2 ${
                        entry.direction === "credit_given"
                          ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                          : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                      }`}
                    >
                      {entry.direction === "credit_given" ? "Credit Given" : "Payment Received"}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                      {entry.date ? new Date(entry.date).toLocaleDateString() : "Unknown Date"}
                    </span>
                  </div>
                  <span
                    className={`font-semibold ${
                      entry.direction === "credit_given"
                        ? "text-red-600 dark:text-red-400"
                        : "text-green-600 dark:text-green-400"
                    }`}
                  >
                    {entry.direction === "credit_given" ? "+" : "-"} Rs. {entry.amount.toFixed(2)}
                  </span>
                </div>
                {entry.description && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                    {entry.description}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-2 font-mono">
                  Raw text: {entry.rawText}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
