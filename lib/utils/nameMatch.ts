import Fuse from "fuse.js";
import type { Customer } from "@/lib/db";

/** Result from a fuzzy name match. */
export interface NameMatchResult {
  /** The matched customer, or null if no good match. */
  customer: Customer | null;
  /** Match score: 0 = perfect, 1 = no match. Lower is better. */
  score: number;
  /** Whether this is a confident auto-link (score < threshold). */
  autoLink: boolean;
  /** Whether this is ambiguous (close to threshold, needs user input). */
  ambiguous: boolean;
}

// Threshold tuning:
// - Below AUTO_LINK_THRESHOLD → auto-link without asking
// - Between AUTO_LINK and AMBIGUOUS → ask user to confirm
// - Above AMBIGUOUS_THRESHOLD → create new customer
const AUTO_LINK_THRESHOLD = 0.25;
const AMBIGUOUS_THRESHOLD = 0.5;

/**
 * Find the best matching customer for a given name.
 *
 * Searches both `name` and `aliases` using Fuse.js fuzzy matching.
 * Returns match info so the caller can decide: auto-link, ask user, or create new.
 */
export function findMatchingCustomer(
  name: string,
  customers: Customer[],
): NameMatchResult {
  if (!name.trim() || customers.length === 0) {
    return { customer: null, score: 1, autoLink: false, ambiguous: false };
  }

  const fuse = new Fuse(customers, {
    keys: ["name", "aliases"],
    threshold: AMBIGUOUS_THRESHOLD,
    includeScore: true,
    // Use extended search for better matching of partial names
    ignoreLocation: true,
    minMatchCharLength: 2,
  });

  const results = fuse.search(name.trim());

  if (results.length === 0) {
    return { customer: null, score: 1, autoLink: false, ambiguous: false };
  }

  const best = results[0];
  const score = best.score ?? 1;

  return {
    customer: best.item,
    score,
    autoLink: score < AUTO_LINK_THRESHOLD,
    ambiguous: score >= AUTO_LINK_THRESHOLD && score < AMBIGUOUS_THRESHOLD,
  };
}

/**
 * Batch-match a list of customer names against existing customers.
 * Groups results by match type for the UI to handle.
 */
export function batchMatchNames(
  names: string[],
  customers: Customer[],
): Map<string, NameMatchResult> {
  const results = new Map<string, NameMatchResult>();

  // Deduplicate names for efficiency
  const uniqueNames = [...new Set(names.map((n) => n.trim()).filter(Boolean))];

  for (const name of uniqueNames) {
    results.set(name, findMatchingCustomer(name, customers));
  }

  return results;
}
