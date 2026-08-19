import React from "react";

interface DifficultyBadgeProps {
  difficulty: "Easy" | "Medium" | "Hard";
  className?: string;
}

export const DifficultyBadge: React.FC<DifficultyBadgeProps> = ({
  difficulty,
  className = "",
}) => {
  const styles = {
    Easy: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50",
    Medium: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-900/50",
    Hard: "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border-rose-200 dark:border-rose-900/50",
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors ${styles[difficulty]} ${className}`}
    >
      {difficulty}
    </span>
  );
};
