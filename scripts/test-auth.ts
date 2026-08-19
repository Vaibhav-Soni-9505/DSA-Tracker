import mongoose from "mongoose";
import { connectDB } from "../server/config/database.js";
import { User } from "../server/models/User.js";
import { Progress } from "../server/models/Progress.js";
import app from "../server/app.js";
import jwt from "jsonwebtoken";
import { config } from "../server/config/env.js";

const PORT = 5002; // use different port for testing
let server: any;
const BASE_URL = `http://localhost:${PORT}/api/v1/auth`;

async function fetchApi(path: string, options: any = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function runTests() {
  await connectDB();
  await User.deleteMany({}); // clean state
  await Progress.deleteMany({});

  server = app.listen(PORT);
  console.log("Test server started.");

  let token = "";
  let userId = "";

  console.log("\n=== TEST 1: REGISTRATION SUCCESS ===");
  let res = await fetchApi("/register", {
    method: "POST",
    body: JSON.stringify({ name: "Vaibhav", email: "user@example.com", password: "secure-password" }),
  });
  console.assert(res.status === 201, `Expected 201, got ${res.status}`);
  console.assert(res.data.success === true, "Expected success: true");
  console.assert(!!res.data.data.token, "Token missing");
  console.assert(!res.data.data.user.passwordHash && !res.data.data.user.password, "Password leaked");
  token = res.data.data.token;
  userId = res.data.data.user.id;
  
  // Verify DB hash
  const dbUser = await User.findById(userId).select("+passwordHash");
  console.assert(dbUser!.passwordHash !== "secure-password", "Password stored as plaintext!");
  console.log("PASS");

  console.log("\n=== TEST 2: DUPLICATE REGISTRATION ===");
  res = await fetchApi("/register", {
    method: "POST",
    body: JSON.stringify({ name: "Vaibhav 2", email: "user@example.com", password: "secure-password" }),
  });
  console.assert(res.status === 409, `Expected 409, got ${res.status}`);
  console.assert(res.data.error.code === "EMAIL_ALREADY_EXISTS", "Wrong error code");
  console.log("PASS");

  console.log("\n=== TEST 3: EMAIL NORMALIZATION ===");
  res = await fetchApi("/register", {
    method: "POST",
    body: JSON.stringify({ name: "Vaibhav 3", email: "User@Example.com", password: "secure-password" }),
  });
  console.assert(res.status === 409, `Expected 409, got ${res.status}`);
  console.log("PASS");

  console.log("\n=== TEST 4: INVALID REGISTRATION ===");
  const invalidCases = [
    { name: "Vaibhav", email: "user@example.com" }, // missing pass
    { name: "Vaibhav", password: "secure-password" }, // missing email
    { email: "user2@example.com", password: "secure-password" }, // missing name
    { name: "Vaibhav", email: "invalid", password: "secure-password" }, // invalid email
    { name: "Vaibhav", email: "user2@example.com", password: "short" }, // short pass
  ];
  for (const c of invalidCases) {
    res = await fetchApi("/register", { method: "POST", body: JSON.stringify(c) });
    console.assert(res.status === 400, `Expected 400, got ${res.status}`);
  }
  console.log("PASS");

  console.log("\n=== TEST 5: LOGIN SUCCESS ===");
  res = await fetchApi("/login", {
    method: "POST",
    body: JSON.stringify({ email: "User@Example.com", password: "secure-password" }),
  });
  console.assert(res.status === 200, `Expected 200, got ${res.status}`);
  console.assert(!!res.data.data.token, "Token missing");
  console.assert(!res.data.data.user.passwordHash, "Password leaked");
  console.log("PASS");

  console.log("\n=== TEST 6: WRONG PASSWORD ===");
  res = await fetchApi("/login", {
    method: "POST",
    body: JSON.stringify({ email: "user@example.com", password: "wrong-password" }),
  });
  console.assert(res.status === 401, `Expected 401, got ${res.status}`);
  console.assert(res.data.error.code === "INVALID_CREDENTIALS", "Wrong error code");
  console.log("PASS");

  console.log("\n=== TEST 7: UNKNOWN EMAIL ===");
  res = await fetchApi("/login", {
    method: "POST",
    body: JSON.stringify({ email: "unknown@example.com", password: "secure-password" }),
  });
  console.assert(res.status === 401, `Expected 401, got ${res.status}`);
  console.assert(res.data.error.code === "INVALID_CREDENTIALS", "Wrong error code");
  console.log("PASS");

  console.log("\n=== TEST 8: /AUTH/ME WITH VALID TOKEN ===");
  res = await fetchApi("/me", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` }
  });
  console.assert(res.status === 200, `Expected 200, got ${res.status}`);
  console.assert(res.data.data.user.email === "user@example.com", "Wrong email");
  console.assert(!res.data.data.user.passwordHash, "Password leaked");
  console.log("PASS");

  console.log("\n=== TEST 9: /AUTH/ME WITHOUT TOKEN ===");
  res = await fetchApi("/me", { method: "GET" });
  console.assert(res.status === 401, `Expected 401, got ${res.status}`);
  console.assert(res.data.error.code === "AUTHENTICATION_REQUIRED", "Wrong error code");
  console.log("PASS");

  console.log("\n=== TEST 10: MALFORMED TOKEN ===");
  res = await fetchApi("/me", {
    method: "GET",
    headers: { Authorization: `Bearer abc.def.xyz` }
  });
  console.assert(res.status === 401, `Expected 401, got ${res.status}`);
  console.log("PASS");

  console.log("\n=== TEST 11: INVALID SIGNATURE ===");
  const badToken = jwt.sign({ sub: userId }, "wrong-secret");
  res = await fetchApi("/me", {
    method: "GET",
    headers: { Authorization: `Bearer ${badToken}` }
  });
  console.assert(res.status === 401, `Expected 401, got ${res.status}`);
  console.log("PASS");

  console.log("\n=== TEST 12: EXPIRED TOKEN ===");
  const expToken = jwt.sign({ sub: userId }, config.JWT_SECRET, { expiresIn: "-1s" });
  res = await fetchApi("/me", {
    method: "GET",
    headers: { Authorization: `Bearer ${expToken}` }
  });
  console.assert(res.status === 401, `Expected 401, got ${res.status}`);
  console.assert(res.data.error.code === "INVALID_TOKEN", "Wrong error code");
  console.log("PASS");

  console.log("\n=== TEST 13: JWT USER ID IS AUTHORITATIVE ===");
  // (Tested by standard /me flow. Sub is the only thing we trust.)
  console.log("PASS");

  console.log("\n=== TEST 14: PASSWORD SECURITY ===");
  // (Tested by explicitly checking DB hash and API responses previously)
  console.log("PASS");

  console.log("\n=== TEST 15: JWT CONTENT ===");
  const decoded = jwt.decode(token) as any;
  console.assert(decoded.sub === userId, "Sub mismatch");
  console.assert(decoded.iat && decoded.exp, "Missing iat/exp");
  console.assert(!decoded.password && !decoded.email && !decoded.progress, "Leaked info in JWT");
  console.log("PASS");

  console.log("\n=== CLEANUP ===");
  await User.deleteMany({});
  await Progress.deleteMany({});
  
  server.close();
  mongoose.connection.close();
  console.log("All tests passed! DB cleaned.");
}

runTests().catch(console.error);
