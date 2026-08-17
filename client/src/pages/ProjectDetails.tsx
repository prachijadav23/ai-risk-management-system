import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Play, CheckCircle2, Circle } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader, Badge, Button, Progress, Skeleton } from '@/components/ui';
import { useProject, usePredict } from '@/hooks';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import type { RiskResult, Employee, Client } from '@/types';
import { usePermissions } from '@/lib/permissions';

const tabs = ['Overview', 'Tasks', 'Milestones', 'Budget', 'Risk'] as const;

export default function ProjectDetails() {
  const { id } = useParams();
  const { data: project, isLoading } = useProject(id);
  const [tab, setTab] = useState<(typeof tabs)[number]>('Overview');
  const [risk, setRisk] = useState<RiskResult | null>(null);
  const predict = usePredict();
  const { toast } = useToast();
  const { can } = usePermissions();

  const runPrediction = () => {
    if (!id) return;
    predict.mutate(id, {
      onSuccess: (d) => { setRisk(d.prediction); setTab('Risk'); toast('success', 'Prediction complete'); },
      onError: () => toast('error', 'Prediction failed'),
    });
  };

  if (isLoading || !project) {
    return <div className="space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-64" /></div>;
  }

  const client = project.client as Client;
  const manager = project.manager as Employee;

  return (
    <div>
      <Link to="/app/projects" className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-600">
        <ArrowLeft size={15} /> Back to projects
      </Link>
      <PageHeader
        title={project.name}
        subtitle={`${project.code} · ${project.category}`}
        action={can('runAI') ? <Button onClick={runPrediction} loading={predict.isPending}><Play size={15} /> Run AI Prediction</Button> : undefined}
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <Badge color="brand">{project.status}</Badge>
        <Badge color="amber">{project.priority}</Badge>
        {project.technology.map((t) => <Badge key={t}>{t}</Badge>)}
      </div>

      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'relative px-4 py-2.5 text-sm font-medium transition-colors',
              tab === t ? 'text-brand-600' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            {t}
            {tab === t && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-brand-600" />}
          </button>
        ))}
      </div>

      {tab === 'Overview' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 p-5">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Description</h3>
            <p className="mt-2 text-sm text-slate-500">{project.description || 'No description provided.'}</p>
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Info label="Client" value={client?.name} />
              <Info label="Manager" value={manager?.name} />
              <Info label="Start" value={formatDate(project.startDate)} />
              <Info label="End" value={formatDate(project.endDate)} />
              <Info label="Requirement changes" value={String(project.requirementChanges)} />
              <Info label="Defects" value={String(project.defectCount)} />
            </div>
            <div className="mt-5">
              <div className="mb-1 flex justify-between text-xs text-slate-500"><span>Progress</span><span>{project.progress}%</span></div>
              <Progress value={project.progress} />
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Budget</h3>
            <p className="mt-3 text-2xl font-bold text-slate-800 dark:text-white">{formatCurrency(project.spentBudget)}</p>
            <p className="text-xs text-slate-400">of {formatCurrency(project.budget)}</p>
            <Progress value={(project.spentBudget / project.budget) * 100} className="mt-3" />
          </Card>
        </div>
      )}

      {tab === 'Tasks' && (
        <Card className="p-2">
          {(project.tasks ?? []).length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-400">No tasks yet.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {(project.tasks ?? []).map((t) => (
                <div key={t._id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{t.title}</p>
                    <p className="text-xs text-slate-400">{typeof t.assignee === 'object' ? (t.assignee as Employee)?.name : 'Unassigned'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge>{t.status}</Badge>
                    <span className="text-xs text-slate-400">{t.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === 'Milestones' && (
        <Card className="p-2">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {project.milestones.map((m, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                {m.completed ? <CheckCircle2 size={18} className="text-emerald-500" /> : <Circle size={18} className="text-slate-300" />}
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{m.title}</p>
                  <p className="text-xs text-slate-400">Due {formatDate(m.dueDate)}</p>
                </div>
                <Badge color={m.completed ? 'green' : 'slate'}>{m.completed ? 'Done' : 'Pending'}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'Budget' && (
        <Card className="p-5">
          <CardHeader title="Budget breakdown" />
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Info label="Total budget" value={formatCurrency(project.budget)} />
            <Info label="Spent" value={formatCurrency(project.spentBudget)} />
            <Info label="Remaining" value={formatCurrency(Math.max(0, project.budget - project.spentBudget))} />
          </div>
        </Card>
      )}

      {tab === 'Risk' && (
        <RiskPanel risk={risk} onRun={runPrediction} running={predict.isPending} />
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-slate-700 dark:text-slate-200">{value ?? '—'}</p>
    </div>
  );
}

export function RiskPanel({ risk, onRun, running }: { risk: RiskResult | null; onRun: () => void; running: boolean }) {
  const { can } = usePermissions();
  if (!risk) {
    return (
      <Card className="p-10 text-center">
        <p className="text-sm text-slate-500">
          {can('runAI')
            ? 'No prediction yet for this project.'
            : 'No prediction has been run for this project yet.'}
        </p>
        {can('runAI') && (
          <Button className="mt-4" onClick={onRun} loading={running}><Play size={15} /> Run AI Prediction</Button>
        )}
      </Card>
    );
  }
  const barColor = (v: number) => (v >= 15 ? '#ef4444' : v >= 8 ? '#f59e0b' : '#22c55e');
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="p-6 text-center">
        <p className="text-xs font-medium text-slate-500">Risk Score</p>
        <p className={cn('mt-2 text-5xl font-extrabold', risk.riskScore >= 55 ? 'text-rose-600' : risk.riskScore >= 35 ? 'text-amber-500' : 'text-emerald-600')}>
          {risk.riskScore}%
        </p>
        <Badge className="mt-3" color={risk.riskLevel === 'Critical' ? 'rose' : risk.riskLevel === 'High' ? 'orange' : risk.riskLevel === 'Medium' ? 'amber' : 'green'}>
          {risk.riskLevel} · {risk.confidence}% confidence
        </Badge>
        <div className="mt-5 space-y-2 text-left text-xs">
          <Stat label="Delay probability" value={risk.delayProbability} />
          <Stat label="Budget overrun" value={risk.budgetOverrunProbability} />
          <Stat label="Failure probability" value={risk.failureProbability} />
          <Stat label="Success probability" value={risk.successProbability} good />
        </div>
      </Card>

      <Card className="lg:col-span-2 p-5">
        <CardHeader title="Explainable factor contributions" subtitle="Each bar shows how many points a factor adds to the risk score" />
        <div className="mt-2 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={risk.factors} layout="vertical" margin={{ left: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="label" width={140} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="contribution" radius={[0, 6, 6, 0]}>
                {risk.factors.map((f, i) => <Cell key={i} fill={barColor(f.contribution)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 rounded-xl bg-brand-50 p-3 text-sm text-brand-800 dark:bg-brand-950/40 dark:text-brand-200">
          <b>Recommended action:</b> {risk.recommendedAction}
        </div>
      </Card>
    </div>
  );
}

function Stat({ label, value, good }: { label: string; value: number; good?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className={cn('font-semibold', good ? 'text-emerald-600' : value >= 55 ? 'text-rose-600' : 'text-slate-700 dark:text-slate-200')}>{value}%</span>
    </div>
  );
}
