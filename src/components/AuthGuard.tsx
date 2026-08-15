'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { store } from '@/lib/store';
import { Loader2, Lock } from 'lucide-react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const isPublic = pathname === '/login' || pathname?.startsWith('/sign/');
      const loggedIn = store.isLoggedIn();

      if (isPublic) {
        if (pathname === '/login' && loggedIn) {
          router.replace('/');
          return;
        }
        setIsAuthorized(true);
        setChecking(false);
        return;
      }

      if (!loggedIn) {
        setIsAuthorized(false);
        setChecking(false);
        const redirectUrl = pathname ? `/login?redirect=${encodeURIComponent(pathname)}` : '/login';
        router.replace(redirectUrl);
      } else {
        setIsAuthorized(true);
        setChecking(false);
      }
    };

    checkAuth();

    const handleAuthChange = () => checkAuth();
    window.addEventListener('kc_auth_change', handleAuthChange);
    return () => window.removeEventListener('kc_auth_change', handleAuthChange);
  }, [pathname, router]);

  if (checking) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 space-y-3">
        <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
        <p className="text-xs text-slate-400 font-semibold">Verifying Passcode Session Security...</p>
      </div>
    );
  }

  if (!isAuthorized && pathname !== '/login' && !pathname?.startsWith('/sign/')) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 space-y-4">
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-3 max-w-sm shadow-xl">
          <div className="w-12 h-12 rounded-xl bg-rose-950/80 text-rose-400 border border-rose-800 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-white">Authentication Required</h2>
          <p className="text-xs text-slate-400">Passcode authentication is mandatory to view the Kia Carens fleet ledger.</p>
          <button
            onClick={() => router.replace(pathname ? `/login?redirect=${encodeURIComponent(pathname)}` : '/login')}
            className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-all shadow-lg shadow-sky-600/30"
          >
            Go to Login Portal
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
