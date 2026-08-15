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

  const [selectedUser, setSelectedUser] = useState<PartnerUser>('Admin');
  const [passcode, setPasscode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const PASSCODES: Record<PartnerUser, string> = {
    'Admin': '9876',
    'Sanjay P': '0707',
    'Sachin': '1906',
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) {
      setErrorMsg('Passcode is required to log in.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg('');

    const expectedPasscode = PASSCODES[selectedUser];
    if (passcode.trim() !== expectedPasscode) {
      setErrorMsg(`Incorrect passcode for ${selectedUser}. Please enter valid passcode.`);
      setIsSubmitting(false);
      return;
    }

    setTimeout(() => {
      store.setCurrentUser(selectedUser);
      store.addAuditLog('User Login', `${selectedUser} logged into Kia Carens Fleet Management System`);
      router.replace(redirectTarget);
    }, 300);
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
            <p className="text-xs text-slate-400 mt-1">Vehicle KA09MK6792 • Secure Auth Portal</p>
          </div>
        </div>

        {/* Login Form Box */}
        <div className="glass-card p-6 sm:p-8 rounded-2xl border-slate-800 space-y-6 bg-slate-900/60 backdrop-blur-xl">
          
          <div className="border-b border-slate-800 pb-4 text-center">
            <h2 className="text-base font-bold text-white flex items-center justify-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Secure Account Login
            </h2>
            <p className="text-xs text-slate-400 mt-1">Passcode verification required for all accounts</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5 text-xs">
            
            {/* User Select Cards */}
            <div className="space-y-2">
              <label className="block text-slate-400 font-semibold mb-1">Select Account Role</label>
              
              <div className="grid grid-cols-1 gap-2.5">
                
                {/* Admin */}
                <button
                  type="button"
                  onClick={() => { setSelectedUser('Admin'); setPasscode(''); setErrorMsg(''); }}
                  className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                    selectedUser === 'Admin'
                      ? 'bg-purple-950/80 border-purple-500 text-white shadow-lg shadow-purple-600/20'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${selectedUser === 'Admin' ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white">Admin Master Login</div>
                      <div className="text-[11px] text-slate-400">Full Fleet Control & Management</div>
                    </div>
                  </div>
                  {selectedUser === 'Admin' && <CheckCircle2 className="w-5 h-5 text-purple-400" />}
                </button>

                {/* Sanjay P */}
                <button
                  type="button"
                  onClick={() => { setSelectedUser('Sanjay P'); setPasscode(''); setErrorMsg(''); }}
                  className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                    selectedUser === 'Sanjay P'
                      ? 'bg-sky-950/80 border-sky-500 text-white shadow-lg shadow-sky-600/20'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${selectedUser === 'Sanjay P' ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white">Sanjay P</div>
                      <div className="text-[11px] text-slate-400">Co-Owner & Fleet Partner</div>
                    </div>
                  </div>
                  {selectedUser === 'Sanjay P' && <CheckCircle2 className="w-5 h-5 text-sky-400" />}
                </button>

                {/* Sachin */}
                <button
                  type="button"
                  onClick={() => { setSelectedUser('Sachin'); setPasscode(''); setErrorMsg(''); }}
                  className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                    selectedUser === 'Sachin'
                      ? 'bg-emerald-950/80 border-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${selectedUser === 'Sachin' ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white">Sachin</div>
                      <div className="text-[11px] text-slate-400">Co-Owner & Fleet Partner</div>
                    </div>
                  </div>
                  {selectedUser === 'Sachin' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                </button>

              </div>
            </div>

            {/* Passcode Input */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Enter Passcode for {selectedUser} *</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="Enter passcode to unlock"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white pl-10 focus:outline-none focus:border-sky-500 font-mono text-sm"
                />
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-400 font-semibold text-center bg-rose-950/60 p-2 rounded-lg border border-rose-800">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !passcode.trim()}
              className={`w-full py-3 rounded-xl font-bold text-sm text-white shadow-lg transition-all flex items-center justify-center space-x-2 ${
                !passcode.trim() ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' :
                selectedUser === 'Admin' ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/30' :
                selectedUser === 'Sanjay P' ? 'bg-sky-600 hover:bg-sky-500 shadow-sky-600/30' :
                'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
              }`}
            >
              <span>{isSubmitting ? 'Logging in...' : `Log In as ${selectedUser}`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

        </div>

        <div className="text-center text-[11px] text-slate-500">
          Kia Carens KA09MK6792 Partnership Ledger System
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
