// Helpers for running as an iPhone Home Screen app

export const isIOS = () => {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

// Safari itself (not Chrome / Firefox / Edge for iOS, which cannot add web apps the same way)
export const isIOSSafari = () => isIOS() && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(navigator.userAgent);

// true when opened from the Home Screen icon
export const isStandalone = () => {
  if (typeof window === 'undefined') return false;
  return window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
};

export const pushSupported = () =>
  typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

// Unread reminder count on the app icon (iOS 16.4+ Home Screen apps, Chrome, Edge)
export function setAppBadge(count) {
  try {
    if (count > 0) navigator.setAppBadge?.(count)?.catch?.(() => {});
    else navigator.clearAppBadge?.()?.catch?.(() => {});
  } catch {}
}

// VAPID public key (base64url) -> Uint8Array for pushManager.subscribe
export function urlBase64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}
