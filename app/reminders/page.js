'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { fmtDate } from '@/lib/format';
import { Badge, Button, Card, cn, EmptyState, ErrorBox, InfoBox, ListSkeleton, PageHeader, Segmented } from '@/components/ui';
import PushControls from '@/components/PushControls';
import PullToRefresh from '@/components/PullToRefresh';

const ACCENT = { overdue: 'border-l-bad', due: 'border-l-warn', upcoming: 'border-l-brand' };

export default function RemindersPage() {
  const [list, setList] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const load = useCallback(() =>
    api.get(`/reminders${showAll ? '' : '?unread=true'}`)
      .then((l) => {
        setList(l);
        setError('');
        if (!showAll) window.dispatchEvent(new CustomEvent('reminders-changed', { detail: l.length }));
      })
      .catch((e) => setError(e.message)), [showAll]);

  useEffect(() => { load(); }, [load]);

  const runNow = async () => {
    try {
      const r = await api.post('/reminders/run');
      setInfo(r.created ? `${r.created} new reminder(s) created.` : 'Checked: no new reminders.');
      load();
    } catch (e) { setError(e.message); }
  };
  const markRead = async (id) => { await api.patch(`/reminders/${id}/read`, { read: true }); load(); };
  const markAll = async () => { await api.patch('/reminders/read-all'); load(); };

  return (
    <>
      <PullToRefresh onRefresh={load} />
      <PageHeader
        title="Reminders"
        actions={
          <>
            <Button variant="ghost" onClick={runNow}>Check now</Button>
            <Button variant="ghost" onClick={markAll} disabled={!list?.some((r) => !r.read)}>Mark all read</Button>
          </>
        }
      />

      <PushControls />

      <p className="mb-4 text-[15px] text-slate-500 dark:text-slate-400">
        The server checks every day and creates a reminder a few days before each due date, on the due date, and when a payment is overdue.
      </p>

      <Segmented className="mb-4 sm:max-w-xs" value={showAll ? 'all' : 'unread'} onChange={(v) => setShowAll(v === 'all')} options={[{ value: 'unread', label: 'Unread' }, { value: 'all', label: 'All' }]} />
      <ErrorBox error={error} />
      <InfoBox>{info}</InfoBox>

      {!list ? <ListSkeleton /> : list.length === 0 ? <Card><EmptyState>No reminders. Everyone is up to date.</EmptyState></Card> : (
        <div className="space-y-2.5">
          {list.map((r) => {
            const taken = r.direction === 'taken';
            return (
              <div
                key={r._id}
                className={cn(
                  'flex items-start gap-3 rounded-2xl border border-l-4 border-slate-200 p-3.5 dark:border-slate-800',
                  taken ? 'border-l-orange-500 bg-orange-50 dark:bg-orange-950/40' : cn('bg-white dark:bg-slate-900', ACCENT[r.kind]),
                  r.read && 'opacity-60'
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {taken && <span className="text-[13px] font-bold uppercase tracking-wide text-orange-700 dark:text-orange-300">You need to pay</span>}
                    <Badge status={r.kind} />
                    <span className="text-[13px] text-slate-500 tabular-nums dark:text-slate-400">Due {fmtDate(r.dueDate)}</span>
                  </div>
                  <p className="mt-1.5 text-[15px]">{r.message}</p>
                  <div className="mt-1 flex flex-wrap gap-x-3 text-sm">
                    {r.person && <Link className="inline-flex min-h-11 items-center font-medium text-brand dark:text-brand-light" href={`/persons/${r.person._id}`}>{r.person.name}</Link>}
                    {r.loan && <Link className="inline-flex min-h-11 items-center font-medium text-brand dark:text-brand-light" href={`/loans/${r.loan._id}`}>Open loan</Link>}
                  </div>
                </div>
                {!r.read && <Button variant="ghost" onClick={() => markRead(r._id)}>Done</Button>}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
