import { Request, Response, NextFunction } from "express";
import { User } from "../models/User.js";
import { hashPassword, comparePassword, generateToken } from "../services/auth.service.js";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let { name, email, password } = req.body;

    // 1. Validation
    if (!name || typeof name !== "string" || name.trim() === "") {
      return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Name is required." } });
    }
    if (!email || typeof email !== "string") {
      return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Email is required." } });
    }
    if (!password || typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Password must be at least 8 characters long." } });
    }
    
    email = email.trim().toLowerCase();
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid email format." } });
    }
    name = name.trim();

    // 2. Check duplicates manually (optional, but gives a cleaner error than Mongo 11000 sometimes)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, error: { code: "EMAIL_ALREADY_EXISTS", message: "An account with this email already exists." } });
    }

    // 3. Hash & Save
    const passwordHash = await hashPassword(password);
    const newUser = new User({ name, email, passwordHash });
    
    try {
      await newUser.save();
    } catch (dbError: any) {
      if (dbError.code === 11000) {
        return res.status(409).json({ success: false, error: { code: "EMAIL_ALREADY_EXISTS", message: "An account with this email already exists." } });
      }
      throw dbError;
    }

    // 4. Token
    const token = generateToken(newUser._id.toString());

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let { email, password } = req.body;

    if (!email || typeof email !== "string" || !password || typeof password !== "string") {
      return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Email and password are required." } });
    }

    email = email.trim().toLowerCase();

    // Find user and explicitly select passwordHash
    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user) {
      return res.status(401).json({ success: false, error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password." } });
    }

    // Compare
    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password." } });
    }

    // Token
    const token = generateToken(user._id.toString());

    res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: { code: "AUTHENTICATION_REQUIRED", message: "Authentication is required." } });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ success: false, error: { code: "INVALID_TOKEN", message: "User no longer exists." } });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
