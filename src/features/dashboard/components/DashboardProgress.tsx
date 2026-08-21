import React from "react";
import { ProgressBar } from "@/components/shared/ProgressBar";

interface DashboardProgressProps {
  solvedCount: number;
  totalCount: number;
  isInitialLoading?: boolean;
}

export const DashboardProgress: React.FC<DashboardProgressProps> = ({
  solvedCount,
  totalCount,
  isInitialLoading = false,
}) => {
  const percentage = totalCount > 0 ? Math.round((solvedCount / totalCount) * 1000) / 10 : 0;

  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
      <div className="flex items-baseline justify-between mb-2">
        <h2 className="text-sm font-medium text-muted-foreground">Overall Progress</h2>
        <span className="text-2xl font-bold tracking-tight">
          {isInitialLoading ? "--" : percentage}% <span className="text-sm font-normal text-muted-foreground">Complete</span>
        </span>
      </div>
      <div className="text-sm font-semibold text-foreground mb-4">
        {isInitialLoading ? "--" : solvedCount} / {totalCount} <span className="font-normal text-muted-foreground">problems solved</span>
      </div>
      <ProgressBar value={isInitialLoading ? 0 : percentage} />
    </div>
  );
};
