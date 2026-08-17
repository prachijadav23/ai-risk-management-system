import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader, Badge, Input, Label, Button } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { initials } from '@/lib/utils';

export default function Profile() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div>
      <PageHeader title="My Profile" subtitle="Your account details and role." />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-2xl font-bold text-white">
            {initials(user.name)}
          </div>
          <h3 className="mt-4 text-lg font-semibold text-slate-800 dark:text-white">{user.name}</h3>
          <p className="text-sm text-slate-500">{user.email}</p>
          <Badge color="brand" className="mt-3">{user.role}</Badge>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <CardHeader title="Account information" />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div><Label>Full name</Label><Input defaultValue={user.name} /></div>
            <div><Label>Email</Label><Input defaultValue={user.email} disabled /></div>
            <div><Label>Role</Label><Input defaultValue={user.role} disabled /></div>
            <div><Label>User ID</Label><Input defaultValue={user.id} disabled /></div>
          </div>
          <div className="mt-5 flex justify-end">
            <Button>Save changes</Button>
          </div>
          <p className="mt-3 text-xs text-slate-400">Profile editing is a UI demo — wire it to a PATCH /auth/me endpoint to persist.</p>
        </Card>
      </div>
    </div>
  );
}
