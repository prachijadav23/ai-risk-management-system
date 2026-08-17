import {
  FolderKanban, PlayCircle, CheckCircle2, AlertTriangle, Users, Gauge, Wallet, Activity, ListTodo,
} from 'lucide-react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  RadialBarChart, RadialBar, LineChart, Line,
} from 'recharts';
import { Link } from 'react-router-dom';
import { PageHeader, KpiCard } from '@/components/PageHeader';
import { Card, CardHeader, Skeleton, Badge, EmptyState } from '@/components/ui';
import { useDashboard, useDepartmentComparison, useEmployeeWorkload, useCommandCenter, useProjects, useBoard } from '@/hooks';
import { formatCurrency, CHART_COLORS } from '@/lib/utils';
import { usePermissions } from '@/lib/permissions';

export default function Dashboard() {
  const { can } = usePermissions();
  // Employees don't have access to global analytics endpoints — show them a
  // personalized view built only from data they're allowed to fetch.
  if (!can('viewAnalytics')) return <EmployeeDashboard />;
  return <AnalyticsDashboard />;
}

function AnalyticsDashboard() {
  const { data, isLoading } = useDashboard();
  const { data: depts } = useDepartmentComparison();
  const { data: workload } = useEmployeeWorkload();
  const { data: cc } = useCommandCenter();

  const kpis = data?.kpis;

  return (
    <div>
      <PageHeader title="Executive Dashboard" subtitle="Live portfolio health across projects, people and budgets." />

      {isLoading || !kpis ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard index={0} label="Total Projects" value={kpis.totalProjects} icon={<FolderKanban size={18} />} />
          <KpiCard index={1} label="Active Projects" value={kpis.activeProjects} icon={<PlayCircle size={18} />} accent="cyan" />
          <KpiCard index={2} label="Completed" value={kpis.completedProjects} icon={<CheckCircle2 size={18} />} accent="green" />
          <KpiCard index={3} label="Delayed" value={kpis.delayedProjects} icon={<AlertTriangle size={18} />} accent="rose" />
          <KpiCard index={4} label="Employees" value={kpis.totalEmployees} icon={<Users size={18} />} />
          <KpiCard index={5} label="Resource Utilization" value={`${kpis.resourceUtilization}%`} icon={<Gauge size={18} />} accent="amber" />
          <KpiCard index={6} label="Budget Utilization" value={`${kpis.budgetUtilization}%`} icon={<Wallet size={18} />} accent="cyan" />
          <KpiCard index={7} label="Avg Risk Score" value={cc ? `${cc.avgRiskScore}%` : '—'} icon={<Activity size={18} />} accent="rose" />
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title="Project Status" subtitle="Distribution by status" />
          <div className="h-64 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data?.statusBreakdown ?? []} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {(data?.statusBreakdown ?? []).map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 px-5 pb-5">
            {(data?.statusBreakdown ?? []).map((s, i) => (
              <span key={s.name} className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                {s.name} ({s.value})
              </span>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Department Comparison" subtitle="Projects & average progress by department" />
          <div className="h-64 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={depts ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="department" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="projects" fill="#6366f1" radius={[6, 6, 0, 0]} name="Projects" />
                <Bar dataKey="avgProgress" fill="#22c55e" radius={[6, 6, 0, 0]} name="Avg Progress %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title="Budget Utilization" subtitle={kpis ? `${formatCurrency(kpis.spentBudget)} of ${formatCurrency(kpis.totalBudget)}` : ''} />
          <div className="h-56 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                innerRadius="70%"
                outerRadius="100%"
                data={[{ name: 'Budget', value: kpis?.budgetUtilization ?? 0, fill: '#6366f1' }]}
                startAngle={90}
                endAngle={-270}
              >
                <RadialBar background dataKey="value" cornerRadius={12} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <p className="pb-5 text-center text-3xl font-bold text-slate-800 dark:text-white">{kpis?.budgetUtilization ?? 0}%</p>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Top Employee Workload" subtitle="Most-loaded team members" />
          <div className="h-56 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={(workload ?? []).map((w) => ({ name: w.name.split(' ')[0], workload: w.currentWorkload, perf: w.performanceScore }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="workload" stroke="#ef4444" strokeWidth={2} name="Workload %" dot={false} />
                <Line type="monotone" dataKey="perf" stroke="#22c55e" strokeWidth={2} name="Performance" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {cc && cc.projects.length > 0 && (
        <Card className="mt-6">
          <CardHeader title="AI Insight — Highest Risk Projects" subtitle="Computed live by the explainable risk engine" action={<Badge color="rose">Top {Math.min(5, cc.projects.length)}</Badge>} />
          <div className="divide-y divide-slate-100 p-2 dark:divide-slate-800">
            {cc.projects.slice(0, 5).map((p) => (
              <div key={p.project} className="flex items-center justify-between px-3 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{p.name}</p>
                  <p className="text-xs text-slate-400">{p.recommendedAction}</p>
                </div>
                <Badge color={p.riskLevel === 'Critical' ? 'rose' : p.riskLevel === 'High' ? 'orange' : p.riskLevel === 'Medium' ? 'amber' : 'green'}>
                  {p.riskScore}% · {p.riskLevel}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

/** Personalized dashboard for the Employee role — only their assigned projects
 *  and their own task board, both of which the backend scopes automatically. */
function EmployeeDashboard() {
  const { data: projectsData, isLoading: pLoading } = useProjects({ limit: 50 });
  const { data: board, isLoading: bLoading } = useBoard();

  const projects = projectsData?.items ?? [];
  const columns = board ?? {};
  const allTasks = Object.values(columns).flat() as { _id: string; status: string }[];
  const done = allTasks.filter((t) => t.status === 'Done').length;
  const inProgress = allTasks.filter((t) => t.status === 'InProgress').length;
  const todo = allTasks.filter((t) => t.status === 'Todo').length;

  return (
    <div>
      <PageHeader title="My Workspace" subtitle="Your assigned projects and tasks at a glance." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard index={0} label="My Projects" value={projects.length} icon={<FolderKanban size={18} />} />
        <KpiCard index={1} label="My Tasks" value={allTasks.length} icon={<ListTodo size={18} />} accent="cyan" />
        <KpiCard index={2} label="In Progress" value={inProgress} icon={<PlayCircle size={18} />} accent="amber" />
        <KpiCard index={3} label="Completed" value={done} icon={<CheckCircle2 size={18} />} accent="green" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="My Projects" subtitle="Projects you're assigned to" />
          <div className="divide-y divide-slate-100 p-2 dark:divide-slate-800">
            {pLoading ? (
              <div className="space-y-2 p-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : projects.length === 0 ? (
              <EmptyState icon={<FolderKanban size={22} />} title="No projects yet" description="You haven't been assigned to any projects." />
            ) : (
              projects.slice(0, 8).map((p) => (
                <Link key={p._id} to={`/app/projects/${p._id}`} className="flex items-center justify-between px-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-900/40">
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{p.name}</p>
                    <p className="text-xs text-slate-400">{p.code} · {p.status}</p>
                  </div>
                  <Badge color={p.status === 'Active' ? 'brand' : p.status === 'Completed' ? 'green' : 'slate'}>
                    {p.progress}%
                  </Badge>
                </Link>
              ))
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="My Task Summary" subtitle="Across your assigned projects" />
          {bLoading ? (
            <div className="space-y-2 p-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : (
            <div className="grid grid-cols-3 gap-3 p-5">
              <div className="rounded-xl bg-slate-50 p-4 text-center dark:bg-slate-800/50">
                <p className="text-2xl font-bold text-slate-700 dark:text-slate-200">{todo}</p>
                <p className="mt-1 text-xs text-slate-400">To do</p>
              </div>
              <div className="rounded-xl bg-amber-50 p-4 text-center dark:bg-amber-950/30">
                <p className="text-2xl font-bold text-amber-600">{inProgress}</p>
                <p className="mt-1 text-xs text-slate-400">In progress</p>
              </div>
              <div className="rounded-xl bg-green-50 p-4 text-center dark:bg-green-950/30">
                <p className="text-2xl font-bold text-green-600">{done}</p>
                <p className="mt-1 text-xs text-slate-400">Done</p>
              </div>
            </div>
          )}
          <div className="px-5 pb-5">
            <Link to="/app/tasks" className="text-sm font-medium text-brand-600 hover:underline">Open my task board →</Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
