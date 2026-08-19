import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config/env.js";

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcryptjs.genSalt(10);
  return bcryptjs.hash(password, salt);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcryptjs.compare(password, hash);
};

export const generateToken = (userId: string): string => {
  return jwt.sign({ sub: userId }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN as any,
  });
};
