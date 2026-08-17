import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2, FolderKanban } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button, Card, Input, Select, Badge, Progress, Skeleton, EmptyState } from '@/components/ui';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { ProjectForm } from '@/components/ProjectForm';
import { useProjects, useDeleteProject } from '@/hooks';
import { api, unwrap } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Project, Client, Department } from '@/types';
import { useToast } from '@/components/ui/Toast';
import { usePermissions } from '@/lib/permissions';

const statusColor = (s: string) =>
  s === 'Active' ? 'brand' : s === 'Completed' ? 'green' : s === 'OnHold' ? 'amber' : s === 'Cancelled' ? 'rose' : 'slate';
const priorityColor = (p: string) =>
  p === 'Critical' ? 'rose' : p === 'High' ? 'orange' : p === 'Medium' ? 'amber' : 'slate';

export default function Projects() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { toast } = useToast();
  const { can } = usePermissions();
  const { data, isLoading } = useProjects({ search, status, page, limit: 12 });
  const del = useDeleteProject();

  const items = data?.items ?? [];
  const meta = data?.meta;

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (p: Project) => { setEditing(p); setModalOpen(true); };

  const confirmDelete = () => {
    if (!deleteId) return;
    del.mutate(deleteId, {
      onSuccess: () => toast('success', 'Project deleted'),
      onError: () => toast('error', 'Delete failed'),
    });
  };

  return (
    <div>
      <PageHeader
        title="Project Management"
        subtitle="Create, track and manage the full project portfolio."
        action={can('createProject') ? <Button onClick={openCreate}><Plus size={16} /> New Project</Button> : undefined}
      />

      <Card className="mb-5 p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Search projects…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
          </div>
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="sm:w-48">
            <option value="">All statuses</option>
            <option value="Planning">Planning</option>
            <option value="Active">Active</option>
            <option value="OnHold">On Hold</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </Select>
        </div>
      </Card>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-52" />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<FolderKanban size={22} />}
          title="No projects found"
          description="Create your first project to get started."
          action={can('createProject') ? <Button onClick={openCreate}><Plus size={16} /> New Project</Button> : undefined}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((p) => (
            <Card key={p._id} className="group p-5 transition-shadow hover:shadow-lg">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <Link to={`/app/projects/${p._id}`} className="block truncate text-sm font-semibold text-slate-800 hover:text-brand-600 dark:text-slate-100">
                    {p.name}
                  </Link>
                  <p className="mt-0.5 text-xs text-slate-400">{p.code} · {p.category}</p>
                </div>
                <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  {can('editProject') && (
                    <button onClick={() => openEdit(p)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800">
                      <Pencil size={14} />
                    </button>
                  )}
                  {can('deleteProject') && (
                    <button onClick={() => setDeleteId(p._id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge color={statusColor(p.status)}>{p.status}</Badge>
                <Badge color={priorityColor(p.priority)}>{p.priority}</Badge>
              </div>

              <div className="mt-4">
                <div className="mb-1 flex justify-between text-xs text-slate-500">
                  <span>Progress</span><span>{p.progress}%</span>
                </div>
                <Progress value={p.progress} />
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800">
                <span>{formatCurrency(p.budget)}</span>
                <span>Due {formatDate(p.endDate)}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {meta && (meta.totalPages ?? 1) > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span className="text-sm text-slate-500">Page {page} of {meta.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= (meta.totalPages ?? 1)} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Project' : 'New Project'} size="lg">
        <ProjectForm project={editing} onDone={() => setModalOpen(false)} />
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete project"
        message="This permanently removes the project and its tasks. This cannot be undone."
        confirmLabel="Delete"
      />
    </div>
  );
}

export function useLookups() {
  return useQuery({
    queryKey: ['lookups'],
    queryFn: () => unwrap<{ clients: Client[]; departments: Department[]; teams: { _id: string; name: string }[]; managers: { _id: string; name: string; designation: string }[] }>(api.get('/lookups')),
  });
}
