'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { downloadCSV, fmtDate, inr, monthLabel, toInputDate } from '@/lib/format';
import { Badge, Button, Card, CardList, EmptyState, ErrorBox, Field, Input, ListCard, ListSkeleton, PageHeader, Segmented, Stat, StatGrid, Table, Td, Tr } from '@/components/ui';
import PullToRefresh from '@/components/PullToRefresh';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'given', label: 'Received' },
  { value: 'taken', label: 'Paid by me' },
];

export default function PaymentsPage() {
  const now = new Date();
  const [from, setFrom] = useState(toInputDate(new Date(now.getFullYear(), now.getMonth() - 2, 1)));
  const [to, setTo] = useState(toInputDate(now));
  const [direction, setDirection] = useState('all');
  const [list, setList] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    const dir = direction === 'all' ? '' : `&direction=${direction}`;
    return api.get(`/payments?from=${from}&to=${to}${dir}`).then((l) => { setList(l); setError(''); }).catch((e) => setError(e.message));
  }, [from, to, direction]);

  useEffect(() => { setList(null); load(); }, [load]);

  const sum = (fn) => list?.filter(fn).reduce((s, p) => s + p.amount, 0) || 0;
  const received = sum((p) => p.direction !== 'taken');
  const receivedInterest = sum((p) => p.direction !== 'taken' && p.type === 'interest');
  const paid = sum((p) => p.direction === 'taken');
  const paidInterest = sum((p) => p.direction === 'taken' && p.type === 'interest');

  const exportCSV = () =>
    downloadCSV(`payments_${from}_to_${to}${direction === 'all' ? '' : `_${direction}`}.csv`, [
      ['Date', 'Direction', 'Person', 'Loan', 'Type', 'For month', 'Amount', 'Method', 'Note'],
      ...list.map((p) => [
        toInputDate(p.paidOn), p.direction === 'taken' ? 'Paid by me' : 'Received', p.person?.name, p.loan?.title || 'Loan',
        p.type, p.forMonth || '', p.amount, p.method, p.note || '',
      ]),
    ]);

  const describe = (p) => (p.type === 'interest' ? `Interest (${monthLabel(p.forMonth)})` : 'Principal');

  return (
    <>
      <PullToRefresh onRefresh={load} />
      <PageHeader title="Payments" actions={<Button variant="ghost" onClick={exportCSV} disabled={!list?.length}>Export CSV</Button>} />

      <Segmented className="mb-3" value={direction} onChange={setDirection} options={FILTERS} />
      <div className="mb-4 grid grid-cols-2 gap-3 sm:max-w-md">
        <Field label="From"><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
        <Field label="To"><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
      </div>
      <ErrorBox error={error} />

      <StatGrid>
        {direction !== 'taken' && <Stat label="Received" value={inr(received)} hint={`${inr(receivedInterest)} interest`} tone="good" />}
        {direction !== 'given' && <Stat label="Paid by me" value={inr(paid)} hint={`${inr(paidInterest)} interest`} tone="warn" />}
        {direction === 'all' && <Stat label="Net" value={`${received - paid < 0 ? '−' : ''}${inr(Math.abs(received - paid))}`} tone={received - paid >= 0 ? 'good' : 'bad'} />}
        <Stat label="Payments" value={list?.length ?? '—'} />
      </StatGrid>

      {!list ? <ListSkeleton /> : list.length === 0 ? <Card><EmptyState>No payments in this period.</EmptyState></Card> : (
        <>
          <CardList>
            {list.map((p) => (
              <ListCard
                key={p._id}
                href={p.loan ? `/loans/${p.loan._id}` : undefined}
                accent={p.direction}
                title={p.person?.name || '—'}
                amount={<span className={p.direction === 'taken' ? 'text-orange-700 dark:text-orange-300' : 'text-good dark:text-green-400'}>{p.direction === 'taken' ? '−' : '+'}{inr(p.amount)}</span>}
                badge={<><Badge status={p.direction} /><span>{describe(p)}</span></>}
                meta={fmtDate(p.paidOn)}
                sub={[p.loan?.title || 'Loan', p.method, p.note].filter(Boolean).join(' · ')}
              />
            ))}
          </CardList>
          <Card className="hidden md:block">
            <Table head={['Date', '', 'Person', 'Loan', 'Type', { label: 'Amount', right: true }, 'Method', 'Note']}>
              {list.map((p) => (
                <Tr key={p._id}>
                  <Td muted>{fmtDate(p.paidOn)}</Td>
                  <Td><Badge status={p.direction} /></Td>
                  <Td>{p.person ? <Link className="font-medium hover:underline" href={`/persons/${p.person._id}`}>{p.person.name}</Link> : '—'}</Td>
                  <Td>{p.loan ? <Link className="text-brand hover:underline dark:text-brand-light" href={`/loans/${p.loan._id}`}>{p.loan.title || 'Loan'}</Link> : '—'}</Td>
                  <Td>{describe(p)}</Td>
                  <Td right className={p.direction === 'taken' ? 'text-orange-700 dark:text-orange-300' : ''}>{p.direction === 'taken' ? '−' : ''}{inr(p.amount)}</Td>
                  <Td>{p.method}</Td>
                  <Td muted className="max-w-48 truncate">{p.note}</Td>
                </Tr>
              ))}
            </Table>
          </Card>
        </>
      )}
    </>
  );
}
