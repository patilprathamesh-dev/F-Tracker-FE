'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { inr, monthLabel } from '@/lib/format';
import { BottomSheet, Button, cn, EmptyState, ErrorBox, Fab, Input, ListSkeleton, PageHeader } from '@/components/ui';
import { PersonForm } from '@/components/Forms';
import PullToRefresh from '@/components/PullToRefresh';
import Link from 'next/link';

const PILL = {
  paid: 'bg-green-50 text-good dark:bg-green-950 dark:text-green-400',
  overdue: 'bg-red-50 text-bad dark:bg-red-950 dark:text-red-400',
  partial: 'bg-amber-50 text-warn dark:bg-amber-950 dark:text-amber-400',
  pending: 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
};
const shortDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

/**
 * This month's status for one side of a person: "Nov: Paid", "Nov: ₹1,500 due 7 Nov",
 * "Nov: ₹500 left" (partly paid) or "Nov: ₹1,500 overdue". For borrowed money it starts with "You pay".
 */
function MonthStatus({ m, taken }) {
  if (!m) return null;
  const month = monthLabel(m.month).split(' ')[0];
  let text;
  if (m.status === 'paid') text = 'Paid';
  else if (m.status === 'overdue') text = `${inr(m.balance)} overdue`;
  else if (m.status === 'partial') text = `${inr(m.balance)} left`;
  else text = `${inr(m.balance)} due ${shortDate(m.dueDate)}`;
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[13px] font-semibold tabular-nums', PILL[m.status])}>
      {m.status === 'paid' && (
        <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5 10 17 19 7" /></svg>
      )}
      {taken ? 'You pay ' : ''}{month}: {text}
    </span>
  );
}

export default function PersonsPage() {
  const [list, setList] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);

  const load = useCallback(() =>
    api.get(`/persons${search ? `?search=${encodeURIComponent(search)}` : ''}`)
      .then((l) => { setList(l); setError(''); })
      .catch((e) => setError(e.message)), [search]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  // /persons?add=1 opens the "Add person" sheet (used by the dashboard's + button)
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('add') === '1') {
      setAdding(true);
      window.history.replaceState(null, '', '/persons');
    }
  }, []);

  return (
    <>
      <PullToRefresh onRefresh={load} />
      <PageHeader title="People" actions={<Button className="max-md:hidden" onClick={() => setAdding(true)}>+ Add person</Button>} />
      <Input
        type="search"
        inputMode="search"
        autoComplete="off"
        placeholder="Search by name or phone…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4"
        aria-label="Search people"
      />
      <ErrorBox error={error} />

      {!list ? <ListSkeleton /> : list.length === 0 ? (
        <EmptyState>{search ? 'Nobody matches that search.' : 'No people yet. Add the first person you have given money to.'}</EmptyState>
      ) : (
        <div className="grid gap-2.5 md:grid-cols-2">
          {list.map((p) => (
            <Link
              key={p._id}
              href={`/persons/${p._id}`}
              className="rounded-2xl border border-slate-200 bg-white p-3.5 transition active:scale-[0.99] active:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:active:bg-slate-800"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-teal-50 text-lg font-bold text-brand dark:bg-teal-950 dark:text-brand-light">
                  {p.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{p.name}</div>
                  <div className="truncate text-[13px] text-slate-500 dark:text-slate-400">{p.phone || 'No phone'}</div>
                </div>
                <div className="shrink-0 text-right">
                  {(p.totalGiven > 0 || p.totalTaken === 0) && (
                    <>
                      <div className="font-semibold tabular-nums">{inr(p.totalGiven)}</div>
                      <div className="text-[13px] text-slate-500 tabular-nums dark:text-slate-400">{inr(p.monthlyInterestToReceive)}/mo · {p.givenLoans} loan(s)</div>
                    </>
                  )}
                  {p.totalTaken > 0 && (
                    <div className="text-[13px] font-medium text-orange-700 tabular-nums dark:text-orange-300">Borrowed {inr(p.totalTaken)}</div>
                  )}
                </div>
              </div>
              {(p.thisMonthGiven || p.thisMonthTaken) && (
                <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-slate-100 pt-2.5 pl-14 dark:border-slate-800">
                  <MonthStatus m={p.thisMonthGiven} />
                  <MonthStatus m={p.thisMonthTaken} taken />
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      <Fab onClick={() => setAdding(true)} label="Add person" />
      {adding && (
        <BottomSheet title="Add person" onClose={() => setAdding(false)}>
          <PersonForm onCancel={() => setAdding(false)} onSaved={() => { setAdding(false); load(); }} />
        </BottomSheet>
      )}
    </>
  );
}
