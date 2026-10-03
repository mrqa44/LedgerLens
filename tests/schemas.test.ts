import { describe, it, expect } from "vitest";
import { ExtractionResponseSchema, RawEntrySchema } from "@/lib/ai/schemas";

describe("RawEntrySchema", () => {
  it("accepts a valid entry", () => {
    const entry = {
      date: "15/03/2024",
      customerName: "Ahmed",
      description: "Rice 10kg",
      amount: 1500,
      direction: "credit_given",
      confidence: 0.9,
      rawText: "Ahmed - Rice 10kg - 1500",
    };
    expect(RawEntrySchema.safeParse(entry).success).toBe(true);
  });

  it("accepts null date", () => {
    const entry = {
      date: null,
      customerName: "Ali",
      amount: 200,
      direction: "payment_received",
      confidence: 0.8,
      rawText: "Ali paid 200",
    };
    expect(RawEntrySchema.safeParse(entry).success).toBe(true);
  });

  it("accepts null amount", () => {
    const entry = {
      customerName: "Hassan",
      amount: null,
      direction: "credit_given",
      confidence: 0.3,
      rawText: "Hassan - ???",
    };
    expect(RawEntrySchema.safeParse(entry).success).toBe(true);
  });

  it("accepts string amount", () => {
    const entry = {
      customerName: "Bilal",
      amount: "1,500",
      direction: "credit_given",
      confidence: 0.7,
      rawText: "Bilal 1,500",
    };
    expect(RawEntrySchema.safeParse(entry).success).toBe(true);
  });

  it("rejects invalid direction", () => {
    const entry = {
      customerName: "Test",
      amount: 100,
      direction: "unknown",
      confidence: 0.5,
      rawText: "test",
    };
    expect(RawEntrySchema.safeParse(entry).success).toBe(false);
  });

  it("rejects confidence > 1", () => {
    const entry = {
      customerName: "Test",
      amount: 100,
      direction: "credit_given",
      confidence: 1.5,
      rawText: "test",
    };
    expect(RawEntrySchema.safeParse(entry).success).toBe(false);
  });

  it("rejects confidence < 0", () => {
    const entry = {
      customerName: "Test",
      amount: 100,
      direction: "credit_given",
      confidence: -0.1,
      rawText: "test",
    };
    expect(RawEntrySchema.safeParse(entry).success).toBe(false);
  });
});

describe("ExtractionResponseSchema", () => {
  it("accepts a valid response", () => {
    const response = {
      entries: [
        {
          customerName: "Ahmed",
          amount: 500,
          direction: "credit_given",
          confidence: 0.9,
          rawText: "Ahmed 500",
        },
      ],
      warnings: ["Photo is slightly blurry"],
    };
    expect(ExtractionResponseSchema.safeParse(response).success).toBe(true);
  });

  it("defaults warnings to empty array", () => {
    const response = {
      entries: [],
    };
    const result = ExtractionResponseSchema.safeParse(response);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.warnings).toEqual([]);
    }
  });

  it("rejects missing entries", () => {
    const response = { warnings: [] };
    expect(ExtractionResponseSchema.safeParse(response).success).toBe(false);
  });
});
