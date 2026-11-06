'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { fmtDate, inr } from '@/lib/format';
import { Badge, BottomSheet, Button, Card, CardList, EmptyState, ErrorBox, Fab, ListCard, ListSkeleton, PageHeader, Stat, StatGrid, Table, Td, Tr } from '@/components/ui';
import { BorrowFlow } from '@/components/Forms';
import PullToRefresh from '@/components/PullToRefresh';

/** Everyone I borrowed money from: amount taken, interest %, interest I pay per month, what I repaid, status */
export default function BorrowedPage() {
  const router = useRouter();
  const [loans, setLoans] = useState(null);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);

  const load = useCallback(() =>
    api.get('/loans?direction=taken').then((l) => { setLoans(l); setError(''); }).catch((e) => setError(e.message)), []);
  useEffect(() => { load(); }, [load]);

  const active = loans?.filter((l) => l.status === 'active') || [];
  const owed = active.reduce((s, l) => s + l.principalOutstanding, 0);
  const monthly = active.reduce((s, l) => s + l.monthlyInterest, 0);
  const repaid = (loans || []).reduce((s, l) => s + l.principalPaid + l.interestPaid, 0);
  const people = new Set(active.map((l) => l.person?._id)).size;

  return (
    <>
      <PullToRefresh onRefresh={load} />
      <PageHeader
        title="Borrowed"
        subtitle="Money I have taken from people"
        actions={<Button className="max-md:hidden" onClick={() => setAdding(true)}>+ Borrow money</Button>}
      />
      <ErrorBox error={error} />

      {loans && (
        <StatGrid>
          <Stat label="I still owe" value={inr(owed)} hint={`${active.length} loan(s) · ${people} people`} tone="warn" />
          <Stat label="Interest I pay / month" value={inr(monthly)} />
          <Stat label="Total I repaid" value={inr(repaid)} hint="Interest + principal" tone="good" />
        </StatGrid>
      )}

      {!loans ? <ListSkeleton /> : loans.length === 0 ? (
        <Card><EmptyState>You have not borrowed any money. Tap “+” to add money you took from someone.</EmptyState></Card>
      ) : (
        <>
          <CardList>
            {loans.map((l) => (
              <ListCard
                key={l._id}
                href={`/loans/${l._id}`}
                accent="taken"
                title={<>{l.person?.name || 'Unknown'} <span className="font-normal text-slate-500 dark:text-slate-400">· {l.title || 'Loan'}</span></>}
                amount={inr(l.principal)}
                badge={<Badge status={l.status} />}
                meta={`${l.interestRate}% · ${inr(l.monthlyInterest)}/mo`}
                sub={`Taken ${fmtDate(l.startDate)} · repaid ${inr(l.principalPaid)} + ${inr(l.interestPaid)} interest`}
              />
            ))}
          </CardList>
          <Card className="hidden md:block">
            <Table head={['Person', 'Loan', 'Date taken', { label: 'Amount taken', right: true }, { label: 'Interest', right: true }, { label: 'I pay / month', right: true }, { label: 'I repaid', right: true }, 'Status']}>
              {loans.map((l) => (
                <Tr key={l._id} onClick={() => router.push(`/loans/${l._id}`)}>
                  <Td>{l.person ? <Link className="font-medium hover:underline" href={`/persons/${l.person._id}`} onClick={(e) => e.stopPropagation()}>{l.person.name}</Link> : '—'}</Td>
                  <Td className="text-brand dark:text-brand-light">{l.title || 'Loan'}</Td>
                  <Td muted>{fmtDate(l.startDate)}</Td>
                  <Td right>{inr(l.principal)}</Td>
                  <Td right>{l.interestRate}%</Td>
                  <Td right>{inr(l.monthlyInterest)}</Td>
                  <Td right>{inr(l.principalPaid + l.interestPaid)}</Td>
                  <Td><Badge status={l.status} /></Td>
                </Tr>
              ))}
            </Table>
          </Card>
        </>
      )}

      <Fab onClick={() => setAdding(true)} label="Borrow money" />
      {adding && (
        <BottomSheet title="Borrow money" onClose={() => setAdding(false)}>
          <BorrowFlow onCancel={() => setAdding(false)} onSaved={() => { setAdding(false); load(); }} />
        </BottomSheet>
      )}
    </>
  );
}
