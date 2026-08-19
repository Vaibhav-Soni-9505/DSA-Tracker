import React, { useState } from "react";
import { ChevronDown, ChevronRight, BookOpen } from "lucide-react";
import { TopicSection } from "./TopicSection";
import type { Step } from "@/types/a2z";
import type { UserProgress } from "@/types/progress";
import { isRevisionDue } from "@/lib/date";
import { useSimulatedDate } from "@/hooks/useSimulatedDate";

interface StepAccordionProps {
  step: Step;
  progress: Record<string, UserProgress>;
  onToggleProblem: (id: string) => void;
  searchQuery: string;
  filter: "all" | "unsolved" | "solved" | "revision";
}

export const StepAccordion: React.FC<StepAccordionProps> = ({
  step,
  progress,
  onToggleProblem,
  searchQuery,
  filter,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const { today } = useSimulatedDate();

  // 1. Calculations
  let totalCount = 0;
  let solvedCount = 0;

  step.topics.forEach((topic) => {
    topic.problems.forEach((prob) => {
      totalCount++;
      if (progress[prob.id]?.solved) {
        solvedCount++;
      }
    });
  });

  const percentage = totalCount > 0 ? Math.round((solvedCount / totalCount) * 100) : 0;

  // 2. Determine if any child content matches query to prevent rendering empty shell
  const hasMatchingProblems = step.topics.some((topic) =>
    topic.problems.some((prob) => {
      const matchesSearch =
        prob.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        step.title.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      const pState = progress[prob.id];
      if (filter === "solved") return pState?.solved;
      if (filter === "unsolved") return !pState?.solved;
      if (filter === "revision") return isRevisionDue(pState, today);
      return true;
    })
  );

  // If search/filter returns nothing for the entire Step, don't render it
  if (!hasMatchingProblems && (searchQuery || filter !== "all")) {
    return null;
  }

  return (
    <div className="border border-border rounded-lg bg-background overflow-hidden shadow-sm">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-muted/20 focus-visible:outline-hidden"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-bold text-base text-foreground tracking-tight line-clamp-1">{step.title}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{step.topics.length} topics</p>
          </div>
        </div>

        <div className="flex items-center gap-4 self-end sm:self-center shrink-0">
          <div className="flex flex-col items-end gap-1">
            <span className="text-sm font-semibold text-foreground">{percentage}% Complete</span>
            <span className="text-xs text-muted-foreground">{solvedCount} / {totalCount} Solved</span>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:text-foreground">
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </div>
        </div>
      </button>

      {/* Topics */}
      {isOpen && (
        <div className="p-4 bg-muted/20 border-t border-border/80 flex flex-col gap-4">
          {step.topics.map((topic) => (
            <TopicSection
              key={topic.id}
              topic={topic}
              progress={progress}
              onToggleProblem={onToggleProblem}
              searchQuery={searchQuery}
              filter={filter}
            />
          ))}
        </div>
      )}
    </div>
  );
};
