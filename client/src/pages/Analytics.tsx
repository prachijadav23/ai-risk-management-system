import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell,
  AreaChart, Area, Legend,
} from 'recharts';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader, Skeleton } from '@/components/ui';
import { useDepartmentComparison, useTaskCompletion, useEmployeeWorkload } from '@/hooks';
import { formatCurrency, CHART_COLORS } from '@/lib/utils';

export default function Analytics() {
  const { data: depts, isLoading: l1 } = useDepartmentComparison();
  const { data: taskComp, isLoading: l2 } = useTaskCompletion();
  const { data: workload, isLoading: l3 } = useEmployeeWorkload();

  return (
    <div>
      <PageHeader title="Analytics & Reports" subtitle="Interactive insights across departments, tasks, budgets and teams." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Budget by department" subtitle="Allocated vs spent" />
          <div className="h-72 p-4">
            {l1 ? <Skeleton className="h-full" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={depts ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="department" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={70} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatCurrency(v)} width={70} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend />
                  <Bar dataKey="budget" fill="#6366f1" radius={[6, 6, 0, 0]} name="Budget" />
                  <Bar dataKey="spent" fill="#f59e0b" radius={[6, 6, 0, 0]} name="Spent" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Task status distribution" subtitle="Across all projects" />
          <div className="h-72 p-4">
            {l2 ? <Skeleton className="h-full" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={taskComp ?? []} dataKey="value" nameKey="name" outerRadius={95} label>
                    {(taskComp ?? []).map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Team workload vs performance" subtitle="Most-loaded employees" />
          <div className="h-80 p-4">
            {l3 ? <Skeleton className="h-full" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={(workload ?? []).map((w) => ({ name: w.name.split(' ')[0], workload: w.currentWorkload, performance: w.performanceScore }))}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="workload" stroke="#6366f1" fill="url(#g1)" name="Workload %" />
                  <Area type="monotone" dataKey="performance" stroke="#22c55e" fill="url(#g2)" name="Performance" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
