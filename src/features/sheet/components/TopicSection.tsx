import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { ProblemRow } from "./ProblemRow";
import type { Topic } from "@/types/a2z";
import type { UserProgress } from "@/types/progress";
import { isRevisionDue } from "@/lib/date";
import { useSimulatedDate } from "@/hooks/useSimulatedDate";

interface TopicSectionProps {
  topic: Topic;
  progress: Record<string, UserProgress>;
  onToggleProblem: (id: string) => void;
  searchQuery: string;
  filter: "all" | "unsolved" | "solved" | "revision";
}

export const TopicSection: React.FC<TopicSectionProps> = ({
  topic,
  progress,
  onToggleProblem,
  searchQuery,
  filter,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const { today } = useSimulatedDate();

  // 1. Calculate count
  const totalCount = topic.problems.length;
  const solvedCount = topic.problems.filter((p) => progress[p.id]?.solved).length;
  const percentage = totalCount > 0 ? Math.round((solvedCount / totalCount) * 100) : 0;

  // 2. Filter problems based on search query & active filters
  const filteredProblems = topic.problems.filter((problem) => {
    // Search filter
    const matchesSearch = problem.title.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    // Tab filter
    const pState = progress[problem.id];
    if (filter === "solved") return pState?.solved;
    if (filter === "unsolved") return !pState?.solved;
    if (filter === "revision") return isRevisionDue(pState, today);

    return true;
  });

  // Hide the entire topic if there's a search/filter and no problems match
  if (filteredProblems.length === 0 && (searchQuery || filter !== "all")) {
    return null;
  }

  return (
    <div className="border border-border/50 rounded-lg bg-card overflow-hidden shadow-xs">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-4 p-4 text-left transition-colors hover:bg-muted/30 focus-visible:outline-hidden"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
          <span className="font-semibold text-sm text-foreground truncate">{topic.title}</span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-xs text-muted-foreground">
            {solvedCount} / {totalCount} Solved
          </div>
          <div className="w-16 h-1.5 rounded-full bg-secondary overflow-hidden hidden xs:block">
            <div className="h-full bg-primary" style={{ width: `${percentage}%` }} />
          </div>
        </div>
      </button>

      {/* Problems List */}
      {isOpen && (
        <div className="border-t border-border/50 divide-y divide-border/40">
          {filteredProblems.map((problem) => (
            <ProblemRow
              key={problem.id}
              problem={problem}
              progress={progress[problem.id]}
              onToggle={onToggleProblem}
            />
          ))}
        </div>
      )}
    </div>
  );
};
