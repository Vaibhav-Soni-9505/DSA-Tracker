import { useMemo } from "react";
import { useProgress } from "@/hooks/useProgress";
import { a2zSheet } from "@/data/a2z-sheet";
import { DashboardProgress } from "../components/DashboardProgress";
import { ContinueLearning } from "../components/ContinueLearning";
import { RevisionSummary } from "../components/RevisionSummary";
import { StepProgressList } from "../components/StepProgressList";
import { isRevisionDue } from "@/lib/date";

import { useSimulatedDate } from "@/hooks/useSimulatedDate";

export default function DashboardPage() {
  const { progress, toggleSolved } = useProgress();
  const { today } = useSimulatedDate();

  // 1. Calculations
  const stats = useMemo(() => {
    let totalCount = 0;
    let solvedCount = 0;
    let dueCount = 0;

    a2zSheet.forEach((step) => {
      step.topics.forEach((topic) => {
        topic.problems.forEach((prob) => {
          totalCount++;
          const p = progress[prob.id];
          if (p?.solved) {
            solvedCount++;
            if (isRevisionDue(p, today)) {
              dueCount++;
            }
          }
        });
      });
    });

    return { totalCount, solvedCount, dueCount };
  }, [progress, today]);

  // 2. Find first unsolved problem (Continue Learning)
  const nextProblem = useMemo(() => {
    for (const step of a2zSheet) {
      for (const topic of step.topics) {
        for (const prob of topic.problems) {
          if (!progress[prob.id]?.solved) {
            return {
              ...prob,
              stepTitle: step.title,
              topicTitle: topic.title,
            };
          }
        }
      }
    }
    return null;
  }, [progress]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">A2Z DSA Tracker</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track your progress. Master DSA. Automatically schedule revisions.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-3 lg:col-span-1">
          <DashboardProgress solvedCount={stats.solvedCount} totalCount={stats.totalCount} />
        </div>
        <div className="md:col-span-1 lg:col-span-1">
          <ContinueLearning
            problem={nextProblem}
            onSolveToggle={(id) => toggleSolved(id)}
            totalCount={stats.totalCount}
          />
        </div>
        <div className="md:col-span-1 lg:col-span-1">
          <RevisionSummary dueCount={stats.dueCount} />
        </div>
      </div>

      {/* Step Progress List */}
      <div>
        <StepProgressList steps={a2zSheet} progress={progress} />
      </div>
    </div>
  );
}
