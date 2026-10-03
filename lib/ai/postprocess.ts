import { parseAmount } from "@/lib/utils/amounts";
import { parseDate } from "@/lib/utils/dates";
import type { RawEntry, ProcessedEntry } from "./schemas";

/**
 * Post-process a single raw AI entry into a normalized, validated entry.
 * Applies amount/date normalization and flags entries needing review.
 */
export function processEntry(raw: RawEntry): ProcessedEntry {
  // Normalize amount
  const parsedAmount = parseAmount(raw.amount);
  const amount = parsedAmount ?? 0;
  const amountMissing = parsedAmount === null;

  // Normalize date
  const { date, ambiguous: dateAmbiguous } = parseDate(raw.date ?? null);

  // Determine if this entry needs human review
  const needsReview =
    raw.confidence < 0.7 ||
    amountMissing ||
    dateAmbiguous ||
    raw.customerName.trim() === "";

  return {
    date,
    customerName: raw.customerName.trim(),
    description: (raw.description ?? "").trim(),
    amount,
    direction: raw.direction,
    confidence: Math.round(raw.confidence * 100) / 100,
    needsReview,
    rawText: raw.rawText,
  };
}

/**
 * Post-process all entries from an AI extraction.
 */
export function processEntries(rawEntries: RawEntry[]): ProcessedEntry[] {
  return rawEntries.map(processEntry);
}

/**
 * Check if AI-extracted entries match a running/page total.
 *
 * Many ledger pages have a total at the bottom. If the sum of extracted
 * amounts doesn't match, we return a warning.
 *
 * @param entries - processed entries
 * @param pageTotal - total shown on the page (if detected)
 * @returns warning string or null
 */
export function checkArithmetic(
  entries: ProcessedEntry[],
  pageTotal?: number | null,
): string | null {
  if (pageTotal === null || pageTotal === undefined) return null;

  const creditSum = entries
    .filter((e) => e.direction === "credit_given")
    .reduce((sum, e) => sum + e.amount, 0);

  const paymentSum = entries
    .filter((e) => e.direction === "payment_received")
    .reduce((sum, e) => sum + e.amount, 0);

  const totalSum = creditSum + paymentSum;
  const netBalance = creditSum - paymentSum;

  // Check if the page total matches either the gross total or net balance
  const tolerance = 0.01;
  if (
    Math.abs(totalSum - pageTotal) > tolerance &&
    Math.abs(netBalance - pageTotal) > tolerance &&
    Math.abs(creditSum - pageTotal) > tolerance &&
    Math.abs(paymentSum - pageTotal) > tolerance
  ) {
    return (
      `Arithmetic mismatch: page shows total ${pageTotal}, ` +
      `but extracted entries sum to ${totalSum.toFixed(2)} ` +
      `(credits: ${creditSum.toFixed(2)}, payments: ${paymentSum.toFixed(2)}, ` +
      `net: ${netBalance.toFixed(2)}). Please verify.`
    );
  }

  return null;
}
