# RiskLens — Frontend

React 18 + Vite + TypeScript + Tailwind CSS single-page app for the
**AI-Driven IT Project Risk Prediction & Resource Allocation System**.

Consumes the Express/MongoDB backend API. Premium dashboard UI with dark/light
mode, animated transitions (Framer Motion), and interactive charts (Recharts).

## Requirements
- Node.js 18+
- The backend running on `http://localhost:5000` (see `../server`)

## Setup

```bash
cd client
cp .env.example .env        # optional; defaults to the Vite dev proxy
npm install
npm run dev                 # http://localhost:5173
```

In development, requests to `/api/*` are proxied to `http://localhost:5000`
(configured in `vite.config.ts`), so no CORS setup is needed. For a hosted
backend, set `VITE_API_URL` in `.env` instead.

### Demo login
Use any seeded account, e.g. **admin@demo.com / password123**
(the login form is pre-filled with this).

## Scripts
- `npm run dev` — dev server with HMR
- `npm run build` — type-check (`tsc --noEmit`) then production build to `dist/`
- `npm run preview` — serve the production build locally
- `npm run typecheck` — type-check only

## What's included
- **Auth** — login, register, forgot-password screens; JWT access token with
  automatic silent refresh (Axios interceptors); protected routes.
- **Layout** — collapsible sidebar, top bar with global search, theme toggle,
  notifications and profile menu; animated page transitions.
- **Overview** — executive dashboard with KPI cards and pie / bar / radial / line
  charts fed by live analytics endpoints.
- **Manage** — Projects (CRUD grid with filters, pagination, create/edit modal),
  Project details (tabbed: overview, tasks, milestones, budget, risk),
  Employees (table CRUD), Tasks (5-column kanban with native drag-and-drop),
  Analytics (department / completion / workload charts).
- **AI Decision Support** — Command Center (portfolio risk scatter + ranking),
  Risk Prediction (run explainable predictions per project), Resource Allocation
  (ranked best-fit candidates), Recommendations (accept / reject), What-If
  Simulator (adjust drivers and compare before/after).
- **Workspace** — Notifications, Settings (theme + account), Profile.

## Structure
```
src/
  lib/          axios client, query client, helpers
  context/      Auth + Theme providers
  hooks/        TanStack Query hooks for every endpoint
  components/   ui primitives, layout (Sidebar/Topbar/AppLayout), forms
  pages/        one file per screen
  types/        shared TypeScript types
  App.tsx       route tree
  main.tsx      providers + bootstrap
```

## Notes
- UI primitives (Button, Card, Modal, Toast, etc.) are hand-built with Tailwind
  rather than generated via the shadcn/ui CLI, so they're all editable in
  `src/components/ui`.
- All amounts are formatted in INR.
- The risk/allocation logic lives in the backend; this app only renders and
  explains the results.
