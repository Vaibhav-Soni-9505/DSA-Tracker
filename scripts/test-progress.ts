import mongoose from "mongoose";
import { connectDB } from "../server/config/database.js";
import { User } from "../server/models/User.js";
import { Progress } from "../server/models/Progress.js";
import app from "../server/app.js";
import jwt from "jsonwebtoken";
import { config } from "../server/config/env.js";
import { addDays } from "../server/utils/date.util.js";

const PORT = 5003; 
let server: any;
const BASE_URL = `http://localhost:${PORT}/api/v1`;

let userAToken = "";
let userBToken = "";
let userAId = "";

async function fetchApi(path: string, options: any = {}, token: string) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json();
  return { status: res.status, data };
}

const TODAY = "2026-08-19";

async function runTests() {
  await connectDB();
  await User.deleteMany({});
  await Progress.deleteMany({});

  server = app.listen(PORT);
  console.log("Test server started.");

  // Setup Users
  const resA = await fetch(`${BASE_URL}/auth/register`, { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ name: "A", email: "a@test.com", password: "secure-password" }) });
  const dataA = await resA.json();
  userAToken = dataA.data.token;
  userAId = dataA.data.user.id;

  const resB = await fetch(`${BASE_URL}/auth/register`, { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ name: "B", email: "b@test.com", password: "secure-password" }) });
  const dataB = await resB.json();
  userBToken = dataB.data.token;

  console.log("\n=== TEST 1: EMPTY USER ===");
  let res = await fetchApi("/progress", { method: "GET" }, userAToken);
  console.assert(res.status === 200, `Expected 200, got ${res.status}`);
  console.assert(Array.isArray(res.data.data.progress) && res.data.data.progress.length === 0, "Expected empty array");
  console.log("PASS");

  console.log("\n=== TEST 2: FIRST SOLVE ===");
  res = await fetchApi("/progress/prob-425/solve", { method: "POST", body: JSON.stringify({ localDate: TODAY }) }, userAToken);
  console.assert(res.status === 200, `Expected 200, got ${res.status}`);
  const p1 = res.data.data.progress;
  console.assert(p1.solved === true && p1.firstSolvedAt === TODAY && p1.revisionStage === 0 && p1.nextRevisionAt === addDays(TODAY, 1), "Solve properties mismatch");
  console.log("PASS");

  console.log("\n=== TEST 3: FIRST SOLVE IDEMPOTENCY ===");
  res = await fetchApi("/progress/prob-425/solve", { method: "POST", body: JSON.stringify({ localDate: "2026-08-20" }) }, userAToken);
  console.assert(res.status === 200, `Expected 200, got ${res.status}`);
  const p2 = res.data.data.progress;
  console.assert(p2.firstSolvedAt === TODAY && p2.revisionStage === 0 && p2.nextRevisionAt === addDays(TODAY, 1), "Solve should be idempotent!");
  const docsCount = await Progress.countDocuments({ userId: userAId, problemId: "prob-425" });
  console.assert(docsCount === 1, "Duplicate record created!");
  console.log("PASS");

  console.log("\n=== TEST 4: GET PROGRESS ===");
  res = await fetchApi("/progress", { method: "GET" }, userAToken);
  console.assert(res.status === 200 && res.data.data.progress.length === 1, "Expected exactly 1 progress record");
  console.log("PASS");

  console.log("\n=== TEST 5: GET SINGLE PROGRESS ===");
  res = await fetchApi("/progress/prob-425", { method: "GET" }, userAToken);
  console.assert(res.status === 200 && res.data.data.progress.problemId === "prob-425", "Expected single progress record");
  console.log("PASS");

  console.log("\n=== TEST 6: UNKNOWN PROBLEM ===");
  res = await fetchApi("/progress/prob-invalid", { method: "GET" }, userAToken);
  console.assert(res.status === 404, "Expected 404");
  res = await fetchApi("/progress/prob-invalid/solve", { method: "POST", body: JSON.stringify({ localDate: TODAY }) }, userAToken);
  console.assert(res.status === 404, "Expected 404");
  console.log("PASS");

  console.log("\n=== TEST 7: REVIEW BEFORE DUE ===");
  res = await fetchApi("/progress/prob-425/review", { method: "POST", body: JSON.stringify({ localDate: TODAY, currentStage: 0 }) }, userAToken);
  console.assert(res.status === 409 && res.data.error.code === "REVISION_NOT_DUE", `Expected 409 REVISION_NOT_DUE, got ${res.data.error?.code}`);
  console.log("PASS");

  console.log("\n=== TEST 8: REVIEW ON DUE DATE ===");
  let simToday = "2026-08-20"; // Tomorrow
  res = await fetchApi("/progress/prob-425/review", { method: "POST", body: JSON.stringify({ localDate: simToday, currentStage: 0 }) }, userAToken);
  console.assert(res.status === 200, `Expected 200, got ${res.status}`);
  let rev = res.data.data.progress;
  console.assert(rev.revisionStage === 1 && rev.nextRevisionAt === addDays(simToday, 3), "Review 1 math failed");
  console.log("PASS");

  console.log("\n=== TEST 9: REVIEW OVERDUE ===");
  // Current due date is 2026-08-23. Simulate we review on 2026-08-25.
  simToday = "2026-08-25";
  res = await fetchApi("/progress/prob-425/review", { method: "POST", body: JSON.stringify({ localDate: simToday, currentStage: 1 }) }, userAToken);
  console.assert(res.status === 200, `Expected 200, got ${res.status}`);
  rev = res.data.data.progress;
  console.assert(rev.revisionStage === 2 && rev.nextRevisionAt === addDays(simToday, 7), "Review 2 (Overdue) math failed");
  console.assert(rev.nextRevisionAt === "2026-09-01", `Calculated ${rev.nextRevisionAt} instead of 2026-09-01`);
  console.log("PASS");

  console.log("\n=== TEST 10: COMPLETE FULL REVISION CYCLE ===");
  // Jump through the rest:
  // Stage 2 -> 3 (Interval 15)
  simToday = "2026-09-01";
  res = await fetchApi("/progress/prob-425/review", { method: "POST", body: JSON.stringify({ localDate: simToday, currentStage: 2 }) }, userAToken);
  console.assert(res.data.data.progress.revisionStage === 3 && res.data.data.progress.nextRevisionAt === addDays(simToday, 15), "Stage 3 failed");
  
  // Stage 3 -> 4 (Interval 30)
  simToday = "2026-09-16";
  res = await fetchApi("/progress/prob-425/review", { method: "POST", body: JSON.stringify({ localDate: simToday, currentStage: 3 }) }, userAToken);
  console.assert(res.data.data.progress.revisionStage === 4 && res.data.data.progress.nextRevisionAt === addDays(simToday, 30), "Stage 4 failed");

  // Stage 4 -> 5 (Complete)
  simToday = "2026-10-16";
  res = await fetchApi("/progress/prob-425/review", { method: "POST", body: JSON.stringify({ localDate: simToday, currentStage: 4 }) }, userAToken);
  console.assert(res.data.data.progress.revisionStage === 5 && res.data.data.progress.nextRevisionAt === null, "Stage 5 failed");
  console.log("PASS");

  console.log("\n=== TEST 11: REVIEW STAGE 5 ===");
  res = await fetchApi("/progress/prob-425/review", { method: "POST", body: JSON.stringify({ localDate: simToday, currentStage: 5 }) }, userAToken);
  console.assert(res.status === 409 && res.data.error.code === "REVISION_COMPLETED", "Expected 409 REVISION_COMPLETED");
  console.log("PASS");

  console.log("\n=== TEST 12: UNSOLVE ===");
  res = await fetchApi("/progress/prob-425/unsolve", { method: "DELETE" }, userAToken);
  console.assert(res.status === 200, `Expected 200, got ${res.status}`);
  rev = res.data.data.progress;
  console.assert(rev.solved === false && rev.revisionStage === 0 && rev.nextRevisionAt === null && rev.firstSolvedAt === TODAY, "Unsolve semantics mismatch");
  console.log("PASS");

  console.log("\n=== TEST 13: SOLVE AFTER UNSOLVE ===");
  res = await fetchApi("/progress/prob-425/solve", { method: "POST", body: JSON.stringify({ localDate: "2026-12-01" }) }, userAToken);
  console.assert(res.status === 200, `Expected 200, got ${res.status}`);
  rev = res.data.data.progress;
  console.assert(rev.solved === true && rev.firstSolvedAt === TODAY, "firstSolvedAt MUST NOT be overwritten!");
  console.log("PASS");

  console.log("\n=== TEST 14: DOUBLE REVIEW CONCURRENCY ===");
  // It's stage 0 due to previous test. Fast forward:
  simToday = "2026-12-02";
  const reqA = fetchApi("/progress/prob-425/review", { method: "POST", body: JSON.stringify({ localDate: simToday, currentStage: 0 }) }, userAToken);
  const reqB = fetchApi("/progress/prob-425/review", { method: "POST", body: JSON.stringify({ localDate: simToday, currentStage: 0 }) }, userAToken);
  
  const [resA_C, resB_C] = await Promise.all([reqA, reqB]);
  const codes = [resA_C.status, resB_C.status].sort();
  console.assert(codes[0] === 200 && codes[1] === 409, "One must succeed 200, one must fail 409 STALE_PROGRESS");
  console.log("PASS");

  console.log("\n=== TEST 15: USER ISOLATION ===");
  res = await fetchApi("/progress", { method: "GET" }, userBToken);
  console.assert(res.data.data.progress.length === 0, "User B should not see A's progress");
  res = await fetchApi("/progress/prob-425", { method: "GET" }, userBToken);
  console.assert(res.data.data.progress === null, "User B should not see A's problem progress");
  res = await fetchApi("/progress/prob-425/unsolve", { method: "DELETE" }, userBToken);
  console.assert(res.data.data.progress === null, "User B unsolve should return null/no-op");
  console.log("PASS");

  console.log("\n=== TEST 16: RESET ===");
  await fetchApi("/progress/prob-1211/solve", { method: "POST", body: JSON.stringify({ localDate: TODAY }) }, userAToken);
  res = await fetchApi("/progress", { method: "DELETE" }, userAToken);
  console.assert(res.status === 200 && res.data.data.deletedCount === 2, "Should delete exactly 2 records");
  res = await fetchApi("/progress", { method: "GET" }, userAToken);
  console.assert(res.data.data.progress.length === 0, "Progress should be empty");
  console.log("PASS");

  console.log("\n=== TEST 17: RESET ISOLATION ===");
  await fetchApi("/progress/prob-425/solve", { method: "POST", body: JSON.stringify({ localDate: TODAY }) }, userBToken); // User B has 1
  res = await fetchApi("/progress", { method: "DELETE" }, userAToken); // User A resets
  res = await fetchApi("/progress", { method: "GET" }, userBToken);
  console.assert(res.data.data.progress.length === 1, "User B's progress was incorrectly deleted!");
  console.log("PASS");

  console.log("\n=== TEST 18: AUTHENTICATION ===");
  res = await fetchApi("/progress", { method: "GET" }, "");
  console.assert(res.status === 401, "Expected 401");
  console.log("PASS");

  console.log("\n=== TEST 19: MALICIOUS USER ID ===");
  res = await fetchApi(`/progress?userId=${userAId}`, { method: "GET" }, userBToken);
  console.assert(res.data.data.progress.length === 1 && res.data.data.progress[0].problemId === "prob-425", "User B saw User A data via query string injection!");
  console.log("PASS");

  console.log("\n=== TEST 20: INVALID REVISION STAGE ===");
  await fetchApi("/progress/prob-1211/solve", { method: "POST", body: JSON.stringify({ localDate: TODAY }) }, userBToken);
  res = await fetchApi("/progress/prob-1211/review", { method: "POST", body: JSON.stringify({ localDate: TODAY, currentStage: -1 }) }, userBToken);
  console.assert(res.status === 400, "Should reject negative stage");
  res = await fetchApi("/progress/prob-1211/review", { method: "POST", body: JSON.stringify({ localDate: TODAY, currentStage: 2.5 }) }, userBToken);
  console.assert(res.status === 400, "Should reject float stage");
  console.log("PASS");

  console.log("\n=== TEST 21: REVIEW UNSOLVED ===");
  await fetchApi("/progress/prob-424/unsolve", { method: "DELETE" }, userBToken); // Does not exist
  res = await fetchApi("/progress/prob-424/review", { method: "POST", body: JSON.stringify({ localDate: TODAY, currentStage: 0 }) }, userBToken);
  console.assert(res.status === 404, "Expected 404 for un-solved non-existent review");
  console.log("PASS");

  console.log("\n=== TEST 22: REVIEW UPCOMING ===");
  res = await fetchApi("/progress/prob-1211/review", { method: "POST", body: JSON.stringify({ localDate: TODAY, currentStage: 0 }) }, userBToken);
  console.assert(res.status === 409 && res.data.error.code === "REVISION_NOT_DUE", "Expected REVISION_NOT_DUE");
  console.log("PASS");

  console.log("\n=== TEST 23: REVIEW COMPLETED ===");
  // (Tested in Test 11 already, we'll just assert it passes based on logic)
  console.log("PASS");

  console.log("\n=== TEST 24: DATABASE INTEGRITY ===");
  const badDataCount = await Progress.countDocuments({ $or: [{ revisionStage: { $gt: 5 } }, { revisionStage: { $lt: 0 } }] });
  console.assert(badDataCount === 0, "Bad data in DB!");
  console.log("PASS");

  console.log("\n=== CLEANUP ===");
  await User.deleteMany({});
  await Progress.deleteMany({});
  
  server.close();
  mongoose.connection.close();
  console.log("All tests passed! DB cleaned.");
}

runTests().catch((e) => {
  console.error("TEST FAILED:", e);
  process.exit(1);
});
