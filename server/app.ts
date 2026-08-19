import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import progressRoutes from "./routes/progress.routes.js";
import { loadProblemIds } from "./utils/problemValidator.js";

const app = express();

// Load the in-memory canonical dataset for ID validation
loadProblemIds();

// Security Headers
app.use(helmet());

app.use(
  cors({
    origin: config.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json());

// API Routes
app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/progress", progressRoutes);

// Fallback for 404
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "The requested endpoint does not exist.",
    },
  });
});

// Centralized error handling
app.use(errorHandler);

export default app;
