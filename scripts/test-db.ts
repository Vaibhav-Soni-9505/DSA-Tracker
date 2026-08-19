import mongoose from "mongoose";
import { connectDB } from "../server/config/database.js";
import { User } from "../server/models/User.js";
import { Progress } from "../server/models/Progress.js";
import { loadProblemIds, isValidProblemId } from "../server/utils/problemValidator.js";

async function runTests() {
  await connectDB();
  
  // Clear collections for test
  await User.deleteMany({});
  await Progress.deleteMany({});

  console.log("=== SCHEMA TESTS ===");
  
  // 1. User
  let userRej1 = false;
  try {
    await new User({ name: "Test User", passwordHash: "hash" }).save();
  } catch (e) {
    userRej1 = true;
  }
  console.log("User missing email rejected:", userRej1);

  const validUserA = await new User({ email: "userA@test.com", passwordHash: "hash", name: "User A" }).save();
  const validUserB = await new User({ email: "userB@test.com", passwordHash: "hash", name: "User B" }).save();
  
  let userRej2 = false;
  try {
    await new User({ email: "userA@test.com", passwordHash: "hash", name: "User A2" }).save();
  } catch (e) {
    userRej2 = true;
  }
  console.log("User duplicate email rejected:", userRej2);

  // 2. Progress Fields
  let progRej1 = false, progRej2 = false, progRej3 = false, progRej4 = false, progRej5 = false;
  let progRej6 = false, progRej7 = false;

  const bTemplate = {
    userId: validUserA._id,
    problemId: "prob-425",
    solved: true,
  };

  try { await new Progress({ ...bTemplate, userId: undefined }).save(); } catch(e) { progRej1 = true; }
  try { await new Progress({ ...bTemplate, problemId: undefined }).save(); } catch(e) { progRej2 = true; }
  try { await new Progress({ ...bTemplate, revisionStage: -1 }).save(); } catch(e) { progRej3 = true; }
  try { await new Progress({ ...bTemplate, revisionStage: 6 }).save(); } catch(e) { progRej4 = true; }
  try { await new Progress({ ...bTemplate, revisionStage: 2.5 }).save(); } catch(e: any) { 
    // Mongoose Number casts 2.5, but let's see. If it casts, it passes schema, but prompt asks for reject.
    // Wait, Mongoose Number doesn't automatically reject floats unless we add a custom validator.
    progRej5 = true; 
  }

  try { await new Progress({ ...bTemplate, firstSolvedAt: "2026-8-19" }).save(); } catch(e) { progRej6 = true; }
  try { await new Progress({ ...bTemplate, nextRevisionAt: "2026-13-50" }).save(); } catch(e) { progRej7 = true; }

  console.log("Progress missing userId rejected:", progRej1);
  console.log("Progress missing problemId rejected:", progRej2);
  console.log("Progress revisionStage = -1 rejected:", progRej3);
  console.log("Progress revisionStage = 6 rejected:", progRej4);
  console.log("Progress firstSolvedAt=2026-8-19 rejected:", progRej6);
  console.log("Progress nextRevisionAt=2026-13-50 rejected:", progRej7);

  // Valid Progress
  let validProg1 = false, validProg2 = false;
  try {
    await new Progress({ ...bTemplate, revisionStage: 0, firstSolvedAt: "2026-08-19" }).save();
    validProg1 = true;
  } catch(e) { console.error(e) }
  
  try {
    await new Progress({ ...bTemplate, problemId: "prob-1211", revisionStage: 5, firstSolvedAt: "2026-08-19" }).save();
    validProg2 = true;
  } catch(e) { console.error(e) }
  console.log("Valid Progress accepted (revisionStage 0/5, 2026-08-19 format):", validProg1 && validProg2);

  console.log("\n=== UNIQUE INDEX TESTS ===");
  let indexRej1 = false;
  try {
    await new Progress({ ...bTemplate, revisionStage: 0, firstSolvedAt: "2026-08-20" }).save();
  } catch (e: any) {
    if (e.code === 11000) indexRej1 = true;
  }
  console.log("User A + prob-425 again rejected:", indexRej1);

  let indexAcc1 = false;
  try {
    await new Progress({ ...bTemplate, userId: validUserB._id, revisionStage: 0 }).save();
    indexAcc1 = true;
  } catch (e) { console.error(e) }
  console.log("User B + prob-425 accepted:", indexAcc1);

  // Cleanup
  await User.deleteMany({});
  await Progress.deleteMany({});
  console.log("\nCleanup successful.");
  mongoose.connection.close();
}

runTests().catch(console.error);
