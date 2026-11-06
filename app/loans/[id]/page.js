'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { fmtDate, inr, monthLabel } from '@/lib/format';
import { Badge, BottomSheet, Button, Card, CardHead, CardList, EmptyState, ErrorBox, Fab, LinkButton, ListCard, PageHeader, PageSkeleton, Stat, StatGrid, Table, Td, Tr } from '@/components/ui';
import { LoanForm, PaymentForm } from '@/components/Forms';

export default function LoanDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // {type:'pay', month, amount} | {type:'edit'}

  const load = useCallback(() => {
    api.get(`/loans/${id}`).then(setData).catch((e) => setError(e.message));
  }, [id]);
  useEffect(load, [load]);

  if (error) return <ErrorBox error={error} />;
  if (!data) return <PageSkeleton rows={5} />;
  const { loan, payments, months, totals } = data;
  const taken = loan.direction === 'taken';
  const isActive = loan.status === 'active';

  const toggleClose = async () => {
    if (isActive && !confirm(`Mark this loan as closed (fully ${taken ? 'paid back' : 'repaid'})? Reminders will stop.`)) return;
    await api.put(`/loans/${id}`, { status: isActive ? 'closed' : 'active' });
    load();
  };
  const remove = async () => {
    if (!confirm('Delete this loan and all its payments?')) return;
    await api.del(`/loans/${id}`);
    router.push(taken ? '/borrowed' : `/persons/${loan.person._id}`);
  };
  const delPayment = async (pid) => {
    if (!confirm('Delete this payment?')) return;
    await api.del(`/payments/${pid}`);
    load();
  };
  // WhatsApp reminder only makes sense when THEY owe me
  const whatsapp = () => {
    const due = months.find((m) => m.status !== 'paid');
    if (taken || !loan.person.phone || !due) return null;
    const text = `Hello ${loan.person.name}, this is a reminder for the ${monthLabel(due.month, true)} payment of ${inr(due.balance)} (interest on ${inr(due.principal)}). Due on ${fmtDate(due.dueDate)}. Thank you!`;
    const phone = loan.person.phone.replace(/\D/g, '');
    return `https://wa.me/${phone.length === 10 ? '91' + phone : phone}?text=${encodeURIComponent(text)}`;
  };
  const waLink = whatsapp();
  // Unpaid months can still be marked paid on a loan that closed because it was repaid
  const payBtn = (m) => m.status !== 'paid' && (isActive || loan.closedReason === 'repaid') && (
    <LinkButton onClick={() => setModal({ type: 'pay', month: m.month, amount: m.balance })}>Mark paid</LinkButton>
  );

  return (
    <>
      <PageHeader
        back={{ href: `/persons/${loan.person._id}`, label: loan.person.name }}
        title={<>{loan.title || 'Loan'} {taken && <Badge status="taken" />} <Badge status={loan.status} /></>}
        subtitle={
          <span className="tabular-nums">
            {inr(loan.principal)} at {loan.interestRate}% per month · {taken ? 'taken' : 'given'} {fmtDate(loan.startDate)} · due on day {loan.dueDay}
            {totals.principalReceived > 0 && isActive && <> · <strong className="text-slate-700 dark:text-slate-200">{inr(totals.principalOutstanding)} still owed</strong></>}
          </span>
        }
        actions={
          <>
            {isActive && <Button className="max-md:hidden" onClick={() => setModal({ type: 'pay' })}>{taken ? '+ Add payment I made' : '+ Add payment'}</Button>}
            {waLink && isActive && <Button variant="ghost" href={waLink} target="_blank" rel="noreferrer">WhatsApp reminder</Button>}
            <Button variant="ghost" onClick={() => setModal({ type: 'edit' })}>Edit</Button>
            <Button variant="ghost" onClick={toggleClose}>{isActive ? 'Close loan' : 'Reopen'}</Button>
            <Button variant="danger" onClick={remove}>Delete</Button>
          </>
        }
      />

      {loan.status === 'closed' && loan.closedReason === 'repaid' && (
        <Card tone="good" className="mb-4 text-[15px]">
          <strong>Fully repaid{loan.closedDate ? ` on ${fmtDate(loan.closedDate)}` : ''}.</strong> The whole {inr(loan.principal)} was {taken ? 'paid back' : 'returned'}, so no new interest is added.
          {totals.interestOutstanding > 0 && (
            <> Interest from before the repayment is still {taken ? 'to pay' : 'due'}: <strong className="tabular-nums">{inr(totals.interestOutstanding)}</strong>. Use “Mark paid” below when it is settled.</>
          )}
        </Card>
      )}
      {loan.description && <Card tone="info" className="mb-4">{loan.description}</Card>}

      <StatGrid>
        <Stat
          label={taken ? 'Interest I pay / month' : 'Monthly interest'}
          value={inr(totals.monthlyInterest)}
          hint={totals.monthlyInterest !== totals.originalMonthlyInterest && isActive ? `On ${inr(totals.principalOutstanding)} owed (was ${inr(totals.originalMonthlyInterest)})` : null}
        />
        <Stat label={taken ? 'Interest paid' : 'Interest received'} value={inr(totals.interestReceived)} tone="good" />
        <Stat label={taken ? 'Interest I owe' : 'Interest overdue'} value={inr(totals.interestOutstanding)} tone={totals.interestOutstanding > 0 ? 'bad' : ''} hint={totals.overdueMonths ? `${totals.overdueMonths} month(s)` : null} />
        <Stat label={taken ? 'Principal I still owe' : 'Principal outstanding'} value={inr(totals.principalOutstanding)} hint={totals.principalReceived ? `${inr(totals.principalReceived)} ${taken ? 'paid back' : 'repaid'}` : null} />
      </StatGrid>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardHead title="Month by month" />
          {months.length === 0 ? <EmptyState>First interest is due next month.</EmptyState> : (
            <>
              <CardList>
                {months.map((m) => (
                  <ListCard
                    key={m.month}
                    title={monthLabel(m.month)}
                    amount={`${inr(m.paid)} / ${inr(m.expected)}`}
                    badge={<Badge status={m.status} />}
                    meta={`Due ${fmtDate(m.dueDate)}`}
                    sub={m.principal !== loan.principal ? `${loan.interestRate}% of ${inr(m.principal)} still owed` : undefined}
                    right={payBtn(m) || undefined}
                  />
                ))}
              </CardList>
              <Table head={['Month', 'Due', { label: 'Interest on', right: true }, { label: 'Paid', right: true }, 'Status', '']}>
                {months.map((m) => (
                  <Tr key={m.month}>
                    <Td>{monthLabel(m.month)}</Td>
                    <Td muted>{fmtDate(m.dueDate)}</Td>
                    <Td right muted>{inr(m.principal)}</Td>
                    <Td right>{inr(m.paid)} / {inr(m.expected)}</Td>
                    <Td><Badge status={m.status} /></Td>
                    <Td right>{payBtn(m)}</Td>
                  </Tr>
                ))}
              </Table>
            </>
          )}
        </Card>

        <Card>
          <CardHead title={taken ? 'Payments I made' : 'Payments received'} />
          {payments.length === 0 ? <EmptyState>No payments yet.</EmptyState> : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {payments.map((p) => (
                <li key={p._id} className="flex items-center gap-2 py-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <strong className="tabular-nums">{inr(p.amount)}</strong>
                      <span className="text-[13px] text-slate-500 dark:text-slate-400">{p.type === 'interest' ? `interest for ${monthLabel(p.forMonth)}` : 'principal'} · {p.method}</span>
                    </div>
                    <div className="text-[13px] text-slate-500 dark:text-slate-400">{fmtDate(p.paidOn)}{p.note ? ` · ${p.note}` : ''}</div>
                  </div>
                  <button type="button" aria-label="Delete payment" onClick={() => delPayment(p._id)} className="flex size-11 shrink-0 items-center justify-center rounded-full text-xl text-slate-400 active:bg-slate-100 active:text-bad dark:active:bg-slate-800">×</button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {isActive && <Fab onClick={() => setModal({ type: 'pay' })} label={taken ? 'Add payment I made' : 'Add payment'} />}

      {modal?.type === 'pay' && (
        <BottomSheet title={taken ? `Payment to ${loan.person.name}` : `Payment from ${loan.person.name}`} onClose={() => setModal(null)}>
          <PaymentForm loan={{ ...loan, principalOutstanding: totals.principalOutstanding }} defaultMonth={modal.month} defaultAmount={modal.amount} onCancel={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />
        </BottomSheet>
      )}
      {modal?.type === 'edit' && (
        <BottomSheet title="Edit loan" onClose={() => setModal(null)}>
          <LoanForm initial={loan} onCancel={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />
        </BottomSheet>
      )}
    </>
  );
}
