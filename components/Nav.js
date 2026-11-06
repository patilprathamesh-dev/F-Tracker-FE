'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { setAppBadge } from '@/lib/pwa';
import { cn, Logo } from './ui';
import { useAuth } from './AuthGate';

// Inline SVG icons (24x24, stroke = currentColor)
const Icon = ({ d, className = 'size-6' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d.map((p, i) => <path key={i} d={p} />)}
  </svg>
);
const ICONS = {
  home: ['M3 10.5 12 3l9 7.5', 'M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5'],
  people: ['M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20', 'M10 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z', 'M20 20v-1.5a3.5 3.5 0 0 0-2.5-3.35', 'M15.5 4.6a3.5 3.5 0 0 1 0 6.8'],
  borrowed: ['M12 3v12', 'm7 10 5 5 5-5', 'M4 21h16'],
  payments: ['M3 7.5A1.5 1.5 0 0 1 4.5 6h15A1.5 1.5 0 0 1 21 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 16.5Z', 'M3 10h18', 'M7 15h3'],
  reminders: ['M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9', 'M10.3 21a1.94 1.94 0 0 0 3.4 0'],
  account: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'M4 21a8 8 0 0 1 16 0'],
};

const TABS = [
  { href: '/', label: 'Home', icon: 'home' },
  { href: '/persons', label: 'People', icon: 'people' },
  { href: '/borrowed', label: 'Borrowed', icon: 'borrowed' },
  { href: '/payments', label: 'Payments', icon: 'payments' },
  { href: '/reminders', label: 'Reminders', icon: 'reminders' },
];

const TITLES = [
  ['/persons/', 'Person'], ['/persons', 'People'], ['/borrowed', 'Borrowed'], ['/loans/', 'Loan'],
  ['/payments', 'Payments'], ['/reminders', 'Reminders'], ['/account', 'Account'],
];
const titleFor = (path) => (path === '/' ? 'Dashboard' : TITLES.find(([p]) => path.startsWith(p))?.[1] || 'Finance');
// Detail pages (one person, one loan) get a back button instead of the logo
const isDetailPath = (path) => /^\/(persons|loans)\/[^/]+/.test(path);
const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};
const todayLabel = () => new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
const isActive = (href, path) => (href === '/' ? path === '/' : path.startsWith(href));

/**
 * Phones (< 768px): a small top header with the page title and a fixed bottom tab bar.
 * Tablet / desktop (>= 768px): a top navigation bar.
 * On first load it shows unread reminders as toasts (once per day) and sets the app icon badge.
 */
export default function Nav() {
  const path = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const isDetail = isDetailPath(path);
  const title = titleFor(path);
  const initial = (user?.email || '?').slice(0, 1).toUpperCase();

  // Back: previous screen if there is one, otherwise the list the page belongs to
  const goBack = () => {
    if (window.history.length > 1) router.back();
    else router.push(path.startsWith('/loans') ? '/' : '/persons');
  };

  // Soft shadow under the header once the page is scrolled
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    let cancelled = false;
    api.get('/reminders?unread=true').then((list) => {
      if (cancelled) return;
      setUnread(list.length);
      const today = new Date().toDateString();
      let shown = null;
      try { shown = localStorage.getItem('reminders-shown'); } catch {}
      if (list.length && shown !== today) {
        setToasts(list.slice(0, 3));
        try { localStorage.setItem('reminders-shown', today); } catch {}
      }
    }).catch(() => {});
    const onChange = (e) => setUnread(e.detail);
    window.addEventListener('reminders-changed', onChange);
    return () => { cancelled = true; window.removeEventListener('reminders-changed', onChange); };
  }, []);

  useEffect(() => setAppBadge(unread), [unread]);

  const count = unread > 0 && (
    <span className="absolute -top-1.5 left-1/2 ml-1.5 min-w-[18px] rounded-full bg-bad px-1 text-center text-[11px] font-bold leading-[18px] text-white tabular-nums ring-2 ring-white dark:ring-slate-900">
      {unread > 99 ? '99+' : unread}
    </span>
  );

  return (
    <>
      {/* Header: frosted glass. Light and see-through; the page scrolls underneath it, blurred. */}
      <header
        className={cn(
          'sticky top-0 z-40 border-b pt-safe pl-safe pr-safe text-slate-900 backdrop-blur-xl backdrop-saturate-150 transition-[background-color,border-color,box-shadow] duration-200',
          'dark:text-white',
          scrolled
            ? 'border-slate-200/70 bg-white/70 shadow-[0_1px_12px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-slate-900/65'
            : 'border-transparent bg-slate-50/60 dark:bg-slate-950/50'
        )}
      >
        {/* Phones: back button or large page title on the left, avatar on the right */}
        <div className="flex h-14 items-center gap-2 px-4 md:hidden">
          {isDetail ? (
            <button
              type="button"
              onClick={goBack}
              aria-label="Back"
              className="-ml-2 flex size-11 shrink-0 items-center justify-center rounded-full text-brand active:bg-slate-900/5 dark:text-brand-light dark:active:bg-white/10"
            >
              <Icon d={['m15 18-6-6 6-6']} className="size-6" />
            </button>
          ) : (
            <Logo />
          )}
          <div className="min-w-0 flex-1 leading-tight">
            <div className={cn('truncate font-bold tracking-tight', isDetail ? 'text-lg' : 'text-[22px]')}>{title}</div>
            {path === '/' && <div className="truncate text-[13px] font-medium text-slate-500 dark:text-slate-400">{greeting()} · {todayLabel()}</div>}
          </div>
          <Link
            href="/account"
            aria-label="Account"
            className="-mr-1 flex size-11 shrink-0 items-center justify-center rounded-full transition active:scale-95"
          >
            <span
              className={cn(
                'flex size-9 items-center justify-center rounded-full text-[15px] font-bold ring-1',
                path === '/account'
                  ? 'bg-brand text-white ring-brand dark:bg-brand-light dark:text-teal-950 dark:ring-brand-light'
                  : 'bg-white/80 text-brand ring-slate-200 dark:bg-white/10 dark:text-brand-light dark:ring-white/15'
              )}
            >
              {initial}
            </span>
          </Link>
        </div>

        {/* Tablet / desktop: logo, tabs and avatar */}
        <div className="mx-auto hidden h-16 max-w-5xl items-center justify-between gap-3 px-6 md:flex">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo />
            <span className="text-lg font-bold tracking-tight">Finance Tracker</span>
          </Link>
          <nav className="flex items-center gap-1 rounded-full border border-slate-200/70 bg-white/60 p-1 dark:border-white/10 dark:bg-white/5" aria-label="Main">
            {TABS.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className={cn(
                  'relative flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[15px] font-medium transition',
                  isActive(t.href, path)
                    ? 'bg-brand text-white shadow-sm dark:bg-brand-light dark:text-teal-950'
                    : 'text-slate-600 hover:bg-slate-900/5 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white'
                )}
              >
                {t.label}
                {t.href === '/reminders' && unread > 0 && (
                  <span className="rounded-full bg-bad px-1.5 text-[12px] font-bold leading-5 text-white tabular-nums">{unread}</span>
                )}
              </Link>
            ))}
          </nav>
          <Link href="/account" aria-label="Account" className="flex size-10 items-center justify-center rounded-full transition hover:scale-105">
            <span
              className={cn(
                'flex size-9 items-center justify-center rounded-full text-[15px] font-bold ring-1',
                path === '/account'
                  ? 'bg-brand text-white ring-brand dark:bg-brand-light dark:text-teal-950 dark:ring-brand-light'
                  : 'bg-white/80 text-brand ring-slate-200 dark:bg-white/10 dark:text-brand-light dark:ring-white/15'
              )}
            >
              {initial}
            </span>
          </Link>
        </div>
      </header>

      {/* Bottom tab bar (phones): a floating frosted-glass pill above the home indicator */}
      <nav
        aria-label="Tabs"
        className={cn(
          'fixed left-4 right-4 z-40 md:hidden',
          'bottom-[max(0.75rem,calc(env(safe-area-inset-bottom)-0.5rem))]',
          'max-[400px]:left-3 max-[400px]:right-3',
          'ml-[env(safe-area-inset-left)] mr-[env(safe-area-inset-right)]'
        )}
      >
        <div className="flex h-16 items-center gap-0.5 rounded-full border border-white/70 bg-white/75 p-1.5 max-[400px]:h-14 max-[400px]:gap-0 max-[400px]:p-1 shadow-[0_8px_30px_rgba(15,23,42,0.12)] backdrop-blur-2xl backdrop-saturate-150 dark:border-white/10 dark:bg-slate-900/75 dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
          {TABS.map((t) => {
            const active = isActive(t.href, path);
            return (
              <Link
                key={t.href}
                href={t.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-[10.5px] font-semibold tracking-tight transition-colors duration-200 active:scale-95 max-[400px]:text-[9.5px] max-[400px]:tracking-tighter',
                  active
                    ? 'bg-slate-900/[0.06] text-slate-900 dark:bg-white/10 dark:text-white'
                    : 'text-slate-500 dark:text-slate-400'
                )}
              >
                <span className="relative">
                  <Icon d={ICONS[t.icon]} className={cn('size-[22px] max-[400px]:size-5', active && 'text-brand dark:text-brand-light')} />
                  {t.href === '/reminders' && count}
                </span>
                <span className="max-w-full truncate px-0.5 max-[400px]:px-0">{t.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {toasts.length > 0 && (
        <div className="fixed inset-x-3 top-[calc(4rem+env(safe-area-inset-top))] z-50 space-y-2 md:inset-x-auto md:right-4 md:top-20 md:w-96">
          {toasts.map((t) => (
            <div
              key={t._id}
              className={cn(
                'flex items-start gap-2 rounded-2xl border border-l-4 border-slate-200 bg-white p-3 shadow-lg dark:border-slate-800 dark:bg-slate-900',
                t.direction === 'taken' ? 'border-l-orange-500' : t.kind === 'overdue' ? 'border-l-bad' : 'border-l-brand'
              )}
            >
              <div className="min-w-0 flex-1">
                <strong className={cn('text-[15px]', t.direction === 'taken' && 'text-orange-700 dark:text-orange-300')}>
                  {t.direction === 'taken' ? 'You need to pay' : t.kind === 'overdue' ? 'Overdue' : 'Payment reminder'}
                </strong>
                <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">{t.message}</p>
              </div>
              <button
                type="button"
                className="-mr-1 -mt-1 flex size-11 shrink-0 items-center justify-center rounded-full text-xl text-slate-400 active:bg-slate-100 dark:active:bg-slate-800"
                onClick={() => setToasts((x) => x.filter((y) => y._id !== t._id))}
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          ))}
          <Link
            href="/reminders"
            onClick={() => setToasts([])}
            className="flex min-h-11 items-center justify-center rounded-2xl bg-slate-900/85 text-[15px] font-semibold text-white backdrop-blur dark:bg-white/90 dark:text-slate-900"
          >
            See all reminders →
          </Link>
        </div>
      )}
    </>
  );
}
