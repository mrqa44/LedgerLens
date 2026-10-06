export const demoCustomers = [
  { id: "demo_c1", name: "Ahmed Khan", aliases: ["Ahmad", "A. Khan"], createdAt: "2024-08-01T10:00:00Z" },
  { id: "demo_c2", name: "Zainab Boutique", aliases: ["Zainab"], createdAt: "2024-08-15T11:30:00Z" },
  { id: "demo_c3", name: "Muhammad Ali", aliases: ["M. Ali", "Ali Bhai"], createdAt: "2024-09-01T09:15:00Z" },
  { id: "demo_c4", name: "Fatima Stores", aliases: [], createdAt: "2024-09-10T14:20:00Z" },
];

export const demoEntries = [
  // Ahmed Khan (Owes money)
  { id: "demo_e1", pageId: "demo_p1", customerId: "demo_c1", date: "2024-09-05T00:00:00Z", description: "Flour and Sugar", amount: 1500, direction: "credit_given", currency: "PKR", confidence: 0.95, needsReview: false, rawText: "Ahmed: Flour 1500", createdAt: "2024-09-05T10:00:00Z" },
  { id: "demo_e2", pageId: "demo_p1", customerId: "demo_c1", date: "2024-09-12T00:00:00Z", description: "Cooking Oil", amount: 2000, direction: "credit_given", currency: "PKR", confidence: 0.92, needsReview: false, rawText: "Ahmad Oil 2000", createdAt: "2024-09-12T10:00:00Z" },
  { id: "demo_e3", pageId: "demo_p2", customerId: "demo_c1", date: "2024-09-20T00:00:00Z", description: "Cash received", amount: 1000, direction: "payment_received", currency: "PKR", confidence: 0.88, needsReview: false, rawText: "Ahmed paid 1000", createdAt: "2024-09-20T10:00:00Z" },
  
  // Zainab Boutique (Settled/Zero balance)
  { id: "demo_e4", pageId: "demo_p2", customerId: "demo_c2", date: "2024-08-20T00:00:00Z", description: "Fabric delivery", amount: 5000, direction: "credit_given", currency: "PKR", confidence: 0.9, needsReview: false, rawText: "Zainab Fabric 5000", createdAt: "2024-08-20T10:00:00Z" },
  { id: "demo_e5", pageId: "demo_p3", customerId: "demo_c2", date: "2024-08-25T00:00:00Z", description: "Cash payment", amount: 5000, direction: "payment_received", currency: "PKR", confidence: 0.91, needsReview: false, rawText: "Zainab jama 5000", createdAt: "2024-08-25T10:00:00Z" },

  // Muhammad Ali (Owes a lot)
  { id: "demo_e6", pageId: "demo_p3", customerId: "demo_c3", date: "2024-09-01T00:00:00Z", description: "Monthly groceries", amount: 12000, direction: "credit_given", currency: "PKR", confidence: 0.85, needsReview: false, rawText: "M. Ali groceries 12000", createdAt: "2024-09-01T10:00:00Z" },
  { id: "demo_e7", pageId: "demo_p4", customerId: "demo_c3", date: "2024-09-15T00:00:00Z", description: "Rice sack", amount: 4500, direction: "credit_given", currency: "PKR", confidence: 0.89, needsReview: false, rawText: "Ali Bhai Rice 4500", createdAt: "2024-09-15T10:00:00Z" },
  { id: "demo_e8", pageId: "demo_p4", customerId: "demo_c3", date: "2024-10-02T00:00:00Z", description: "Partial payment", amount: 5000, direction: "payment_received", currency: "PKR", confidence: 0.94, needsReview: false, rawText: "M. Ali wapas 5000", createdAt: "2024-10-02T10:00:00Z" },

  // Fatima Stores (We owe them money - advanced payment)
  { id: "demo_e9", pageId: "demo_p5", customerId: "demo_c4", date: "2024-09-25T00:00:00Z", description: "Advance cash", amount: 10000, direction: "payment_received", currency: "PKR", confidence: 0.96, needsReview: false, rawText: "Fatima advanced 10000", createdAt: "2024-09-25T10:00:00Z" },
  { id: "demo_e10", pageId: "demo_p5", customerId: "demo_c4", date: "2024-09-28T00:00:00Z", description: "Supplies", amount: 4000, direction: "credit_given", currency: "PKR", confidence: 0.91, needsReview: false, rawText: "Fatima supplies 4000", createdAt: "2024-09-28T10:00:00Z" },
];
