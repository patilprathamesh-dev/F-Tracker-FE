'use client';

import { useEffect, useState } from 'react';

/**
 * Registers the service worker and shows an "Install app" button
 * when the browser allows installing (Chrome / Edge on Windows, Mac, Linux, Android).
 * Hidden once the app is already running as an installed app.
 */
export default function InstallApp() {
  const [prompt, setPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
    if (window.matchMedia('(display-mode: standalone)').matches) setInstalled(true);

    const onPrompt = (e) => { e.preventDefault(); setPrompt(e); };
    const onInstalled = () => { setInstalled(true); setPrompt(null); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed || !prompt) return null;

  return (
    <button
      className="btn install-btn"
      onClick={async () => {
        prompt.prompt();
        await prompt.userChoice;
        setPrompt(null);
      }}
      title="Install as a desktop app with its own shortcut"
    >
      ⬇ Install app
    </button>
  );
}
