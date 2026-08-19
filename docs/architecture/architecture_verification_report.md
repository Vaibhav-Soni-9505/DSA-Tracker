# Phase 4A: Architecture Verification Report

**Date of Verification:** 2026-08-19  
**Status:** **GO** (Ready for Phase 4B Implementation)  

## 1. Frontend Inspection Summary
The current React codebase was inspected (`src/types/progress.ts`, `src/hooks/useProgress.tsx`, `src/config/revision.ts`, and `src/lib/date.ts`) to understand the exact mechanics of the existing local implementation.
- The revision logic relies on an array of intervals `[1, 3, 7, 15, 30]`.
- All dates are natively handled as calendar-day strings (`YYYY-MM-DD`).
- `firstSolvedAt` behaves as an immutable timestamp for a problem's lifecycle.
- Unsolving a problem correctly resets its `revisionStage` to `0` and `nextRevisionAt` to `null`, but deliberately preserves `firstSolvedAt`.

## 2. Architectural Ambiguities Resolved
During the verification, several ambiguities in the original `backend_architecture.md` draft were identified and formally resolved:

### A. Date/Timezone Architecture
* **Issue:** The original draft proposed storing `YYYY-MM-DDT00:00:00.000Z` and relying on the backend to execute timezone math. This would break the frontend's strict calendar-day (`YYYY-MM-DD`) semantic and fail across global timezones.
* **Resolution:** MongoDB will store `firstSolvedAt` and `nextRevisionAt` strictly as `YYYY-MM-DD` strings. The client API contract requires semantic actions to include `{ "localDate": "2026-08-19" }`. The backend computes `nextRevisionAt` by performing date math against this provided local string, making timezone conversions unnecessary and natively supporting the frontend's simulated-date testing tools.

### B. Concurrency / Double Review
* **Issue:** `POST /review` lacked a concurrency mechanism. A user quickly double-clicking "Reviewed" or doing so across two tabs could incorrectly jump two stages.
* **Resolution:** The payload must require `{ "currentStage": number }`. The backend uses MongoDB's Optimistic Concurrency Control (`Progress.findOneAndUpdate({ revisionStage: req.body.currentStage })`). If the database state doesn't match the request state, the query safely rejects the action with a `409 Conflict`.

### C. Migration Conflict Rules
* **Issue:** LocalStorage to MongoDB migration lacked a deterministic conflict-resolution rule if progress existed in both environments.
* **Resolution:** 
  1. If Mongo `solved === false` and Local `solved === true`, Local wins.
  2. If both `solved === true`, the record with the HIGHER `revisionStage` wins.
  3. If `revisionStage` is identical, the Mongo record wins.
  4. `firstSolvedAt` of the winning record is strictly preserved.

### D. Index Verification
* **Issue:** A compound index on `{ userId: 1, nextRevisionAt: 1 }` was proposed.
* **Resolution:** This was deemed an unnecessary micro-optimization. A user has a maximum of 474 records. The backend will simply return all records via `GET /progress`, and the frontend will calculate dashboard/revision widgets in memory (as it already does). Only one index is needed: the unique compound index on `{ userId: 1, problemId: 1 }`.

### E. Dataset Integrity
* **Issue:** Validating incoming `problemId`s natively on the backend without duplicating the dataset in MongoDB.
* **Resolution:** The backend will load a static `a2z-ids.json` list generated from the frontend at build time. This guarantees `O(1)` validation lookup without state drift.

## 3. Final Architecture Consistency Matrix

| Requirement | Architecture Decision | Status | Concern |
|---|---|---|---|
| **User progress** | `progress` collection only | **PASS** | None |
| **Revision authority** | Backend executes semantic endpoints | **PASS** | None |
| **firstSolvedAt** | Immutable string, ignored on unsolve | **PASS** | None |
| **Duplicate progress** | Unique compound index `{userId: 1, problemId: 1}` | **PASS** | None |
| **Multi-user isolation**| `req.user.id` implicitly scopes all queries | **PASS** | None |
| **Revision concurrency**| `currentStage` conditional MongoDB update | **PASS** | None |
| **Date handling** | `YYYY-MM-DD` string stored. Frontend passes `localDate` | **PASS** | None |
| **Migration conflicts** | Deterministic merge: highest `revisionStage` wins | **PASS** | None |
| **Problem validation** | Shared `a2z-ids.json` in memory | **PASS** | None |
| **API contract** | Predictable idempotency, explicit payload requirements | **PASS** | None |
| **Error handling** | Standardized JSON with explicit HTTP status codes | **PASS** | None |
| **Security** | Strict boundary, no client-provided user IDs | **PASS** | None |
| **Deployment** | Frontend → HTTPS → API → DB | **PASS** | None |

## 4. Final Decision
### **GO**
The backend architecture is internally consistent, completely compatible with the React frontend, secure against duplicate requests, timezone-safe, and ready for implementation.

## 5. Phase 4B Implementation Order
1. Scaffold Express, configure `dotenv`, and connect Mongoose to MongoDB.
2. Define the exact Mongoose Schemas (`User`, `Progress`).
3. Generate and mount the `a2z-ids.json` validator.
4. Implement the Progress Controller & Service (Solve, Unsolve, Review, Reset).
5. Implement the `POST /sync` LocalStorage migration pipeline.
6. Build out the JWT Authentication middleware.
7. Connect the React frontend via an Axios/Fetch API client layer.
