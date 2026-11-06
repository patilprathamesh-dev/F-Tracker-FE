'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { inr } from '@/lib/format';
import { Empty, ErrorBox, Modal } from '@/components/ui';
import { PersonForm } from '@/components/Forms';

export default function PersonsPage() {
  const [list, setList] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);

  const load = useCallback(() => {
    api.get(`/persons${search ? `?search=${encodeURIComponent(search)}` : ''}`).then(setList).catch((e) => setError(e.message));
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <>
      <div className="page-head">
        <h1>People</h1>
        <button className="btn" onClick={() => setAdding(true)}>+ Add person</button>
      </div>
      <input className="search" placeholder="Search by name or phone…" value={search} onChange={(e) => setSearch(e.target.value)} />
      <ErrorBox error={error} />

      {!list ? <p className="muted">Loading…</p> : list.length === 0 ? (
        <Empty>No people yet. Add the first person you have given money to.</Empty>
      ) : (
        <div className="grid">
          {list.map((p) => (
            <Link key={p._id} href={`/persons/${p._id}`} className="card person-card">
              <div className="avatar">{p.name.slice(0, 1).toUpperCase()}</div>
              <div className="grow">
                <h3>{p.name}</h3>
                <p className="muted">{p.phone || 'No phone'}</p>
              </div>
              <div className="right">
                <div className="big">{inr(p.totalPrincipal)}</div>
                <div className="muted small">{inr(p.monthlyInterest)}/month · {p.activeLoans} loan(s)</div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {adding && (
        <Modal title="Add person" onClose={() => setAdding(false)}>
          <PersonForm onCancel={() => setAdding(false)} onSaved={() => { setAdding(false); load(); }} />
        </Modal>
      )}
    </>
  );
}
