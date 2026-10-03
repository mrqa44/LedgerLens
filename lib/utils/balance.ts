import type { LedgerEntry } from "@/lib/db";

/**
 * Calculate the outstanding balance for a set of ledger entries.
 *
 * Formula: sum(credit_given) − sum(payment_received)
 *
 * A positive result means the customer owes the shopkeeper money.
 * A negative result means the shopkeeper owes the customer (overpayment).
 * Zero means the account is settled.
 *
 * This is a pure function with no side effects — easy to test.
 */
export function calculateBalance(entries: Pick<LedgerEntry, "amount" | "direction">[]): number {
  let balance = 0;

  for (const entry of entries) {
    if (entry.direction === "credit_given") {
      balance += entry.amount;
    } else {
      balance -= entry.amount;
    }
  }

  // Round to 2 decimal places to avoid floating-point drift
  return Math.round(balance * 100) / 100;
}
