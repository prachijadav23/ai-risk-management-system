import { Bell, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, Badge } from '@/components/ui';

const mock = [
  { id: 1, type: 'risk', title: 'High risk detected', body: 'Project "Payment Gateway Revamp" crossed 70% risk score.', time: '2h ago' },
  { id: 2, type: 'success', title: 'Milestone completed', body: 'UAT sign-off completed for "Inventory Cloud Migration".', time: '5h ago' },
  { id: 3, type: 'info', title: 'New allocation', body: 'Riya Sharma was recommended for "AI Chatbot Platform".', time: '1d ago' },
  { id: 4, type: 'warning', title: 'Budget alert', body: '"ERP Upgrade" is at 92% budget utilization.', time: '2d ago' },
];

const icon = { risk: <AlertTriangle size={16} className="text-rose-500" />, success: <CheckCircle2 size={16} className="text-emerald-500" />, info: <Info size={16} className="text-brand-500" />, warning: <AlertTriangle size={16} className="text-amber-500" /> };

export default function Notifications() {
  return (
    <div>
      <PageHeader title="Notifications" subtitle="Alerts from the risk engine and project activity." action={<Badge color="rose">{mock.length} new</Badge>} />
      <Card className="divide-y divide-slate-100 dark:divide-slate-800">
        {mock.map((n) => (
          <div key={n.id} className="flex items-start gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50">
            <div className="mt-0.5">{icon[n.type as keyof typeof icon]}</div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{n.title}</p>
              <p className="text-xs text-slate-500">{n.body}</p>
            </div>
            <span className="whitespace-nowrap text-[11px] text-slate-400">{n.time}</span>
          </div>
        ))}
      </Card>
      <p className="mt-3 text-center text-xs text-slate-400">Live notification records are seeded in the database; this view shows representative alerts.</p>
    </div>
  );
}
