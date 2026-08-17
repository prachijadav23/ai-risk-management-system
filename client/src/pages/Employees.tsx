import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Search, Pencil, Trash2, Users } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button, Card, Input, Label, Select, Badge, Progress, Skeleton, EmptyState } from '@/components/ui';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { useEmployees, useCreateEmployee, useUpdateEmployee, useDeleteEmployee } from '@/hooks';
import { useLookups } from '@/pages/Projects';
import { initials } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import { apiErrorMessage } from '@/lib/api';
import type { Employee, Department } from '@/types';
import { usePermissions } from '@/lib/permissions';

const availColor = (a: string) => (a === 'Available' ? 'green' : a === 'PartiallyAvailable' ? 'amber' : 'rose');
const idOf = (v: unknown): string => (typeof v === 'object' && v ? (v as { _id: string })._id : String(v ?? ''));

export default function Employees() {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useEmployees({ search, limit: 30 });
  const del = useDeleteEmployee();
  const { toast } = useToast();
  const { can } = usePermissions();
  const items = data?.items ?? [];

  return (
    <div>
      <PageHeader
        title="Employee Management"
        subtitle="Skills, workload, availability and performance across the org."
        action={can('manageEmployees') ? <Button onClick={() => { setEditing(null); setModalOpen(true); }}><Plus size={16} /> Add Employee</Button> : undefined}
      />

      <Card className="mb-5 p-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Search employees…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </Card>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : items.length === 0 ? (
        <EmptyState icon={<Users size={22} />} title="No employees found" />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs text-slate-400 dark:border-slate-800">
                  <th className="px-5 py-3 font-medium">Employee</th>
                  <th className="px-5 py-3 font-medium">Designation</th>
                  <th className="px-5 py-3 font-medium">Skills</th>
                  <th className="px-5 py-3 font-medium">Workload</th>
                  <th className="px-5 py-3 font-medium">Availability</th>
                  <th className="px-5 py-3 font-medium">Perf.</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((e) => (
                  <tr key={e._id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-xs font-semibold text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
                          {initials(e.name)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-700 dark:text-slate-200">{e.name}</p>
                          <p className="text-xs text-slate-400">{e.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{e.designation}</td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {e.skills.slice(0, 3).map((s) => <Badge key={s}>{s}</Badge>)}
                        {e.skills.length > 3 && <Badge color="slate">+{e.skills.length - 3}</Badge>}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="w-24"><Progress value={e.currentWorkload} /></div>
                      <span className="text-xs text-slate-400">{e.currentWorkload}%</span>
                    </td>
                    <td className="px-5 py-3"><Badge color={availColor(e.availability)}>{e.availability}</Badge></td>
                    <td className="px-5 py-3 font-semibold text-slate-700 dark:text-slate-200">{e.performanceScore}</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        {can('manageEmployees') && (
                          <button onClick={() => { setEditing(e); setModalOpen(true); }} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-700">
                            <Pencil size={14} />
                          </button>
                        )}
                        {can('deleteEmployee') && (
                          <button onClick={() => setDeleteId(e._id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40">
                            <Trash2 size={14} />
                          </button>
                        )}
                        {!can('manageEmployees') && !can('deleteEmployee') && (
                          <span className="px-1.5 text-xs text-slate-300">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Employee' : 'Add Employee'} size="lg">
        <EmployeeForm employee={editing} onDone={() => setModalOpen(false)} />
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && del.mutate(deleteId, { onSuccess: () => toast('success', 'Employee removed') })}
        title="Remove employee"
        message="This will remove the employee record permanently."
        confirmLabel="Remove"
      />
    </div>
  );
}

interface EForm {
  name: string; email: string; phone: string; department: string; designation: string;
  skills: string; experienceYears: number; salary: number; availability: string;
  currentWorkload: number; performanceScore: number;
}

function EmployeeForm({ employee, onDone }: { employee: Employee | null; onDone: () => void }) {
  const { data: lookups } = useLookups();
  const create = useCreateEmployee();
  const update = useUpdateEmployee();
  const { toast } = useToast();

  const { register, handleSubmit } = useForm<EForm>({
    defaultValues: employee
      ? {
          name: employee.name, email: employee.email, phone: employee.phone ?? '',
          department: idOf(employee.department), designation: employee.designation,
          skills: employee.skills.join(', '), experienceYears: employee.experienceYears,
          salary: employee.salary, availability: employee.availability,
          currentWorkload: employee.currentWorkload, performanceScore: employee.performanceScore,
        }
      : { availability: 'Available', experienceYears: 2, salary: 800000, currentWorkload: 40, performanceScore: 75, skills: '' },
  });

  const onSubmit = (v: EForm) => {
    const body = {
      ...v,
      experienceYears: Number(v.experienceYears), salary: Number(v.salary),
      currentWorkload: Number(v.currentWorkload), performanceScore: Number(v.performanceScore),
      skills: v.skills.split(',').map((s) => s.trim()).filter(Boolean),
    } as Partial<Employee>;
    const opts = {
      onSuccess: () => { toast('success', employee ? 'Employee updated' : 'Employee added'); onDone(); },
      onError: (e: unknown) => toast('error', apiErrorMessage(e)),
    };
    if (employee) update.mutate({ id: employee._id, body }, opts);
    else create.mutate(body, opts);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div><Label>Name</Label><Input {...register('name', { required: true })} /></div>
        <div><Label>Email</Label><Input type="email" {...register('email', { required: true })} /></div>
        <div><Label>Phone</Label><Input {...register('phone')} /></div>
        <div><Label>Designation</Label><Input {...register('designation', { required: true })} /></div>
        <div>
          <Label>Department</Label>
          <Select {...register('department', { required: true })}>
            <option value="">Select…</option>
            {lookups?.departments.map((d: Department) => <option key={d._id} value={d._id}>{d.name}</option>)}
          </Select>
        </div>
        <div>
          <Label>Availability</Label>
          <Select {...register('availability')}>
            <option value="Available">Available</option>
            <option value="PartiallyAvailable">Partially Available</option>
            <option value="Unavailable">Unavailable</option>
          </Select>
        </div>
      </div>
      <div><Label>Skills (comma-separated)</Label><Input {...register('skills')} placeholder="React, Node.js, AWS" /></div>
      <div className="grid gap-4 sm:grid-cols-4">
        <div><Label>Experience (yrs)</Label><Input type="number" {...register('experienceYears')} /></div>
        <div><Label>Salary (₹)</Label><Input type="number" {...register('salary')} /></div>
        <div><Label>Workload (%)</Label><Input type="number" min={0} max={100} {...register('currentWorkload')} /></div>
        <div><Label>Performance</Label><Input type="number" min={0} max={100} {...register('performanceScore')} /></div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onDone}>Cancel</Button>
        <Button type="submit" loading={create.isPending || update.isPending}>{employee ? 'Save' : 'Add employee'}</Button>
      </div>
    </form>
  );
}
