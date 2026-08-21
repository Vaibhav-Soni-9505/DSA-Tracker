import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { ProgressBar } from "@/components/shared/ProgressBar";
import type { Step } from "@/types/a2z";
import type { UserProgress } from "@/types/progress";

interface StepProgressListProps {
  steps: Step[];
  progress: Record<string, UserProgress>;
  isInitialLoading?: boolean;
}

export const StepProgressList: React.FC<StepProgressListProps> = ({ steps, progress, isInitialLoading = false }) => {
  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
      <h2 className="text-sm font-medium text-muted-foreground mb-4">A2Z Steps Progress</h2>
      <div className="divide-y divide-border">
        {steps.map((step) => {
          // Count total and solved in this step
          let stepTotal = 0;
          let stepSolved = 0;

          step.topics.forEach((topic) => {
            topic.problems.forEach((prob) => {
              stepTotal++;
              if (progress[prob.id]?.solved) {
                stepSolved++;
              }
            });
          });

          const percentage = stepTotal > 0 ? Math.round((stepSolved / stepTotal) * 100) : 0;

          return (
            <div key={step.id} className="py-4 first:pt-0 last:pb-0">
              <div className="flex items-center justify-between gap-4 mb-2">
                <div className="font-medium text-sm text-foreground truncate">
                  {step.title}
                </div>
                <div className="text-xs text-muted-foreground shrink-0 font-medium">
                  {isInitialLoading ? "-- / --" : `${stepSolved} / ${stepTotal} (${percentage}%)`}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <ProgressBar value={isInitialLoading ? 0 : percentage} className="flex-1" />
                <Link
                  to="/sheet"
                  className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                  title="View in sheet"
                >
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
