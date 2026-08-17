# AI-Driven IT Project Risk Prediction & Resource Allocation — Backend

Node.js + Express + TypeScript + MongoDB (Mongoose) REST API with JWT auth,
role-based access control, and a **deterministic, explainable** risk-prediction
and resource-allocation engine.

> The AI engine (`src/services/risk.service.ts`) is a transparent weighted-factor
> model — **not** a trained ML model. Its public interface (`RiskInput → RiskResult`)
> is deliberately stable so it can later be replaced by a Python FastAPI +
> scikit-learn / XGBoost microservice without changing controllers or the frontend.

## Requirements
- Node.js 18+
- MongoDB 6+ running locally (or a MongoDB Atlas URI)

## Setup

```bash
cd server
cp .env.example .env        # then edit secrets if you like
npm install
npm run seed                # creates realistic demo data + demo users
npm run dev                 # starts http://localhost:5000
```

Health check: `GET http://localhost:5000/api/health`

### Demo logins (created by the seed)
| Role            | Email               | Password    |
|-----------------|---------------------|-------------|
| Administrator   | admin@demo.com      | password123 |
| Project Manager | pm@demo.com         | password123 |
| Team Lead       | lead@demo.com       | password123 |
| Employee        | employee@demo.com   | password123 |

## Scripts
- `npm run dev` — hot-reloading dev server
- `npm run build` — compile to `dist/`
- `npm start` — run compiled build
- `npm run typecheck` — type-check only
- `npm run seed` — reset + seed the database

Seed volume is configurable via env, e.g. `SEED_EMPLOYEES=200 SEED_PROJECTS=50 npm run seed`.

## API overview
All routes are under `/api`. Protected routes require `Authorization: Bearer <accessToken>`.

**Auth** — `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`,
`POST /auth/logout`, `GET /auth/me`

**Projects** — `GET /projects` (paginated, filterable), `GET /projects/:id`,
`POST /projects`, `PUT /projects/:id`, `DELETE /projects/:id`,
`POST /projects/:id/milestones`

**Employees** — `GET /employees`, `GET /employees/:id`, `POST /employees`,
`PUT /employees/:id`, `DELETE /employees/:id`

**Tasks** — `GET /tasks`, `GET /tasks/board` (kanban), `POST /tasks`,
`PUT /tasks/:id`, `PATCH /tasks/:id/move`, `DELETE /tasks/:id`

**Analytics** — `GET /analytics/dashboard`, `/departments`, `/task-completion`,
`/employee-workload`, `/monthly-trend`

**AI** —
- `GET  /ai/command-center` — live portfolio risk summary
- `POST /ai/projects/:id/predict` — run + persist a prediction (also generates recommendations)
- `GET  /ai/projects/:id/latest` — latest stored prediction
- `POST /ai/projects/:id/allocate` — rank best-fit employees `{ requiredSkills?: string[] }`
- `POST /ai/projects/:id/simulate` — what-if `{ budget?, avgTeamWorkload?, deadlineShiftDays?, requirementChanges?, progress? }`
- `GET  /ai/recommendations` — list recommendations (filter `?status=Pending`)
- `PATCH /ai/recommendations/:id` — accept/reject `{ status: 'Accepted' | 'Rejected' }`

## Response shape
```json
{ "success": true, "message": "OK", "data": {}, "meta": { "page": 1, "total": 50 } }
```

## Structure
```
src/
  config/        env + db connection
  models/        Mongoose schemas (User, Project, Employee, Task, Team, ...)
  middleware/    auth, rbac, validate (zod), error handling
  services/      risk / allocation / recommendation engines (replaceable)
  controllers/   request handlers
  routes/        Express routers
  validators/    zod schemas
  seed/          demo-data generator
```

## Roadmap (next modules)
- React + Vite + Tailwind frontend consuming these APIs (auth, dashboard, CRUD, AI pages)
- CSV/Excel report export endpoints
- Optional Python FastAPI ML service behind the same `RiskInput → RiskResult` contract
