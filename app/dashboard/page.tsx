"use client";

import Link from "next/link";
import { useAllEntries, useCustomersWithBalances, useReviewCount } from "@/lib/db/hooks";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";

export default function DashboardPage() {
  const entries = useAllEntries();
  const customers = useCustomersWithBalances();
  const reviewCount = useReviewCount();

  // Metrics calculations
  const totalOutstanding = customers.reduce((sum, { balance }) => sum + (balance > 0 ? balance : 0), 0);
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const totalCollectedThisMonth = entries
    .filter(e => e.direction === "payment_received" && e.date)
    .filter(e => {
      const d = new Date(e.date!);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, e) => sum + e.amount, 0);

  const topDebtors = [...customers]
    .filter(({ balance }) => balance > 0)
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 5);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Business Dashboard</h1>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 rounded-2xl">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Outstanding</p>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400">
            Rs. {totalOutstanding.toFixed(2)}
          </p>
          <p className="text-xs text-gray-400 mt-2">Money currently owed to you</p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 rounded-2xl">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Collected This Month</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
            Rs. {totalCollectedThisMonth.toFixed(2)}
          </p>
          <p className="text-xs text-gray-400 mt-2">Payments received in {new Date().toLocaleString('default', { month: 'long' })}</p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Needs Review</p>
            <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
              {reviewCount}
            </p>
          </div>
          {reviewCount > 0 ? (
            <p className="text-xs text-amber-700 dark:text-amber-500 mt-2 font-medium">
              Check your recent scans to fix these.
            </p>
          ) : (
            <p className="text-xs text-green-600 dark:text-green-500 mt-2 font-medium">
              ✓ All entries approved
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Section */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-2xl">
            <h2 className="text-lg font-semibold mb-4">Credit vs Payments (Last 6 Weeks)</h2>
            <DashboardCharts entries={entries} />
          </div>
        </div>

        {/* Top Debtors List */}
        <div>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden flex flex-col h-full">
            <div className="p-5 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-semibold">Top Debtors</h2>
            </div>
            
            <ul className="divide-y divide-gray-100 dark:divide-gray-800 flex-1 overflow-y-auto">
              {topDebtors.length > 0 ? (
                topDebtors.map(({ customer, balance }) => (
                  <li key={customer.id}>
                    <Link 
                      href={`/customers/${customer.id}`}
                      className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <span className="font-medium text-sm truncate pr-2">{customer.name}</span>
                      <span className="font-semibold text-red-600 dark:text-red-400 text-sm whitespace-nowrap">
                        Rs. {balance.toFixed(2)}
                      </span>
                    </Link>
                  </li>
                ))
              ) : (
                <li className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                  Nobody owes you money!
                </li>
              )}
            </ul>
            
            {topDebtors.length > 0 && (
              <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-center">
                <Link href="/customers" className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">
                  View all customers →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
