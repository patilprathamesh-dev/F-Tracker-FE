// Makes the app installable as a desktop app (Chrome / Edge: "Install app" or "Create shortcut")
export default function manifest() {
  return {
    name: 'Finance Tracker',
    short_name: 'Finance',
    description: 'Track money given, monthly interest and payment reminders',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f6f7f9',
    theme_color: '#0f766e',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Reminders', url: '/reminders', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
      { name: 'People', url: '/persons', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
    ],
  };
}
