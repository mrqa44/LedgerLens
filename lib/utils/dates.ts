/**
 * Normalize various date formats found in handwritten ledgers into ISO date
 * strings (YYYY-MM-DD). Returns null if the date cannot be parsed.
 *
 * Supports:
 *   - "15/03/2024", "15-03-2024", "15.03.2024" (DD/MM/YYYY — common in South Asia)
 *   - "2024-03-15" (ISO)
 *   - "15 March 2024", "15 Mar 2024"
 *   - "March 15, 2024"
 *   - Partial dates: "15/03" (assumes current year)
 *   - Eastern Arabic / Devanagari numerals in dates
 */

import { convertNumerals } from "./amounts";

const MONTH_NAMES: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

/** Build ISO date string from parts, returns null if invalid. */
function toISO(day: number, month: number, year: number): string | null {
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  if (year < 1900 || year > 2100) return null;

  // Basic validation (doesn't check exact days-in-month, but good enough)
  const dateObj = new Date(year, month - 1, day);
  if (
    dateObj.getFullYear() !== year ||
    dateObj.getMonth() !== month - 1 ||
    dateObj.getDate() !== day
  ) {
    return null;
  }

  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

/** Expand 2-digit year: 00-49 → 2000s, 50-99 → 1900s */
function expandYear(y: number): number {
  if (y >= 100) return y;
  return y <= 49 ? 2000 + y : 1900 + y;
}

/**
 * Parse a raw date string into an ISO YYYY-MM-DD string.
 * Returns null if unparseable. Sets `ambiguous` flag in returned object
 * if the date interpretation could be wrong (e.g. DD/MM vs MM/DD ambiguity).
 */
export function parseDate(
  raw: string | null | undefined,
  currentYear?: number,
): { date: string | null; ambiguous: boolean } {
  if (!raw || raw.trim() === "") return { date: null, ambiguous: false };

  const thisYear = currentYear ?? new Date().getFullYear();
  let cleaned = convertNumerals(raw.trim());

  // --- ISO format: YYYY-MM-DD ---
  const isoMatch = cleaned.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return { date: toISO(parseInt(d), parseInt(m), parseInt(y)), ambiguous: false };
  }

  // --- DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY ---
  const dmy = cleaned.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    const day = parseInt(d);
    const month = parseInt(m);
    const year = expandYear(parseInt(y));
    // Flag as ambiguous if both day and month could be swapped (both ≤ 12)
    const ambiguous = day <= 12 && month <= 12 && day !== month;
    return { date: toISO(day, month, year), ambiguous };
  }

  // --- DD/MM (no year — assume current year) ---
  const dmNoYear = cleaned.match(/^(\d{1,2})[\/\-.](\d{1,2})$/);
  if (dmNoYear) {
    const [, d, m] = dmNoYear;
    const day = parseInt(d);
    const month = parseInt(m);
    const ambiguous = day <= 12 && month <= 12 && day !== month;
    return { date: toISO(day, month, thisYear), ambiguous };
  }

  // --- "15 March 2024" or "15 Mar 2024" ---
  const dayMonthYear = cleaned.match(/^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{2,4})$/);
  if (dayMonthYear) {
    const [, d, mName, y] = dayMonthYear;
    const month = MONTH_NAMES[mName.toLowerCase()];
    if (month) {
      return { date: toISO(parseInt(d), month, expandYear(parseInt(y))), ambiguous: false };
    }
  }

  // --- "March 15, 2024" ---
  const monthDayYear = cleaned.match(/^([a-zA-Z]+)\s+(\d{1,2}),?\s+(\d{2,4})$/);
  if (monthDayYear) {
    const [, mName, d, y] = monthDayYear;
    const month = MONTH_NAMES[mName.toLowerCase()];
    if (month) {
      return { date: toISO(parseInt(d), month, expandYear(parseInt(y))), ambiguous: false };
    }
  }

  // --- "15 March" or "15 Mar" (no year) ---
  const dayMonth = cleaned.match(/^(\d{1,2})\s+([a-zA-Z]+)$/);
  if (dayMonth) {
    const [, d, mName] = dayMonth;
    const month = MONTH_NAMES[mName.toLowerCase()];
    if (month) {
      return { date: toISO(parseInt(d), month, thisYear), ambiguous: false };
    }
  }

  return { date: null, ambiguous: false };
}
