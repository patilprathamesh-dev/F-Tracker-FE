'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { fmtDate, inr, monthLabel } from '@/lib/format';
import { Badge, Empty, ErrorBox, Stat } from '@/components/ui';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard').then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <ErrorBox error={`Could not load dashboard: ${error}. Is the backend running?`} />;
  if (!data) return <p className="muted">Loading…</p>;

  const { stats, thisMonth, chart } = data;
  const max = Math.max(1, ...chart.map((c) => c.interest + c.principal));
  const pending = thisMonth.items.filter((i) => i.status !== 'paid');

  return (
    <>
      <div className="page-head">
        <h1>Dashboard</h1>
        <Link href="/persons" className="btn">+ Add person</Link>
      </div>

      <div className="stats">
        <Stat label="Money given (outstanding)" value={inr(stats.totalPrincipal)} hint={`${stats.activeLoans} active loan(s) · ${stats.persons} people`} />
        <Stat label="Expected interest / month" value={inr(stats.expectedMonthly)} />
        <Stat label={`Received in ${monthLabel(thisMonth.month)}`} value={inr(stats.receivedThisMonth)} tone="good" />
        <Stat label="Interest overdue" value={inr(stats.interestOutstanding)} tone={stats.interestOutstanding > 0 ? 'bad' : ''} hint={stats.unreadReminders ? `${stats.unreadReminders} unread reminder(s)` : 'All clear'} />
      </div>

      <section className="card">
        <div className="card-head">
          <h2>{monthLabel(thisMonth.month, true)} payments</h2>
          <span className="muted">{thisMonth.items.length - pending.length} of {thisMonth.items.length} paid</span>
        </div>
        {thisMonth.items.length === 0 ? (
          <Empty>No payments due this month.</Empty>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Person</th><th>Loan</th><th>Due date</th><th className="num">Expected</th><th className="num">Paid</th><th>Status</th></tr></thead>
              <tbody>
                {thisMonth.items.map((i) => (
                  <tr key={i.loanId}>
                    <td><Link href={`/persons/${i.person._id}`}>{i.person.name}</Link></td>
                    <td><Link href={`/loans/${i.loanId}`}>{i.title || 'Loan'}</Link></td>
                    <td>{fmtDate(i.dueDate)}</td>
                    <td className="num">{inr(i.expected)}</td>
                    <td className="num">{inr(i.paid)}</td>
                    <td><Badge status={i.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card">
        <div className="card-head">
          <h2>Money received – last 12 months</h2>
          <div className="legend"><span className="sw sw-int" /> Interest <span className="sw sw-pri" /> Principal</div>
        </div>
        <div className="bars">
          {chart.map((c) => (
            <div key={c.month} className="bar-col" title={`${monthLabel(c.month)}: interest ${inr(c.interest)}, principal ${inr(c.principal)}`}>
              <div className="bar-stack">
                <div className="bar bar-pri" style={{ height: `${(c.principal / max) * 100}%` }} />
                <div className="bar bar-int" style={{ height: `${(c.interest / max) * 100}%` }} />
              </div>
              <span>{monthLabel(c.month).split(' ')[0]}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
