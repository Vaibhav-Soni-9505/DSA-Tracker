import { Progress, IProgress } from "../models/Progress.js";
import { addDays, isPastOrToday } from "../utils/date.util.js";
import mongoose from "mongoose";

const REVISION_INTERVALS = [1, 3, 7, 15, 30];
const MAX_REVISION_STAGE = 5;

export class ProgressService {
  static async getAll(userId: string): Promise<IProgress[]> {
    return Progress.find({ userId });
  }

  static async getSingle(userId: string, problemId: string): Promise<IProgress | null> {
    return Progress.findOne({ userId, problemId });
  }

  static async solve(userId: string, problemId: string, localDate: string): Promise<IProgress> {
    let progress = await Progress.findOne({ userId, problemId });

    if (progress) {
      if (progress.solved) {
        // Idempotent: return existing
        return progress;
      }
      // Unsolved -> Solved again
      progress.solved = true;
      progress.revisionStage = 0;
      progress.nextRevisionAt = addDays(localDate, REVISION_INTERVALS[0]);
      // PRESERVE firstSolvedAt if it exists
      progress.firstSolvedAt = progress.firstSolvedAt ?? localDate;
      await progress.save();
      return progress;
    }

    // First Solve
    progress = new Progress({
      userId: new mongoose.Types.ObjectId(userId),
      problemId,
      solved: true,
      firstSolvedAt: localDate,
      revisionStage: 0,
      nextRevisionAt: addDays(localDate, REVISION_INTERVALS[0]),
    });
    
    // Using save inside a try-catch for unique constraints (although findOne was checked above)
    try {
      await progress.save();
    } catch (err: any) {
      if (err.code === 11000) {
        // It was inserted concurrently. Fetch and return it.
        return Progress.findOne({ userId, problemId }) as Promise<IProgress>;
      }
      throw err;
    }
    return progress;
  }

  static async review(userId: string, problemId: string, localDate: string, currentStage: number) {
    // 1. Fetch current document to validate business rules
    const progress = await Progress.findOne({ userId, problemId });

    if (!progress) {
      throw { status: 404, code: "PROGRESS_NOT_FOUND", message: "Progress not found." };
    }
    if (!progress.solved) {
      throw { status: 409, code: "NOT_SOLVED", message: "Cannot review an unsolved problem." };
    }
    if (progress.revisionStage >= MAX_REVISION_STAGE) {
      throw { status: 409, code: "REVISION_COMPLETED", message: "Revision completed." };
    }
    if (!progress.nextRevisionAt || !isPastOrToday(progress.nextRevisionAt, localDate)) {
      throw { status: 409, code: "REVISION_NOT_DUE", message: "Revision is not due yet." };
    }

    // 2. Perform conditional update (Concurrency Protection)
    const nextStage = currentStage + 1;
    let nextRevisionAt: string | null = null;
    
    if (nextStage < MAX_REVISION_STAGE) {
      nextRevisionAt = addDays(localDate, REVISION_INTERVALS[nextStage]);
    }

    const updated = await Progress.findOneAndUpdate(
      { 
        userId: new mongoose.Types.ObjectId(userId), 
        problemId, 
        revisionStage: currentStage // Conditional!
      },
      { 
        $set: { 
          revisionStage: nextStage, 
          nextRevisionAt 
        } 
      },
      { returnDocument: 'after' }
    );

    if (!updated) {
      // It means the doc exists (we found it above) but the revisionStage changed
      throw { status: 409, code: "STALE_PROGRESS", message: "This progress was updated elsewhere. Refresh and try again." };
    }

    return updated;
  }

  static async unsolve(userId: string, problemId: string): Promise<IProgress | null> {
    const progress = await Progress.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId), problemId },
      { 
        $set: { 
          solved: false, 
          revisionStage: 0, 
          nextRevisionAt: null 
        } 
      },
      { returnDocument: 'after' }
    );
    // Returns null if not found. The controller handles it idempotently.
    return progress;
  }

  static async resetAll(userId: string): Promise<number> {
    const res = await Progress.deleteMany({ userId: new mongoose.Types.ObjectId(userId) });
    return res.deletedCount;
  }
}
