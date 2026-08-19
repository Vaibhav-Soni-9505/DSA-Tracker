import { Request, Response, NextFunction } from "express";
import { ProgressService } from "../services/progress.service.js";
import { isValidProblemId } from "../utils/problemValidator.js";
import { isValidDateString } from "../utils/date.util.js";

// Helper for formatting output
const formatProgress = (p: any) => ({
  problemId: p.problemId,
  solved: p.solved,
  firstSolvedAt: p.firstSolvedAt,
  revisionStage: p.revisionStage,
  nextRevisionAt: p.nextRevisionAt,
});

export const getAllProgress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const progressList = await ProgressService.getAll(userId);
    res.status(200).json({
      success: true,
      data: {
        progress: progressList.map(formatProgress),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getSingleProgress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const problemId = req.params.problemId as string;

    if (!isValidProblemId(problemId)) {
      return res.status(404).json({ success: false, error: { code: "PROBLEM_NOT_FOUND", message: "Problem not found." } });
    }

    const progress = await ProgressService.getSingle(userId, problemId);
    
    res.status(200).json({
      success: true,
      data: {
        progress: progress ? formatProgress(progress) : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const solveProblem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const problemId = req.params.problemId as string;
    const { localDate } = req.body;

    if (!isValidProblemId(problemId)) {
      return res.status(404).json({ success: false, error: { code: "PROBLEM_NOT_FOUND", message: "Problem not found." } });
    }
    if (!isValidDateString(localDate)) {
      return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "A valid localDate (YYYY-MM-DD) is required." } });
    }

    const progress = await ProgressService.solve(userId, problemId, localDate);
    res.status(200).json({ success: true, data: { progress: formatProgress(progress) } });
  } catch (error) {
    next(error);
  }
};

export const reviewProblem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const problemId = req.params.problemId as string;
    const { localDate, currentStage } = req.body;

    if (!isValidProblemId(problemId)) {
      return res.status(404).json({ success: false, error: { code: "PROBLEM_NOT_FOUND", message: "Problem not found." } });
    }
    if (!isValidDateString(localDate)) {
      return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "A valid localDate (YYYY-MM-DD) is required." } });
    }
    if (currentStage === undefined || !Number.isInteger(currentStage) || currentStage < 0 || currentStage > 5) {
      return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "A valid currentStage integer (0-5) is required." } });
    }

    try {
      const progress = await ProgressService.review(userId, problemId, localDate, currentStage);
      res.status(200).json({ success: true, data: { progress: formatProgress(progress) } });
    } catch (err: any) {
      if (err.status) {
        return res.status(err.status).json({ success: false, error: { code: err.code, message: err.message } });
      }
      throw err;
    }
  } catch (error) {
    next(error);
  }
};

export const unsolveProblem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const problemId = req.params.problemId as string;

    if (!isValidProblemId(problemId)) {
      return res.status(404).json({ success: false, error: { code: "PROBLEM_NOT_FOUND", message: "Problem not found." } });
    }

    const progress = await ProgressService.unsolve(userId, problemId);
    
    res.status(200).json({
      success: true,
      data: {
        progress: progress ? formatProgress(progress) : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const resetProgress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const deletedCount = await ProgressService.resetAll(userId);
    
    res.status(200).json({
      success: true,
      data: {
        deletedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};
