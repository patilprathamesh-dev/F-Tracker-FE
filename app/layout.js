import './globals.css';
import { Inter } from 'next/font/google';
import AuthGate from '@/components/AuthGate';
import { THEME_SCRIPT } from '@/lib/theme';

// Self-hosted by Next.js: no layout shift, and it works offline after the first load
const inter = Inter({ subsets: ['latin', 'latin-ext'], display: 'swap', variable: '--font-inter' });

// iPhone 15 Plus: 430 x 932 points at 3x = 1290 x 2796 pixels
const IPHONE_15_PLUS = '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)';

export const metadata = {
  title: 'Finance Tracker',
  description: 'Track money given and borrowed, monthly interest and payment reminders',
  applicationName: 'Finance Tracker',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Finance',
    // 'default' = dark time/battery on a light status bar, matching the light glass header
    // ('black-translucent' always draws white text, which would be invisible on a light header)
    statusBarStyle: 'default',
    startupImage: [
      { url: '/splash/iphone-15-plus-dark.png', media: `${IPHONE_15_PLUS} and (prefers-color-scheme: dark)` },
      { url: '/splash/iphone-15-plus-light.png', media: `${IPHONE_15_PLUS} and (prefers-color-scheme: light)` },
      { url: '/splash/iphone-15-plus-light.png', media: IPHONE_15_PLUS },
    ],
  },
  icons: {
    icon: [{ url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  formatDetection: { telephone: false },
  // Next already emits <meta name="mobile-web-app-capable">; older iOS versions still read the apple- one
  other: { 'apple-mobile-web-app-capable': 'yes' },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover', // draw under the Dynamic Island and home indicator; safe-area padding keeps content clear
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#020617' },
  ],
};

export default function RootLayout({ children }) {
  return (
    // suppressHydrationWarning: the theme script adds the "dark" class before React loads
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="font-sans">
        <AuthGate>{children}</AuthGate>
      </body>
    </html>
  );
}
