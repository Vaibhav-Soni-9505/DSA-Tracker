import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import {
  getAllProgress,
  getSingleProgress,
  solveProblem,
  reviewProblem,
  unsolveProblem,
  resetProgress,
} from "../controllers/progress.controller.js";

const router = Router();

// ALL progress routes require authentication. We apply it at the router level.
router.use(authenticate);

router.get("/", getAllProgress);
router.get("/:problemId", getSingleProgress);
router.post("/:problemId/solve", solveProblem);
router.post("/:problemId/review", reviewProblem);
router.delete("/:problemId/unsolve", unsolveProblem);
router.delete("/", resetProgress);

export default router;
