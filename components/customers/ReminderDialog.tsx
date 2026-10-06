"use client";

import { useState } from "react";
import { generateReminderMessage, generateWhatsAppLink, type ReminderLanguage } from "@/lib/reminders";

interface ReminderDialogProps {
  customerName: string;
  balance: number;
  onClose: () => void;
}

export function ReminderDialog({ customerName, balance, onClose }: ReminderDialogProps) {
  const [lang, setLang] = useState<ReminderLanguage>("en");
  const [copied, setCopied] = useState(false);

  const message = generateReminderMessage({ customerName, balance }, lang);
  const waLink = generateWhatsAppLink(message);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Send Reminder</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            ✕
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Language
          </label>
          <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            {(["en", "ur", "hi"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  lang === l
                    ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {l === "en" ? "English" : l === "ur" ? "Urdu" : "Hindi"}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6 relative">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Message Preview
          </label>
          <div
            className={`w-full h-32 p-3 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 resize-none whitespace-pre-wrap overflow-y-auto ${
              lang === "ur" ? "text-right" : "text-left"
            } font-sans`}
          >
            {message}
          </div>
          <button
            onClick={handleCopy}
            className="absolute bottom-2 right-2 p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-sm rounded-lg text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            {copied ? "✓ Copied" : "Copy text"}
          </button>
        </div>

        <div className="flex gap-3">
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center py-2.5 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors shadow-sm"
          >
            Open in WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
