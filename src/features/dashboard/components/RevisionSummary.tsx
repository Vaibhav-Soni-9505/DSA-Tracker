import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, RotateCcw, Sparkles } from "lucide-react";

interface RevisionSummaryProps {
  dueCount: number;
}

export const RevisionSummary: React.FC<RevisionSummaryProps> = ({ dueCount }) => {
  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-4">Revision Status</h2>
        <div className="flex items-center gap-3">
          {dueCount > 0 ? (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400">
              <RotateCcw className="h-5 w-5" />
            </div>
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
              <Sparkles className="h-5 w-5" />
            </div>
          )}
          <div>
            <div className="text-base font-semibold text-foreground">
              {dueCount > 0 ? `${dueCount} Revision${dueCount === 1 ? "" : "s"} Due` : "All caught up!"}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {dueCount > 0
                ? "Items scheduled for revision are pending."
                : "No revisions scheduled for today."}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        {dueCount > 0 ? (
          <Link
            to="/revision"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-xs transition-colors hover:bg-amber-500 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring dark:bg-amber-600 dark:hover:bg-amber-500"
          >
            Review Now
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <Link
            to="/revision"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
          >
            View Schedule
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
};
