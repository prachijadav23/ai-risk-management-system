import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center dark:bg-slate-950">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100 text-brand-600 dark:bg-brand-900/40">
        <Compass size={30} />
      </div>
      <h1 className="mt-6 text-6xl font-bold tracking-tight text-slate-900 dark:text-white">404</h1>
      <p className="mt-2 text-lg font-medium text-slate-700 dark:text-slate-200">Page not found</p>
      <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <div className="mt-6 flex gap-3">
        <Link to="/app">
          <Button><ArrowLeft size={16} /> Back to dashboard</Button>
        </Link>
        <Link to="/">
          <Button variant="outline">Go home</Button>
        </Link>
      </div>
    </div>
  );
}
