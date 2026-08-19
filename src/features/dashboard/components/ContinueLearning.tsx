import React from "react";
import { ExternalLink, Play } from "lucide-react";
import { DifficultyBadge } from "@/components/shared/DifficultyBadge";
import type { Problem } from "@/types/a2z";

interface ContinueLearningProps {
  problem: (Problem & { stepTitle: string; topicTitle: string }) | null;
  onSolveToggle: (id: string) => void;
  totalCount: number;
}

export const ContinueLearning: React.FC<ContinueLearningProps> = ({
  problem,
  onSolveToggle,
  totalCount,
}) => {
  if (!problem) {
    return (
      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-6 shadow-sm flex flex-col justify-between h-full">
        <div>
          <h2 className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-4">A2Z Sheet Complete</h2>
          <div className="text-base font-semibold text-foreground mb-1 tracking-tight">You've completed all {totalCount} problems.</div>
          <p className="text-xs text-muted-foreground">
            Focus on your revisions to master the concepts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-4">Continue Learning</h2>
        <div className="flex items-start justify-between gap-4 mb-2">
          <div>
            <h3 className="text-base font-semibold text-foreground tracking-tight line-clamp-1">
              {problem.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {problem.stepTitle} &bull; {problem.topicTitle}
            </p>
          </div>
          <DifficultyBadge difficulty={problem.difficulty} />
        </div>
      </div>

      <div className="flex items-center gap-2 mt-6">
        <a
          href={problem.problemUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-input bg-background px-3 py-1 text-sm font-medium text-foreground shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
        >
          <ExternalLink className="h-4 w-4" />
          Solve Problem
        </a>
        <button
          onClick={() => onSolveToggle(problem.id)}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-3 py-1 text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/95 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
        >
          <Play className="h-4 w-4 fill-current" />
          Mark Solved
        </button>
      </div>
    </div>
  );
};
