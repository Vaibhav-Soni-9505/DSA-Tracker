import { Router } from "express";
import rateLimit from "express-rate-limit";
import { register, login, getMe } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 auth requests per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many authentication attempts. Please try again later."
      }
    });
  }
});

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.get("/me", authenticate, getMe);

export default router;
