/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * RBAC verification harness.
 *
 * The MongoDB binary CDN is blocked in this environment, so instead of a live
 * DB we stub the exact Mongoose static calls that the REAL authorization code
 * (`middleware/scope.ts`, `middleware/rbac.ts`, `controllers/auth.controller`)
 * makes, back them with in-memory fixtures, and assert the access decisions for
 * all four roles. This exercises the actual security logic, not a reimplementation.
 */
import { Types } from 'mongoose';

// Models (we monkey-patch their statics before any call touches a real connection)
import { Project } from '../models/Project';
import { Team } from '../models/Team';
import { Employee } from '../models/Employee';
import { Task } from '../models/Task';
import { User } from '../models/User';

import {
  accessibleProjectIds,
  assertProjectAccess,
  assertTaskAccess,
  assertEmployeeAccess,
} from '../middleware/scope';
import { authorize } from '../middleware/rbac';
import { ApiError } from '../utils/ApiError';

const oid = () => new Types.ObjectId();

// ---- Fixtures ---------------------------------------------------------------
const E_ADMIN = oid(), E_PM = oid(), E_LEAD = oid(), E_EMP = oid(), E_OTHER = oid();
const T1 = oid(), T2 = oid();
const P1 = oid(), P2 = oid(), P3 = oid(), P4 = oid();
const TK1 = oid(), TK2 = oid(), TK3 = oid();

const S = (v: any) => String(v);

const projects = [
  { _id: P1, manager: E_PM, team: T1 },
  { _id: P2, manager: E_PM, team: T2 },
  { _id: P3, manager: E_OTHER, team: T1 },
  { _id: P4, manager: E_OTHER, team: T2 },
];
const teams = [
  { _id: T1, lead: E_LEAD, members: [E_LEAD, E_EMP] },
  { _id: T2, lead: E_OTHER, members: [E_OTHER] },
];
const employees: Record<string, any> = {
  [S(E_ADMIN)]: { _id: E_ADMIN, assignedProjects: [] },
  [S(E_PM)]: { _id: E_PM, assignedProjects: [P1, P2] },
  [S(E_LEAD)]: { _id: E_LEAD, assignedProjects: [P1, P3] },
  [S(E_EMP)]: { _id: E_EMP, assignedProjects: [P1] },
  [S(E_OTHER)]: { _id: E_OTHER, assignedProjects: [P4] },
};
const tasks: Record<string, any> = {
  [S(TK1)]: { _id: TK1, project: P1, assignee: E_EMP },
  [S(TK2)]: { _id: TK2, project: P1, assignee: E_OTHER },
  [S(TK3)]: { _id: TK3, project: P4, assignee: E_OTHER },
};

// ---- Chainable query stub ---------------------------------------------------
function chain(result: any) {
  const p: any = {
    select: () => p,
    sort: () => p,
    skip: () => p,
    limit: () => p,
    populate: () => p,
    lean: () => Promise.resolve(result),
    then: (res: any, rej: any) => Promise.resolve(result).then(res, rej),
  };
  return p;
}

// ---- Monkey-patch the exact statics used by scope.ts ------------------------
(Project as any).find = (filter: any = {}) => {
  let out = projects;
  if (filter.manager) out = out.filter((p) => S(p.manager) === S(filter.manager));
  if (filter.team?.$in) {
    const set = new Set(filter.team.$in.map(S));
    out = out.filter((p) => set.has(S(p.team)));
  }
  return chain(out.map((p) => ({ _id: p._id })));
};
(Project as any).exists = (filter: any) =>
  Promise.resolve(projects.find((p) => S(p._id) === S(filter._id)) ? { _id: filter._id } : null);

(Team as any).find = (filter: any = {}) => {
  let out = teams;
  if (filter.lead) out = out.filter((t) => S(t.lead) === S(filter.lead));
  return chain(out.map((t) => ({ _id: t._id, members: t.members })));
};

(Employee as any).findById = (id: any) => chain(employees[S(id)] ?? null);
(Employee as any).exists = (filter: any) =>
  Promise.resolve(employees[S(filter._id)] ? { _id: filter._id } : null);

(Task as any).findById = (id: any) => chain(tasks[S(id)] ?? null);

(User as any).findById = (id: any) => chain({ employee: id });

// ---- Test runner ------------------------------------------------------------
let pass = 0, fail = 0;
const rows: string[] = [];

function record(name: string, ok: boolean, detail = '') {
  rows.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
  ok ? pass++ : fail++;
}

function reqFor(role: string, employee?: Types.ObjectId) {
  return { user: { sub: S(oid()), role, email: `${role}@t.com`, employee: employee ? S(employee) : undefined } } as any;
}

async function expectAllowed(name: string, fn: () => Promise<any>) {
  try { await fn(); record(name, true, 'allowed'); }
  catch (e: any) { record(name, false, `unexpected ${e?.statusCode ?? ''} ${e?.message ?? e}`); }
}
async function expectDenied(name: string, code: number, fn: () => Promise<any>) {
  try { await fn(); record(name, false, 'was allowed but should be denied'); }
  catch (e: any) {
    const ok = e instanceof ApiError && e.statusCode === code;
    record(name, ok, ok ? `denied ${code}` : `wrong error ${e?.statusCode}/${e?.message}`);
  }
}
function setEq(a: string[], b: string[]) {
  const sa = new Set(a), sb = new Set(b);
  return sa.size === sb.size && [...sa].every((x) => sb.has(x));
}

async function run() {
  // 1) accessibleProjectIds per role
  const admin = await accessibleProjectIds(reqFor('Administrator', E_ADMIN));
  record('scope: Administrator → ALL projects', admin === 'ALL');

  const pm = await accessibleProjectIds(reqFor('ProjectManager', E_PM));
  record('scope: ProjectManager → only managed {P1,P2}',
    pm !== 'ALL' && setEq(pm as string[], [S(P1), S(P2)]), Array.isArray(pm) ? `${(pm as string[]).length} ids` : '');

  const lead = await accessibleProjectIds(reqFor('TeamLead', E_LEAD));
  record('scope: TeamLead → led-team + assigned {P1,P3}',
    lead !== 'ALL' && setEq(lead as string[], [S(P1), S(P3)]));

  const emp = await accessibleProjectIds(reqFor('Employee', E_EMP));
  record('scope: Employee → only assigned {P1}',
    emp !== 'ALL' && setEq(emp as string[], [S(P1)]));

  record('scope: Employee ≠ ProjectManager access set',
    !setEq(emp as string[], pm as string[]));

  // 2) assertProjectAccess (IDOR)
  await expectAllowed('IDOR: Employee opens assigned P1', () => assertProjectAccess(reqFor('Employee', E_EMP), S(P1)));
  await expectDenied('IDOR: Employee opens foreign P4 → 403', 403, () => assertProjectAccess(reqFor('Employee', E_EMP), S(P4)));
  await expectDenied('IDOR: Employee opens missing id → 404', 404, () => assertProjectAccess(reqFor('Employee', E_EMP), S(oid())));
  await expectDenied('IDOR: PM opens non-managed P3 → 403', 403, () => assertProjectAccess(reqFor('ProjectManager', E_PM), S(P3)));
  await expectAllowed('IDOR: PM opens managed P2', () => assertProjectAccess(reqFor('ProjectManager', E_PM), S(P2)));
  await expectAllowed('IDOR: Lead opens team project P3', () => assertProjectAccess(reqFor('TeamLead', E_LEAD), S(P3)));
  await expectDenied('IDOR: Lead opens non-team P2 → 403', 403, () => assertProjectAccess(reqFor('TeamLead', E_LEAD), S(P2)));
  await expectAllowed('IDOR: Admin opens any P4', () => assertProjectAccess(reqFor('Administrator', E_ADMIN), S(P4)));

  // 3) assertTaskAccess
  const t1 = await assertTaskAccess(reqFor('Employee', E_EMP), S(TK1));
  record('task: Employee own task TK1 → isOwnTask', t1.isOwnTask === true);
  const t2 = await assertTaskAccess(reqFor('Employee', E_EMP), S(TK2));
  record('task: Employee foreign task in own project → accessible, not own', t2.isOwnTask === false);
  await expectDenied('task: Employee task in foreign project TK3 → 403', 403, () => assertTaskAccess(reqFor('Employee', E_EMP), S(TK3)));
  await expectDenied('task: PM task in foreign project TK3 → 403', 403, () => assertTaskAccess(reqFor('ProjectManager', E_PM), S(TK3)));

  // 4) assertEmployeeAccess
  await expectAllowed('emp: Employee reads self', () => assertEmployeeAccess(reqFor('Employee', E_EMP), S(E_EMP)));
  await expectDenied('emp: Employee reads other → 403', 403, () => assertEmployeeAccess(reqFor('Employee', E_EMP), S(E_OTHER)));
  await expectAllowed('emp: Lead reads team member', () => assertEmployeeAccess(reqFor('TeamLead', E_LEAD), S(E_EMP)));
  await expectDenied('emp: Lead reads non-member → 403', 403, () => assertEmployeeAccess(reqFor('TeamLead', E_LEAD), S(E_OTHER)));
  await expectAllowed('emp: PM reads any employee', () => assertEmployeeAccess(reqFor('ProjectManager', E_PM), S(E_OTHER)));

  // 5) authorize() middleware role-gating
  const midCheck = (role: string | null, allowed: string[]) =>
    new Promise<number>((resolve) => {
      const req: any = role ? { user: { role } } : {};
      authorize(...(allowed as any))(req, {} as any, (err?: any) =>
        resolve(err ? (err as ApiError).statusCode : 200)
      );
    });
  record('authorize: no user → 401', (await midCheck(null, ['Administrator'])) === 401);
  record('authorize: Employee blocked from Admin route → 403', (await midCheck('Employee', ['Administrator', 'ProjectManager'])) === 403);
  record('authorize: PM allowed on PM route → next()', (await midCheck('ProjectManager', ['Administrator', 'ProjectManager'])) === 200);
  record('authorize: Employee blocked from analytics (Admin/PM/Lead) → 403', (await midCheck('Employee', ['Administrator', 'ProjectManager', 'TeamLead'])) === 403);

  // 6) register forces Employee (privilege-escalation guard)
  (User as any).findOne = () => Promise.resolve(null);
  let createdRole = '';
  (User as any).create = (doc: any) => {
    createdRole = doc.role;
    return Promise.resolve({ ...doc, _id: oid(), refreshTokens: [], save: () => Promise.resolve() });
  };
  const authCtrl = await import('../controllers/auth.controller');
  const res: any = { status: () => res, json: () => res };
  await authCtrl.register(
    { body: { name: 'Mallory', email: 'm@x.com', password: 'password123', role: 'Administrator' } } as any,
    res
  );
  record("register: body role 'Administrator' is IGNORED → Employee created", createdRole === 'Employee', `got '${createdRole}'`);

  // ---- Report ----
  console.log('\n──────── RBAC VERIFICATION ────────');
  for (const r of rows) console.log(r);
  console.log('───────────────────────────────────');
  console.log(`TOTAL: ${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
}

run().catch((e) => { console.error(e); process.exit(1); });
