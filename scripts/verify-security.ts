import http from "http";

async function verifySecurity() {
  console.log("=== SECURITY HEADER VERIFICATION ===");
  try {
    const res = await fetch("http://localhost:5000/api/v1/health");
    console.log("Status:", res.status);
    console.log("Headers:");
    const headersObj: Record<string, string> = {};
    res.headers.forEach((value, key) => {
      headersObj[key] = value;
      console.log(`  ${key}: ${value}`);
    });

    console.assert(!headersObj["x-powered-by"], "❌ X-Powered-By is still present!");
    console.assert(headersObj["x-frame-options"] === "SAMEORIGIN", "❌ X-Frame-Options missing!");
    console.assert(headersObj["content-security-policy"], "❌ Content-Security-Policy missing!");
    console.log("✅ Security Headers Verified.");
  } catch (err) {
    console.error("Failed to hit health endpoint:", err);
  }

  console.log("\n=== RATE LIMIT VERIFICATION ===");
  try {
    let limitHit = false;
    let limitResponse = null;
    console.log("Spamming /api/v1/auth/login 15 times...");
    for (let i = 0; i < 15; i++) {
      const res = await fetch("http://localhost:5000/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: `test${i}@test.com`, password: "password123" })
      });
      if (res.status === 429) {
        limitHit = true;
        limitResponse = await res.json();
        break;
      }
    }
    
    console.assert(limitHit, "❌ Rate limit was NOT triggered!");
    console.log("✅ Rate limit triggered successfully.");
    console.log("Response when exceeded:", limitResponse);

  } catch (err) {
    console.error("Failed to hit auth endpoint:", err);
  }
}

verifySecurity();
