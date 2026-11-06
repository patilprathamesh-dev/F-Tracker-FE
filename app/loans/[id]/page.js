'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { fmtDate, inr, monthLabel } from '@/lib/format';
import { Badge, Empty, ErrorBox, Modal, Stat } from '@/components/ui';
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
  if (!data) return <p className="muted">Loading…</p>;
  const { loan, payments, months, totals } = data;

  const toggleClose = async () => {
    const closing = loan.status === 'active';
    if (closing && !confirm('Mark this loan as closed (fully repaid)? Reminders will stop.')) return;
    await api.put(`/loans/${id}`, { status: closing ? 'closed' : 'active' });
    load();
  };
  const remove = async () => {
    if (!confirm('Delete this loan and all its payments?')) return;
    await api.del(`/loans/${id}`);
    router.push(`/persons/${loan.person._id}`);
  };
  const delPayment = async (pid) => {
    if (!confirm('Delete this payment?')) return;
    await api.del(`/payments/${pid}`);
    load();
  };
  const whatsapp = () => {
    const due = months.find((m) => m.status !== 'paid');
    if (!loan.person.phone || !due) return null;
    const text = `Hello ${loan.person.name}, this is a reminder for the ${monthLabel(due.month, true)} payment of ${inr(due.balance)} (interest on ${inr(loan.principal)}). Due on ${fmtDate(due.dueDate)}. Thank you!`;
    const phone = loan.person.phone.replace(/\D/g, '');
    return `https://wa.me/${phone.length === 10 ? '91' + phone : phone}?text=${encodeURIComponent(text)}`;
  };
  const waLink = whatsapp();

  return (
    <>
      <Link href={`/persons/${loan.person._id}`} className="back">← {loan.person.name}</Link>
      <div className="page-head">
        <div>
          <h1>{loan.title || 'Loan'} <Badge status={loan.status} /></h1>
          <p className="muted">
            {inr(loan.principal)} at {loan.interestRate}% per month · given {fmtDate(loan.startDate)} · due on day {loan.dueDay}
          </p>
        </div>
        <div className="btn-row">
          {loan.status === 'active' && <button className="btn" onClick={() => setModal({ type: 'pay' })}>+ Add payment</button>}
          {waLink && loan.status === 'active' && <a className="btn ghost" href={waLink} target="_blank" rel="noreferrer">WhatsApp reminder</a>}
          <button className="btn ghost" onClick={() => setModal({ type: 'edit' })}>Edit</button>
          <button className="btn ghost" onClick={toggleClose}>{loan.status === 'active' ? 'Close loan' : 'Reopen'}</button>
          <button className="btn danger ghost" onClick={remove}>Delete</button>
        </div>
      </div>

      {loan.description && <div className="card note"><p>{loan.description}</p></div>}

      <div className="stats">
        <Stat label="Monthly interest" value={inr(totals.monthlyInterest)} />
        <Stat label="Interest received" value={inr(totals.interestReceived)} tone="good" />
        <Stat label="Interest overdue" value={inr(totals.interestOutstanding)} tone={totals.interestOutstanding > 0 ? 'bad' : ''} hint={totals.overdueMonths ? `${totals.overdueMonths} month(s)` : null} />
        <Stat label="Principal outstanding" value={inr(totals.principalOutstanding)} hint={totals.principalReceived ? `${inr(totals.principalReceived)} repaid` : null} />
      </div>

      <div className="two-col">
        <section className="card">
          <div className="card-head"><h2>Month by month</h2></div>
          {months.length === 0 ? <Empty>First interest is due next month.</Empty> : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Month</th><th>Due</th><th className="num">Paid</th><th>Status</th><th /></tr></thead>
                <tbody>
                  {months.map((m) => (
                    <tr key={m.month}>
                      <td>{monthLabel(m.month)}</td>
                      <td>{fmtDate(m.dueDate)}</td>
                      <td className="num">{inr(m.paid)} / {inr(m.expected)}</td>
                      <td><Badge status={m.status} /></td>
                      <td className="num">
                        {m.status !== 'paid' && loan.status === 'active' && (
                          <button className="link-btn" onClick={() => setModal({ type: 'pay', month: m.month, amount: m.balance })}>Mark paid</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card">
          <div className="card-head"><h2>Payments received</h2></div>
          {payments.length === 0 ? <Empty>No payments yet.</Empty> : (
            <ul className="list">
              {payments.map((p) => (
                <li key={p._id}>
                  <div className="grow">
                    <strong>{inr(p.amount)}</strong>{' '}
                    <span className="muted small">{p.type === 'interest' ? `interest for ${monthLabel(p.forMonth)}` : 'principal'} · {p.method}</span>
                    <div className="muted small">{fmtDate(p.paidOn)}{p.note ? ` · ${p.note}` : ''}</div>
                  </div>
                  <button className="icon-btn" title="Delete" onClick={() => delPayment(p._id)}>×</button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {modal?.type === 'pay' && (
        <Modal title={`Payment from ${loan.person.name}`} onClose={() => setModal(null)}>
          <PaymentForm loan={loan} defaultMonth={modal.month} defaultAmount={modal.amount} onCancel={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />
        </Modal>
      )}
      {modal?.type === 'edit' && (
        <Modal title="Edit loan" onClose={() => setModal(null)}>
          <LoanForm initial={loan} onCancel={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />
        </Modal>
      )}
    </>
  );
}
