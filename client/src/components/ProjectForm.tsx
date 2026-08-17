import { useForm } from 'react-hook-form';
import { Button, Input, Label, Select, Textarea } from '@/components/ui';
import { useCreateProject, useUpdateProject } from '@/hooks';
import { useLookups } from '@/pages/Projects';
import { useToast } from '@/components/ui/Toast';
import { apiErrorMessage } from '@/lib/api';
import type { Project } from '@/types';

interface FormValues {
  name: string;
  code: string;
  description: string;
  client: string;
  manager: string;
  department: string;
  category: string;
  technology: string;
  startDate: string;
  endDate: string;
  budget: number;
  spentBudget: number;
  priority: string;
  status: string;
  progress: number;
  requirementChanges: number;
  defectCount: number;
}

const idOf = (v: unknown): string => (typeof v === 'object' && v ? (v as { _id: string })._id : String(v ?? ''));
const dateInput = (d?: string) => (d ? new Date(d).toISOString().slice(0, 10) : '');

export function ProjectForm({ project, onDone }: { project: Project | null; onDone: () => void }) {
  const { data: lookups } = useLookups();
  const create = useCreateProject();
  const update = useUpdateProject();
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    defaultValues: project
      ? {
          name: project.name,
          code: project.code,
          description: project.description ?? '',
          client: idOf(project.client),
          manager: idOf(project.manager),
          department: idOf(project.department),
          category: project.category,
          technology: project.technology.join(', '),
          startDate: dateInput(project.startDate),
          endDate: dateInput(project.endDate),
          budget: project.budget,
          spentBudget: project.spentBudget,
          priority: project.priority,
          status: project.status,
          progress: project.progress,
          requirementChanges: project.requirementChanges,
          defectCount: project.defectCount,
        }
      : {
          category: 'Web Application',
          priority: 'Medium',
          status: 'Planning',
          budget: 500000,
          spentBudget: 0,
          progress: 0,
          requirementChanges: 0,
          defectCount: 0,
          startDate: dateInput(new Date().toISOString()),
          endDate: dateInput(new Date(Date.now() + 90 * 86400000).toISOString()),
        },
  });

  const onSubmit = (v: FormValues) => {
    const body = {
      ...v,
      budget: Number(v.budget),
      spentBudget: Number(v.spentBudget),
      progress: Number(v.progress),
      requirementChanges: Number(v.requirementChanges),
      defectCount: Number(v.defectCount),
      technology: v.technology.split(',').map((t) => t.trim()).filter(Boolean),
    } as Partial<Project>;
    const opts = {
      onSuccess: () => { toast('success', project ? 'Project updated' : 'Project created'); onDone(); },
      onError: (e: unknown) => toast('error', apiErrorMessage(e)),
    };
    if (project) update.mutate({ id: project._id, body }, opts);
    else create.mutate(body, opts);
  };

  const loading = create.isPending || update.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Project name</Label>
          <Input {...register('name', { required: true })} />
          {errors.name && <p className="mt-1 text-xs text-rose-500">Required</p>}
        </div>
        <div>
          <Label>Code</Label>
          <Input {...register('code', { required: true })} placeholder="PRJ-1001" />
        </div>
      </div>

      <div>
        <Label>Description</Label>
        <Textarea rows={2} {...register('description')} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label>Client</Label>
          <Select {...register('client', { required: true })}>
            <option value="">Select…</option>
            {lookups?.clients.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </Select>
        </div>
        <div>
          <Label>Manager</Label>
          <Select {...register('manager', { required: true })}>
            <option value="">Select…</option>
            {lookups?.managers.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
          </Select>
        </div>
        <div>
          <Label>Department</Label>
          <Select {...register('department', { required: true })}>
            <option value="">Select…</option>
            {lookups?.departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Category</Label>
          <Select {...register('category')}>
            {['Web Application', 'Mobile Application', 'Cloud Migration', 'Data Analytics', 'AI/ML Platform', 'Cybersecurity', 'ERP System', 'CRM System'].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Technologies (comma-separated)</Label>
          <Input {...register('technology')} placeholder="React, Node.js, MongoDB" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Start date</Label>
          <Input type="date" {...register('startDate', { required: true })} />
        </div>
        <div>
          <Label>End date</Label>
          <Input type="date" {...register('endDate', { required: true })} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Budget (₹)</Label>
          <Input type="number" {...register('budget', { required: true })} />
        </div>
        <div>
          <Label>Spent budget (₹)</Label>
          <Input type="number" {...register('spentBudget')} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label>Priority</Label>
          <Select {...register('priority')}>
            {['Low', 'Medium', 'High', 'Critical'].map((p) => <option key={p}>{p}</option>)}
          </Select>
        </div>
        <div>
          <Label>Status</Label>
          <Select {...register('status')}>
            {['Planning', 'Active', 'OnHold', 'Completed', 'Cancelled'].map((s) => <option key={s}>{s}</option>)}
          </Select>
        </div>
        <div>
          <Label>Progress (%)</Label>
          <Input type="number" min={0} max={100} {...register('progress')} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Requirement changes</Label>
          <Input type="number" min={0} {...register('requirementChanges')} />
        </div>
        <div>
          <Label>Defect count</Label>
          <Input type="number" min={0} {...register('defectCount')} />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onDone}>Cancel</Button>
        <Button type="submit" loading={loading}>{project ? 'Save changes' : 'Create project'}</Button>
      </div>
    </form>
  );
}
