"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { LedgerEntry } from "@/lib/db";

interface DashboardChartsProps {
  entries: LedgerEntry[];
}

export function DashboardCharts({ entries }: DashboardChartsProps) {
  const weeklyData = useMemo(() => {
    // Group entries by week
    const weeks = new Map<string, { credit: number; payment: number }>();
    
    // Sort entries by date ascending
    const sorted = [...entries].filter(e => e.date).sort((a, b) => a.date!.localeCompare(b.date!));

    sorted.forEach((entry) => {
      if (!entry.date) return;
      
      const d = new Date(entry.date);
      // Get the Monday of the week
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const startOfWeek = new Date(d.setDate(diff));
      const weekKey = `${startOfWeek.getDate()} ${startOfWeek.toLocaleString('default', { month: 'short' })}`;

      const current = weeks.get(weekKey) || { credit: 0, payment: 0 };
      if (entry.direction === "credit_given") {
        current.credit += entry.amount;
      } else {
        current.payment += entry.amount;
      }
      weeks.set(weekKey, current);
    });

    return Array.from(weeks.entries())
      .slice(-6) // Show last 6 weeks max
      .map(([week, data]) => ({
        week,
        Credit: Math.round(data.credit),
        Payment: Math.round(data.payment),
      }));
  }, [entries]);

  if (weeklyData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
        <p className="text-gray-500 dark:text-gray-400 text-sm">Not enough data for chart</p>
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={weeklyData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
          <XAxis 
            dataKey="week" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: '#6B7280' }} 
            dy={10} 
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: '#6B7280' }} 
          />
          <Tooltip 
            cursor={{ fill: 'transparent' }}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
          <Bar dataKey="Credit" name="Credit Given" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
          <Bar dataKey="Payment" name="Payment Received" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
