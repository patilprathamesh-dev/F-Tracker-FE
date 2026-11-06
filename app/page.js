'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { fmtDate, inr, monthLabel } from '@/lib/format';
import { Badge, Button, Card, CardHead, CardList, cn, EmptyState, ErrorBox, Fab, ListCard, PageHeader, PageSkeleton, Stat, StatGrid, Table, Td, Tr } from '@/components/ui';
import PullToRefresh from '@/components/PullToRefresh';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => api.get('/dashboard').then((d) => { setData(d); setError(''); }).catch((e) => setError(e.message)), []);
  useEffect(() => { load(); }, [load]);

  if (error && !data) return <ErrorBox error={`Could not load dashboard: ${error}`} />;
  if (!data) return <PageSkeleton />;

  const { stats, thisMonth, chart } = data;
  const max = Math.max(1, ...chart.map((c) => Math.max(c.interest + c.principal, c.paid)));
  const settled = thisMonth.items.filter((i) => i.status === 'paid').length;
  const net = stats.netPosition;

  return (
    <>
      <PullToRefresh onRefresh={load} />
      <PageHeader
        title="Dashboard"
        actions={<Button href="/persons?add=1" className="max-md:hidden">+ Add person</Button>}
      />

      <Card tone={net >= 0 ? 'good' : 'bad'} className="mb-4">
        <div className="text-sm text-slate-600 dark:text-slate-300">Net position (given − borrowed)</div>
        <div className={cn('mt-1 text-[28px] font-bold tracking-tight tabular-nums', net >= 0 ? 'text-good dark:text-green-400' : 'text-bad dark:text-red-400')}>
          {net < 0 ? '−' : ''}{inr(Math.abs(net))}
        </div>
        <div className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">
          {net >= 0 ? 'Others owe you more than you owe them.' : 'You owe more than others owe you.'}
        </div>
      </Card>

      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Money I gave</h2>
      <StatGrid>
        <Stat label="Outstanding" value={inr(stats.totalPrincipal)} hint={`${stats.activeLoans} loan(s) · ${stats.persons} people`} />
        <Stat label="Interest to receive / month" value={inr(stats.expectedMonthly)} />
        <Stat label={`Received in ${monthLabel(thisMonth.month)}`} value={inr(stats.receivedThisMonth)} tone="good" />
        <Stat label="Interest overdue" value={inr(stats.interestOutstanding)} tone={stats.interestOutstanding > 0 ? 'bad' : ''} hint={stats.unreadReminders ? `${stats.unreadReminders} unread reminder(s)` : 'All clear'} />
      </StatGrid>

      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Money I borrowed</h2>
      <StatGrid>
        <Stat label="Borrowed (outstanding)" value={inr(stats.totalBorrowed)} hint={`${stats.borrowedLoans} loan(s)`} tone="warn" />
        <Stat label="Interest to pay / month" value={inr(stats.payableMonthly)} />
        <Stat label={`Paid in ${monthLabel(thisMonth.month)}`} value={inr(stats.paidThisMonth)} />
        <Stat label="Interest I owe now" value={inr(stats.interestDue)} tone={stats.interestDue > 0 ? 'bad' : ''} />
      </StatGrid>

      <Card className="mb-4">
        <CardHead title={`${monthLabel(thisMonth.month, true)} payments`}>
          <span className="text-sm text-slate-500 tabular-nums dark:text-slate-400">{settled} of {thisMonth.items.length} paid</span>
        </CardHead>
        {thisMonth.items.length === 0 ? <EmptyState>No payments due this month.</EmptyState> : (
          <>
            <CardList>
              {thisMonth.items.map((i) => (
                <ListCard
                  key={`${i.loanId}`}
                  href={`/loans/${i.loanId}`}
                  accent={i.direction}
                  title={<>{i.person.name} <span className="font-normal text-slate-500 dark:text-slate-400">· {i.title || 'Loan'}</span></>}
                  amount={`${inr(i.paid)} / ${inr(i.expected)}`}
                  badge={<><Badge status={i.direction} /><Badge status={i.status} /></>}
                  meta={`Due ${fmtDate(i.dueDate)}`}
                />
              ))}
            </CardList>
            <Table head={['Person', 'Loan', '', 'Due date', { label: 'Expected', right: true }, { label: 'Paid', right: true }, 'Status']}>
              {thisMonth.items.map((i) => (
                <Tr key={i.loanId}>
                  <Td><Link className="font-medium hover:underline" href={`/persons/${i.person._id}`}>{i.person.name}</Link></Td>
                  <Td><Link className="text-brand hover:underline dark:text-brand-light" href={`/loans/${i.loanId}`}>{i.title || 'Loan'}</Link></Td>
                  <Td><Badge status={i.direction} /></Td>
                  <Td muted>{fmtDate(i.dueDate)}</Td>
                  <Td right>{inr(i.expected)}</Td>
                  <Td right>{inr(i.paid)}</Td>
                  <Td><Badge status={i.status} /></Td>
                </Tr>
              ))}
            </Table>
          </>
        )}
      </Card>

      <Card>
        <CardHead title={<>Money in and out <span className="text-sm font-normal text-slate-500 md:hidden dark:text-slate-400">· 6 months</span><span className="hidden text-sm font-normal text-slate-500 md:inline dark:text-slate-400">· 12 months</span></>}>
          <div className="flex flex-wrap items-center gap-3 text-[13px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-brand dark:bg-brand-light" />Interest in</span>
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-teal-300 dark:bg-teal-700" />Principal in</span>
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-orange-400" />I paid</span>
          </div>
        </CardHead>
        <div className="flex h-44 items-end gap-1.5 md:gap-2">
          {chart.map((c, idx) => (
            <div
              key={c.month}
              className={cn('flex h-full min-w-0 flex-1 flex-col items-center gap-1', idx < chart.length - 6 && 'hidden md:flex')}
              title={`${monthLabel(c.month)}: received ${inr(c.interest + c.principal)}, paid ${inr(c.paid)}`}
            >
              <div className="flex w-full flex-1 items-end justify-center gap-0.5">
                <div className="flex h-full w-1/2 max-w-6 flex-col justify-end">
                  <div className="w-full rounded-t-sm bg-teal-300 dark:bg-teal-700" style={{ height: `${(c.principal / max) * 100}%` }} />
                  <div className={cn('w-full bg-brand dark:bg-brand-light', !c.principal && 'rounded-t-sm')} style={{ height: `${(c.interest / max) * 100}%` }} />
                </div>
                <div className="flex h-full w-1/3 max-w-4 flex-col justify-end">
                  <div className="w-full rounded-t-sm bg-orange-400" style={{ height: `${(c.paid / max) * 100}%` }} />
                </div>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">{monthLabel(c.month).split(' ')[0]}</span>
            </div>
          ))}
        </div>
      </Card>

      <Fab href="/persons?add=1" label="Add person" />
    </>
  );
}
