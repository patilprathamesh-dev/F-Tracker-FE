'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { fmtDate, inr } from '@/lib/format';
import { Badge, Empty, ErrorBox, Modal } from '@/components/ui';
import { LoanForm, PersonForm } from '@/components/Forms';

export default function PersonDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [person, setPerson] = useState(null);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // 'edit' | 'loan'

  const load = useCallback(() => {
    api.get(`/persons/${id}`).then(setPerson).catch((e) => setError(e.message));
  }, [id]);
  useEffect(load, [load]);

  const remove = async () => {
    if (!confirm(`Delete ${person.name} and ALL their loans and payments? This cannot be undone.`)) return;
    await api.del(`/persons/${id}`);
    router.push('/persons');
  };

  if (error) return <ErrorBox error={error} />;
  if (!person) return <p className="muted">Loading…</p>;

  const active = person.loans.filter((l) => l.status === 'active');
  const total = active.reduce((s, l) => s + l.principal, 0);
  const monthly = active.reduce((s, l) => s + l.monthlyInterest, 0);

  return (
    <>
      <Link href="/persons" className="back">← People</Link>
      <div className="page-head">
        <div>
          <h1>{person.name}</h1>
          <p className="muted">{[person.phone, person.email].filter(Boolean).join(' · ') || 'No contact details'}</p>
        </div>
        <div className="btn-row">
          {person.phone && <a className="btn ghost" href={`tel:${person.phone}`}>Call</a>}
          <button className="btn ghost" onClick={() => setModal('edit')}>Edit</button>
          <button className="btn danger ghost" onClick={remove}>Delete</button>
        </div>
      </div>

      {(person.notes || person.address) && (
        <div className="card note">
          {person.address && <p><strong>Address:</strong> {person.address}</p>}
          {person.notes && <p>{person.notes}</p>}
        </div>
      )}

      <div className="stats">
        <div className="stat"><div className="stat-label">Total given (active)</div><div className="stat-value">{inr(total)}</div></div>
        <div className="stat"><div className="stat-label">Interest per month</div><div className="stat-value">{inr(monthly)}</div></div>
      </div>

      <section className="card">
        <div className="card-head">
          <h2>Loans</h2>
          <button className="btn" onClick={() => setModal('loan')}>+ Give money</button>
        </div>
        {person.loans.length === 0 ? <Empty>No loans yet.</Empty> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Title</th><th>Date given</th><th className="num">Amount</th><th className="num">Interest</th><th className="num">Per month</th><th>Due day</th><th>Status</th></tr></thead>
              <tbody>
                {person.loans.map((l) => (
                  <tr key={l._id} className="clickable" onClick={() => router.push(`/loans/${l._id}`)}>
                    <td><Link href={`/loans/${l._id}`}>{l.title || 'Loan'}</Link></td>
                    <td>{fmtDate(l.startDate)}</td>
                    <td className="num">{inr(l.principal)}</td>
                    <td className="num">{l.interestRate}%</td>
                    <td className="num">{inr(l.monthlyInterest)}</td>
                    <td>{l.dueDay}</td>
                    <td><Badge status={l.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modal === 'edit' && (
        <Modal title="Edit person" onClose={() => setModal(null)}>
          <PersonForm initial={person} onCancel={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />
        </Modal>
      )}
      {modal === 'loan' && (
        <Modal title={`Give money to ${person.name}`} onClose={() => setModal(null)}>
          <LoanForm personId={id} onCancel={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />
        </Modal>
      )}
    </>
  );
}
