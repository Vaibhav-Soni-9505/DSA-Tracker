import mongoose from "mongoose";
import { config } from "./env.js";

export const connectDB = async () => {
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log(`[Database] Connected to MongoDB`);
  } catch (error) {
    console.error(`[Database] Connection failed: ${(error as Error).message}`);
    // Do not crash the app, but signal failure so health checks can report it
    throw error;
  }
};
