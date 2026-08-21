import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import type { UserProgress, RevisionStage } from "@/types/progress";
import { a2zSheet } from "@/data/a2z-sheet";
import { addDays, toDateString } from "@/lib/date";
import { REVISION_INTERVALS } from "@/config/revision";
import { useSimulatedDate } from "./useSimulatedDate";
import { useAuth } from "@/features/auth/AuthContext";
import { progressApi } from "@/lib/api";

interface ProgressContextType {
  progress: Record<string, UserProgress>;
  isInitialLoading: boolean;
  isSyncing: boolean;
  toggleSolved: (problemId: string) => Promise<void>;
  completeRevision: (problemId: string) => Promise<void>;
  resetProgress: () => Promise<void>;
  loadTestData: () => void;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

const generateEmptyProgress = (): Record<string, UserProgress> => {
  const initial: Record<string, UserProgress> = {};
  a2zSheet.forEach((step) => {
    step.topics.forEach((topic) => {
      topic.problems.forEach((prob) => {
        initial[prob.id] = {
          userId: "user-1", // Will be overridden by backend or ignored
          problemId: prob.id,
          solved: false,
          firstSolvedAt: null,
          revisionStage: 0,
          nextRevisionAt: null,
        };
      });
    });
  });
  return initial;
};

export const migrateState = (saved: Record<string, any>): Record<string, UserProgress> => {
  const initial = generateEmptyProgress();
  Object.keys(saved).forEach(key => {
    if (!initial[key]) return;
    const item = saved[key];
    if (!item || typeof item !== "object") return;

    let rStage = Number(item.revisionStage);
    if (isNaN(rStage) || rStage < 0 || rStage > 5) rStage = 0;

    const validateDateStr = (str: any) => {
        if (!str || typeof str !== 'string') return null;
        return isNaN(Date.parse(str)) ? null : str;
    };

    initial[key] = {
      ...initial[key],
      solved: Boolean(item.solved),
      firstSolvedAt: validateDateStr(item.firstSolvedAt ?? item.solvedAt),
      revisionStage: rStage as RevisionStage,
      nextRevisionAt: validateDateStr(item.nextRevisionAt),
    };
  });
  return initial;
};

export const ProgressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { today, isSimulated } = useSimulatedDate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [progress, setProgress] = useState<Record<string, UserProgress>>(generateEmptyProgress());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const pendingMutations = useRef(0);

  const incrementPending = () => {
    pendingMutations.current++;
    setIsSaving(true);
  };

  const decrementPending = () => {
    pendingMutations.current--;
    if (pendingMutations.current <= 0) setIsSaving(false);
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (pendingMutations.current > 0) {
        e.preventDefault();
        e.returnValue = "Changes you made may not be saved.";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);
  
  const currentUserRef = useRef<string | null>(null);
  // Ref to hold today to avoid re-triggering migration when date changes
  const todayRef = useRef(today);
  useEffect(() => { todayRef.current = today; }, [today]);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !user) {
      currentUserRef.current = null;
      const saved = localStorage.getItem("a2z-user-progress");
      if (saved) {
        try {
          setProgress(migrateState(JSON.parse(saved)));
        } catch (e) {
          setProgress(generateEmptyProgress());
        }
      } else {
        setProgress(generateEmptyProgress());
      }
      setIsLoading(false);
      return;
    }

    // Identify user switch
    if (currentUserRef.current !== user.id) {
      setProgress(generateEmptyProgress());
      setIsLoading(true);
      currentUserRef.current = user.id;
    }

    let isMounted = true;

    async function loadAndMigrate() {
      try {
        setError(null);
        setIsLoading(true);

        const res = await progressApi.getAll();
        const serverArray = res.data.progress;
        
        const serverDict: Record<string, UserProgress> = {};
        serverArray.forEach(p => {
          serverDict[p.problemId] = p;
        });

        const migrationKey = `a2z-progress-migrated:${user!.id}`;
        const isMigrated = localStorage.getItem(migrationKey);

        if (!isMigrated) {
          const savedStr = localStorage.getItem("a2z-user-progress");
          if (savedStr) {
            let localDict: Record<string, UserProgress> = {};
            try {
               localDict = migrateState(JSON.parse(savedStr));
            } catch (e) {}

            let hasErrors = false;
            
            for (const probId of Object.keys(localDict)) {
              const localProb = localDict[probId];
              // Only migrate if solved locally and DOES NOT exist on server
              if (localProb.solved && !serverDict[probId]) {
                try {
                  let targetDate = localProb.firstSolvedAt ?? toDateString(todayRef.current);
                  const solveRes = await progressApi.solve(probId, targetDate);
                  let latestServerProb = solveRes.data.progress;
                  
                  for (let i = 0; i < localProb.revisionStage; i++) {
                     // Fast-forward the simulated date to precisely the nextRevisionAt boundary 
                     // to bypass backend REVISION_NOT_DUE protections during historical migration.
                     let simDate = latestServerProb.nextRevisionAt 
                       ? latestServerProb.nextRevisionAt 
                       : toDateString(todayRef.current);
                     const revRes = await progressApi.review(probId, simDate, i);
                     latestServerProb = revRes.data.progress;
                  }
                  serverDict[probId] = latestServerProb;
                } catch (err) {
                  hasErrors = true;
                  console.error(`Migration failed for ${probId}`, err);
                }
              }
            }
            if (!hasErrors) {
              localStorage.setItem(migrationKey, "true");
            }
          } else {
            localStorage.setItem(migrationKey, "true");
          }
        }

        if (isMounted) {
          setProgress({ ...generateEmptyProgress(), ...serverDict });
        }
      } catch (err: any) {
        if (err?.code === "INVALID_TOKEN" || err?.code === "AUTHENTICATION_REQUIRED") {
          return;
        }
        if (isMounted) {
          setError(err.message || "Unable to load your progress. Please try again.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadAndMigrate();

    return () => { isMounted = false; };
  }, [user, isAuthenticated, authLoading]);

  // Sync unauthenticated progress to localStorage
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      localStorage.setItem("a2z-user-progress", JSON.stringify(progress));
    }
  }, [progress, isAuthenticated, authLoading]);

  const toggleSolved = async (problemId: string) => {
    const current = progress[problemId];
    if (!current) return;

    if (!isAuthenticated) {
      // Legacy unauthenticated logic
      setProgress((prev) => {
        const p = prev[problemId];
        if (p.solved) {
          return { ...prev, [problemId]: { ...p, solved: false, revisionStage: 0, nextRevisionAt: null } };
        } else {
          return { ...prev, [problemId]: { ...p, solved: true, firstSolvedAt: p.firstSolvedAt ?? toDateString(today), revisionStage: 0, nextRevisionAt: toDateString(addDays(today, REVISION_INTERVALS[0])) } };
        }
      });
      return;
    }

    const previousState = current;
    const isNowSolved = !previousState.solved;
    const currentToday = isSimulated ? today : new Date();

    let nextRev: string | null = null;
    let firstSolvedAt = previousState.firstSolvedAt;

    if (isNowSolved) {
      firstSolvedAt = firstSolvedAt ?? toDateString(currentToday);
      nextRev = toDateString(addDays(currentToday, REVISION_INTERVALS[0]));
    } else {
      nextRev = null;
      // firstSolvedAt remains unchanged when unsolving
    }

    // Optimistic Update
    setProgress(prev => ({
      ...prev,
      [problemId]: {
        ...prev[problemId],
        solved: isNowSolved,
        revisionStage: 0,
        firstSolvedAt: firstSolvedAt,
        nextRevisionAt: nextRev
      }
    }));

    incrementPending();
    try {
      if (previousState.solved) {
        const res = await progressApi.unsolve(problemId);
        setProgress(prev => ({ ...prev, [problemId]: { ...prev[problemId], ...res.data.progress } }));
      } else {
        const res = await progressApi.solve(problemId, toDateString(currentToday));
        setProgress(prev => ({ ...prev, [problemId]: { ...prev[problemId], ...res.data.progress } }));
      }
    } catch (e: any) {
      // Rollback on failure
      setProgress(prev => ({
        ...prev,
        [problemId]: previousState
      }));
      if (e?.code === "INVALID_TOKEN" || e?.code === "AUTHENTICATION_REQUIRED") {
        return;
      }
      console.error(e);
      alert(e.message || "Failed to update progress.");
    } finally {
      decrementPending();
    }
  };

  const completeRevision = async (problemId: string) => {
    const current = progress[problemId];
    if (!current || !current.solved || current.revisionStage >= 5) return;

    if (!isAuthenticated) {
      // Legacy unauthenticated logic
      setProgress((prev) => {
        const p = prev[problemId];
        const nextStage = (p.revisionStage + 1) as RevisionStage;
        let nextRev: string | null = null;
        if (nextStage < 5) {
          nextRev = toDateString(addDays(today, REVISION_INTERVALS[nextStage as 0 | 1 | 2 | 3 | 4]));
        }
        return { ...prev, [problemId]: { ...p, revisionStage: nextStage, nextRevisionAt: nextRev } };
      });
      return;
    }

    const previousState = current;
    const nextStage = (previousState.revisionStage + 1) as RevisionStage;
    let nextRev: string | null = null;
    if (nextStage < 5) {
      nextRev = toDateString(addDays(today, REVISION_INTERVALS[nextStage as 0 | 1 | 2 | 3 | 4]));
    }

    // Optimistic Update
    setProgress(prev => ({
      ...prev,
      [problemId]: {
        ...prev[problemId],
        revisionStage: nextStage,
        nextRevisionAt: nextRev
      }
    }));

    incrementPending();
    try {
      const res = await progressApi.review(problemId, toDateString(today), previousState.revisionStage);
      setProgress(prev => ({ ...prev, [problemId]: { ...prev[problemId], ...res.data.progress } }));
    } catch (e: any) {
      // Rollback on failure
      setProgress(prev => ({
        ...prev,
        [problemId]: previousState
      }));
      if (e?.code === "INVALID_TOKEN" || e?.code === "AUTHENTICATION_REQUIRED") {
        return;
      }
      console.error(e);
      if (e.code === "STALE_PROGRESS") {
        alert("This problem was updated elsewhere. Refreshing progress...");
        try {
          const syncRes = await progressApi.getSingle(problemId);
          if (syncRes.data.progress) {
             setProgress(prev => ({ ...prev, [problemId]: { ...prev[problemId], ...syncRes.data.progress! } }));
          }
        } catch (err) {}
      } else {
        alert(e.message || "Failed to review problem.");
      }
    } finally {
      decrementPending();
    }
  };

  const resetProgress = async () => {
    if (!isAuthenticated) {
      setProgress(generateEmptyProgress());
      return;
    }

    try {
      await progressApi.reset();
      setProgress(generateEmptyProgress());
      // Explicitly DO NOT remove the migration marker.
      // If we did, a refresh would re-trigger migration and resurrect old localStorage data!
    } catch (e: any) {
      if (e?.code === "INVALID_TOKEN" || e?.code === "AUTHENTICATION_REQUIRED") {
        return;
      }
      console.error(e);
      alert("Failed to reset progress.");
    }
  };

  const loadTestData = () => {
    // Only works unauthenticated properly, for authenticated it overrides memory but API is truth
    if (isAuthenticated) {
      alert("Test data injection disabled while authenticated.");
      return;
    }
    setProgress((prev) => {
      const next = { ...prev };
      const histDate = "2026-08-12";
      if (next["prob-425"]) next["prob-425"] = { ...next["prob-425"], solved: true, firstSolvedAt: histDate, revisionStage: 0, nextRevisionAt: toDateString(today) };
      if (next["prob-1211"]) next["prob-1211"] = { ...next["prob-1211"], solved: true, firstSolvedAt: histDate, revisionStage: 1, nextRevisionAt: toDateString(addDays(today, 2)) };
      if (next["prob-424"]) next["prob-424"] = { ...next["prob-424"], solved: true, firstSolvedAt: "2026-05-01", revisionStage: 5, nextRevisionAt: null };
      return next;
    });
  };



  if (error && isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background space-y-4">
        <p className="text-destructive font-medium">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    );
  }

  const isSyncing = isLoading || isSaving;

  return (
    <ProgressContext.Provider value={{ 
      progress, 
      isInitialLoading: isLoading,
      isSyncing, 
      toggleSolved, 
      completeRevision, 
      resetProgress, 
      loadTestData 
    }}>
      {children}
    </ProgressContext.Provider>
  );
};

export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error("useProgress must be used within a ProgressProvider");
  }
  return context;
};
