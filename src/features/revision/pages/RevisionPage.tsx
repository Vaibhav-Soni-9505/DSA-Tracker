import { useMemo } from "react";
import { useProgress } from "@/hooks/useProgress";
import { a2zSheet } from "@/data/a2z-sheet";
import { RevisionItem } from "../components/RevisionItem";
import { CalendarClock, CheckCircle, ListTodo } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { isRevisionDue } from "@/lib/date";

import { useSimulatedDate } from "@/hooks/useSimulatedDate";

export default function RevisionPage() {
  const { progress, isInitialLoading, completeRevision, toggleSolved } = useProgress();
  const { today } = useSimulatedDate();

  // 1. Map problems list with step and topic context
  const allProblems = useMemo(() => {
    const list: Array<any> = [];
    a2zSheet.forEach((step) => {
      step.topics.forEach((topic) => {
        topic.problems.forEach((prob) => {
          list.push({
            ...prob,
            stepTitle: step.title,
            topicTitle: topic.title,
          });
        });
      });
    });
    return list;
  }, []);

  // 2. Partition problems into revision queues (Due, Upcoming, Completed)
  const queues = useMemo(() => {
    const due: Array<any> = [];
    const upcoming: Array<any> = [];
    const completed: Array<any> = [];

    allProblems.forEach((problem) => {
      const p = progress[problem.id];
      if (!p || !p.solved) return; // Ignore unsolved items

      if (p.revisionStage === 5) {
        completed.push({ problem, progress: p });
      } else if (p.nextRevisionAt) {
        if (isRevisionDue(p, today)) {
          due.push({ problem, progress: p });
        } else {
          upcoming.push({ problem, progress: p });
        }
      }
    });

    // Sort: due (earliest first), upcoming (earliest first), completed (recently completed first - placeholder sort)
    due.sort((a, b) => {
      const timeDiff = new Date(a.progress.nextRevisionAt!).getTime() - new Date(b.progress.nextRevisionAt!).getTime();
      return timeDiff === 0 ? a.problem.order - b.problem.order : timeDiff;
    });
    
    upcoming.sort((a, b) => {
      const timeDiff = new Date(a.progress.nextRevisionAt!).getTime() - new Date(b.progress.nextRevisionAt!).getTime();
      return timeDiff === 0 ? a.problem.order - b.problem.order : timeDiff;
    });

    return { due, upcoming, completed };
  }, [allProblems, progress, today]);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Revision Schedule</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review solved problems at intervals of 1, 3, 7, 15, and 30 days to build long-term memory.
        </p>
      </div>

      {/* Due Today Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <ListTodo className="h-4 w-4 text-amber-500" />
            Due Today
            <span className="rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-xs font-semibold px-2 py-0.5 border border-amber-200/40">
              {isInitialLoading ? "--" : queues.due.length}
            </span>
          </h2>
        </div>

        {isInitialLoading ? (
          <div className="h-24 rounded-lg border border-border bg-card animate-pulse"></div>
        ) : queues.due.length > 0 ? (
          <div className="flex flex-col gap-4">
            {queues.due.map(({ problem, progress }) => (
              <RevisionItem
                key={problem.id}
                problem={problem}
                progress={progress}
                onReviewed={completeRevision}
                onToggleSolved={toggleSolved}
                variant="due"
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={CheckCircle}
            title="You're all caught up."
            description="No revisions are due today."
          />
        )}
      </div>

      {/* Upcoming Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
            Upcoming Revisions
            <span className="rounded-full bg-secondary text-muted-foreground text-xs font-semibold px-2 py-0.5">
              {isInitialLoading ? "--" : queues.upcoming.length}
            </span>
          </h2>
        </div>

        {isInitialLoading ? (
          <div className="h-24 rounded-lg border border-border bg-card animate-pulse"></div>
        ) : queues.upcoming.length > 0 ? (
          <div className="flex flex-col gap-4">
            {queues.upcoming.map(({ problem, progress }) => (
              <RevisionItem
                key={problem.id}
                problem={problem}
                progress={progress}
                onReviewed={completeRevision}
                onToggleSolved={toggleSolved}
                variant="upcoming"
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No upcoming revisions."
            description="Revisions will appear here as you solve new problems."
          />
        )}
      </div>

      {/* Completed Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            Completed (5 Rounds)
            <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-semibold px-2 py-0.5 border border-emerald-200/40">
              {isInitialLoading ? "--" : queues.completed.length}
            </span>
          </h2>
        </div>

        {isInitialLoading ? (
          <div className="h-24 rounded-lg border border-border bg-card animate-pulse"></div>
        ) : queues.completed.length > 0 ? (
          <div className="flex flex-col gap-3">
            {queues.completed.map(({ problem, progress }) => (
              <RevisionItem
                key={problem.id}
                problem={problem}
                progress={progress}
                onReviewed={completeRevision}
                onToggleSolved={toggleSolved}
                variant="completed"
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No completed revision cycles yet."
            description="Finish all 5 revision stages for a problem to mark it as permanently mastered."
          />
        )}
      </div>
    </div>
  );
}
