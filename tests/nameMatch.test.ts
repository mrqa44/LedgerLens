import { describe, it, expect } from "vitest";
import { findMatchingCustomer, batchMatchNames } from "@/lib/utils/nameMatch";
import type { Customer } from "@/lib/db";

const mockCustomers: Customer[] = [
  { id: "1", name: "Ahmed Khan", aliases: ["Ahmad"], createdAt: "2024-01-01" },
  { id: "2", name: "Muhammad Bilal", aliases: ["M. Bilal", "Bilal"], createdAt: "2024-01-02" },
  { id: "3", name: "Hassan", aliases: [], createdAt: "2024-01-03" },
];

describe("findMatchingCustomer", () => {
  it("returns no match when customers array is empty", () => {
    const result = findMatchingCustomer("Ahmed", []);
    expect(result.customer).toBeNull();
    expect(result.autoLink).toBe(false);
    expect(result.ambiguous).toBe(false);
  });

  it("returns no match for empty name", () => {
    const result = findMatchingCustomer("", mockCustomers);
    expect(result.customer).toBeNull();
  });

  it("finds exact match on name (autoLink)", () => {
    const result = findMatchingCustomer("Ahmed Khan", mockCustomers);
    expect(result.customer?.id).toBe("1");
    expect(result.autoLink).toBe(true);
    expect(result.ambiguous).toBe(false);
  });

  it("finds exact match on alias (autoLink)", () => {
    const result = findMatchingCustomer("Ahmad", mockCustomers);
    expect(result.customer?.id).toBe("1");
    expect(result.autoLink).toBe(true);
  });

  it("finds ambiguous match for slight misspelling", () => {
    // "Hasan" instead of "Hassan"
    const result = findMatchingCustomer("Hasan", mockCustomers);
    expect(result.customer?.id).toBe("3");
    // Should be a good match, might be autoLink or ambiguous depending on fuse score
    // 'Hassan' vs 'Hasan' is usually very close, let's verify it matches the right person
    expect(result.customer?.name).toBe("Hassan");
  });

  it("returns no match for completely different name", () => {
    const result = findMatchingCustomer("Zeeshan", mockCustomers);
    expect(result.customer).toBeNull();
    expect(result.autoLink).toBe(false);
    expect(result.ambiguous).toBe(false);
  });

  it("handles case-insensitivity", () => {
    const result = findMatchingCustomer("ahmed khan", mockCustomers);
    expect(result.customer?.id).toBe("1");
  });
});

describe("batchMatchNames", () => {
  it("processes multiple names and returns a map", () => {
    const names = ["Ahmed Khan", "M. Bilal", "Zeeshan"];
    const results = batchMatchNames(names, mockCustomers);
    
    expect(results.size).toBe(3);
    expect(results.get("Ahmed Khan")?.customer?.id).toBe("1");
    expect(results.get("M. Bilal")?.customer?.id).toBe("2");
    expect(results.get("Zeeshan")?.customer).toBeNull();
  });

  it("deduplicates names", () => {
    const names = ["Hassan", "Hassan", "  Hassan  "];
    const results = batchMatchNames(names, mockCustomers);
    
    // Size should be 1 because it trims and deduplicates
    expect(results.size).toBe(1);
    expect(results.get("Hassan")?.customer?.id).toBe("3");
  });
});
