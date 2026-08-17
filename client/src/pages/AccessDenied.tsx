import { Link } from 'react-router-dom';
import { ShieldX, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';

export default function AccessDenied() {
  const { user } = useAuth();
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/40">
        <ShieldX size={30} />
      </div>
      <h1 className="mt-6 text-2xl font-bold text-slate-900 dark:text-white">Access denied</h1>
      <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
        Your role{user?.role ? ` (${user.role})` : ''} doesn't have permission to view this page.
        If you believe this is a mistake, contact your administrator.
      </p>
      <div className="mt-6">
        <Link to="/app">
          <Button><ArrowLeft size={16} /> Back to dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
