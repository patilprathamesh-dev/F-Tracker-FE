'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthGate';
import { Button, Card, PageHeader, Segmented } from '@/components/ui';
import { getTheme, setTheme } from '@/lib/theme';

const icon = (paths) => (
  <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {paths.map((d) => <path key={d} d={d} />)}
  </svg>
);
const SUN = icon(['M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'M12 2v2', 'M12 20v2', 'm4.93 4.93 1.41 1.41', 'm17.66 17.66 1.41 1.41', 'M2 12h2', 'M20 12h2', 'm6.34 17.66-1.41 1.41', 'm19.07 4.93-1.41 1.41']);
const MOON = icon(['M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z']);
const PHONE = icon(['M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z', 'M12 18h.01']);

const THEMES = [
  { value: 'light', label: <span className="flex items-center justify-center gap-1.5">{SUN}Light</span> },
  { value: 'dark', label: <span className="flex items-center justify-center gap-1.5">{MOON}Dark</span> },
  { value: 'system', label: <span className="flex items-center justify-center gap-1.5">{PHONE}System</span> },
];

export default function AccountPage() {
  const { user, logout } = useAuth();
  const [theme, setThemeState] = useState('system');

  useEffect(() => setThemeState(getTheme()), []);
  const choose = (mode) => {
    setThemeState(mode);
    setTheme(mode);
  };

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

      <Card className="mb-4">
        <h2 className="text-lg font-semibold">Appearance</h2>
        <p className="mt-0.5 mb-3 text-sm text-slate-500 dark:text-slate-400">
          {theme === 'system' ? 'Follows your iPhone’s light / dark setting.' : `Always ${theme}, whatever the iPhone is set to.`}
        </p>
        <Segmented value={theme} onChange={choose} options={THEMES} />
      </Card>

      <Button variant="danger" size="lg" onClick={logout}>Log out</Button>
    </>
  );
}
