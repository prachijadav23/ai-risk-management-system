import { BrainCircuit, Gauge, TrendingDown, Wallet, AlertOctagon } from 'lucide-react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { PageHeader, KpiCard } from '@/components/PageHeader';
import { Card, CardHeader, Badge, Skeleton } from '@/components/ui';
import { useCommandCenter } from '@/hooks';
import { cn } from '@/lib/utils';

export default function CommandCenter() {
  const { data, isLoading } = useCommandCenter();

  return (
    <div>
      <PageHeader
        title="AI Command Center"
        subtitle="Portfolio-wide risk intelligence, computed live from your data."
        action={<Badge color="brand"><BrainCircuit size={13} className="mr-1" /> rule-based engine v1</Badge>}
      />

      <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
        These scores come from a deterministic, explainable weighted-factor engine — not a trained ML model. The engine is built to be swapped for a Python/FastAPI ML service later.
      </div>

      {isLoading || !data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard index={0} label="Avg Risk Score" value={`${data.avgRiskScore}%`} icon={<Gauge size={18} />} accent="rose" />
            <KpiCard index={1} label="Avg Success Probability" value={`${data.avgSuccessProbability}%`} icon={<BrainCircuit size={18} />} accent="green" />
            <KpiCard index={2} label="Avg Delay Probability" value={`${data.avgDelayProbability}%`} icon={<TrendingDown size={18} />} accent="amber" />
            <KpiCard index={3} label="High-Risk Projects" value={data.highRisk} icon={<AlertOctagon size={18} />} accent="rose" />
          </div>

          <Card className="mt-6">
            <CardHeader title="Risk vs Success map" subtitle="Each dot is a project — bubble size = delay probability" />
            <div className="h-80 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" dataKey="riskScore" name="Risk" unit="%" tick={{ fontSize: 11 }} label={{ value: 'Risk Score', position: 'bottom', fontSize: 11 }} />
                  <YAxis type="number" dataKey="successProbability" name="Success" unit="%" tick={{ fontSize: 11 }} />
                  <ZAxis type="number" dataKey="delayProbability" range={[50, 400]} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v: number, n) => [`${v}%`, n]} labelFormatter={() => ''} />
                  <Scatter data={data.projects} name="Projects">
                    {data.projects.map((p, i) => (
                      <Cell key={i} fill={p.riskScore >= 55 ? '#ef4444' : p.riskScore >= 35 ? '#f59e0b' : '#22c55e'} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="mt-6">
            <CardHeader title="Project risk ranking" subtitle={`${data.projectsAnalyzed} active projects analyzed`} />
            <div className="divide-y divide-slate-100 p-2 dark:divide-slate-800">
              {data.projects.map((p) => (
                <div key={p.project} className="flex items-center justify-between gap-4 px-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{p.name}</p>
                    <p className="truncate text-xs text-slate-400">{p.recommendedAction}</p>
                  </div>
                  <div className="hidden items-center gap-4 sm:flex">
                    <MiniStat label="Delay" value={p.delayProbability} />
                    <MiniStat label="Overrun" value={p.budgetOverrunProbability} />
                    <MiniStat label="Success" value={p.successProbability} good />
                  </div>
                  <Badge color={p.riskLevel === 'Critical' ? 'rose' : p.riskLevel === 'High' ? 'orange' : p.riskLevel === 'Medium' ? 'amber' : 'green'}>
                    {p.riskScore}%
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function MiniStat({ label, value, good }: { label: string; value: number; good?: boolean }) {
  return (
    <div className="text-center">
      <p className="text-[10px] text-slate-400">{label}</p>
      <p className={cn('text-sm font-semibold', good ? 'text-emerald-600' : value >= 55 ? 'text-rose-600' : 'text-slate-600 dark:text-slate-300')}>{value}%</p>
    </div>
  );
}
