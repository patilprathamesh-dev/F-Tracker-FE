'use client';

import { useAuth } from '@/components/AuthGate';
import { Button, Card, PageHeader } from '@/components/ui';

export default function AccountPage() {
  const { user, logout } = useAuth();
  return (
    <>
      <PageHeader title="Account" />
      <Card className="mb-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">Logged in as</p>
        <p className="mt-0.5 break-all font-semibold">{user?.email || '—'}</p>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          The login email and password are set on the server (ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env).
          Changing them logs out every device.
        </p>
      </Card>
      <Button variant="danger" size="lg" onClick={logout}>Log out</Button>
    </>
  );
}
