import { useState } from 'react';
import { Lightbulb, Check, X } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, Badge, Button, Skeleton, EmptyState } from '@/components/ui';
import { useRecommendations, useResolveRecommendation } from '@/hooks';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import { usePermissions } from '@/lib/permissions';

const priorityColor = (p: string) => (p === 'Critical' ? 'rose' : p === 'High' ? 'orange' : p === 'Medium' ? 'amber' : 'slate');
const filters = ['Pending', 'Accepted', 'Rejected', 'All'];

export default function Recommendations() {
  const [filter, setFilter] = useState('Pending');
  const { data, isLoading } = useRecommendations(filter === 'All' ? undefined : filter);
  const resolve = useResolveRecommendation();
  const { toast } = useToast();
  const { can } = usePermissions();

  const act = (id: string, status: 'Accepted' | 'Rejected') => {
    resolve.mutate({ id, status }, { onSuccess: () => toast('success', `Recommendation ${status.toLowerCase()}`) });
  };

  return (
    <div>
      <PageHeader title="AI Recommendations" subtitle="Actionable interventions generated from live risk analysis." />

      <div className="mb-5 flex gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-xl px-4 py-2 text-sm font-medium transition-colors',
              filter === f ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
      ) : !data || data.length === 0 ? (
        <EmptyState icon={<Lightbulb size={22} />} title="No recommendations" description="Run predictions on the Command Center or a project to generate recommendations." />
      ) : (
        <div className="space-y-4">
          {data.map((r) => (
            <Card key={r._id} className="p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge color={priorityColor(r.priority)}>{r.priority}</Badge>
                    <Badge color="brand">{r.type}</Badge>
                    <Badge color={r.status === 'Accepted' ? 'green' : r.status === 'Rejected' ? 'rose' : 'slate'}>{r.status}</Badge>
                    {typeof r.project === 'object' && r.project && <span className="text-xs text-slate-400">{r.project.name}</span>}
                  </div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{r.problem}</p>
                  <p className="mt-1 text-sm text-slate-500"><b>Why:</b> {r.reason}</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300"><b>Action:</b> {r.action}</p>
                  <p className="mt-1 text-xs text-emerald-600">Expected impact: {r.expectedImpact} · {r.confidence}% confidence</p>
                </div>
                {r.status === 'Pending' && can('resolveRecommendation') && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => act(r._id, 'Accepted')}><Check size={14} /> Accept</Button>
                    <Button size="sm" variant="outline" onClick={() => act(r._id, 'Rejected')}><X size={14} /> Dismiss</Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
