import type { Role } from '@/types';
import { useAuth } from '@/context/AuthContext';

/**
 * Frontend capability matrix — a MIRROR of the backend authorization rules.
 *
 * This drives what the UI shows (nav items, buttons, route access). It is a
 * convenience layer only: every one of these capabilities is ALSO enforced by
 * the backend API, so hiding a button is never the security boundary.
 */

export type Capability =
  | 'viewAnalytics'
  | 'viewCommandCenter'
  | 'viewEmployees'
  | 'manageEmployees'
  | 'deleteEmployee'
  | 'createProject'
  | 'editProject'
  | 'deleteProject'
  | 'createTask'
  | 'deleteTask'
  | 'runAI'
  | 'allocate'
  | 'viewRecommendations'
  | 'resolveRecommendation'
  | 'manageUsers';

const MATRIX: Record<Capability, Role[]> = {
  viewAnalytics: ['Administrator', 'ProjectManager', 'TeamLead'],
  viewCommandCenter: ['Administrator', 'ProjectManager', 'TeamLead'],
  viewEmployees: ['Administrator', 'ProjectManager', 'TeamLead'],
  manageEmployees: ['Administrator', 'ProjectManager'],
  deleteEmployee: ['Administrator'],
  createProject: ['Administrator', 'ProjectManager'],
  editProject: ['Administrator', 'ProjectManager', 'TeamLead'],
  deleteProject: ['Administrator'],
  createTask: ['Administrator', 'ProjectManager', 'TeamLead'],
  deleteTask: ['Administrator', 'ProjectManager', 'TeamLead'],
  runAI: ['Administrator', 'ProjectManager', 'TeamLead'],
  allocate: ['Administrator', 'ProjectManager'],
  viewRecommendations: ['Administrator', 'ProjectManager', 'TeamLead'],
  resolveRecommendation: ['Administrator', 'ProjectManager'],
  manageUsers: ['Administrator'],
};

/** Role → set of routes they may open. Routes not listed are open to all
 *  authenticated roles. Used by both the router guard and the sidebar. */
export const ROUTE_ROLES: Record<string, Role[]> = {
  '/app/employees': ['Administrator', 'ProjectManager', 'TeamLead'],
  '/app/analytics': ['Administrator', 'ProjectManager', 'TeamLead'],
  '/app/ai': ['Administrator', 'ProjectManager', 'TeamLead'],
  '/app/ai/risk': ['Administrator', 'ProjectManager', 'TeamLead'],
  '/app/ai/allocation': ['Administrator', 'ProjectManager'],
  '/app/ai/recommendations': ['Administrator', 'ProjectManager', 'TeamLead'],
  '/app/ai/simulator': ['Administrator', 'ProjectManager', 'TeamLead'],
  '/app/users': ['Administrator'],
};

export function roleCan(role: Role | undefined, cap: Capability): boolean {
  if (!role) return false;
  return MATRIX[cap].includes(role);
}

export function roleCanAccessRoute(role: Role | undefined, path: string): boolean {
  const allowed = ROUTE_ROLES[path];
  if (!allowed) return true; // unrestricted route
  return !!role && allowed.includes(role);
}

/** Hook: `can('createProject')` and `role` for the current user. */
export function usePermissions() {
  const { user } = useAuth();
  const role = user?.role;
  return {
    role,
    can: (cap: Capability) => roleCan(role, cap),
    canAccessRoute: (path: string) => roleCanAccessRoute(role, path),
  };
}
