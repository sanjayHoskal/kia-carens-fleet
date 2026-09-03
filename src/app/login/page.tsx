'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Car, Lock, ShieldCheck, UserCheck, KeyRound, ArrowRight, CheckCircle2 } from 'lucide-react';
import { store } from '@/lib/store';
import { PartnerUser } from '@/lib/types';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams?.get('redirect') || '/';

  const [passcode, setPasscode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) {
      setErrorMsg('Please enter the admin passcode.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg('');

    if (passcode.trim() !== '9876') {
      setErrorMsg('Incorrect passcode. Please enter valid admin passcode.');
      setIsSubmitting(false);
      return;
    }

    setTimeout(() => {
      store.setCurrentUser('Admin');
      router.replace(redirectTarget);
    }, 200);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        
        {/* Logo Banner */}
        <div className="text-center space-y-3">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-tr from-sky-500 to-emerald-400 p-0.5 shadow-xl shadow-sky-500/20">
            <div className="h-full w-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Car className="h-8 w-8 text-sky-400" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Kia Carens Fleet Ledger</h1>
            <p className="text-xs text-slate-400 mt-1">Vehicle KA09MK6792 • Admin Portal</p>
          </div>
        </div>

        {/* Login Form Box */}
        <div className="glass-card p-6 sm:p-8 rounded-2xl border-slate-800 space-y-6 bg-slate-900/60 backdrop-blur-xl">
          
          <div className="border-b border-slate-800 pb-4 text-center">
            <div className="inline-flex p-3 rounded-2xl bg-purple-950/80 border border-purple-800 text-purple-400 mb-3">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white">
              Admin Portal Login
            </h2>
            <p className="text-xs text-slate-400 mt-1">Enter your admin passcode to access full fleet management</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5 text-xs">
            
            {/* Passcode Input */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1.5">Admin Passcode *</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  autoFocus
                  placeholder="Enter passcode"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-3 text-white pl-10 focus:outline-none focus:border-purple-500 font-mono text-base tracking-widest text-center"
                />
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-400 font-semibold text-center bg-rose-950/60 p-2.5 rounded-lg border border-rose-800 animate-shake">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !passcode.trim()}
              className={`w-full py-3.5 rounded-xl font-bold text-sm text-white shadow-lg transition-all flex items-center justify-center space-x-2 ${
                !passcode.trim() ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' :
                'bg-purple-600 hover:bg-purple-500 shadow-purple-600/30'
              }`}
            >
              <span>{isSubmitting ? 'Verifying...' : 'Unlock Admin Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

        </div>

        <div className="text-center text-[11px] text-slate-500">
          Kia Carens KA09MK6792 Fleet Ledger System
        </div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <p className="text-xs text-slate-400 font-semibold">Loading Login Portal...</p>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
