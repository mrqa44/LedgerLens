import * as XLSX from "xlsx";
import { db } from "@/lib/db";
import { calculateBalance } from "@/lib/utils/balance";

export async function exportToExcel() {
  const customers = await db.customers.toArray();
  const entries = await db.entries.toArray();

  // 1. Prepare Customers Sheet
  const customersSheetData = customers.map(c => {
    const customerEntries = entries.filter(e => e.customerId === c.id);
    const balance = calculateBalance(customerEntries);
    return {
      "Customer Name": c.name,
      "Aliases": c.aliases.join(", "),
      "Total Balance (Rs)": balance,
      "Status": balance > 0 ? "Owes You" : balance < 0 ? "You Owe" : "Settled",
      "Added On": new Date(c.createdAt).toLocaleDateString()
    };
  });

  // 2. Prepare Transactions Sheet
  // Map customer IDs to names for the entries sheet
  const customerMap = new Map(customers.map(c => [c.id, c.name]));
  
  const entriesSheetData = entries.map(e => ({
    "Date": e.date ? new Date(e.date).toLocaleDateString() : "Unknown",
    "Customer": customerMap.get(e.customerId) || "Unknown",
    "Type": e.direction === "credit_given" ? "Credit Given" : "Payment Received",
    "Amount (Rs)": e.amount,
    "Description": e.description || "",
    "AI Confidence": `${Math.round(e.confidence * 100)}%`,
    "Raw Text": e.rawText
  })).sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime());

  // Create workbook
  const wb = XLSX.utils.book_new();
  
  // Add Customers sheet
  const wsCustomers = XLSX.utils.json_to_sheet(customersSheetData);
  XLSX.utils.book_append_sheet(wb, wsCustomers, "Customers & Balances");

  // Add Transactions sheet
  const wsEntries = XLSX.utils.json_to_sheet(entriesSheetData);
  XLSX.utils.book_append_sheet(wb, wsEntries, "All Transactions");

  // Generate Excel file and trigger download
  XLSX.writeFile(wb, `LedgerLens_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
}

export async function exportToCSV() {
  const customers = await db.customers.toArray();
  const entries = await db.entries.toArray();
  const customerMap = new Map(customers.map(c => [c.id, c.name]));

  const entriesSheetData = entries.map(e => ({
    "Date": e.date ? new Date(e.date).toLocaleDateString() : "Unknown",
    "Customer": customerMap.get(e.customerId) || "Unknown",
    "Type": e.direction === "credit_given" ? "Credit Given" : "Payment Received",
    "Amount": e.amount,
    "Description": e.description || "",
  }));

  const ws = XLSX.utils.json_to_sheet(entriesSheetData);
  const csv = XLSX.utils.sheet_to_csv(ws);

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `LedgerLens_Transactions_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
