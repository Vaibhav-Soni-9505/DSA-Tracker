import { Router, Request, Response } from "express";
import mongoose from "mongoose";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  const isDbConnected = mongoose.connection.readyState === 1;

  if (!isDbConnected) {
    return res.status(503).json({
      success: false,
      error: {
        code: "SERVICE_UNAVAILABLE",
        message: "Database is disconnected",
      },
    });
  }

  res.status(200).json({
    success: true,
    data: {
      status: "ok",
      database: "connected",
    },
  });
});

export default router;
