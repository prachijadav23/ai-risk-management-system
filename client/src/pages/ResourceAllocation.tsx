import { useState } from 'react';
import { Sparkles, Check } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader, Select, Label, Button, Badge, Progress, EmptyState } from '@/components/ui';
import { useProjects, useAllocate } from '@/hooks';
import { initials, cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import type { AllocationScore } from '@/types';

export default function ResourceAllocation() {
  const { data } = useProjects({ limit: 100 });
  const allocate = useAllocate();
  const { toast } = useToast();
  const [projectId, setProjectId] = useState('');
  const [result, setResult] = useState<{ requiredSkills: string[]; recommendations: AllocationScore[] } | null>(null);
  const [accepted, setAccepted] = useState<Set<string>>(new Set());

  const run = () => {
    if (!projectId) { toast('warning', 'Select a project'); return; }
    allocate.mutate({ projectId }, {
      onSuccess: (d) => { setResult(d); setAccepted(new Set()); },
      onError: () => toast('error', 'Allocation failed'),
    });
  };

  const toggle = (id: string) => {
    setAccepted((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div>
      <PageHeader title="Resource Allocation" subtitle="Rank best-fit engineers by skill match, availability, capacity, experience and performance." />

      <Card className="mb-6 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Label>Project</Label>
            <Select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="">Select a project…</option>
              {(data?.items ?? []).map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </Select>
          </div>
          <Button onClick={run} loading={allocate.isPending}><Sparkles size={15} /> Recommend</Button>
        </div>
        {result && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400">Matching against:</span>
            {result.requiredSkills.map((s) => <Badge key={s} color="brand">{s}</Badge>)}
          </div>
        )}
      </Card>

      {!result ? (
        <EmptyState icon={<Sparkles size={22} />} title="No recommendations yet" description="Pick a project and run the allocation engine." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {result.recommendations.map((r, i) => (
            <Card key={r.id} className={cn('p-5 transition-all', accepted.has(r.id) && 'ring-2 ring-emerald-400')}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
                    {initials(r.name)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{r.name}</p>
                    <p className="text-xs text-slate-400">{r.designation}</p>
                  </div>
                </div>
                {i === 0 && <Badge color="green">Best fit</Badge>}
              </div>

              <div className="mt-4 flex items-baseline gap-2">
                <span className={cn('text-3xl font-bold', r.fitScore >= 70 ? 'text-emerald-600' : r.fitScore >= 50 ? 'text-amber-500' : 'text-slate-500')}>
                  {r.fitScore}
                </span>
                <span className="text-xs text-slate-400">fit score</span>
              </div>

              <div className="mt-3 space-y-1.5">
                <Row label="Skill match" value={r.skillMatchPct} />
                <Row label="Spare capacity" value={r.spareCapacity} />
              </div>

              {r.matchedSkills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {r.matchedSkills.map((s) => <Badge key={s} color="green">{s}</Badge>)}
                  {r.missingSkills.map((s) => <Badge key={s} color="rose">{s}</Badge>)}
                </div>
              )}

              <Button
                variant={accepted.has(r.id) ? 'secondary' : 'outline'}
                size="sm"
                className="mt-4 w-full"
                onClick={() => { toggle(r.id); toast('success', accepted.has(r.id) ? 'Recommendation reverted' : `${r.name} accepted`); }}
              >
                {accepted.has(r.id) ? <><Check size={14} /> Accepted</> : 'Accept recommendation'}
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-0.5 flex justify-between text-xs text-slate-500"><span>{label}</span><span>{value}%</span></div>
      <Progress value={value} />
    </div>
  );
}
