import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, GripVertical, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button, Card, Input, Label, Select, Textarea, Badge, Skeleton } from '@/components/ui';
import { Modal } from '@/components/ui/Modal';
import { useBoard, useMoveTask, useCreateTask, useDeleteTask, useProjects } from '@/hooks';
import { cn, formatDate } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import type { Task, Employee } from '@/types';
import { usePermissions } from '@/lib/permissions';

const COLUMNS: { key: string; label: string; color: string }[] = [
  { key: 'Todo', label: 'To Do', color: 'bg-slate-400' },
  { key: 'InProgress', label: 'In Progress', color: 'bg-brand-500' },
  { key: 'Review', label: 'Review', color: 'bg-amber-500' },
  { key: 'Done', label: 'Done', color: 'bg-emerald-500' },
  { key: 'Blocked', label: 'Blocked', color: 'bg-rose-500' },
];

const priorityColor = (p: string) => (p === 'Critical' ? 'rose' : p === 'High' ? 'orange' : p === 'Medium' ? 'amber' : 'slate');

export default function Tasks() {
  const { data: board, isLoading } = useBoard();
  const move = useMoveTask();
  const del = useDeleteTask();
  const { toast } = useToast();
  const { can } = usePermissions();
  const [dragId, setDragId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const onDrop = (status: string) => {
    if (dragId) {
      move.mutate({ id: dragId, status });
      setDragId(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Task Management"
        subtitle="Drag cards between columns to update status."
        action={can('createTask') ? <Button onClick={() => setModalOpen(true)}><Plus size={16} /> New Task</Button> : undefined}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-5">
          {COLUMNS.map((c) => <Skeleton key={c.key} className="h-96" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-5">
          {COLUMNS.map((col) => {
            const tasks = board?.[col.key] ?? [];
            return (
              <div
                key={col.key}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(col.key)}
                className="flex flex-col rounded-2xl bg-slate-100/60 p-3 dark:bg-slate-900/60"
              >
                <div className="mb-3 flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className={cn('h-2.5 w-2.5 rounded-full', col.color)} />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{col.label}</span>
                  </div>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-800">{tasks.length}</span>
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  {tasks.map((t: Task) => (
                    <div
                      key={t._id}
                      draggable
                      onDragStart={() => setDragId(t._id)}
                      className="group cursor-grab rounded-xl border border-slate-200 bg-white p-3 shadow-soft active:cursor-grabbing dark:border-slate-800 dark:bg-slate-900"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{t.title}</p>
                        {can('deleteTask') && (
                          <button
                            onClick={() => del.mutate(t._id, { onSuccess: () => toast('success', 'Task deleted') })}
                            className="opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            <Trash2 size={13} className="text-slate-300 hover:text-rose-500" />
                          </button>
                        )}
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <Badge color={priorityColor(t.priority)}>{t.priority}</Badge>
                        <span className="text-[10px] text-slate-400">{t.dueDate ? formatDate(t.dueDate) : ''}</span>
                      </div>
                      {typeof t.assignee === 'object' && t.assignee && (
                        <p className="mt-2 flex items-center gap-1 text-[11px] text-slate-400">
                          <GripVertical size={11} /> {(t.assignee as Employee).name}
                        </p>
                      )}
                    </div>
                  ))}
                  {tasks.length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-xs text-slate-300 dark:border-slate-800">
                      Drop here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Task">
        <TaskForm onDone={() => setModalOpen(false)} />
      </Modal>
    </div>
  );
}

interface TForm {
  title: string; description: string; project: string; priority: string; status: string;
  estimatedHours: number; dueDate: string;
}

function TaskForm({ onDone }: { onDone: () => void }) {
  const { data } = useProjects({ limit: 100 });
  const create = useCreateTask();
  const { toast } = useToast();
  const { register, handleSubmit } = useForm<TForm>({
    defaultValues: { priority: 'Medium', status: 'Todo', estimatedHours: 8 },
  });

  const onSubmit = (v: TForm) => {
    create.mutate(
      { ...v, estimatedHours: Number(v.estimatedHours) } as Partial<Task>,
      {
        onSuccess: () => { toast('success', 'Task created'); onDone(); },
        onError: () => toast('error', 'Create failed'),
      }
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div><Label>Title</Label><Input {...register('title', { required: true })} /></div>
      <div><Label>Description</Label><Textarea rows={2} {...register('description')} /></div>
      <div>
        <Label>Project</Label>
        <Select {...register('project', { required: true })}>
          <option value="">Select…</option>
          {(data?.items ?? []).map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
        </Select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Priority</Label>
          <Select {...register('priority')}>{['Low', 'Medium', 'High', 'Critical'].map((p) => <option key={p}>{p}</option>)}</Select>
        </div>
        <div>
          <Label>Status</Label>
          <Select {...register('status')}>{['Todo', 'InProgress', 'Review', 'Done', 'Blocked'].map((s) => <option key={s}>{s}</option>)}</Select>
        </div>
        <div><Label>Estimated hours</Label><Input type="number" {...register('estimatedHours')} /></div>
        <div><Label>Due date</Label><Input type="date" {...register('dueDate')} /></div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onDone}>Cancel</Button>
        <Button type="submit" loading={create.isPending}>Create task</Button>
      </div>
    </form>
  );
}
