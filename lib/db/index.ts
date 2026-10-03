import Dexie, { type EntityTable } from "dexie";

// ---------------------------------------------------------------------------
// Data models — these define the IndexedDB tables where ALL user data lives.
// Nothing is ever sent to a server or cloud database.
// ---------------------------------------------------------------------------

/** A photographed ledger page (the source image). */
export interface LedgerPage {
  id: string;
  createdAt: string; // ISO 8601
  thumbnailDataUrl: string; // small JPEG data-url for the page list
  notes: string;
}

/** A customer who appears in one or more ledger entries. */
export interface Customer {
  id: string;
  name: string;
  aliases: string[]; // alternate spellings found via fuzzy match
  phone?: string;
  createdAt: string;
}

/**
 * A single line item extracted from a ledger page.
 *
 * `direction` captures the shopkeeper's perspective:
 * - "credit_given"      → the customer took goods on credit (they owe more)
 * - "payment_received"  → the customer paid back some amount (they owe less)
 */
export interface LedgerEntry {
  id: string;
  pageId: string; // FK → LedgerPage.id
  customerId: string; // FK → Customer.id
  date: string | null; // ISO date string, or null if unreadable
  description: string;
  amount: number; // always positive
  direction: "credit_given" | "payment_received";
  currency: string; // e.g. "PKR", "INR"
  confidence: number; // 0..1 — how confident the AI was
  needsReview: boolean; // true when confidence < 0.7 or data is ambiguous
  rawText: string; // the original text as read by the AI
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Database class — Dexie wraps IndexedDB with a clean, typed API.
// We declare indexes (not all columns — Dexie stores the full object).
// ---------------------------------------------------------------------------

export class LedgerLensDB extends Dexie {
  pages!: EntityTable<LedgerPage, "id">;
  customers!: EntityTable<Customer, "id">;
  entries!: EntityTable<LedgerEntry, "id">;

  constructor() {
    super("LedgerLensDB");

    this.version(1).stores({
      // Indexed fields — other fields are stored but not indexed
      pages: "id, createdAt",
      customers: "id, name, createdAt",
      entries: "id, pageId, customerId, date, createdAt, needsReview",
    });
  }
}

/** Singleton database instance used throughout the app. */
export const db = new LedgerLensDB();
