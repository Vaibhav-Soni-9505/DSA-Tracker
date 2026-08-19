import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { config } from "../config/env.js";

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: { code: "AUTHENTICATION_REQUIRED", message: "Authentication is required." },
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, config.JWT_SECRET) as { sub: string };
    
    const userId = payload.sub;
    
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({
        success: false,
        error: { code: "INVALID_TOKEN", message: "Authentication token is invalid or expired." },
      });
    }

    req.user = { id: userId };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: { code: "INVALID_TOKEN", message: "Authentication token is invalid or expired." },
    });
  }
};
