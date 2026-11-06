'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { downloadCSV, fmtDate, inr, monthLabel, toInputDate } from '@/lib/format';
import { Empty, ErrorBox, Stat } from '@/components/ui';

export default function PaymentsPage() {
  const now = new Date();
  const [from, setFrom] = useState(toInputDate(new Date(now.getFullYear(), now.getMonth() - 2, 1)));
  const [to, setTo] = useState(toInputDate(now));
  const [list, setList] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setList(null);
    api.get(`/payments?from=${from}&to=${to}`).then(setList).catch((e) => setError(e.message));
  }, [from, to]);

  const interest = list?.filter((p) => p.type === 'interest').reduce((s, p) => s + p.amount, 0) || 0;
  const principal = list?.filter((p) => p.type === 'principal').reduce((s, p) => s + p.amount, 0) || 0;

  const exportCSV = () =>
    downloadCSV(`payments_${from}_to_${to}.csv`, [
      ['Date', 'Person', 'Loan', 'Type', 'For month', 'Amount', 'Method', 'Note'],
      ...list.map((p) => [toInputDate(p.paidOn), p.person?.name, p.loan?.title || 'Loan', p.type, p.forMonth || '', p.amount, p.method, p.note || '']),
    ]);

  return (
    <>
      <div className="page-head">
        <h1>Payments</h1>
        <button className="btn ghost" onClick={exportCSV} disabled={!list?.length}>Export CSV</button>
      </div>
      <div className="filters">
        <label>From <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
        <label>To <input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
      </div>
      <ErrorBox error={error} />

      <div className="stats">
        <Stat label="Interest received" value={inr(interest)} tone="good" />
        <Stat label="Principal received" value={inr(principal)} />
        <Stat label="Total" value={inr(interest + principal)} />
      </div>

      <section className="card">
        {!list ? <p className="muted">Loading…</p> : list.length === 0 ? <Empty>No payments in this period.</Empty> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Date</th><th>Person</th><th>Loan</th><th>Type</th><th className="num">Amount</th><th>Method</th><th>Note</th></tr></thead>
              <tbody>
                {list.map((p) => (
                  <tr key={p._id}>
                    <td>{fmtDate(p.paidOn)}</td>
                    <td>{p.person ? <Link href={`/persons/${p.person._id}`}>{p.person.name}</Link> : '—'}</td>
                    <td>{p.loan ? <Link href={`/loans/${p.loan._id}`}>{p.loan.title || 'Loan'}</Link> : '—'}</td>
                    <td>{p.type === 'interest' ? `Interest (${monthLabel(p.forMonth)})` : 'Principal'}</td>
                    <td className="num">{inr(p.amount)}</td>
                    <td>{p.method}</td>
                    <td className="muted">{p.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
