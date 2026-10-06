"use client";

import { useState } from "react";
import Link from "next/link";
import { useCustomersWithBalances } from "@/lib/db/hooks";
import { EmptyState } from "@/components/shared/EmptyState";

/** 
 * Customer list page — shows all customers, their balances, and allows searching.
 * Sorted by balance descending (highest owed first).
 */
export default function CustomersPage() {
  const allCustomers = useCustomersWithBalances();
  const [search, setSearch] = useState("");

  const filtered = allCustomers.filter((item) =>
    item.customer.name.toLowerCase().includes(search.toLowerCase()) ||
    item.customer.aliases.some((alias) => alias.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Customers</h1>
      </div>

      {allCustomers.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No Customers Yet"
          description="Customers will appear here once you scan and save a ledger page."
        />
      ) : (
        <>
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.map(({ customer, balance }) => (
                <li key={customer.id}>
                  <Link
                    href={`/customers/${customer.id}`}
                    className="flex items-center justify-between px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div>
                      <p className="font-semibold">{customer.name}</p>
                      {customer.aliases.length > 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          aka: {customer.aliases.join(", ")}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <p
                        className={`font-semibold ${
                          balance > 0
                            ? "text-red-600 dark:text-red-400"
                            : balance < 0
                            ? "text-green-600 dark:text-green-400"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        Rs. {Math.abs(balance).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {balance > 0 ? "You are owed" : balance < 0 ? "You owe them" : "Settled"}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}

              {filtered.length === 0 && (
                <li className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  No customers found matching "{search}".
                </li>
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
