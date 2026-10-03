import { describe, it, expect } from "vitest";
import { convertNumerals, parseAmount } from "@/lib/utils/amounts";

describe("convertNumerals", () => {
  it("converts Eastern Arabic numerals to standard digits", () => {
    expect(convertNumerals("٠١٢٣٤٥٦٧٨٩")).toBe("0123456789");
  });

  it("converts Devanagari numerals to standard digits", () => {
    expect(convertNumerals("०१२३४५६७८९")).toBe("0123456789");
  });

  it("leaves standard digits unchanged", () => {
    expect(convertNumerals("0123456789")).toBe("0123456789");
  });

  it("handles mixed numeral systems", () => {
    expect(convertNumerals("١٢3٤5")).toBe("12345");
  });

  it("preserves non-numeral text", () => {
    expect(convertNumerals("Rs. ١٥٠٠")).toBe("Rs. 1500");
  });
});

describe("parseAmount", () => {
  it("parses simple integers", () => {
    expect(parseAmount("500")).toBe(500);
  });

  it("parses decimals", () => {
    expect(parseAmount("1200.50")).toBe(1200.5);
  });

  it("strips currency symbol ₹", () => {
    expect(parseAmount("₹1500")).toBe(1500);
  });

  it("strips Rs. prefix", () => {
    expect(parseAmount("Rs. 500")).toBe(500);
  });

  it("strips Rs prefix without dot", () => {
    expect(parseAmount("Rs 250")).toBe(250);
  });

  it("strips trailing /-", () => {
    expect(parseAmount("500/-")).toBe(500);
  });

  it("handles commas (standard format)", () => {
    expect(parseAmount("1,200")).toBe(1200);
  });

  it("handles South Asian comma format (1,00,000)", () => {
    expect(parseAmount("1,00,000")).toBe(100000);
  });

  it("converts Eastern Arabic numerals", () => {
    expect(parseAmount("١٥٠٠")).toBe(1500);
  });

  it("converts Devanagari numerals", () => {
    expect(parseAmount("२५०")).toBe(250);
  });

  it("handles Eastern Arabic with commas", () => {
    expect(parseAmount("١,٥٠٠")).toBe(1500);
  });

  it("returns null for empty string", () => {
    expect(parseAmount("")).toBe(null);
  });

  it("returns null for null input", () => {
    expect(parseAmount(null)).toBe(null);
  });

  it("returns null for undefined input", () => {
    expect(parseAmount(undefined)).toBe(null);
  });

  it("returns null for non-numeric text", () => {
    expect(parseAmount("hello")).toBe(null);
  });

  it("passes through valid numbers", () => {
    expect(parseAmount(500)).toBe(500);
  });

  it("returns null for negative numbers", () => {
    expect(parseAmount(-100)).toBe(null);
  });

  it("rounds to 2 decimal places", () => {
    expect(parseAmount("100.999")).toBe(101);
  });

  it("handles ₨ symbol", () => {
    expect(parseAmount("₨500")).toBe(500);
  });
});
