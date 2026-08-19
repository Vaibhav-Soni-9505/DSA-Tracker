import React from "react";
import type { RevisionStage } from "@/types/progress";

interface RevisionBadgeProps {
  stage: RevisionStage;
  className?: string;
}

export const RevisionBadge: React.FC<RevisionBadgeProps> = ({ stage, className = "" }) => {
  if (stage === 5) {
    return (
      <span
        className={`inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/50 ${className}`}
      >
        Rev Completed
      </span>
    );
  }

  // stage 0 = solved but no rev yet, 1 = rev 1 done, etc.
  return (
    <span
      className={`inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/50 dark:border-blue-900/50 ${className}`}
    >
      Rev {stage} / 5
    </span>
  );
};
