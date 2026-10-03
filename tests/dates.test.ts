import { describe, it, expect } from "vitest";
import { parseDate } from "@/lib/utils/dates";

// Use a fixed year for deterministic tests
const YEAR = 2024;

describe("parseDate", () => {
  it("parses ISO format (YYYY-MM-DD)", () => {
    expect(parseDate("2024-03-15", YEAR)).toEqual({ date: "2024-03-15", ambiguous: false });
  });

  it("parses DD/MM/YYYY", () => {
    expect(parseDate("15/03/2024", YEAR)).toEqual({ date: "2024-03-15", ambiguous: false });
  });

  it("parses DD-MM-YYYY", () => {
    expect(parseDate("15-03-2024", YEAR)).toEqual({ date: "2024-03-15", ambiguous: false });
  });

  it("parses DD.MM.YYYY", () => {
    expect(parseDate("15.03.2024", YEAR)).toEqual({ date: "2024-03-15", ambiguous: false });
  });

  it("parses 2-digit year (24 → 2024)", () => {
    expect(parseDate("15/03/24", YEAR)).toEqual({ date: "2024-03-15", ambiguous: false });
  });

  it("parses 2-digit year (99 → 1999)", () => {
    expect(parseDate("15/03/99", YEAR)).toEqual({ date: "1999-03-15", ambiguous: false });
  });

  it("flags ambiguous DD/MM when both ≤ 12", () => {
    const result = parseDate("03/05/2024", YEAR);
    // Interprets as DD=3, MM=5 (South Asian convention) but flags ambiguous
    expect(result.date).toBe("2024-05-03");
    expect(result.ambiguous).toBe(true);
  });

  it("does not flag ambiguous when day > 12", () => {
    const result = parseDate("25/03/2024", YEAR);
    expect(result.ambiguous).toBe(false);
  });

  it("does not flag ambiguous when day equals month", () => {
    const result = parseDate("05/05/2024", YEAR);
    expect(result.ambiguous).toBe(false);
  });

  it("parses DD/MM (no year, assumes current year)", () => {
    expect(parseDate("15/03", YEAR)).toEqual({ date: "2024-03-15", ambiguous: false });
  });

  it("parses '15 March 2024'", () => {
    expect(parseDate("15 March 2024", YEAR)).toEqual({ date: "2024-03-15", ambiguous: false });
  });

  it("parses '15 Mar 2024'", () => {
    expect(parseDate("15 Mar 2024", YEAR)).toEqual({ date: "2024-03-15", ambiguous: false });
  });

  it("parses 'March 15, 2024'", () => {
    expect(parseDate("March 15, 2024", YEAR)).toEqual({ date: "2024-03-15", ambiguous: false });
  });

  it("parses '15 March' (no year)", () => {
    expect(parseDate("15 March", YEAR)).toEqual({ date: "2024-03-15", ambiguous: false });
  });

  it("returns null for empty string", () => {
    expect(parseDate("", YEAR)).toEqual({ date: null, ambiguous: false });
  });

  it("returns null for null input", () => {
    expect(parseDate(null, YEAR)).toEqual({ date: null, ambiguous: false });
  });

  it("returns null for unparseable text", () => {
    expect(parseDate("yesterday", YEAR)).toEqual({ date: null, ambiguous: false });
  });

  it("returns null for invalid date (Feb 30)", () => {
    expect(parseDate("30/02/2024", YEAR)).toEqual({ date: null, ambiguous: false });
  });

  it("handles Eastern Arabic numerals in dates", () => {
    // ١٥/٠٣/٢٠٢٤ = 15/03/2024
    expect(parseDate("١٥/٠٣/٢٠٢٤", YEAR)).toEqual({ date: "2024-03-15", ambiguous: false });
  });
});
