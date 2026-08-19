import React, { useState } from "react";
import { CheckCircle2, ExternalLink, Calendar, RefreshCcw } from "lucide-react";
import { DifficultyBadge } from "@/components/shared/DifficultyBadge";
import { RevisionBadge } from "@/components/shared/RevisionBadge";
import { ProblemDetailsDialog } from "@/components/shared/ProblemDetailsDialog";
import type { Problem } from "@/types/a2z";
import type { UserProgress } from "@/types/progress";
import { formatDate, relativeLabel, daysFromNow } from "@/lib/date";
import { useSimulatedDate } from "@/hooks/useSimulatedDate";

interface RevisionItemProps {
  problem: Problem & { stepTitle: string; topicTitle: string };
  progress: UserProgress;
  onReviewed: (id: string) => void;
  onToggleSolved: (id: string) => void;
  variant: "due" | "upcoming" | "completed";
}

export const RevisionItem: React.FC<RevisionItemProps> = ({
  problem,
  progress,
  onReviewed,
  onToggleSolved,
  variant,
}) => {
  const { today } = useSimulatedDate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const daysOverdue = variant === "due" && progress.nextRevisionAt ? daysFromNow(progress.nextRevisionAt, today) : 0;

  return (
    <>
      <div 
        onClick={() => setIsDialogOpen(true)}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-border rounded-lg bg-card shadow-xs hover:border-border/80 transition-all cursor-pointer"
      >
        {/* Problem details */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <DifficultyBadge difficulty={problem.difficulty} />
            <RevisionBadge stage={progress.revisionStage} />
            {variant === "due" && (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 dark:bg-amber-950/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400 border border-amber-200/45">
                {daysOverdue < 0 ? `Overdue by ${Math.abs(daysOverdue)} day${Math.abs(daysOverdue) !== 1 ? 's' : ''}` : "Due Today"}
              </span>
            )}
          </div>

          <h3 className="text-sm font-semibold text-foreground tracking-tight line-clamp-1">
            {problem.title}
          </h3>

          <div className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="truncate">{problem.stepTitle}</span>
            <span>&bull;</span>
            <span className="truncate">{problem.topicTitle}</span>
          </div>
        </div>

        {/* Date/Info & Action controls */}
        <div className="flex items-center justify-between sm:justify-end gap-4 border-t border-border/40 pt-3 sm:border-t-0 sm:pt-0 shrink-0">
          {/* Revision info */}
          {variant !== "completed" && progress.nextRevisionAt && (
            <div className="flex flex-col sm:items-end gap-0.5 text-xs">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {variant === "due" ? "Was due" : "Next revision"}
              </span>
              <span className="font-semibold text-foreground">
                {relativeLabel(progress.nextRevisionAt, today)} ({formatDate(progress.nextRevisionAt)})
              </span>
            </div>
          )}

          {variant === "completed" && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="h-4 w-4" />
              Revision complete
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center gap-2">
            {/* Practice/External link */}
            <a
              href={problem.problemUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
              title="Practice problem"
              aria-label={`Practice problem ${problem.title}`}
            >
              <ExternalLink className="h-4 w-4" />
            </a>

            {/* Reviewed Action button */}
            {variant === "due" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReviewed(problem.id);
                }}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-amber-600 hover:bg-amber-500 text-white px-3 text-xs font-semibold shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 dark:bg-amber-600 dark:hover:bg-amber-500"
              >
                <RefreshCcw className="h-3 w-3" />
                Reviewed
              </button>
            )}
          </div>
        </div>
      </div>

      <ProblemDetailsDialog
        problem={problem}
        progress={progress}
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onToggleSolved={onToggleSolved}
        onReviewed={onReviewed}
        stepTitle={problem.stepTitle}
        topicTitle={problem.topicTitle}
      />
    </>
  );
};
