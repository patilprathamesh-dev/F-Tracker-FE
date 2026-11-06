'use client';

import { useEffect, useState } from 'react';
import { isIOSSafari, isStandalone } from '@/lib/pwa';
import { Logo } from './ui';

const DISMISS_KEY = 'install-card-dismissed';

/**
 * Registers the service worker, and in iPhone Safari (not the installed app) shows a card:
 * "Install on your iPhone: tap Share then Add to Home Screen". iOS has no install prompt event,
 * so this is the only way to guide the user. Dismissal is remembered.
 */
export default function InstallCard() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      if (process.env.NODE_ENV === 'production') {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      } else {
        // While developing, a cached page from an old build can break hydration: remove the worker and its cache
        navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister())).catch(() => {});
        if (window.caches) caches.keys().then((keys) => keys.forEach((k) => caches.delete(k))).catch(() => {});
      }
    }
    let dismissed = false;
    try { dismissed = localStorage.getItem(DISMISS_KEY) === '1'; } catch {}
    if (isIOSSafari() && !isStandalone() && !dismissed) setShow(true);
  }, []);

  if (!show) return null;

  const dismiss = () => {
    setShow(false);
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch {}
  };

  return (
    <div className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-50 md:hidden" role="dialog" aria-label="Install the app">
      <div className="relative rounded-2xl border border-slate-200 bg-white p-4 pr-12 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start gap-3">
          <Logo size="md" />
          <div>
            <p className="font-semibold">Install on your iPhone</p>
            <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">
              Tap <span className="inline-flex translate-y-0.5 items-center text-sky-600 dark:text-sky-400" aria-label="Share">
                <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v12M8 7l4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" /></svg>
              </span>{' '}
              Share, then <strong>&lsquo;Add to Home Screen&rsquo;</strong>.
            </p>
          </div>
        </div>
        <button type="button" onClick={dismiss} aria-label="Dismiss" className="absolute right-1 top-1 flex size-11 items-center justify-center rounded-full text-xl text-slate-400 active:bg-slate-100 dark:active:bg-slate-800">×</button>
        {/* Arrow pointing down at the Share button in Safari's bottom toolbar */}
        <div className="absolute -bottom-2 left-1/2 size-4 -translate-x-1/2 rotate-45 border-r border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900" />
      </div>
    </div>
  );
}
