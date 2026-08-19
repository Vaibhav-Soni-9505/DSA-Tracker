import dotenv from "dotenv";

// Load from .env file during development
dotenv.config();

export const config = {
  MONGODB_URI: process.env.MONGODB_URI || "",
  PORT: process.env.PORT || "5000",
  NODE_ENV: process.env.NODE_ENV || "development",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:5173",
  JWT_SECRET: process.env.JWT_SECRET || "",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
};

export const validateEnv = () => {
  if (!config.MONGODB_URI) {
    console.error("FATAL ERROR: MONGODB_URI is not defined.");
    process.exit(1);
  }
  if (!config.JWT_SECRET && config.NODE_ENV !== "test") {
    console.error("FATAL ERROR: JWT_SECRET is not defined.");
    process.exit(1);
  }
};
