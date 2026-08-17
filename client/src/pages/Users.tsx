import { useState } from 'react';
import { UserPlus, Trash2, ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button, Card, Input, Label, Select, Badge, Skeleton, EmptyState } from '@/components/ui';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser, useEmployees } from '@/hooks';
import type { Role } from '@/types';
import { apiErrorMessage } from '@/lib/api';

const ROLE_OPTIONS: Role[] = ['Administrator', 'ProjectManager', 'TeamLead', 'Employee'];
const roleColor = (r: Role) =>
  r === 'Administrator' ? 'rose' : r === 'ProjectManager' ? 'brand' : r === 'TeamLead' ? 'amber' : 'green';

export default function Users() {
  const { data, isLoading } = useUsers();
  const del = useDeleteUser();
  const update = useUpdateUser();
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const users = data?.items ?? [];

  const changeRole = (id: string, role: Role) =>
    update.mutate(
      { id, body: { role } },
      {
        onSuccess: () => toast('success', 'Role updated'),
        onError: (e) => toast('error', apiErrorMessage(e)),
      }
    );

  const toggleActive = (id: string, isActive: boolean) =>
    update.mutate(
      { id, body: { isActive } },
      {
        onSuccess: () => toast('success', isActive ? 'Account activated' : 'Account deactivated'),
        onError: (e) => toast('error', apiErrorMessage(e)),
      }
    );

  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle="Create and manage privileged accounts. Public sign-ups are always Employees."
        action={<Button onClick={() => setCreateOpen(true)}><UserPlus size={16} /> New user</Button>}
      />

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : users.length === 0 ? (
        <EmptyState icon={<ShieldCheck size={22} />} title="No users yet" description="Create the first privileged account." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-900/60">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                    <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200">{u.name}</td>
                    <td className="px-4 py-3 text-slate-500">{u.email}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Badge color={roleColor(u.role)}>{u.role}</Badge>
                        <Select
                          value={u.role}
                          onChange={(e) => changeRole(u._id, e.target.value as Role)}
                          className="h-8 w-auto py-0 text-xs"
                        >
                          {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                        </Select>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(u._id, !u.isActive)}
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          u.isActive
                            ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400'
                            : 'bg-slate-200 text-slate-500 dark:bg-slate-800'
                        }`}
                      >
                        {u.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setDeleteId(u._id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create user">
        <CreateUserForm onDone={() => setCreateOpen(false)} />
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete user?"
        message="This permanently removes the account. This cannot be undone."
        confirmLabel="Delete"
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (!deleteId) return;
          del.mutate(deleteId, {
            onSuccess: () => toast('success', 'User deleted'),
            onError: (e) => toast('error', apiErrorMessage(e)),
          });
          setDeleteId(null);
        }}
      />
    </div>
  );
}

function CreateUserForm({ onDone }: { onDone: () => void }) {
  const create = useCreateUser();
  const { toast } = useToast();
  const { data: emp } = useEmployees({ limit: 100 });
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'ProjectManager' as Role,
    employee: '',
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate(
      { ...form, employee: form.employee || undefined },
      {
        onSuccess: () => { toast('success', 'User created'); onDone(); },
        onError: (err) => toast('error', apiErrorMessage(err)),
      }
    );
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <Label>Full name</Label>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      </div>
      <div>
        <Label>Email</Label>
        <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
      </div>
      <div>
        <Label>Temporary password</Label>
        <Input type="text" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Role</Label>
          <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
            {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </Select>
        </div>
        <div>
          <Label>Link employee (optional)</Label>
          <Select value={form.employee} onChange={(e) => setForm({ ...form, employee: e.target.value })}>
            <option value="">— none —</option>
            {(emp?.items ?? []).map((x) => <option key={x._id} value={x._id}>{x.name}</option>)}
          </Select>
        </div>
      </div>
      <p className="text-xs text-slate-400">
        Linking an employee record scopes what a Project Manager, Team Lead or Employee can see
        (their managed / led / assigned projects).
      </p>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onDone}>Cancel</Button>
        <Button type="submit" loading={create.isPending}>Create user</Button>
      </div>
    </form>
  );
}
