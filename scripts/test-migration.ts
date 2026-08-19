import { migrateState } from '../src/hooks/useProgress';
import { a2zSheet } from '../src/data/a2z-sheet';

// We need two real valid IDs from a2zSheet
const validId1 = a2zSheet[0].topics[0].problems[0].id; 
const validId2 = a2zSheet[0].topics[0].problems[1].id;

const obsoleteId = "stale-problem-9999";

const mockLocalStorage = {
  // 1. A progress record whose problemId no longer exists
  [obsoleteId]: {
    userId: "user-1",
    problemId: obsoleteId,
    solved: true,
    solvedAt: "2026-08-01",
    revisionStage: 5,
    nextRevisionAt: null
  },
  // 2. A valid current problem record using the old schema
  [validId1]: {
    userId: "user-1",
    problemId: validId1,
    solved: true,
    solvedAt: "2026-08-12",
    revisionStage: 2,
    nextRevisionAt: "2026-08-19"
  },
  // 3. A valid current problem record that already has firstSolvedAt
  [validId2]: {
    userId: "user-1",
    problemId: validId2,
    solved: true,
    firstSolvedAt: "2026-08-10",
    revisionStage: 1,
    nextRevisionAt: "2026-08-13"
  }
};

console.log("--- MIGRATION TEST ---");
console.log(`Input keys count: ${Object.keys(mockLocalStorage).length}`);

const result = migrateState(mockLocalStorage);

console.log("\n--- RESULT ---");

// A. Obsolete problem IDs are ignored/removed
console.log(`Obsolete ID '${obsoleteId}' exists in result?`, !!result[obsoleteId]);

// B. The old solvedAt value is migrated
console.log(`Valid ID 1 migrated correctly?`);
console.log(`  firstSolvedAt: ${result[validId1].firstSolvedAt} (Expected: 2026-08-12)`);
console.log(`  solvedAt exists?: ${'solvedAt' in result[validId1]} (Expected: false)`);

// C. An existing valid firstSolvedAt is NOT overwritten
console.log(`Valid ID 2 migrated correctly?`);
console.log(`  firstSolvedAt: ${result[validId2].firstSolvedAt} (Expected: 2026-08-10)`);

// D, E. Revision stage and next revision intact
console.log(`Valid ID 1 revision info: stage=${result[validId1].revisionStage}, next=${result[validId1].nextRevisionAt}`);
console.log(`Valid ID 2 revision info: stage=${result[validId2].revisionStage}, next=${result[validId2].nextRevisionAt}`);

// Idempotence Check
console.log("\n--- IDEMPOTENCE TEST ---");
const result2 = migrateState(result);
console.log(`Valid ID 1 firstSolvedAt after 2nd migration: ${result2[validId1].firstSolvedAt}`);
console.log(`Valid ID 2 firstSolvedAt after 2nd migration: ${result2[validId2].firstSolvedAt}`);
