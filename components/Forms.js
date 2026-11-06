'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { inr, monthKey, toInputDate } from '@/lib/format';
import { Button, ErrorBox, Field, Input, Row2, Segmented, Select, SheetActions, Textarea } from './ui';

/**
 * Runs a form save once. A ref (not state) blocks a second tap or Enter
 * that arrives before React has re-rendered the disabled button, which
 * would otherwise create the same record twice.
 */
function useSubmit(fn, onDone) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const running = useRef(false);
  const submit = async (e) => {
    e.preventDefault();
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setError('');
    try {
      const res = await fn();
      // Stay locked after success: the sheet is closing, so no second save
      onDone?.(res);
    } catch (err) {
      setError(err.message);
      running.current = false;
      setBusy(false);
    }
  };
  return { busy, error, submit };
}

function Actions({ busy, onCancel, label = 'Save' }) {
  return (
    <SheetActions>
      <Button variant="ghost" onClick={onCancel} disabled={busy}>Cancel</Button>
      <Button type="submit" loading={busy}>{busy ? 'Saving…' : label}</Button>
    </SheetActions>
  );
}

export function PersonForm({ initial = {}, onSaved, onCancel }) {
  const [f, setF] = useState({ name: '', phone: '', email: '', address: '', notes: '', ...initial });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const { busy, error, submit } = useSubmit(
    () => (initial._id ? api.put(`/persons/${initial._id}`, f) : api.post('/persons', f)),
    onSaved
  );
  return (
    <form onSubmit={submit} className="flex flex-col gap-4 pt-2">
      <ErrorBox error={error} />
      <Field label="Name *"><Input required placeholder="e.g. Rahul Sharma" value={f.name} onChange={set('name')} autoComplete="name" autoCapitalize="words" /></Field>
      <Row2>
        <Field label="Phone"><Input type="tel" inputMode="tel" autoComplete="tel" placeholder="e.g. 98765 43210" value={f.phone || ''} onChange={set('phone')} /></Field>
        <Field label="Email"><Input type="email" inputMode="email" autoComplete="email" autoCapitalize="none" placeholder="name@example.com" value={f.email || ''} onChange={set('email')} /></Field>
      </Row2>
      <Field label="Address"><Input autoComplete="street-address" placeholder="Area, city" value={f.address || ''} onChange={set('address')} /></Field>
      <Field label="Notes"><Textarea rows={3} placeholder="Anything to remember about this person" value={f.notes || ''} onChange={set('notes')} /></Field>
      <Actions busy={busy} onCancel={onCancel} />
    </form>
  );
}

/**
 * direction: 'given' (I give money) or 'taken' (I borrow money).
 * For an existing loan the direction comes from the loan itself.
 */
export function LoanForm({ personId, direction = 'given', initial = {}, onSaved, onCancel }) {
  const dir = initial.direction || direction;
  const taken = dir === 'taken';
  const [f, setF] = useState({
    title: '', principal: '', interestRate: '', startDate: toInputDate(), dueDay: 5, description: '',
    ...initial,
    ...(initial.startDate ? { startDate: toInputDate(initial.startDate) } : {}),
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const monthly = (Number(f.principal) * Number(f.interestRate)) / 100;
  const { busy, error, submit } = useSubmit(() => {
    const body = {
      title: f.title, principal: Number(f.principal), interestRate: Number(f.interestRate),
      startDate: f.startDate, dueDay: Number(f.dueDay), description: f.description,
    };
    return initial._id ? api.put(`/loans/${initial._id}`, body) : api.post('/loans', { ...body, person: personId, direction: dir });
  }, onSaved);

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 pt-2">
      <ErrorBox error={error} />
      <Field label="Title" hint="Optional">
        <Input placeholder={taken ? 'e.g. Home repair' : 'e.g. Shop loan'} value={f.title || ''} onChange={set('title')} autoComplete="off" />
      </Field>
      <Row2>
        <Field label={taken ? 'Amount taken (₹) *' : 'Amount given (₹) *'}>
          <Input required type="number" inputMode="decimal" min="0" step="any" autoComplete="off" className="tabular-nums" placeholder="₹ 1,00,000" value={f.principal} onChange={set('principal')} />
        </Field>
        <Field label="Interest % per month *">
          <Input required type="number" inputMode="decimal" min="0" step="any" autoComplete="off" className="tabular-nums" placeholder="e.g. 2" value={f.interestRate} onChange={set('interestRate')} />
        </Field>
      </Row2>
      {monthly > 0 && (
        <div className="rounded-xl bg-slate-100 px-3.5 py-2.5 text-[15px] dark:bg-slate-800">
          {taken ? 'You pay' : 'You receive'} <strong className="tabular-nums">{inr(monthly)}</strong> per month · <span className="tabular-nums">{inr(monthly * 12)}</span> per year
        </div>
      )}
      <Row2>
        <Field label={taken ? 'Date taken *' : 'Date given *'}>
          <Input required type="date" value={f.startDate} onChange={set('startDate')} />
        </Field>
        <Field label="Payment due on day" hint="Day of every month (1–28)">
          <Input type="number" inputMode="numeric" min="1" max="28" className="tabular-nums" placeholder="5" value={f.dueDay} onChange={set('dueDay')} />
        </Field>
      </Row2>
      <Field label="Description / note"><Textarea rows={3} placeholder="e.g. Given in cash, agreement signed" value={f.description || ''} onChange={set('description')} /></Field>
      <Actions busy={busy} onCancel={onCancel} label={initial._id ? 'Save' : taken ? 'Borrow money' : 'Give money'} />
    </form>
  );
}

/** A payment on a 'given' loan is money I received; on a 'taken' loan it is money I paid. */
export function PaymentForm({ loan, defaultMonth, defaultAmount, onSaved, onCancel }) {
  const taken = loan.direction === 'taken';
  const [f, setF] = useState({
    type: 'interest',
    amount: defaultAmount ?? loan.monthlyInterest ?? '',
    paidOn: toInputDate(),
    forMonth: defaultMonth || monthKey(),
    method: 'cash',
    note: '',
  });
  const set = (k) => (e) => {
    const next = { ...f, [k]: e.target.value };
    // Switching to principal: suggest the full remaining amount
    if (k === 'type' && e.target.value === 'principal' && loan.principalOutstanding != null) next.amount = loan.principalOutstanding;
    if (k === 'type' && e.target.value === 'interest') next.amount = defaultAmount ?? loan.monthlyInterest ?? '';
    setF(next);
  };
  const { busy, error, submit } = useSubmit(
    () => api.post('/payments', { ...f, amount: Number(f.amount), loan: loan._id || loan.id, forMonth: f.type === 'interest' ? f.forMonth : undefined }),
    onSaved
  );
  return (
    <form onSubmit={submit} className="flex flex-col gap-4 pt-2">
      <ErrorBox error={error} />
      <Row2>
        <Field label="Type">
          <Select value={f.type} onChange={set('type')}>
            <option value="interest">Monthly interest</option>
            <option value="principal">{taken ? 'Principal I paid back' : 'Principal repayment'}</option>
          </Select>
        </Field>
        <Field
          label="Amount (₹) *"
          hint={f.type === 'principal' && loan.principalOutstanding != null ? `Still owed: ${inr(loan.principalOutstanding)}` : undefined}
        >
          <Input
            required type="number" inputMode="decimal" min="0" step="any" autoComplete="off" className="tabular-nums"
            max={f.type === 'principal' && loan.principalOutstanding ? loan.principalOutstanding : undefined}
            placeholder="₹ 0" value={f.amount} onChange={set('amount')}
          />
        </Field>
      </Row2>
      {f.type === 'principal' && loan.principalOutstanding > 0 && (
        <div className="rounded-xl bg-slate-100 px-3.5 py-2.5 text-[15px] dark:bg-slate-800">
          {Number(f.amount) >= loan.principalOutstanding
            ? <>This repays the full amount. The loan will <strong>close</strong> and interest stops.</>
            : Number(f.amount) > 0
              ? <>From next month, interest is {loan.interestRate}% of <strong className="tabular-nums">{inr(loan.principalOutstanding - Number(f.amount))}</strong> = <strong className="tabular-nums">{inr(((loan.principalOutstanding - Number(f.amount)) * loan.interestRate) / 100)}</strong>/month.</>
              : <>Enter the amount {taken ? 'you paid back' : 'they repaid'}.</>}
        </div>
      )}
      <Row2>
        <Field label={taken ? 'Paid on' : 'Received on'}><Input type="date" value={f.paidOn} onChange={set('paidOn')} /></Field>
        {f.type === 'interest' && (
          <Field label="For month"><Input type="month" value={f.forMonth} onChange={set('forMonth')} /></Field>
        )}
      </Row2>
      <Field label="Method">
        <Select value={f.method} onChange={set('method')}>
          <option value="cash">Cash</option>
          <option value="upi">UPI</option>
          <option value="bank">Bank transfer</option>
          <option value="cheque">Cheque</option>
          <option value="other">Other</option>
        </Select>
      </Field>
      <Field label="Note"><Textarea rows={2} placeholder="e.g. Paid by UPI, ref 1234" value={f.note} onChange={set('note')} /></Field>
      <Actions busy={busy} onCancel={onCancel} label={taken ? 'Save payment I made' : 'Save payment'} />
    </form>
  );
}

/**
 * "+ Borrow money": step 1 pick an existing person or quickly add a new one,
 * step 2 the loan form with direction 'taken'.
 */
export function BorrowFlow({ onSaved, onCancel }) {
  const [people, setPeople] = useState(null);
  const [mode, setMode] = useState('existing');
  const [personId, setPersonId] = useState('');
  const [newPerson, setNewPerson] = useState({ name: '', phone: '' });
  const [person, setPerson] = useState(null); // chosen person -> step 2
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const running = useRef(false);

  useEffect(() => {
    api.get('/persons').then((list) => {
      setPeople(list);
      if (!list.length) setMode('new');
    }).catch((e) => setError(e.message));
  }, []);

  const next = async (e) => {
    e.preventDefault();
    setError('');
    if (mode === 'existing') {
      const p = people.find((x) => x._id === personId);
      if (!p) return setError('Choose a person');
      return setPerson(p);
    }
    if (running.current) return; // a double tap must not create the person twice
    running.current = true;
    setBusy(true);
    try {
      setPerson(await api.post('/persons', newPerson));
    } catch (err) {
      setError(err.message);
    } finally {
      running.current = false;
      setBusy(false);
    }
  };

  if (person) {
    return (
      <>
        <p className="pt-1 text-[15px] text-slate-600 dark:text-slate-300">
          Borrowing from <strong className="text-slate-900 dark:text-white">{person.name}</strong>{' '}
          <button type="button" className="min-h-11 px-1 font-semibold text-brand dark:text-brand-light" onClick={() => setPerson(null)}>Change</button>
        </p>
        <LoanForm personId={person._id} direction="taken" onSaved={onSaved} onCancel={onCancel} />
      </>
    );
  }

  return (
    <form onSubmit={next} className="flex flex-col gap-4 pt-2">
      <ErrorBox error={error} />
      {people?.length > 0 && (
        <Segmented value={mode} onChange={setMode} options={[{ value: 'existing', label: 'Existing person' }, { value: 'new', label: 'New person' }]} />
      )}
      {mode === 'existing' ? (
        <Field label="Who did you borrow from? *">
          <Select required value={personId} onChange={(e) => setPersonId(e.target.value)} disabled={!people}>
            <option value="">{people ? 'Choose a person…' : 'Loading…'}</option>
            {people?.map((p) => <option key={p._id} value={p._id}>{p.name}{p.phone ? ` · ${p.phone}` : ''}</option>)}
          </Select>
        </Field>
      ) : (
        <>
          <Field label="Name *">
            <Input required autoComplete="name" autoCapitalize="words" placeholder="e.g. Vikas Mehta" value={newPerson.name} onChange={(e) => setNewPerson({ ...newPerson, name: e.target.value })} />
          </Field>
          <Field label="Phone">
            <Input type="tel" inputMode="tel" autoComplete="tel" placeholder="e.g. 98220 01122" value={newPerson.phone} onChange={(e) => setNewPerson({ ...newPerson, phone: e.target.value })} />
          </Field>
        </>
      )}
      <SheetActions>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={busy}>{busy ? 'Saving…' : 'Next'}</Button>
      </SheetActions>
    </form>
  );
}
