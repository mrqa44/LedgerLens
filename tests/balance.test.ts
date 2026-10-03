import { describe, it, expect } from "vitest";
import { calculateBalance } from "@/lib/utils/balance";

describe("calculateBalance", () => {
  it("returns 0 for an empty list", () => {
    expect(calculateBalance([])).toBe(0);
  });

  it("sums credit_given as positive", () => {
    const entries = [
      { amount: 100, direction: "credit_given" as const },
      { amount: 200, direction: "credit_given" as const },
    ];
    expect(calculateBalance(entries)).toBe(300);
  });

  it("sums payment_received as negative", () => {
    const entries = [
      { amount: 50, direction: "payment_received" as const },
      { amount: 150, direction: "payment_received" as const },
    ];
    expect(calculateBalance(entries)).toBe(-200);
  });

  it("computes net balance (credit minus payments)", () => {
    const entries = [
      { amount: 500, direction: "credit_given" as const },
      { amount: 200, direction: "payment_received" as const },
      { amount: 100, direction: "credit_given" as const },
      { amount: 50, direction: "payment_received" as const },
    ];
    // 500 + 100 - 200 - 50 = 350
    expect(calculateBalance(entries)).toBe(350);
  });

  it("returns negative when overpaid", () => {
    const entries = [
      { amount: 100, direction: "credit_given" as const },
      { amount: 300, direction: "payment_received" as const },
    ];
    expect(calculateBalance(entries)).toBe(-200);
  });

  it("handles floating-point amounts correctly", () => {
    const entries = [
      { amount: 0.1, direction: "credit_given" as const },
      { amount: 0.2, direction: "credit_given" as const },
    ];
    // 0.1 + 0.2 should be 0.3, not 0.30000000000000004
    expect(calculateBalance(entries)).toBe(0.3);
  });

  it("returns 0 when fully settled", () => {
    const entries = [
      { amount: 500, direction: "credit_given" as const },
      { amount: 500, direction: "payment_received" as const },
    ];
    expect(calculateBalance(entries)).toBe(0);
  });
});
