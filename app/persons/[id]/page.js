'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { fmtDate, inr } from '@/lib/format';
import { Badge, BottomSheet, Button, Card, CardHead, CardList, EmptyState, ErrorBox, Fab, ListCard, PageHeader, PageSkeleton, Stat, StatGrid, Table, Td, Tr } from '@/components/ui';
import { LoanForm, PersonForm } from '@/components/Forms';

function LoanSection({ title, loans, direction, onAdd, router }) {
  const taken = direction === 'taken';
  return (
    <Card className="mb-4">
      <CardHead title={title}>
        <Button variant={taken ? 'ghost' : 'primary'} onClick={onAdd}>{taken ? '+ Borrow money' : '+ Give money'}</Button>
      </CardHead>
      {loans.length === 0 ? <EmptyState>{taken ? 'You have not borrowed from this person.' : 'No money given yet.'}</EmptyState> : (
        <>
          <CardList>
            {loans.map((l) => (
              <ListCard
                key={l._id}
                href={`/loans/${l._id}`}
                accent={direction}
                title={l.title || 'Loan'}
                amount={inr(l.principalOutstanding)}
                badge={<Badge status={l.status} />}
                meta={`${l.interestRate}% · ${inr(l.monthlyInterest)}/mo`}
                sub={`${taken ? 'Taken' : 'Given'} ${inr(l.principal)} on ${fmtDate(l.startDate)}${l.principalPaid ? ` · ${inr(l.principalPaid)} repaid` : ''} · due on day ${l.dueDay}`}
              />
            ))}
          </CardList>
          <Table head={['Title', taken ? 'Date taken' : 'Date given', { label: 'Amount', right: true }, { label: 'Still owed', right: true }, { label: 'Interest', right: true }, { label: 'Per month', right: true }, 'Due day', 'Status']}>
            {loans.map((l) => (
              <Tr key={l._id} onClick={() => router.push(`/loans/${l._id}`)}>
                <Td className="font-medium text-brand dark:text-brand-light">{l.title || 'Loan'}</Td>
                <Td muted>{fmtDate(l.startDate)}</Td>
                <Td right>{inr(l.principal)}</Td>
                <Td right>{inr(l.principalOutstanding)}</Td>
                <Td right>{l.interestRate}%</Td>
                <Td right>{inr(l.monthlyInterest)}</Td>
                <Td>{l.dueDay}</Td>
                <Td><Badge status={l.status} /></Td>
              </Tr>
            ))}
          </Table>
        </>
      )}
    </Card>
  );
}

export default function PersonDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [person, setPerson] = useState(null);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // 'edit' | 'given' | 'taken'

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
  if (!person) return <PageSkeleton stats={2} rows={3} />;

  const given = person.loans.filter((l) => (l.direction || 'given') === 'given');
  const taken = person.loans.filter((l) => l.direction === 'taken');
  const sum = (list, k) => list.filter((l) => l.status === 'active').reduce((s, l) => s + l[k], 0);

  return (
    <>
      <PageHeader
        back={{ href: '/persons', label: 'People' }}
        title={person.name}
        subtitle={[person.phone, person.email].filter(Boolean).join(' · ') || 'No contact details'}
        actions={
          <>
            {person.phone && <Button variant="ghost" href={`tel:${person.phone}`}>Call</Button>}
            <Button variant="ghost" onClick={() => setModal('edit')}>Edit</Button>
            <Button variant="danger" onClick={remove}>Delete</Button>
          </>
        }
      />

      {(person.notes || person.address) && (
        <Card tone="info" className="mb-4">
          {person.address && <p><strong>Address:</strong> {person.address}</p>}
          {person.notes && <p className="mt-1">{person.notes}</p>}
        </Card>
      )}

      <StatGrid>
        <Stat label="I gave (still owed)" value={inr(sum(given, 'principalOutstanding'))} hint={`${inr(sum(given, 'monthlyInterest'))} interest / month`} />
        <Stat label="I took (still owed)" value={inr(sum(taken, 'principalOutstanding'))} hint={`${inr(sum(taken, 'monthlyInterest'))} interest / month`} tone={taken.length ? 'warn' : ''} />
      </StatGrid>

      <LoanSection title="Money I gave" loans={given} direction="given" onAdd={() => setModal('given')} router={router} />
      <LoanSection title="Money I took" loans={taken} direction="taken" onAdd={() => setModal('taken')} router={router} />

      <Fab onClick={() => setModal('given')} label={`Give money to ${person.name}`} />

      {modal === 'edit' && (
        <BottomSheet title="Edit person" onClose={() => setModal(null)}>
          <PersonForm initial={person} onCancel={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />
        </BottomSheet>
      )}
      {(modal === 'given' || modal === 'taken') && (
        <BottomSheet title={modal === 'taken' ? `Borrow money from ${person.name}` : `Give money to ${person.name}`} onClose={() => setModal(null)}>
          <LoanForm personId={id} direction={modal} onCancel={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />
        </BottomSheet>
      )}
    </>
  );
}
