import { useState } from 'react';
import { Play } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, Select, Label, Button } from '@/components/ui';
import { RiskPanel } from '@/pages/ProjectDetails';
import { useProjects, usePredict } from '@/hooks';
import { useToast } from '@/components/ui/Toast';
import type { RiskResult } from '@/types';

export default function RiskPrediction() {
  const { data } = useProjects({ limit: 100 });
  const predict = usePredict();
  const { toast } = useToast();
  const [projectId, setProjectId] = useState('');
  const [risk, setRisk] = useState<RiskResult | null>(null);

  const run = () => {
    if (!projectId) { toast('warning', 'Select a project first'); return; }
    predict.mutate(projectId, {
      onSuccess: (d) => { setRisk(d.prediction); toast('success', 'Prediction complete'); },
      onError: () => toast('error', 'Prediction failed'),
    });
  };

  return (
    <div>
      <PageHeader title="AI Risk Prediction" subtitle="Run the explainable engine against any project and inspect the factor breakdown." />

      <Card className="mb-6 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Label>Project</Label>
            <Select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="">Select a project…</option>
              {(data?.items ?? []).map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </Select>
          </div>
          <Button onClick={run} loading={predict.isPending}><Play size={15} /> Run prediction</Button>
        </div>
      </Card>

      <RiskPanel risk={risk} onRun={run} running={predict.isPending} />
    </div>
  );
}
