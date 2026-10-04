interface ConfidenceBadgeProps {
  confidence: number; // 0..1
}

/**
 * Visual confidence indicator:
 * - Green (≥ 0.7): high confidence, likely correct
 * - Amber (0.5–0.7): some uncertainty, worth checking
 * - Red (< 0.5): low confidence, likely needs correction
 */
export function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  const pct = Math.round(confidence * 100);

  let colorClass: string;
  let label: string;

  if (confidence >= 0.7) {
    colorClass = "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    label = "High";
  } else if (confidence >= 0.5) {
    colorClass = "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300";
    label = "Medium";
  } else {
    colorClass = "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    label = "Low";
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}
      title={`${label} confidence: ${pct}%`}
    >
      {pct}%
    </span>
  );
}
