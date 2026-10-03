/**
 * Normalize amount strings that may contain Eastern Arabic numerals (٠-٩),
 * Devanagari numerals (०-९), commas, currency symbols, or other formatting
 * into a standard JavaScript number.
 *
 * Examples:
 *   "١,٥٠٠" → 1500
 *   "२५०"   → 250
 *   "1,200.50" → 1200.50
 *   "Rs. 500" → 500
 *   "500/-"   → 500
 */

/** Map of Eastern Arabic (Arabic-Indic) numerals to standard digits. */
const EASTERN_ARABIC: Record<string, string> = {
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
  "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
};

/** Map of Devanagari numerals to standard digits. */
const DEVANAGARI: Record<string, string> = {
  "०": "0", "१": "1", "२": "2", "३": "3", "४": "4",
  "५": "5", "६": "6", "७": "7", "८": "8", "९": "9",
};

/** Replace Eastern Arabic and Devanagari numerals with standard 0-9 digits. */
export function convertNumerals(text: string): string {
  return text.replace(/[٠-٩]/g, (ch) => EASTERN_ARABIC[ch] ?? ch)
             .replace(/[०-९]/g, (ch) => DEVANAGARI[ch] ?? ch);
}

/**
 * Parse a raw amount string into a number.
 * Returns null if the string cannot be parsed into a valid positive number.
 */
export function parseAmount(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;

  // If it's already a number, just validate it
  if (typeof raw === "number") {
    return isFinite(raw) && raw >= 0 ? Math.round(raw * 100) / 100 : null;
  }

  // Convert non-standard numerals to standard digits
  let cleaned = convertNumerals(raw);

  // Remove currency symbols, "Rs", "Rs.", "₨", "₹", "/-", and whitespace
  cleaned = cleaned.replace(/[₹₨$]/g, "")
                    .replace(/Rs\.?\s*/gi, "")
                    .replace(/\/-/g, "")
                    .replace(/\s/g, "");

  // Handle South Asian comma format: 1,00,000 → 100000
  // Standard commas: 1,000 → 1000
  cleaned = cleaned.replace(/,/g, "");

  // Try to parse
  const num = parseFloat(cleaned);
  if (isNaN(num) || !isFinite(num) || num < 0) return null;

  return Math.round(num * 100) / 100;
}
