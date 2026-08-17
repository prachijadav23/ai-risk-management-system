import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, FolderKanban, Users, ListTodo, BarChart3, BrainCircuit,
  ShieldAlert, Sparkles, Lightbulb, SlidersHorizontal, Bell, Settings, ChevronLeft, Activity,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { roleCanAccessRoute } from '@/lib/permissions';
import { useAuth } from '@/context/AuthContext';

const nav = [
  { section: 'Overview', items: [{ to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true }] },
  {
    section: 'Manage',
    items: [
      { to: '/app/projects', label: 'Projects', icon: FolderKanban },
      { to: '/app/employees', label: 'Employees', icon: Users },
      { to: '/app/tasks', label: 'Tasks', icon: ListTodo },
      { to: '/app/analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    section: 'AI Decision Support',
    items: [
      { to: '/app/ai', label: 'Command Center', icon: BrainCircuit },
      { to: '/app/ai/risk', label: 'Risk Prediction', icon: ShieldAlert },
      { to: '/app/ai/allocation', label: 'Resource Allocation', icon: Sparkles },
      { to: '/app/ai/recommendations', label: 'Recommendations', icon: Lightbulb },
      { to: '/app/ai/simulator', label: 'What-If Simulator', icon: SlidersHorizontal },
    ],
  },
  {
    section: 'Administration',
    items: [
      { to: '/app/users', label: 'User Management', icon: ShieldCheck },
    ],
  },
  {
    section: 'Workspace',
    items: [
      { to: '/app/notifications', label: 'Notifications', icon: Bell },
      { to: '/app/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { user } = useAuth();
  const visibleNav = nav
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => roleCanAccessRoute(user?.role, item.to)),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-screen shrink-0 flex-col border-r border-slate-200 bg-white transition-all dark:border-slate-800 dark:bg-slate-900 lg:flex',
        collapsed ? 'w-[76px]' : 'w-64'
      )}
    >
      <div className="flex h-16 items-center gap-2.5 px-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-soft">
          <Activity size={18} />
        </div>
        {!collapsed && (
          <div className="leading-tight">
            <p className="text-sm font-bold text-slate-800 dark:text-white">RiskLens</p>
            <p className="text-[10px] text-slate-400">AI Decision Support</p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {visibleNav.map((group) => (
          <div key={group.section}>
            {!collapsed && (
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {group.section}
              </p>
            )}
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={'end' in item ? Boolean(item.end) : false}
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.span
                          layoutId="active-pill"
                          className="absolute left-0 h-6 w-1 rounded-r-full bg-brand-600"
                        />
                      )}
                      <item.icon size={18} className="shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <button
        onClick={onToggle}
        className="m-3 flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-2 text-xs text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
      >
        <ChevronLeft size={16} className={cn('transition-transform', collapsed && 'rotate-180')} />
        {!collapsed && 'Collapse'}
      </button>
    </aside>
  );
}
