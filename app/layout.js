import './globals.css';
import Nav from '@/components/Nav';

export const metadata = {
  title: 'Finance Tracker',
  description: 'Track money given, monthly interest and payment reminders',
  applicationName: 'Finance Tracker',
  appleWebApp: { capable: true, title: 'Finance', statusBarStyle: 'default' },
  icons: { apple: '/icons/apple-touch-icon.png' },
};

export const viewport = {
  themeColor: '#0f766e',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
