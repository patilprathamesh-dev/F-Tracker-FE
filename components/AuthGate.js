'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { api, getToken, NetworkError, setToken } from '@/lib/api';
import Nav from './Nav';
import OfflineBanner from './OfflineBanner';
import InstallCard from './InstallCard';
import { PageSkeleton } from './ui';

const AuthContext = createContext({ user: null, login: () => {}, logout: () => {} });
export const useAuth = () => useContext(AuthContext);

const PUBLIC_PATHS = ['/login'];

/**
 * Checks the saved login token once, then:
 * - no valid token on a private page -> /login
 * - logged in on /login               -> the dashboard
 * The app shell (nav, tab bar) only renders for a logged-in user.
 */
export default function AuthGate({ children }) {
  const path = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(undefined); // undefined = still checking
  const isPublic = PUBLIC_PATHS.includes(path);

  useEffect(() => {
    if (!getToken()) { setUser(null); return; }
    api.get('/auth/me')
      .then(setUser)
      // Server unreachable: keep the saved login and show the offline banner instead of logging out
      .catch((e) => setUser(e instanceof NetworkError ? { email: '', offline: true } : null));
    const onExpired = () => setUser(null);
    window.addEventListener('auth-required', onExpired);
    return () => window.removeEventListener('auth-required', onExpired);
  }, []);

  useEffect(() => {
    if (user === null && !isPublic) router.replace(`/login?next=${encodeURIComponent(path)}`);
    if (user && isPublic) router.replace('/');
  }, [user, isPublic, path, router]);

  const login = useCallback(({ token, user: u }) => { setToken(token); setUser(u); }, []);
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    router.replace('/login');
  }, [router]);

  let content;
  if (isPublic) content = user ? null : children;
  else if (!user) content = <main className="mx-auto max-w-5xl px-4 pt-[calc(1.5rem+env(safe-area-inset-top))]"><PageSkeleton /></main>;
  else {
    content = (
      <>
        <Nav />
        <OfflineBanner />
        <main className="mx-auto max-w-5xl px-4 pt-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] md:px-6 md:pt-6 md:pb-10">
          {children}
        </main>
        <InstallCard />
      </>
    );
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{content}</AuthContext.Provider>;
}
