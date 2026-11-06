'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { isIOS, isStandalone, pushSupported, urlBase64ToUint8Array } from '@/lib/pwa';
import { Button, Card } from './ui';

/**
 * "Enable notifications" + "Send test notification".
 * iOS only allows Web Push in apps opened from the Home Screen (iOS 16.4+),
 * and the permission request must come straight from a tap.
 */
export default function PushControls() {
  const [state, setState] = useState('checking'); // checking | hidden | needs-install | off | on | denied
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isStandalone()) return setState(isIOS() ? 'needs-install' : 'hidden');
    if (!pushSupported()) return setState('hidden');
    if (Notification.permission === 'denied') return setState('denied');
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setState(sub && Notification.permission === 'granted' ? 'on' : 'off'))
      .catch(() => setState('off'));
  }, []);

  const enable = async () => {
    setMsg('');
    setBusy(true);
    try {
      // Ask first, directly inside the tap handler (required by iOS)
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') { setState(permission === 'denied' ? 'denied' : 'off'); return; }
      const { publicKey } = await api.get('/push/public-key');
      const reg = await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription())
        || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) }));
      await api.post('/push/subscribe', sub.toJSON());
      setState('on');
      setMsg('Notifications are on. You will get a notification for every new reminder.');
    } catch (e) {
      setMsg(`Could not turn on notifications: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await api.post('/push/unsubscribe', { endpoint: sub.endpoint }).catch(() => {});
        await sub.unsubscribe();
      }
      setState('off');
      setMsg('Notifications are off on this device.');
    } finally {
      setBusy(false);
    }
  };

  const test = async () => {
    setMsg('');
    setBusy(true);
    try {
      const r = await api.post('/push/test');
      setMsg(`${r.message}. It should appear in a few seconds.`);
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (state === 'checking' || state === 'hidden') return null;

  return (
    <Card className="mb-4">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-teal-50 text-brand dark:bg-teal-950 dark:text-brand-light">
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Notifications</p>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {state === 'needs-install' && 'To get reminder notifications on your iPhone, add this app to your Home Screen (Share → Add to Home Screen) and open it from there.'}
            {state === 'off' && 'Get a notification on this iPhone when a payment is coming up or overdue.'}
            {state === 'on' && 'On for this device.'}
            {state === 'denied' && 'Notifications are blocked. Turn them on in Settings → Notifications → Finance.'}
          </p>
        </div>
      </div>
      {(state === 'off' || state === 'on') && (
        <div className="mt-3 flex flex-wrap gap-2">
          {state === 'off' && <Button onClick={enable} disabled={busy}>{busy ? 'Turning on…' : 'Enable notifications'}</Button>}
          {state === 'on' && (
            <>
              <Button onClick={test} disabled={busy}>Send test notification</Button>
              <Button variant="ghost" onClick={disable} disabled={busy}>Turn off</Button>
            </>
          )}
        </div>
      )}
      {msg && <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{msg}</p>}
    </Card>
  );
}
