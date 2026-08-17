import { Moon, Sun, Bell, Shield, Palette } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader, Button } from '@/components/ui';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

export default function Settings() {
  const { theme, toggle } = useTheme();
  const { logout } = useAuth();

  return (
    <div>
      <PageHeader title="Settings" subtitle="Personalize your workspace." />
      <div className="space-y-6">
        <Card className="p-5">
          <CardHeader title="Appearance" subtitle="Switch between light and dark themes" />
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => theme === 'dark' && toggle()}
              className={cn('flex flex-1 items-center gap-3 rounded-xl border p-4 transition-colors', theme === 'light' ? 'border-brand-400 bg-brand-50 dark:bg-brand-950/30' : 'border-slate-200 dark:border-slate-800')}
            >
              <Sun size={18} className="text-amber-500" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Light</span>
            </button>
            <button
              onClick={() => theme === 'light' && toggle()}
              className={cn('flex flex-1 items-center gap-3 rounded-xl border p-4 transition-colors', theme === 'dark' ? 'border-brand-400 bg-brand-50 dark:bg-brand-950/30' : 'border-slate-200 dark:border-slate-800')}
            >
              <Moon size={18} className="text-brand-500" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Dark</span>
            </button>
          </div>
        </Card>

        <Card className="p-5">
          <CardHeader title="Preferences" />
          <div className="mt-4 space-y-3">
            <Toggle icon={<Bell size={16} />} label="Risk alert notifications" defaultOn />
            <Toggle icon={<Palette size={16} />} label="Compact density" />
            <Toggle icon={<Shield size={16} />} label="Two-factor authentication" />
          </div>
        </Card>

        <Card className="p-5">
          <CardHeader title="Account" />
          <div className="mt-4">
            <Button variant="danger" onClick={logout}>Sign out</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Toggle({ icon, label, defaultOn }: { icon: React.ReactNode; label: string; defaultOn?: boolean }) {
  return (
    <label className="flex items-center justify-between rounded-xl border border-slate-100 p-3 dark:border-slate-800">
      <span className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">{icon}{label}</span>
      <input type="checkbox" defaultChecked={defaultOn} className="h-5 w-5 accent-brand-600" />
    </label>
  );
}
