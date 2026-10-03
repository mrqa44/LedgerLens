import { describe, it, expect } from "vitest";
import { processEntry, checkArithmetic } from "@/lib/ai/postprocess";
import type { RawEntry, ProcessedEntry } from "@/lib/ai/schemas";

describe("processEntry", () => {
  it("normalizes a clean entry", () => {
    const raw: RawEntry = {
      date: "15/03/2024",
      customerName: "Ahmed Khan",
      description: "Sugar 5kg",
      amount: 500,
      direction: "credit_given",
      confidence: 0.95,
      rawText: "Ahmed Khan - Sugar 5kg - 500",
    };

    const result = processEntry(raw);
    expect(result.date).toBe("2024-03-15");
    expect(result.customerName).toBe("Ahmed Khan");
    expect(result.amount).toBe(500);
    expect(result.direction).toBe("credit_given");
    expect(result.needsReview).toBe(false);
  });

  it("flags low confidence entries for review", () => {
    const raw: RawEntry = {
      date: "15/03/2024",
      customerName: "Someone",
      description: "",
      amount: 100,
      direction: "credit_given",
      confidence: 0.4,
      rawText: "???",
    };

    const result = processEntry(raw);
    expect(result.needsReview).toBe(true);
  });

  it("flags entries with missing amount for review", () => {
    const raw: RawEntry = {
      customerName: "Ali",
      description: "",
      amount: null,
      direction: "credit_given",
      confidence: 0.9,
      rawText: "Ali - unknown amount",
    };

    const result = processEntry(raw);
    expect(result.amount).toBe(0);
    expect(result.needsReview).toBe(true);
  });

  it("flags entries with ambiguous dates for review", () => {
    const raw: RawEntry = {
      date: "05/06/2024", // Could be May 6 or June 5
      customerName: "Hassan",
      description: "",
      amount: 300,
      direction: "payment_received",
      confidence: 0.9,
      rawText: "Hassan paid 300",
    };

    const result = processEntry(raw);
    expect(result.needsReview).toBe(true); // Ambiguous date
  });

  it("flags entries with empty customer name for review", () => {
    const raw: RawEntry = {
      customerName: "  ",
      description: "",
      amount: 100,
      direction: "credit_given",
      confidence: 0.9,
      rawText: "??? 100",
    };

    const result = processEntry(raw);
    expect(result.needsReview).toBe(true);
  });

  it("handles string amounts from AI", () => {
    const raw: RawEntry = {
      customerName: "Bilal",
      description: "",
      amount: "1,500",
      direction: "credit_given",
      confidence: 0.85,
      rawText: "Bilal 1,500",
    };

    const result = processEntry(raw);
    expect(result.amount).toBe(1500);
  });

  it("trims whitespace from names and descriptions", () => {
    const raw: RawEntry = {
      customerName: "  Ahmed  ",
      description: "  Rice  ",
      amount: 100,
      direction: "credit_given",
      confidence: 0.9,
      rawText: "Ahmed Rice 100",
    };

    const result = processEntry(raw);
    expect(result.customerName).toBe("Ahmed");
    expect(result.description).toBe("Rice");
  });
});

describe("checkArithmetic", () => {
  const makeEntries = (amounts: [number, "credit_given" | "payment_received"][]): ProcessedEntry[] =>
    amounts.map(([amount, direction], i) => ({
      date: null,
      customerName: `Customer ${i}`,
      description: "",
      amount,
      direction,
      confidence: 0.9,
      needsReview: false,
      rawText: `${amount}`,
    }));

  it("returns null when no page total provided", () => {
    const entries = makeEntries([[100, "credit_given"]]);
    expect(checkArithmetic(entries)).toBe(null);
    expect(checkArithmetic(entries, null)).toBe(null);
    expect(checkArithmetic(entries, undefined)).toBe(null);
  });

  it("returns null when sum matches page total", () => {
    const entries = makeEntries([
      [100, "credit_given"],
      [200, "credit_given"],
      [50, "payment_received"],
    ]);
    // Total of all amounts = 350, credit sum = 300, payment sum = 50, net = 250
    expect(checkArithmetic(entries, 350)).toBe(null);
  });

  it("returns null when net balance matches page total", () => {
    const entries = makeEntries([
      [500, "credit_given"],
      [200, "payment_received"],
    ]);
    // Net = 300
    expect(checkArithmetic(entries, 300)).toBe(null);
  });

  it("returns null when credit sum matches page total", () => {
    const entries = makeEntries([
      [500, "credit_given"],
      [200, "payment_received"],
    ]);
    expect(checkArithmetic(entries, 500)).toBe(null);
  });

  it("returns a warning when nothing matches", () => {
    const entries = makeEntries([
      [100, "credit_given"],
      [200, "credit_given"],
    ]);
    const result = checkArithmetic(entries, 999);
    expect(result).toContain("Arithmetic mismatch");
    expect(result).toContain("999");
  });
});
