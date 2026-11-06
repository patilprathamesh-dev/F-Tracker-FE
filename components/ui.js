'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

/** Joins class names, skipping empty ones: cn('a', cond && 'b') */
export const cn = (...c) => c.filter(Boolean).join(' ');

/* ------------------------------------------------------------------ Buttons */

const BUTTON = {
  base: 'inline-flex select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-xl font-semibold transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
  primary: 'bg-brand text-white shadow-sm active:bg-teal-800 dark:bg-brand-light dark:text-teal-950 dark:active:bg-teal-300',
  ghost: 'border border-slate-200 bg-white text-slate-800 active:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:active:bg-slate-800',
  danger: 'border border-slate-200 bg-white text-bad active:bg-red-50 dark:border-slate-700 dark:bg-slate-900 dark:text-red-400 dark:active:bg-red-950',
  md: 'min-h-11 px-4 text-[15px]',
  lg: 'min-h-12 w-full px-5 text-base',
};

/** <Button> or, with href, a <Link> styled as a button. variant: primary | ghost | danger, size: md | lg */
export function Button({ variant = 'primary', size = 'md', href, className, children, ...props }) {
  const classes = cn(BUTTON.base, BUTTON[variant], BUTTON[size], className);
  if (href) return <Link href={href} className={classes} {...props}>{children}</Link>;
  return <button type="button" className={classes} {...props}>{children}</button>;
}

/** Text-sized button for inline actions ("Mark paid") with a 44px tap area */
export function LinkButton({ className, children, ...props }) {
  return (
    <button type="button" className={cn('inline-flex min-h-11 items-center px-1 font-semibold text-brand active:opacity-60 dark:text-brand-light', className)} {...props}>
      {children}
    </button>
  );
}

/** Round floating "+" button for the page's main action (phones only) */
export function Fab({ label, onClick, href }) {
  const classes = 'fixed right-4 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-30 flex size-14 items-center justify-center rounded-full bg-brand text-white shadow-lg shadow-teal-900/30 transition active:scale-95 md:hidden dark:bg-brand-light dark:text-teal-950';
  const icon = <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>;
  if (href) return <Link href={href} className={classes} aria-label={label}>{icon}</Link>;
  return <button type="button" className={classes} onClick={onClick} aria-label={label}>{icon}</button>;
}

/* ------------------------------------------------------------------ Logo */

/** Indian Rupee icon (Lucide "indian-rupee", ISC licence), drawn inline so no icon package is needed */
export function RupeeIcon({ className = 'size-5', strokeWidth = 2.2 }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 3h12" />
      <path d="M6 8h12" />
      <path d="m6 13 8.5 8" />
      <path d="M6 13h3" />
      <path d="M9 13c6.667 0 6.667-10 0-10" />
    </svg>
  );
}

const LOGO_SIZE = {
  sm: { box: 'size-9 rounded-xl', icon: 'size-5' },
  md: { box: 'size-11 rounded-[14px]', icon: 'size-6' },
  lg: { box: 'size-20 rounded-[22px]', icon: 'size-10' },
};

/** App logo: the rupee icon on a teal gradient tile. size: sm | md | lg */
export function Logo({ size = 'sm', className }) {
  const s = LOGO_SIZE[size];
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex shrink-0 items-center justify-center bg-gradient-to-br from-brand-light to-brand text-white shadow-md shadow-teal-900/20 ring-1 ring-inset ring-white/20',
        s.box,
        className
      )}
    >
      <RupeeIcon className={s.icon} strokeWidth={size === 'lg' ? 2.4 : 2.2} />
    </span>
  );
}

/* ------------------------------------------------------------------ Layout */

const CARD_TONE = {
  default: 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900',
  good: 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/60',
  bad: 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/60',
  info: 'border-transparent bg-sky-50 text-[15px] dark:bg-sky-950/60',
};

/** tone: default | good | bad | info (colours are chosen here so they never clash with className) */
export function Card({ tone = 'default', className, children, ...props }) {
  return (
    <section className={cn('rounded-2xl border p-4', CARD_TONE[tone], className)} {...props}>
      {children}
    </section>
  );
}

export function CardHead({ title, children }) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </div>
  );
}

/**
 * Page title row: back link, title, subtitle and action buttons.
 * On phones the top header already shows the title of list pages and the back button,
 * so here those are only visible from 768px (detail pages keep their name, e.g. the person's).
 */
export function PageHeader({ title, subtitle, back, actions, children }) {
  const empty = !back && !subtitle && !actions && !children;
  return (
    <div className={cn('mb-4', empty && 'max-md:hidden')}>
      {back && (
        <Link href={back.href} className="-ml-1 mb-1 hidden min-h-11 items-center gap-1 text-[15px] font-medium text-brand active:opacity-60 md:inline-flex dark:text-brand-light">
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className={cn('flex flex-wrap items-center gap-2 text-[22px] font-bold tracking-tight md:text-2xl', !back && 'max-md:sr-only')}>{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ Status */

const BADGE_TEXT = {
  paid: 'Paid', partial: 'Partly paid', pending: 'Upcoming', overdue: 'Overdue', active: 'Active', closed: 'Closed',
  upcoming: 'Upcoming', due: 'Due today', given: 'Given', taken: 'Borrowed',
};
const BADGE_TONE = {
  paid: 'bg-green-50 text-good dark:bg-green-950 dark:text-green-400',
  active: 'bg-green-50 text-good dark:bg-green-950 dark:text-green-400',
  overdue: 'bg-red-50 text-bad dark:bg-red-950 dark:text-red-400',
  partial: 'bg-amber-50 text-warn dark:bg-amber-950 dark:text-amber-400',
  due: 'bg-amber-50 text-warn dark:bg-amber-950 dark:text-amber-400',
  pending: 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  upcoming: 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  closed: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  given: 'bg-teal-50 text-brand dark:bg-teal-950 dark:text-brand-light',
  taken: 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
};

export function Badge({ status, className }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[13px] font-semibold leading-5', BADGE_TONE[status] || BADGE_TONE.closed, className)}>
      {BADGE_TEXT[status] || status}
    </span>
  );
}

const STAT_TONE = { good: 'text-good dark:text-green-400', bad: 'text-bad dark:text-red-400', warn: 'text-orange-700 dark:text-orange-300' };

export function Stat({ label, value, hint, tone }) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900">
      <div className="text-[13px] leading-tight text-slate-500 dark:text-slate-400">{label}</div>
      <div className={cn('mt-1 truncate text-[22px] font-bold tracking-tight tabular-nums sm:text-[28px]', STAT_TONE[tone])}>{value}</div>
      {hint && <div className="mt-0.5 text-[13px] leading-tight text-slate-500 dark:text-slate-400">{hint}</div>}
    </div>
  );
}

export function StatGrid({ children, className }) {
  return <div className={cn('mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4', className)}>{children}</div>;
}

export function EmptyState({ children }) {
  return <div className="rounded-xl px-4 py-8 text-center text-[15px] text-slate-500 dark:text-slate-400">{children}</div>;
}

export function ErrorBox({ error }) {
  if (!error) return null;
  return <div role="alert" className="mb-4 rounded-xl bg-red-50 px-3.5 py-3 text-[15px] text-bad dark:bg-red-950 dark:text-red-300">{error}</div>;
}

export function InfoBox({ children }) {
  if (!children) return null;
  return <div className="mb-4 rounded-xl bg-sky-50 px-3.5 py-3 text-[15px] text-sky-800 dark:bg-sky-950 dark:text-sky-200">{children}</div>;
}

/* ------------------------------------------------------------------ Loading */

export function Skeleton({ className }) {
  return <div className={cn('animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800', className)} />;
}

/** Placeholder for a page that is loading: title, stat cards and a few rows */
export function PageSkeleton({ stats = 4, rows = 4 }) {
  return (
    <div aria-busy="true" aria-label="Loading">
      <Skeleton className="mb-5 h-7 w-40" />
      {stats > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: stats }, (_, i) => <Skeleton key={i} className="h-[88px] rounded-2xl" />)}
        </div>
      )}
      <ListSkeleton rows={rows} />
    </div>
  );
}

export function ListSkeleton({ rows = 4 }) {
  return (
    <div className="space-y-2.5" aria-busy="true">
      {Array.from({ length: rows }, (_, i) => <Skeleton key={i} className="h-[72px] rounded-2xl" />)}
    </div>
  );
}

/* ------------------------------------------------------------------ Lists and tables */

/**
 * One row as a card on phones: title + amount on top, badge + meta below.
 * Pass href to make the whole card tappable.
 */
export function ListCard({ href, onClick, title, amount, badge, meta, sub, accent, right }) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 font-semibold">{title}</div>
        {amount != null && <div className="shrink-0 font-semibold tabular-nums">{amount}</div>}
      </div>
      {(badge || meta) && (
        <div className="mt-1.5 flex items-center justify-between gap-2 text-[13px] text-slate-500 dark:text-slate-400">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">{badge}</div>
          <div className="shrink-0 tabular-nums">{meta}</div>
        </div>
      )}
      {sub && <div className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">{sub}</div>}
    </>
  );
  const classes = cn(
    'block w-full rounded-2xl border border-slate-200 bg-white p-3.5 text-left dark:border-slate-800 dark:bg-slate-900',
    accent === 'taken' && 'border-l-4 border-l-orange-500',
    (href || onClick) && 'transition active:scale-[0.99] active:bg-slate-50 dark:active:bg-slate-800'
  );
  if (right) {
    return <div className={cn(classes, 'flex items-center gap-2')}><div className="min-w-0 flex-1">{body}</div>{right}</div>;
  }
  if (href) return <Link href={href} className={classes}>{body}</Link>;
  if (onClick) return <button type="button" onClick={onClick} className={classes}>{body}</button>;
  return <div className={classes}>{body}</div>;
}

/** Card list shown below 768px */
export function CardList({ children, className }) {
  return <div className={cn('space-y-2.5 md:hidden', className)}>{children}</div>;
}

/** Table shown from 768px up. head: array of strings or { label, right } */
export function Table({ head, children }) {
  return (
    <table className="hidden w-full border-collapse text-[15px] md:table">
      <thead>
        <tr>
          {head.map((h, i) => {
            const label = typeof h === 'string' ? h : h.label;
            return (
              <th key={i} className={cn('border-b border-slate-200 px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400', h?.right && 'text-right')}>
                {label}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

export function Tr({ onClick, children }) {
  return (
    <tr onClick={onClick} className={cn('border-b border-slate-100 last:border-0 dark:border-slate-800/70', onClick && 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50')}>
      {children}
    </tr>
  );
}

export function Td({ right, muted, className, children }) {
  return (
    <td className={cn('px-2 py-2.5', right && 'text-right tabular-nums', muted && 'text-slate-500 dark:text-slate-400', className)}>
      {children}
    </td>
  );
}

/** Segmented control: options = [{ value, label }] */
export function Segmented({ value, onChange, options, className }) {
  return (
    <div className={cn('flex rounded-xl bg-slate-200/70 p-1 dark:bg-slate-800', className)} role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'min-h-10 flex-1 rounded-lg px-3 text-[15px] font-semibold transition',
            value === o.value ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-white' : 'text-slate-500 active:bg-white/50 dark:text-slate-400'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ Forms */

const CONTROL = 'block w-full min-w-0 min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2 text-base text-slate-900 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-brand-light';

export function Field({ label, hint, children, className }) {
  return (
    <label className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</span>
      {children}
      {hint && <small className="text-[13px] text-slate-500 dark:text-slate-400">{hint}</small>}
    </label>
  );
}

export function Input({ className, ...props }) {
  // The appearance reset keeps iOS date/month inputs full width and left aligned
  return <input className={cn(CONTROL, 'appearance-none [&::-webkit-date-and-time-value]:text-left', className)} {...props} />;
}

export function Select({ className, children, ...props }) {
  return (
    <select
      className={cn(CONTROL, 'appearance-none bg-[url("data:image/svg+xml;utf8,<svg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 20 20%27 fill=%27%2394a3b8%27><path d=%27M5.5 7.5 10 12l4.5-4.5%27 stroke=%27%2394a3b8%27 stroke-width=%271.8%27 fill=%27none%27 stroke-linecap=%27round%27/></svg>")] bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat pr-10', className)}
      {...props}
    >
      {children}
    </select>
  );
}

export function Textarea({ className, ...props }) {
  return <textarea className={cn(CONTROL, 'resize-y', className)} {...props} />;
}

/** Two fields side by side from 640px, stacked on phones */
export function Row2({ children }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>;
}

/* ------------------------------------------------------------------ Bottom sheet */

/**
 * A bottom sheet on phones (slides up, drag handle, max 90dvh, scrolls inside)
 * and a centered modal from 768px. Put form buttons in <SheetActions> so they
 * stay stuck to the bottom above the home indicator.
 */
export function BottomSheet({ title, onClose, children }) {
  const [shown, setShown] = useState(false);
  const [dragY, setDragY] = useState(0);
  const startY = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  const close = () => {
    setShown(false);
    setTimeout(() => closeRef.current(), 180);
  };

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(true));
    const onKey = (e) => e.key === 'Escape' && closeRef.current();
    window.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, []);

  // Drag the handle down to close
  const onTouchStart = (e) => { startY.current = e.touches[0].clientY; };
  const onTouchMove = (e) => {
    if (startY.current == null) return;
    setDragY(Math.max(0, e.touches[0].clientY - startY.current));
  };
  const onTouchEnd = () => {
    if (dragY > 90) close();
    setDragY(0);
    startY.current = null;
  };

  return (
    <div
      className={cn('fixed inset-0 z-50 flex items-end bg-black/40 transition-opacity duration-200 md:items-center md:justify-center md:p-6', shown ? 'opacity-100' : 'opacity-0')}
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={dragY ? { transform: `translateY(${dragY}px)`, transition: 'none' } : undefined}
        className={cn(
          'flex max-h-[90dvh] w-full flex-col rounded-t-3xl bg-white shadow-2xl transition-transform duration-200 ease-out pl-safe pr-safe dark:bg-slate-900',
          'md:max-w-lg md:rounded-2xl',
          shown ? 'translate-y-0' : 'translate-y-full md:translate-y-8'
        )}
      >
        <div className="shrink-0 touch-none" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
          <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-slate-300 md:hidden dark:bg-slate-700" />
          <div className="flex items-center justify-between gap-2 px-4 pt-2 pb-1 md:pt-4">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button type="button" onClick={close} aria-label="Close" className="-mr-2 flex size-11 items-center justify-center rounded-full text-slate-500 active:bg-slate-100 dark:active:bg-slate-800">
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          </div>
        </div>
        <div className="overflow-y-auto overscroll-contain px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:pb-4">{children}</div>
      </div>
    </div>
  );
}

/** Buttons pinned to the bottom of a BottomSheet */
export function SheetActions({ children }) {
  return (
    <div className="sticky bottom-0 -mx-4 mt-2 -mb-[calc(1rem+env(safe-area-inset-bottom))] md:mb-0 flex gap-2 border-t border-slate-200 bg-white/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:px-0 md:pb-0 dark:border-slate-800 dark:bg-slate-900/95 md:dark:bg-transparent [&>*]:flex-1 md:[&>*]:flex-none md:justify-end">
      {children}
    </div>
  );
}
