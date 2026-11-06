'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { fmtDate } from '@/lib/format';
import { Badge, Empty, ErrorBox } from '@/components/ui';

export default function RemindersPage() {
  const [list, setList] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [perm, setPerm] = useState('default');

  const load = useCallback(() => {
    api.get(`/reminders${showAll ? '' : '?unread=true'}`)
      .then((l) => {
        setList(l);
        if (!showAll) window.dispatchEvent(new CustomEvent('reminders-changed', { detail: l.length }));
      })
      .catch((e) => setError(e.message));
  }, [showAll]);

  useEffect(load, [load]);
  useEffect(() => {
    if (typeof Notification !== 'undefined') setPerm(Notification.permission);
  }, []);

  const runNow = async () => {
    const r = await api.post('/reminders/run');
    setInfo(r.created ? `${r.created} new reminder(s) created.` : 'Checked: no new reminders.');
    load();
  };
  const markRead = async (id) => { await api.patch(`/reminders/${id}/read`, { read: true }); load(); };
  const markAll = async () => { await api.patch('/reminders/read-all'); load(); };
  const enableNotif = async () => setPerm(await Notification.requestPermission());

  return (
    <>
      <div className="page-head">
        <h1>Reminders</h1>
        <div className="btn-row">
          <button className="btn ghost" onClick={runNow}>Check now</button>
          <button className="btn ghost" onClick={markAll} disabled={!list?.some((r) => !r.read)}>Mark all read</button>
        </div>
      </div>

      <p className="muted">
        The server checks every day and creates a reminder a few days before each due date, on the due date, and when a payment is overdue.
        {perm !== 'granted' && typeof Notification !== 'undefined' && (
          <> <button className="link-btn" onClick={enableNotif}>Turn on browser notifications</button></>
        )}
      </p>

      <div className="tabs">
        <button className={!showAll ? 'active' : ''} onClick={() => setShowAll(false)}>Unread</button>
        <button className={showAll ? 'active' : ''} onClick={() => setShowAll(true)}>All</button>
      </div>
      <ErrorBox error={error} />
      {info && <div className="info">{info}</div>}

      {!list ? <p className="muted">Loading…</p> : list.length === 0 ? <Empty>No reminders. Everyone is up to date.</Empty> : (
        <div className="reminders">
          {list.map((r) => (
            <div key={r._id} className={`card reminder reminder-${r.kind} ${r.read ? 'is-read' : ''}`}>
              <div className="grow">
                <div className="reminder-top"><Badge status={r.kind} /> <span className="muted small">Due {fmtDate(r.dueDate)}</span></div>
                <p>{r.message}</p>
                <div className="small">
                  {r.person && <Link href={`/persons/${r.person._id}`}>{r.person.name}</Link>}
                  {r.loan && <> · <Link href={`/loans/${r.loan._id}`}>Open loan</Link></>}
                </div>
              </div>
              {!r.read && <button className="btn ghost" onClick={() => markRead(r._id)}>Done</button>}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
