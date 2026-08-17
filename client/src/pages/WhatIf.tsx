import { useState } from 'react';
import { SlidersHorizontal, ArrowRight } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader, Select, Label, Button, Input, Badge } from '@/components/ui';
import { useProjects, useSimulate } from '@/hooks';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import type { RiskResult } from '@/types';

export default function WhatIf() {
  const { data } = useProjects({ limit: 100 });
  const simulate = useSimulate();
  const { toast } = useToast();
  const [projectId, setProjectId] = useState('');
  const [overrides, setOverrides] = useState({ deadlineShiftDays: 0, requirementChanges: 0, progress: 0, avgTeamWorkload: 60 });
  const [result, setResult] = useState<{ before: RiskResult; after: RiskResult } | null>(null);

  const run = () => {
    if (!projectId) { toast('warning', 'Select a project'); return; }
    simulate.mutate(
      { projectId, overrides: { ...overrides } },
      { onSuccess: (d) => setResult(d), onError: () => toast('error', 'Simulation failed') }
    );
  };

  const delta = result ? result.after.riskScore - result.before.riskScore : 0;

  return (
    <div>
      <PageHeader title="What-If Simulator" subtitle="Adjust project parameters and see how projected risk shifts — before you commit." />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-1">
          <CardHeader title="Scenario inputs" />
          <div className="mt-4 space-y-4">
            <div>
              <Label>Project</Label>
              <Select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                <option value="">Select…</option>
                {(data?.items ?? []).map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
              </Select>
            </div>
            <Slider label="Deadline shift (days)" min={-60} max={60} value={overrides.deadlineShiftDays} onChange={(v) => setOverrides((o) => ({ ...o, deadlineShiftDays: v }))} hint="Negative = pull in the deadline" />
            <Slider label="Extra requirement changes" min={0} max={20} value={overrides.requirementChanges} onChange={(v) => setOverrides((o) => ({ ...o, requirementChanges: v }))} />
            <Slider label="Progress override (%)" min={0} max={100} value={overrides.progress} onChange={(v) => setOverrides((o) => ({ ...o, progress: v }))} />
            <Slider label="Avg team workload (%)" min={0} max={100} value={overrides.avgTeamWorkload} onChange={(v) => setOverrides((o) => ({ ...o, avgTeamWorkload: v }))} />
            <Button className="w-full" onClick={run} loading={simulate.isPending}><SlidersHorizontal size={15} /> Simulate</Button>
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <CardHeader title="Before vs After" subtitle="Projected impact on key risk metrics" />
          {!result ? (
            <div className="flex h-72 items-center justify-center text-sm text-slate-400">Run a simulation to see the comparison.</div>
          ) : (
            <>
              <div className="mt-4 flex items-center justify-center gap-6">
                <Big label="Current" value={result.before.riskScore} />
                <ArrowRight className="text-slate-300" />
                <Big label="Simulated" value={result.after.riskScore} highlight />
                <Badge color={delta > 0 ? 'rose' : delta < 0 ? 'green' : 'slate'}>
                  {delta > 0 ? '+' : ''}{delta}% risk
                </Badge>
              </div>
              <div className="mt-6 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { metric: 'Risk', Before: result.before.riskScore, After: result.after.riskScore },
                      { metric: 'Delay', Before: result.before.delayProbability, After: result.after.delayProbability },
                      { metric: 'Overrun', Before: result.before.budgetOverrunProbability, After: result.after.budgetOverrunProbability },
                      { metric: 'Failure', Before: result.before.failureProbability, After: result.after.failureProbability },
                      { metric: 'Success', Before: result.before.successProbability, After: result.after.successProbability },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="metric" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Before" fill="#94a3b8" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="After" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

function Slider({ label, min, max, value, onChange, hint }: { label: string; min: number; max: number; value: number; onChange: (v: number) => void; hint?: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <Label>{label}</Label>
        <Input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className="h-7 w-20 text-xs" />
      </div>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-brand-600" />
      {hint && <p className="mt-1 text-[10px] text-slate-400">{hint}</p>}
    </div>
  );
}

function Big({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="text-center">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={cn('text-4xl font-extrabold', highlight ? 'text-brand-600' : 'text-slate-500')}>{value}%</p>
    </div>
  );
}
