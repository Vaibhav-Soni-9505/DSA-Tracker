import { useState, useMemo } from "react";
import { useProgress } from "@/hooks/useProgress";
import { a2zSheet } from "@/data/a2z-sheet";
import { StepAccordion } from "../components/StepAccordion";
import { Search, X, Inbox, Percent } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { isRevisionDue } from "@/lib/date";

type FilterType = "all" | "unsolved" | "solved" | "revision";

import { useSimulatedDate } from "@/hooks/useSimulatedDate";

export default function SheetPage() {
  const { progress, toggleSolved } = useProgress();
  const { today } = useSimulatedDate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  // 1. Calculate overall sheet stats
  const stats = useMemo(() => {
    let totalCount = 0;
    let solvedCount = 0;

    a2zSheet.forEach((step) => {
      step.topics.forEach((topic) => {
        topic.problems.forEach((prob) => {
          totalCount++;
          if (progress[prob.id]?.solved) {
            solvedCount++;
          }
        });
      });
    });

    const percentage = totalCount > 0 ? Math.round((solvedCount / totalCount) * 100) : 0;
    return { totalCount, solvedCount, percentage };
  }, [progress]);

  // 2. Count total matches to handle empty states properly
  const totalVisibleProblems = useMemo(() => {
    let count = 0;
    a2zSheet.forEach((step) => {
      step.topics.forEach((topic) => {
        topic.problems.forEach((prob) => {
          // Check search query matches problem title, topic, or step title
          const matchesSearch =
            prob.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            step.title.toLowerCase().includes(searchQuery.toLowerCase());
          if (!matchesSearch) return;

          // Check filter tabs matches state
          const pState = progress[prob.id];
          if (filter === "solved" && !pState?.solved) return;
          if (filter === "unsolved" && pState?.solved) return;
          if (filter === "revision" && !isRevisionDue(pState, today)) return;

          count++;
        });
      });
    });
    return count;
  }, [progress, searchQuery, filter, today]);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">A2Z DSA Sheet</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Follow the roadmap, solve problems on GFG/LeetCode, and schedule revisions.
          </p>
        </div>

        {/* Global Progress mini-badge */}
        <div className="flex items-center gap-3 shrink-0 rounded-lg border border-border bg-card px-4 py-2.5 shadow-xs">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
            <Percent className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">Sheet Completed</div>
            <div className="text-sm font-bold text-foreground">
              {stats.percentage}%{" "}
              <span className="text-xs font-normal text-muted-foreground">
                ({stats.solvedCount}/{stats.totalCount})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search problems, topics, or steps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 rounded-md border border-input bg-background pl-9 pr-8 text-sm placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Tab Filters */}
        <div className="flex rounded-md border border-border p-1 bg-muted/20 shrink-0">
          {(["all", "unsolved", "solved", "revision"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1 text-xs font-medium rounded-sm capitalize transition-colors ${
                filter === tab
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "revision" ? "Revision Due" : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Step Sections Accordion */}
      <div className="flex flex-col gap-6">
        {a2zSheet.map((step) => (
          <StepAccordion
            key={step.id}
            step={step}
            progress={progress}
            onToggleProblem={toggleSolved}
            searchQuery={searchQuery}
            filter={filter}
          />
        ))}

        {/* Empty State */}
        {totalVisibleProblems === 0 && (
          <EmptyState
            icon={Inbox}
            title="No problems found."
            description="Try modifying your search query or changing the filter settings."
            action={
              (searchQuery || filter !== "all") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setFilter("all");
                  }}
                  className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  Reset all filters
                </button>
              )
            }
          />
        )}
      </div>
    </div>
  );
}
