import { ReactNode } from 'react';
import type { Role } from '@/types';
import { useAuth } from '@/context/AuthContext';
import AccessDenied from '@/pages/AccessDenied';

/**
 * Wrap a route element so that directly entering its URL with an unauthorized
 * role renders the Access Denied page instead of the protected content.
 * (The backend independently enforces the same rules on every API call.)
 */
export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) return <AccessDenied />;
  return <>{children}</>;
}
