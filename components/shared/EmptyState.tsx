import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  children?: ReactNode;
}

/** A friendly empty state placeholder for pages with no data yet. */
export function EmptyState({ icon, title, description, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <span className="text-5xl mb-4">{icon}</span>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h2>
      <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">{description}</p>
      {children}
    </div>
  );
}
