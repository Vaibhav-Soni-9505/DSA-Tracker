import React, { useState } from "react";
import { Check, ExternalLink, Calendar, BookOpen } from "lucide-react";
import { DifficultyBadge } from "@/components/shared/DifficultyBadge";
import { RevisionBadge } from "@/components/shared/RevisionBadge";
import { ProblemDetailsDialog } from "@/components/shared/ProblemDetailsDialog";
import type { Problem } from "@/types/a2z";
import type { UserProgress } from "@/types/progress";
import { isPastOrToday, formatDate } from "@/lib/date";
import { useSimulatedDate } from "@/hooks/useSimulatedDate";

interface ProblemRowProps {
  problem: Problem;
  progress?: UserProgress;
  onToggle: (id: string) => void;
  stepTitle?: string;
  topicTitle?: string;
}

export const ProblemRow: React.FC<ProblemRowProps> = ({ problem, progress, onToggle, stepTitle, topicTitle }) => {
  const { today } = useSimulatedDate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const isSolved = progress?.solved ?? false;
  const stage = progress?.revisionStage ?? 0;
  const nextRev = progress?.nextRevisionAt ?? null;
  const isRevDue = isSolved && nextRev && isPastOrToday(nextRev, today) && stage < 5;

  return (
    <>
      <div
        onClick={() => setIsDialogOpen(true)}
        className={`flex items-center justify-between gap-4 py-2.5 px-3 border-b border-border/60 hover:bg-muted/30 transition-colors cursor-pointer ${
          isSolved ? "bg-muted/10" : ""
        }`}
      >
        {/* Checkbox & Title */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle(problem.id);
            }}
            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border text-current transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-ring ${
              isSolved
                ? "bg-emerald-600 border-emerald-600 text-white dark:bg-emerald-600 dark:border-emerald-600"
                : "border-input bg-background hover:border-muted-foreground"
            }`}
            aria-label={isSolved ? `Mark "${problem.title}" unsolved` : `Mark "${problem.title}" solved`}
          >
            {isSolved && <Check className="h-3 w-3 stroke-[3]" />}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-medium leading-none truncate ${
                  isSolved ? "text-muted-foreground line-through decoration-muted-foreground/30" : "text-foreground"
                }`}
              >
                {problem.title}
              </span>
              {problem.articleUrl && (
                <a
                  href={problem.articleUrl}
                  onClick={(e) => e.stopPropagation()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground shrink-0 rounded-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                  title="View study article"
                  aria-label={`View study article for ${problem.title}`}
                >
                  <BookOpen className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Badges & Actions */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Revision Due/Info (Desktop only) */}
          {isSolved && (
            <div className="hidden sm:flex items-center gap-2">
              {isRevDue ? (
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/50"
                  title={`Due: ${formatDate(nextRev)}`}
                >
                  <Calendar className="h-2.5 w-2.5" />
                  Rev Due
                </span>
              ) : nextRev && stage < 5 ? (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] text-muted-foreground"
                  title={`Next revision: ${formatDate(nextRev)}`}
                >
                  <Calendar className="h-2.5 w-2.5" />
                  {formatDate(nextRev)}
                </span>
              ) : null}
              {progress?.firstSolvedAt && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] text-muted-foreground" title="First solved date">
                  First solved: {formatDate(progress.firstSolvedAt)}
                </span>
              )}
              <RevisionBadge stage={stage} />
            </div>
          )}

          {/* Difficulty Badge */}
          <DifficultyBadge difficulty={problem.difficulty} className="w-16 justify-center" />

          {/* External Link */}
          <a
            href={problem.problemUrl}
            onClick={(e) => e.stopPropagation()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
            title="Open problem in new tab"
            aria-label={`Open problem ${problem.title} in new tab`}
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      <ProblemDetailsDialog
        problem={problem}
        progress={progress}
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onToggleSolved={onToggle}
        stepTitle={stepTitle}
        topicTitle={topicTitle}
      />
    </>
  );
};
