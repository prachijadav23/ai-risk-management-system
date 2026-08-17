# Role-Based Access Control (RBAC)

This project enforces authorization on the **backend API** (the security
boundary) and mirrors it in the **frontend** (for UX — hiding what a user can't
do). Hiding a button is never the protection; every rule below is enforced
server-side and independently verified by `server` → `npm run test:rbac`.

## Roles
- **Administrator** – full system access, including user/role management.
- **Project Manager** – manages the projects they own + related employees,
  tasks, risk, analytics, AI prediction, allocation, recommendations, what-if.
- **Team Lead** – manages projects of teams they lead, their team's tasks, and
  relevant risk/analytics features.
- **Employee** – only their assigned projects/tasks, their own task progress,
  notifications, and viewing risk on their projects.

## Data scoping (IDOR prevention)
Access is scoped to the records a user owns, so changing an `:id` in a URL/API
call cannot reach someone else's data:
- **Administrator** → all projects.
- **Project Manager** → projects where they are the manager.
- **Team Lead** → projects of teams they lead (+ assigned).
- **Employee** → only projects in their `assignedProjects`.

Unauthorized access returns **403**; a non-existent id returns **404** (so
existence isn't leaked). Missing/invalid tokens return **401**.

## Permission matrix

| Capability / Endpoint                              | Admin | PM  | Lead | Employee |
|----------------------------------------------------|:-----:|:---:|:----:|:--------:|
| Register (public) → always creates **Employee**    |  n/a  | n/a | n/a  |   n/a    |
| View projects (scoped list)                        |  ✅   | ✅  | ✅   | ✅ (assigned) |
| Open a project by id                               |  ✅   | own | team | assigned |
| Create project                                     |  ✅   | ✅  | ❌   | ❌       |
| Update project                                     |  ✅   | own | team | ❌       |
| Delete project                                     |  ✅   | ❌  | ❌   | ❌       |
| Add milestone                                      |  ✅   | own | team | ❌       |
| View task board (scoped)                           |  ✅   | ✅  | ✅   | ✅ (assigned) |
| Create task / assign                               |  ✅   | ✅  | ✅   | ❌       |
| Update / move task                                 |  ✅   | own project | own project | own task, safe fields only |
| Delete task                                        |  ✅   | ✅  | ✅   | ❌       |
| Employee directory (list)                          |  ✅   | ✅  | team | ❌       |
| View an employee by id                             |  ✅   | ✅  | team/self | self only |
| Create / update employee                           |  ✅   | ✅  | ❌   | ❌       |
| Delete employee                                    |  ✅   | ❌  | ❌   | ❌       |
| Global analytics dashboards                        |  ✅   | ✅  | ✅   | ❌       |
| AI Command Center (portfolio, scoped)              |  ✅   | ✅  | ✅   | ❌       |
| Run risk prediction                                |  ✅   | ✅  | ✅   | ❌       |
| View latest prediction (scoped)                    |  ✅   | ✅  | ✅   | ✅ (assigned) |
| Resource allocation                                |  ✅   | ✅  | ❌   | ❌       |
| What-if simulator                                  |  ✅   | ✅  | ✅   | ❌       |
| View recommendations (scoped)                      |  ✅   | ✅  | ✅   | ❌       |
| Accept / reject recommendation                     |  ✅   | ✅  | ❌   | ❌       |
| Lookups (form dropdowns)                           |  ✅   | ✅  | ✅   | ❌       |
| User management (`/api/users`)                     |  ✅   | ❌  | ❌   | ❌       |

"own" = only records the user manages; "team" = records of teams they lead;
"assigned" = only records they're assigned to; "safe fields" = status, progress,
actual hours.

## Privileged accounts
Public `POST /auth/register` **always** creates an Employee — any `role` sent in
the body is ignored. Administrator / Project Manager / Team Lead accounts are
created only by an Administrator via `POST /api/users` (or the in-app
**User Management** page). Linking a `User` to an `Employee` record is what
scopes their managed/led/assigned data.

## Frontend enforcement
- Sidebar items and action buttons are filtered by role (`src/lib/permissions.ts`).
- Restricted routes are wrapped in `RequireRole`; directly entering an
  unauthorized URL renders the **Access Denied** page.
- Employees get a personalized dashboard (their projects + task summary) instead
  of the global analytics dashboard.

## Verifying
```bash
cd server
npm run test:rbac      # 27 checks across all 4 roles (scoping, IDOR, 401/403, register guard)
```
Demo accounts (created by `npm run seed`) each own the right data so scoped
access is visible: `pm@demo.com` manages several projects, `lead@demo.com` leads
a team on several, `employee@demo.com` is assigned to a handful with tasks.
