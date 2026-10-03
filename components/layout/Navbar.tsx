"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/", label: "Scan", icon: "📷" },
  { href: "/customers", label: "Customers", icon: "👥" },
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
] as const;

/** Main navigation bar — responsive with a bottom bar on mobile. */
export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* ── Desktop top bar ── */}
      <header className="hidden md:flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-6 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="text-2xl">🔍</span>
          <span>LedgerLens</span>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                }`}
              >
                {item.icon} {item.label}
              </Link>
            );
          })}
          <div className="ml-2 border-l border-gray-200 dark:border-gray-700 pl-2">
            <ThemeToggle />
          </div>
        </nav>
      </header>

      {/* ── Mobile top bar (logo + theme toggle only) ── */}
      <header className="md:hidden flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="text-2xl">🔍</span>
          <span>LedgerLens</span>
        </Link>
        <ThemeToggle />
      </header>

      {/* ── Mobile bottom navigation bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex justify-around py-2 safe-bottom">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors min-w-[60px] ${
                isActive
                  ? "text-blue-700 dark:text-blue-300"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
