'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/components/AuthGate';
import { Button, ErrorBox, Field, Input, Logo } from '@/components/ui';

// Only allow redirects back into this app (blocks //evil.com style links)
function safeNext() {
  const next = new URLSearchParams(window.location.search).get('next') || '/';
  return next.startsWith('/') && !next.startsWith('//') && next !== '/login' ? next : '/';
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      router.replace(safeNext());
      login(res);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-slate-50 pt-safe pb-safe pl-safe pr-safe dark:bg-slate-950">
      {/* Soft brand glow behind the glass card */}
      <div aria-hidden="true" className="pointer-events-none absolute -top-24 left-1/2 size-[28rem] -translate-x-1/2 rounded-full bg-teal-300/40 blur-3xl dark:bg-teal-700/30" />
      <div aria-hidden="true" className="pointer-events-none absolute top-1/3 -right-24 size-72 rounded-full bg-sky-200/50 blur-3xl dark:bg-sky-800/20" />

      <div className="relative flex flex-1 flex-col items-center justify-end px-6 pt-10 pb-8 sm:justify-center">
        <Logo size="lg" />
        <h1 className="mt-4 text-[22px] font-bold tracking-tight">Finance Tracker</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Log in to see your money</p>
      </div>
      <form
        onSubmit={submit}
        className="relative mx-auto w-full max-w-md rounded-t-3xl border border-white/60 bg-white/70 px-5 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-xl shadow-slate-900/5 backdrop-blur-xl sm:mb-10 sm:rounded-3xl sm:pb-6 dark:border-white/10 dark:bg-slate-900/70"
      >
        <div className="flex flex-col gap-4">
          <ErrorBox error={error} />
          <Field label="Email">
            <Input type="email" inputMode="email" autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Password">
            <Input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <Button type="submit" size="lg" disabled={busy} className="mt-1">{busy ? 'Logging in…' : 'Log in'}</Button>
        </div>
      </form>
    </main>
  );
}
