"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db, type Customer, type LedgerEntry, type LedgerPage } from "@/lib/db";
import { calculateBalance } from "@/lib/utils/balance";

/** All ledger pages, newest first. */
export function usePages(): LedgerPage[] {
  return useLiveQuery(() => db.pages.orderBy("createdAt").reverse().toArray()) ?? [];
}

/** All customers, sorted by name. */
export function useCustomers(): Customer[] {
  return useLiveQuery(() => db.customers.orderBy("name").toArray()) ?? [];
}

/** All customers with their computed balances, sorted by balance descending. */
export function useCustomersWithBalances(): { customer: Customer; balance: number }[] {
  return (
    useLiveQuery(async () => {
      const customers = await db.customers.toArray();
      const allEntries = await db.entries.toArray();

      // Group entries by customerId
      const entriesByCustomer = new Map<string, LedgerEntry[]>();
      for (const entry of allEntries) {
        const list = entriesByCustomer.get(entry.customerId) ?? [];
        list.push(entry);
        entriesByCustomer.set(entry.customerId, list);
      }

      // Compute balances
      const result = customers.map((customer) => ({
        customer,
        balance: calculateBalance(entriesByCustomer.get(customer.id) ?? []),
      }));

      // Sort by balance descending (highest owed first)
      result.sort((a, b) => b.balance - a.balance);
      return result;
    }) ?? []
  );
}

/** Entries for a specific customer, newest first. */
export function useCustomerEntries(customerId: string): LedgerEntry[] {
  return (
    useLiveQuery(
      () => db.entries.where("customerId").equals(customerId).reverse().sortBy("createdAt"),
      [customerId],
    ) ?? []
  );
}

/** Entries for a specific page. */
export function usePageEntries(pageId: string): LedgerEntry[] {
  return (
    useLiveQuery(
      () => db.entries.where("pageId").equals(pageId).toArray(),
      [pageId],
    ) ?? []
  );
}

/** A single customer by ID. */
export function useCustomer(customerId: string): Customer | undefined {
  return useLiveQuery(() => db.customers.get(customerId), [customerId]);
}

/** All entries (for dashboard aggregations). */
export function useAllEntries(): LedgerEntry[] {
  return useLiveQuery(() => db.entries.toArray()) ?? [];
}

/** Count of entries needing review. */
export function useReviewCount(): number {
  return (
    useLiveQuery(() => db.entries.where("needsReview").equals(1).count()) ?? 0
  );
}
