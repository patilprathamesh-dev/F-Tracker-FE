'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { inr, monthKey, toInputDate } from '@/lib/format';
import { ErrorBox, Field } from './ui';

function useSubmit(fn, onDone) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fn();
      onDone?.(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, submit };
}

export function PersonForm({ initial = {}, onSaved, onCancel }) {
  const [f, setF] = useState({ name: '', phone: '', email: '', address: '', notes: '', ...initial });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const { busy, error, submit } = useSubmit(
    () => (initial._id ? api.put(`/persons/${initial._id}`, f) : api.post('/persons', f)),
    onSaved
  );
  return (
    <form onSubmit={submit} className="form">
      <ErrorBox error={error} />
      <Field label="Name *"><input required value={f.name} onChange={set('name')} autoFocus /></Field>
      <div className="row2">
        <Field label="Phone"><input value={f.phone || ''} onChange={set('phone')} inputMode="tel" /></Field>
        <Field label="Email"><input type="email" value={f.email || ''} onChange={set('email')} /></Field>
      </div>
      <Field label="Address"><input value={f.address || ''} onChange={set('address')} /></Field>
      <Field label="Notes"><textarea rows={3} value={f.notes || ''} onChange={set('notes')} /></Field>
      <div className="actions">
        <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>
        <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
      </div>
    </form>
  );
}

export function LoanForm({ personId, initial = {}, onSaved, onCancel }) {
  const [f, setF] = useState({
    title: '', principal: '', interestRate: '', startDate: toInputDate(), dueDay: 5, description: '',
    ...initial,
    ...(initial.startDate ? { startDate: toInputDate(initial.startDate) } : {}),
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const monthly = (Number(f.principal) * Number(f.interestRate)) / 100;
  const { busy, error, submit } = useSubmit(() => {
    const body = { ...f, principal: Number(f.principal), interestRate: Number(f.interestRate), dueDay: Number(f.dueDay) };
    return initial._id ? api.put(`/loans/${initial._id}`, body) : api.post('/loans', { ...body, person: personId });
  }, onSaved);

  return (
    <form onSubmit={submit} className="form">
      <ErrorBox error={error} />
      <Field label="Title" hint="Optional, e.g. 'Shop loan'"><input value={f.title || ''} onChange={set('title')} /></Field>
      <div className="row2">
        <Field label="Amount given (₹) *"><input required type="number" min="0" step="any" value={f.principal} onChange={set('principal')} /></Field>
        <Field label="Interest % per month *"><input required type="number" min="0" step="any" value={f.interestRate} onChange={set('interestRate')} /></Field>
      </div>
      {monthly > 0 && <div className="calc">Monthly interest: <strong>{inr(monthly)}</strong> · Yearly: {inr(monthly * 12)}</div>}
      <div className="row2">
        <Field label="Date given *"><input required type="date" value={f.startDate} onChange={set('startDate')} /></Field>
        <Field label="Payment due on day" hint="Day of every month (1–28)"><input type="number" min="1" max="28" value={f.dueDay} onChange={set('dueDay')} /></Field>
      </div>
      <Field label="Description / note"><textarea rows={3} value={f.description || ''} onChange={set('description')} /></Field>
      <div className="actions">
        <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>
        <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
      </div>
    </form>
  );
}

export function PaymentForm({ loan, defaultMonth, defaultAmount, onSaved, onCancel }) {
  const [f, setF] = useState({
    type: 'interest',
    amount: defaultAmount ?? loan.monthlyInterest ?? '',
    paidOn: toInputDate(),
    forMonth: defaultMonth || monthKey(),
    method: 'cash',
    note: '',
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const { busy, error, submit } = useSubmit(
    () => api.post('/payments', { ...f, amount: Number(f.amount), loan: loan._id || loan.id, forMonth: f.type === 'interest' ? f.forMonth : undefined }),
    onSaved
  );
  return (
    <form onSubmit={submit} className="form">
      <ErrorBox error={error} />
      <div className="row2">
        <Field label="Type">
          <select value={f.type} onChange={set('type')}>
            <option value="interest">Monthly interest</option>
            <option value="principal">Principal repayment</option>
          </select>
        </Field>
        <Field label="Amount (₹) *"><input required type="number" min="0" step="any" value={f.amount} onChange={set('amount')} autoFocus /></Field>
      </div>
      <div className="row2">
        <Field label="Received on"><input type="date" value={f.paidOn} onChange={set('paidOn')} /></Field>
        {f.type === 'interest' && (
          <Field label="For month"><input type="month" value={f.forMonth} onChange={set('forMonth')} /></Field>
        )}
      </div>
      <Field label="Method">
        <select value={f.method} onChange={set('method')}>
          <option value="cash">Cash</option>
          <option value="upi">UPI</option>
          <option value="bank">Bank transfer</option>
          <option value="cheque">Cheque</option>
          <option value="other">Other</option>
        </select>
      </Field>
      <Field label="Note"><textarea rows={2} value={f.note} onChange={set('note')} /></Field>
      <div className="actions">
        <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>
        <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save payment'}</button>
      </div>
    </form>
  );
}
