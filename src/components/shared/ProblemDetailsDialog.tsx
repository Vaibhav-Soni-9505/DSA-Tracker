import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { DifficultyBadge } from "./DifficultyBadge";
import { RevisionBadge } from "./RevisionBadge";
import { CheckCircle2, ExternalLink, BookOpen, Calendar, Clock, RefreshCcw } from "lucide-react";
import type { Problem } from "@/types/a2z";
import type { UserProgress } from "@/types/progress";
import { formatDate, isPastOrToday } from "@/lib/date";
import { useSimulatedDate } from "@/hooks/useSimulatedDate";

interface ProblemDetailsDialogProps {
  problem: Problem | null;
  progress: UserProgress | undefined;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleSolved: (id: string) => void;
  onReviewed?: (id: string) => void;
  stepTitle?: string;
  topicTitle?: string;
}

export const ProblemDetailsDialog: React.FC<ProblemDetailsDialogProps> = ({
  problem,
  progress,
  isOpen,
  onOpenChange,
  onToggleSolved,
  onReviewed,
  stepTitle,
  topicTitle,
}) => {
  const { today } = useSimulatedDate();
  
  if (!problem) return null;

  const isSolved = progress?.solved ?? false;
  const stage = progress?.revisionStage ?? 0;
  const nextRev = progress?.nextRevisionAt ?? null;
  const isRevDue = isSolved && nextRev && isPastOrToday(nextRev, today) && stage < 5;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md gap-6">
        <DialogHeader className="gap-2">
          <div className="flex items-center gap-2 mb-1">
            <DifficultyBadge difficulty={problem.difficulty} />
            {isSolved && <RevisionBadge stage={stage} />}
            {isRevDue && (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 dark:bg-amber-950/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400 border border-amber-200/45">
                Revision Due
              </span>
            )}
            {stage === 5 && (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200/45">
                Revision Complete
              </span>
            )}
          </div>
          <DialogTitle className="text-xl leading-tight">{problem.title}</DialogTitle>
          <DialogDescription className="flex flex-col gap-1">
            {(stepTitle || topicTitle) && (
              <span className="text-xs">
                {stepTitle} &bull; {topicTitle}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4 text-sm bg-muted/30 p-4 rounded-lg border border-border/50">
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Status</span>
            <span className="flex items-center gap-1.5 font-medium">
              {isSolved ? (
                <><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Solved</>
              ) : (
                <span className="text-muted-foreground">Not Solved</span>
              )}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">First Solved</span>
            <span className="flex items-center gap-1.5 font-medium">
              {progress?.firstSolvedAt ? (
                <><Calendar className="h-4 w-4 text-muted-foreground" /> {formatDate(progress.firstSolvedAt)}</>
              ) : (
                <span className="text-muted-foreground">Not solved yet</span>
              )}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Revision</span>
            <span className="flex items-center gap-1.5 font-medium">
               {isSolved ? (
                 <>{stage} / 5</>
               ) : (
                 <span className="text-muted-foreground">—</span>
               )}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Next Revision</span>
            <span className="flex items-center gap-1.5 font-medium">
               {nextRev ? (
                 <><Clock className="h-4 w-4 text-muted-foreground" /> {formatDate(nextRev)}</>
               ) : (
                 <span className="text-muted-foreground">—</span>
               )}
            </span>
          </div>
        </div>

        {/* Links */}
        <div className="flex items-center gap-3">
          <a
            href={problem.problemUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 h-9 rounded-md border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
            Open Problem
          </a>
          {problem.articleUrl && (
            <a
              href={problem.articleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 h-9 rounded-md border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
            >
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              Open Article
            </a>
          )}
        </div>

        {/* Action Button Footer */}
        <DialogFooter className="sm:justify-between border-t pt-4 border-border/50 gap-2 sm:gap-0">
          <DialogClose asChild>
            <button className="w-full sm:w-auto h-9 px-4 rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring transition-colors">
              Close
            </button>
          </DialogClose>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            {!isSolved ? (
              <button
                onClick={() => {
                  onToggleSolved(problem.id);
                  onOpenChange(false);
                }}
                className="w-full sm:w-auto h-9 px-4 rounded-md text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                Mark Solved
              </button>
            ) : isRevDue && onReviewed ? (
              <button
                onClick={() => {
                  onReviewed(problem.id);
                  onOpenChange(false);
                }}
                className="w-full sm:w-auto h-9 px-4 rounded-md text-sm font-semibold bg-amber-600 hover:bg-amber-500 text-white shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 transition-colors flex items-center justify-center gap-2 dark:bg-amber-600 dark:hover:bg-amber-500"
              >
                <RefreshCcw className="h-4 w-4" />
                Reviewed
              </button>
            ) : (
              <button
                onClick={() => onToggleSolved(problem.id)}
                className="w-full sm:w-auto h-9 px-4 rounded-md text-sm font-medium border border-destructive/30 text-destructive hover:bg-destructive/20 hover:border-destructive/50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-destructive/50 transition-colors"
              >
                Unsolve
              </button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
