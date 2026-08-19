import { addDays, toDateString, isRevisionDue } from '../src/lib/date';
import { REVISION_INTERVALS } from '../src/config/revision';
import { UserProgress, RevisionStage } from '../src/types/progress';

// Mock progress object
const problemId = 'prob-test-1';
let progress: UserProgress = {
  userId: 'user-1',
  problemId,
  solved: false,
  firstSolvedAt: null,
  revisionStage: 0,
  nextRevisionAt: null,
};

let virtualToday = new Date('2026-08-19T10:00:00.000Z');

// Reducer functions ported directly from useProgress
function toggleSolved() {
  if (progress.solved) {
    progress = { ...progress, solved: false, revisionStage: 0, nextRevisionAt: null };
  } else {
    const dateStr = toDateString(virtualToday);
    const nextRevisionStr = toDateString(addDays(virtualToday, REVISION_INTERVALS[0])); 
    progress = {
      ...progress,
      solved: true,
      firstSolvedAt: progress.firstSolvedAt ?? dateStr,
      revisionStage: 0,
      nextRevisionAt: nextRevisionStr,
    };
  }
}

function completeRevision() {
  if (!progress.solved || progress.revisionStage >= 5) return;
  const nextStage = (progress.revisionStage + 1) as RevisionStage;
  let nextRevisionAt: string | null = null;
  if (nextStage < 5) {
    const days = REVISION_INTERVALS[nextStage as 0 | 1 | 2 | 3 | 4];
    nextRevisionAt = toDateString(addDays(virtualToday, days));
  }
  progress = {
    ...progress,
    revisionStage: nextStage,
    nextRevisionAt,
  };
}

function logState(stepLabel: string) {
  console.log(`\n--- ${stepLabel} ---`);
  console.log(`Virtual Today: ${toDateString(virtualToday)}`);
  console.log(`solved: ${progress.solved}`);
  console.log(`firstSolvedAt: ${progress.firstSolvedAt}`);
  console.log(`revisionStage: ${progress.revisionStage}`);
  console.log(`nextRevisionAt: ${progress.nextRevisionAt}`);
  console.log(`isRevisionDue: ${isRevisionDue(progress, virtualToday)}`); // NOTE: we need to pass virtualToday to isRevisionDue to mock time, but isRevisionDue uses new Date() internally in the real code. 
}

// Since isRevisionDue in production uses new Date(), let's override the global Date temporarily to simulate time travel.
const OriginalDate = Date;
class MockDate extends OriginalDate {
  constructor(...args: any[]) {
    if (args.length === 0) {
      super(virtualToday.getTime());
    } else {
      super(...args as any);
    }
  }
  static now() {
    return virtualToday.getTime();
  }
}
global.Date = MockDate as any;

console.log("INITIAL STATE:");
console.log(progress);

virtualToday = new Date('2026-08-19T10:00:00.000Z');
toggleSolved();
logState("1. Solved for the first time");

virtualToday = new Date('2026-08-20T10:00:00.000Z');
logState("Time travels to +1 day (Due)");
completeRevision();
logState("2. Marked Reviewed (Completed Stage 0 -> 1)");

virtualToday = new Date('2026-08-23T10:00:00.000Z');
logState("Time travels to +3 days (Due)");
completeRevision();
logState("3. Marked Reviewed (Completed Stage 1 -> 2)");

// What if we review it 2 days LATE?
virtualToday = new Date('2026-09-01T10:00:00.000Z'); // 2026-08-23 + 7 days = 2026-08-30. 2026-09-01 is 2 days late!
logState("Time travels to +9 days (Overdue)");
completeRevision();
logState("4. Marked Reviewed (Completed Stage 2 -> 3) - Next date should be 2026-09-01 + 15 days = 2026-09-16, NOT 2026-08-30 + 15 days");

virtualToday = new Date('2026-09-16T10:00:00.000Z');
logState("Time travels to +15 days (Due)");
completeRevision();
logState("5. Marked Reviewed (Completed Stage 3 -> 4)");

virtualToday = new Date('2026-10-16T10:00:00.000Z');
logState("Time travels to +30 days (Due)");
completeRevision();
logState("6. Marked Reviewed (Completed Stage 4 -> 5)");

virtualToday = new Date('2026-10-20T10:00:00.000Z');
logState("Time travels 4 days later (Already complete)");
completeRevision();
logState("7. Attempt review when already completed");
