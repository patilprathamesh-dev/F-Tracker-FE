'use client';

import { useEffect, useRef, useState } from 'react';
import { isStandalone } from '@/lib/pwa';
import { cn } from './ui';

const TRIGGER = 70; // px to pull before it refreshes

/**
 * Pull down at the top of the page to refresh (only in the installed app,
 * where Safari's own pull-to-reload is not available). No library.
 */
export default function PullToRefresh({ onRefresh }) {
  const [pull, setPull] = useState(0);
  const [busy, setBusy] = useState(false);
  const start = useRef(null);
  const pullRef = useRef(0);
  const refreshRef = useRef(onRefresh);
  refreshRef.current = onRefresh;

  useEffect(() => {
    if (!isStandalone()) return;
    const onStart = (e) => {
      start.current = window.scrollY <= 0 && !document.body.style.overflow ? e.touches[0].clientY : null;
    };
    const onMove = (e) => {
      if (start.current == null) return;
      const dy = e.touches[0].clientY - start.current;
      pullRef.current = dy > 0 ? Math.min(dy * 0.5, 110) : 0;
      setPull(pullRef.current);
    };
    const onEnd = async () => {
      const shouldRefresh = pullRef.current >= TRIGGER;
      start.current = null;
      pullRef.current = 0;
      setPull(0);
      if (!shouldRefresh) return;
      setBusy(true);
      try { await refreshRef.current(); } finally { setBusy(false); }
    };
    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd);
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, []);

  if (!pull && !busy) return null;
  const ready = pull >= TRIGGER;
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-[calc(3.75rem+env(safe-area-inset-top))] z-30 flex justify-center"
      style={{ transform: `translateY(${busy ? 16 : pull / 2}px)` }}
      aria-live="polite"
    >
      <div className="flex size-10 items-center justify-center rounded-full bg-white shadow-md dark:bg-slate-800">
        <svg
          viewBox="0 0 24 24"
          className={cn('size-5 text-brand transition-transform dark:text-brand-light', busy && 'animate-spin', ready && !busy && 'rotate-180')}
          fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
        >
          {busy ? <path d="M21 12a9 9 0 1 1-6.2-8.56" /> : <path d="M12 5v14M6 13l6 6 6-6" />}
        </svg>
        <span className="sr-only">{busy ? 'Refreshing' : ready ? 'Release to refresh' : 'Pull to refresh'}</span>
      </div>
    </div>
  );
}
