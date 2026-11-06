'use client';

import { useEffect, useState } from 'react';

/** "You're offline" bar when the phone has no connection or the backend can't be reached */
export default function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if (!navigator.onLine) setOffline(true);
    const down = () => setOffline(true);
    const up = () => setOffline(false);
    window.addEventListener('offline', down);
    window.addEventListener('api-offline', down);
    window.addEventListener('online', up);
    window.addEventListener('api-online', up);
    return () => {
      window.removeEventListener('offline', down);
      window.removeEventListener('api-offline', down);
      window.removeEventListener('online', up);
      window.removeEventListener('api-online', up);
    };
  }, []);

  if (!offline) return null;
  return (
    <div role="status" className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-30 flex items-center justify-center gap-2 bg-slate-800 px-4 py-2 text-sm font-medium text-white md:top-16 dark:bg-slate-700">
      <svg viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M2 2l20 20M8.5 16.4a5 5 0 0 1 7 0M5 12.9a10 10 0 0 1 5.2-2.7M19 12.9a10 10 0 0 0-2.3-1.7M2 8.8a15 15 0 0 1 4.2-2.5M22 8.8A15 15 0 0 0 11.2 5M12 20h.01" /></svg>
      You&apos;re offline. The numbers may be out of date.
    </div>
  );
}
