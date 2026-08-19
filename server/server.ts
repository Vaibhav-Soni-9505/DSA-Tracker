import app from "./app.js";
import { config, validateEnv } from "./config/env.js";
import { connectDB } from "./config/database.js";

const startServer = async () => {
  // 1. Validate environment
  validateEnv();

  // 2. Connect to Database
  try {
    await connectDB();
  } catch (error) {
    console.error("Shutting down due to database connection failure.");
    process.exit(1);
  }

  // 3. Start Express
  const PORT = config.PORT;
  app.listen(PORT, () => {
    console.log(`[Server] Running on port ${PORT} in ${config.NODE_ENV} mode.`);
  });
};

startServer();
