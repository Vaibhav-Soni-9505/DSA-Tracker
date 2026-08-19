# Phase 4A: Backend Architecture & Database Design

This document details the architectural specifications for evolving the A2Z DSA Tracker from a local-only React application to a full-stack, multi-user platform powered by Node.js, Express, and MongoDB.

---

## 1. Recommended Folder Structure
The backend will utilize a layered architecture separating routing, HTTP request handling, business logic, and database modeling.

```text
server/
├── config/           # Database connections and environment setups
├── models/           # Mongoose schemas (User, Progress)
├── controllers/      # HTTP request/response handlers
├── services/         # Core business logic and pure functions (Revision math)
├── routes/           # Express router definitions
├── middleware/       # Authentication, error handling, rate limiting
├── utils/            # Shared utilities (Date manipulation, validation)
└── app.ts            # Application bootstrap
```

---

## 2. MongoDB Collections
Only two collections are required. 

- `users`: Contains authentication and identity data.
- `progress`: Contains user-specific tracking data.

**Decision on a `problems` collection:** We will **NOT** create a MongoDB collection for the 474-problem A2Z dataset. The dataset is shared application data. Storing it in the DB introduces unnecessary data duplication, forces complex join queries (`$lookup`), and complicates dataset updates.

---

## 3. User Schema
Authentication will be implemented in a future phase.

```typescript
{
  _id: ObjectId,
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true },
  createdAt: Date,
  updatedAt: Date
}
```

---

## 4. Progress Schema
Maps cleanly to the frontend's `UserProgress` interface.

```typescript
{
  _id: ObjectId,
  userId: { type: ObjectId, ref: 'User', required: true },
  problemId: { type: String, required: true }, // e.g., "prob-123"
  solved: { type: Boolean, default: false },
  firstSolvedAt: { type: String, default: null }, // Stored as "YYYY-MM-DD"
  revisionStage: { type: Number, enum: [0, 1, 2, 3, 4, 5], default: 0 },
  nextRevisionAt: { type: String, default: null }, // Stored as "YYYY-MM-DD"
  createdAt: Date,
  updatedAt: Date
}
```

---

## 5. Field Types & Data Rules
- **`firstSolvedAt`:** Historical string. Once populated during the initial "Solve", backend logic must never overwrite or delete it during unsolving or reviewing.
- **`revisionStage`:** Strictly bounded integer `0–5`.
- **`nextRevisionAt`:** Set to `null` if the problem is unsolved or if `revisionStage === 5`.

---

## 6. Required Indexes
1. **Compound Unique Index:** `{ userId: 1, problemId: 1 }`
   *Reason:* Enforces data integrity (one progress document per problem per user) and provides instantaneous single-problem lookups. It inherently acts as an index for `{ userId: 1 }`, optimizing the `GET /progress` query which fetches all 474 records for a user.
   *Note:* No other indexes (like `nextRevisionAt` or `solved`) are needed because the maximum dataset size per user is 474 documents. The frontend fetches all progress into memory and performs filtering locally, making additional DB indexes unnecessary.

---

## 7. API Design & Endpoints
The API exposes **semantic operations**.

### Endpoints
- `GET /api/v1/progress` → Retrieve all progress for the authenticated user.
- `GET /api/v1/progress/:problemId` → Retrieve progress for a single problem.
- `POST /api/v1/progress/:problemId/solve` → Mark solved.
  - **Body:** `{ "localDate": "YYYY-MM-DD" }`
- `POST /api/v1/progress/:problemId/review` → Advance the revision stage.
  - **Body:** `{ "localDate": "YYYY-MM-DD", "currentStage": <number> }`
- `DELETE /api/v1/progress/:problemId/unsolve` → Revert to unsolved. Sets `solved=false, revisionStage=0, nextRevisionAt=null`, preserves `firstSolvedAt`.
- `DELETE /api/v1/progress` → Destructive reset of all progress.
- `POST /api/v1/progress/sync` → Syncs localStorage payload.

---

## 8. Revision Rules & Validation Cases
- **Case 1 (Review unsolved):** Returns `400 Bad Request`.
- **Case 2 (Review upcoming):** Returns `409 Conflict` (`REVISION_NOT_DUE`).
- **Case 3 (Review due problem):** Returns `200 OK`, advances one stage.
- **Case 4 (Review overdue problem):** Returns `200 OK`. The next date is calculated strictly from the *actual review date* (provided via `localDate`), NOT the old due date.
- **Case 5 (Review Stage 5):** Returns `400 Bad Request`.
- **Case 6 (Unknown problemId):** Returns `400 Bad Request`.

---

## 9. Date/Time Strategy (Calendar-Day Based)
**Challenge:** Standard `Date` timestamps cause UTC boundary drift based on user timezone.
**Resolution:** The application is fundamentally **calendar-day based**. 
1. MongoDB will store dates exactly as string literals: `"YYYY-MM-DD"`.
2. The client is responsible for determining "today" and sends it in semantic payloads: `{ "localDate": "2026-08-19" }`.
3. The backend trusts `localDate` as the anchor. It performs date math (adding days) directly on that string.
4. *Benefit:* This perfectly aligns with the frontend's simulated-date logic, eliminates UTC off-by-one errors, and cleanly decouples timezones.

---

## 10. Concurrency Strategy
**Conflict Prevention:** The `POST /review` endpoint requires `currentStage` in the payload.
The backend executes:
```javascript
Progress.findOneAndUpdate(
  { userId: req.user.id, problemId: id, revisionStage: req.body.currentStage },
  { $set: { revisionStage: nextStage, nextRevisionAt: nextDate } }
)
```
If two tabs send a review request for Stage 2, the first succeeds. The second queries for `revisionStage: 2`, finds 0 matches (since it's now 3), and returns `409 Conflict`.

---

## 11. Idempotency & Replay Strategy
- **Solve twice:** If already solved, return `200 OK` with existing data (no-op). `firstSolvedAt` remains intact.
- **Review twice:** Concurrency logic returns `409 Conflict` (safe failure).
- **Reset twice:** If progress is already empty, return `200 OK` (no-op).
- **Unsolve twice:** If already unsolved, return `200 OK` (no-op).

---

## 12. Authentication & Authorization Boundary
- Identity is determined entirely server-side via `req.user.id` from auth middleware.
- The client NEVER sends `userId` in payloads.
- Authorization is strictly implicit: Every query is permanently scoped to `req.user.id`.

---

## 13. A2Z Dataset Strategy
The backend will obtain the canonical valid IDs via a statically shared `a2z-ids.json` file. During the build step, the frontend's valid dataset IDs are exported to this JSON file and loaded into backend memory on boot. This guarantees ONE source of truth and instant `O(1)` validation without drift.

---

## 14. LocalStorage Migration Strategy
**Conflict Resolution Rule:**
If a record exists in both LocalStorage and MongoDB during `POST /sync`:
1. If Mongo `solved === false` and Local `solved === true`, Local wins.
2. If both `solved === true`, the record with the **HIGHER** `revisionStage` wins.
3. If `revisionStage` is identical, the Mongo record wins.
4. `firstSolvedAt` of the winning record is strictly preserved.
*Safety:* If the network fails post-save, the frontend retry is completely safe due to these deterministic merge rules.

---

## 15. Offline / Network Failure Strategy
API failure → frontend catches error → optimistic state rolls back → toast error shown → server state remains authoritative. Simple and robust.

---

## 16. Environment Configuration
- **Backend:** `MONGODB_URI`, `PORT`, `NODE_ENV`, `JWT_SECRET`, `CORS_ORIGIN`
- **Frontend:** `VITE_API_BASE_URL`
`MONGODB_URI` and `JWT_SECRET` are never exposed to the browser.

---

## 17. Security Considerations
Includes CORS limits, Auth Middleware, BCrypt hashing, payload validation (Zod), and rate-limiting on mutation endpoints.

---

## 18. Error Contract
Standardized format:
```json
{
  "success": false,
  "error": { "code": "REVISION_NOT_DUE", "message": "..." }
}
```
- `400`: Bad payload / Invalid Stage / Unknown ID
- `401`: Missing Auth
- `404`: Not Found
- `409`: Conflict (Concurrency / Not Due)

---

## 19. Final Architecture Consistency Matrix

| Requirement | Architecture Decision | Status | Concern |
|---|---|---|---|
| User progress | `progress` collection only | PASS | |
| Revision authority | Backend executes semantic endpoints | PASS | |
| firstSolvedAt | Immutable string, ignored on unsolve | PASS | |
| Duplicate progress | Unique compound index `{userId: 1, problemId: 1}` | PASS | |
| Multi-user isolation | `req.user.id` implicitly scopes all queries | PASS | |
| Revision concurrency | `currentStage` conditional MongoDB update | PASS | |
| Date handling | `YYYY-MM-DD` string stored. Frontend passes `localDate` | PASS | |
| Migration conflicts | Deterministic merge: highest `revisionStage` wins | PASS | |
| Problem validation | Shared `a2z-ids.json` in memory | PASS | |
| API contract | Predictable idempotency, explicit payload requirements | PASS | |
| Error handling | Standardized JSON with explicit HTTP status codes | PASS | |
| Security | Strict boundary, no client-provided user IDs | PASS | |
| Deployment | Frontend → HTTPS → API → DB | PASS | |
