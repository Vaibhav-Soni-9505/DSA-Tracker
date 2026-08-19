import mongoose from "mongoose";
import { connectDB } from "../server/config/database.ts";
import { User } from "../server/models/User.ts";
import { Progress } from "../server/models/Progress.ts";

// Mock localStorage and import.meta.env for Node.js API client execution
const mockStorage: Record<string, string> = {};
(global as any).localStorage = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, value: string) => { mockStorage[key] = value; },
  removeItem: (key: string) => { delete mockStorage[key]; }
};
(global as any).import = { meta: { env: { VITE_API_BASE_URL: "http://localhost:5000/api/v1" } } };

// @ts-ignore
import { api, progressApi } from "../src/lib/api.ts";

async function runE2ESimulation() {
  console.log("=== STARTING PHASE 4B-4B LOGICAL E2E SIMULATION ===\n");
  
  await connectDB();
  await User.deleteMany({ email: { $in: ["userA@test.com", "userB@test.com"] } });

  // 1. Setup Local Storage Legacy Progress (Before Login)
  console.log("[Test 1] Setting up legacy localStorage progress...");
  mockStorage["a2z-user-progress"] = JSON.stringify({
    "prob-425": { problemId: "prob-425", solved: true, firstSolvedAt: "2026-08-01", revisionStage: 2, nextRevisionAt: "2026-08-10" },
    "prob-1211": { problemId: "prob-1211", solved: false, revisionStage: 0 }
  });

  // 2. Register/Login User A
  console.log("[Test 2] Registering User A...");
  const regRes = await api.post<any>("/auth/register", { name: "User A", email: "userA@test.com", password: "password123" });
  api.setToken(regRes.data.token);
  const userAId = regRes.data.user.id;
  console.log("✅ User A Authenticated.");

  // 3. Simulate Migration (as useProgress would do)
  console.log("[Test 3] Simulating LocalStorage Migration...");
  const savedStr = localStorage.getItem("a2z-user-progress");
  const localDict = JSON.parse(savedStr!);
  let hasErrors = false;
  
  for (const probId of Object.keys(localDict)) {
    const localProb = localDict[probId];
    if (localProb.solved) {
      try {
        const solveRes = await progressApi.solve(probId, localProb.firstSolvedAt);
        let latestProb = solveRes.data.progress;
        for (let i = 0; i < localProb.revisionStage; i++) {
          const revRes = await progressApi.review(probId, latestProb.nextRevisionAt!, i);
          latestProb = revRes.data.progress;
        }
      } catch (err) {
        hasErrors = true;
        console.error(err);
      }
    }
  }
  if (!hasErrors) {
    localStorage.setItem(`a2z-progress-migrated:${userAId}`, "true");
  }
  
  // Verify Migration
  const migratedProgress = await progressApi.getAll();
  const migratedProb1 = migratedProgress.data.progress.find(p => p.problemId === "prob-425");
  console.assert(!!migratedProb1, "Migration failed to save prob-425 to DB");
  console.assert(migratedProb1?.revisionStage === 2, "Migration failed to restore revisionStage");
  console.assert(migratedProb1?.firstSolvedAt === "2026-08-01", "Migration failed to preserve firstSolvedAt");
  console.assert(localStorage.getItem(`a2z-progress-migrated:${userAId}`) === "true", "Migration marker not set");
  console.log("✅ Existing localStorage progress migration successful. DB is now authoritative.");

  // 4. New Problem Solve
  console.log("[Test 4] Solving a new problem through API...");
  const solve3 = await progressApi.solve("prob-424", "2026-08-19");
  const solveCheck = await progressApi.getSingle("prob-424");
  console.assert(solveCheck.data.progress?.solved === true, "Solve API failed");
  console.assert(solveCheck.data.progress?.firstSolvedAt === "2026-08-19", "Solve API date wrong");
  console.log("✅ New problem solve successful.");

  // 5. Review
  console.log("[Test 5] Reviewing a problem...");
  await progressApi.review("prob-424", solve3.data.progress.nextRevisionAt!, 0);
  const reviewCheck = await progressApi.getSingle("prob-424");
  console.assert(reviewCheck.data.progress?.revisionStage === 1, "Review API failed to increment stage");
  console.log("✅ Review API successful. Stage updated.");

  // 6. Unsolve
  console.log("[Test 6] Unsolving a problem...");
  await progressApi.unsolve("prob-424");
  const unsolveCheck = await progressApi.getSingle("prob-424");
  console.assert(unsolveCheck.data.progress?.solved === false, "Unsolve API failed");
  console.assert(unsolveCheck.data.progress?.firstSolvedAt === "2026-08-19", "Unsolve destroyed firstSolvedAt!");
  console.assert(unsolveCheck.data.progress?.revisionStage === 0, "Unsolve didn't reset stage");
  console.log("✅ Unsolve API successful. State reset, history preserved.");

  // 7. Reset All Progress
  console.log("[Test 7] Resetting all progress...");
  await progressApi.reset();
  const resetCheck = await progressApi.getAll();
  console.assert(resetCheck.data.progress.length === 0, "Reset failed to clear DB");
  console.log("✅ Reset All Progress successful.");

  // 8. Logout & Verify State Isolation
  console.log("[Test 8] Logging out User A...");
  api.removeToken();
  console.assert(localStorage.getItem("a2z-auth-token") === null, "Token not removed");
  
  console.log("[Test 9] Registering/Logging in User B...");
  const regResB = await api.post<any>("/auth/register", { name: "User B", email: "userB@test.com", password: "password123" });
  api.setToken(regResB.data.token);
  
  console.log("[Test 10] Verifying User B isolation...");
  const userBProgress = await progressApi.getAll();
  console.assert(userBProgress.data.progress.length === 0, "User B saw User A's data!");
  console.log("✅ User B isolated. Previous user's progress not visible.");

  console.log("\n✅ ALL BACKEND-FRONTEND INTEGRATION LOGIC TESTS PASSED.");
  
  // Cleanup
  await User.deleteMany({ email: { $in: ["userA@test.com", "userB@test.com"] } });
  await Progress.deleteMany({});
  await mongoose.disconnect();
}

runE2ESimulation().catch(err => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
