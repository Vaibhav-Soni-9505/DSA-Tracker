export type RevisionStage = 0 | 1 | 2 | 3 | 4 | 5;

export interface UserProgress {
  userId: string;
  problemId: string;
  solved: boolean;
  firstSolvedAt: string | null;
  revisionStage: RevisionStage;
  nextRevisionAt: string | null;
  solvedAt?: string | null; // Deprecated, kept for backward compatibility migration
}
