import { describe, it, expect } from "vitest";
import { generateReminderMessage, generateWhatsAppLink } from "@/lib/reminders";

describe("generateReminderMessage", () => {
  it("generates English reminder", () => {
    const msg = generateReminderMessage({ customerName: "Ahmed", balance: 500 }, "en");
    expect(msg).toContain("Hello Ahmed");
    expect(msg).toContain("Rs. 500.00");
    expect(msg).toContain("pending balance");
  });

  it("generates Urdu reminder", () => {
    const msg = generateReminderMessage({ customerName: "Ahmed", balance: 500 }, "ur");
    expect(msg).toContain("السلام علیکم Ahmed");
    expect(msg).toContain("500.00 روپے بقایا");
  });

  it("generates Hindi reminder", () => {
    const msg = generateReminderMessage({ customerName: "Ahmed", balance: 500 }, "hi");
    expect(msg).toContain("नमस्ते Ahmed");
    expect(msg).toContain("₹500.00 बकाया");
  });

  it("includes shop name if provided", () => {
    const msg = generateReminderMessage({ customerName: "Ali", balance: 200, shopName: "Ali Store" }, "en");
    expect(msg).toContain("from Ali Store");
  });
});

describe("generateWhatsAppLink", () => {
  it("generates link with phone number", () => {
    const link = generateWhatsAppLink("Hello", "+923001234567");
    expect(link).toBe("https://wa.me/923001234567?text=Hello");
  });

  it("generates link without phone number", () => {
    const link = generateWhatsAppLink("Hello test");
    expect(link).toBe("https://wa.me/?text=Hello%20test");
  });

  it("strips non-numeric characters from phone", () => {
    const link = generateWhatsAppLink("Hi", "0300-1234567");
    expect(link).toBe("https://wa.me/03001234567?text=Hi");
  });
});
