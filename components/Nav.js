'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import InstallApp from './InstallApp';

const LINKS = [
  { href: '/', label: 'Dashboard' },
  { href: '/persons', label: 'People' },
  { href: '/payments', label: 'Payments' },
  { href: '/reminders', label: 'Reminders' },
];

/**
 * Top navigation. On first load it fetches unread reminders and shows them
 * as a pop-up message (and a browser notification if allowed), once per day.
 */
export default function Nav() {
  const path = usePathname();
  const [unread, setUnread] = useState(0);
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
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          // Desktop notification (through the service worker, so clicking it opens Reminders)
          const show = (r) => {
            const opts = { body: r.message, icon: '/icons/icon-192.png', tag: r._id };
            const fallback = () => new Notification('Payment reminder', opts);
            if (!navigator.serviceWorker) return fallback();
            navigator.serviceWorker.getRegistration()
              .then((reg) => (reg ? reg.showNotification('Payment reminder', opts) : fallback()))
              .catch(fallback);
          };
          list.slice(0, 3).forEach(show);
        }
      }
    }).catch(() => {});
    const onChange = (e) => setUnread(e.detail);
    window.addEventListener('reminders-changed', onChange);
    return () => { cancelled = true; window.removeEventListener('reminders-changed', onChange); };
  }, []);

  return (
    <>
      <header className="nav">
        <Link href="/" className="brand">₹ Finance Tracker</Link>
        <nav>
          {LINKS.map((l) => {
            const active = l.href === '/' ? path === '/' : path.startsWith(l.href);
            return (
              <Link key={l.href} href={l.href} className={active ? 'active' : ''}>
                {l.label}
                {l.href === '/reminders' && unread > 0 && <span className="dot">{unread}</span>}
              </Link>
            );
          })}
          <InstallApp />
        </nav>
      </header>

      {toasts.length > 0 && (
        <div className="toasts">
          {toasts.map((t) => (
            <div key={t._id} className={`toast toast-${t.kind}`}>
              <div>
                <strong>{t.kind === 'overdue' ? 'Overdue' : 'Payment reminder'}</strong>
                <p>{t.message}</p>
              </div>
              <button className="icon-btn" onClick={() => setToasts((x) => x.filter((y) => y._id !== t._id))} aria-label="Dismiss">×</button>
            </div>
          ))}
          <Link href="/reminders" className="toast-link" onClick={() => setToasts([])}>See all reminders →</Link>
        </div>
      )}
    </>
  );
}
