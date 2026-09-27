'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Car, 
  LayoutDashboard, 
  CalendarCheck2, 
  Receipt, 
  TrendingUp, 
  FolderArchive,
  ShieldCheck, 
  UserCheck, 
  CheckCircle2, 
  Menu, 
  X,
  LogOut,
  Lock,
  RefreshCw,
  Cloud,
  Settings,
  ShieldAlert,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
import { store } from '@/lib/store';
import { PartnerUser, LoanState } from '@/lib/types';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<PartnerUser | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>('');
  
  // Safe System Settings & Danger Zone Modal State
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [loan, setLoan] = useState<LoanState>(store.getLoanState());
  const [resetPrincipal, setResetPrincipal] = useState(1181000);
  const [resetEmi, setResetEmi] = useState(20918);
  const [confirmPhrase, setConfirmPhrase] = useState('');
  const [ackChecked, setAckChecked] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleCloudSync = async () => {
    setIsSyncing(true);
    try {
      await store.fetchAllDataAsync();
      setLastSyncedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (e) {
      console.error('Cloud sync error:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const syncAuth = () => {
      setCurrentUser(store.getCurrentUser());
      setIsLoggedIn(store.isLoggedIn());
      setLoan(store.getLoanState());
    };

    syncAuth();

    // Ensure dark class is always set
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');

    window.addEventListener('kc_auth_change', syncAuth);
    window.addEventListener('kc_data_sync', syncAuth);
    return () => {
      window.removeEventListener('kc_auth_change', syncAuth);
      window.removeEventListener('kc_data_sync', syncAuth);
    };
  }, []);

  const handleExecuteFactoryReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ackChecked || confirmPhrase.trim().toUpperCase() !== 'RESET') {
      alert('Please check the confirmation box and type RESET to execute factory reset.');
      return;
    }

    if (!resetPrincipal || resetPrincipal <= 0) {
      alert('Please enter a valid loan principal amount.');
      return;
    }

    setIsResetting(true);
    try {
      store.resetToFreshState(Number(resetPrincipal), Number(resetEmi));
      setShowSettingsModal(false);
      setConfirmPhrase('');
      setAckChecked(false);
      window.location.reload();
    } catch (err) {
      console.error('Error during factory reset:', err);
      alert('Factory reset failed. Please check network/database connection.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleLogout = () => {
    store.logout();
    if (currentUser) {
      store.addAuditLog('User Logged Out', `${currentUser} logged out`);
    }
    router.push('/login');
  };

  const isLoginPage = pathname === '/login';
  const isSignPage = pathname?.startsWith('/sign/');
  const showNavControls = isLoggedIn && !isLoginPage && !isSignPage;

  const navLinks = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/bookings', label: 'Bookings', icon: CalendarCheck2 },
    { href: '/expenses', label: 'Expenses & OCR', icon: Receipt },
    { href: '/analytics', label: 'P&L Reports', icon: TrendingUp },
    { href: '/documents', label: 'Car Documents', icon: FolderArchive },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand & Vehicle Title */}
          <Link href={isLoginPage ? '#' : '/'} className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-500 to-emerald-400 p-0.5 shadow-lg shadow-sky-500/20">
              <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Car className="h-5 w-5 text-sky-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white tracking-wide text-base">Kia Carens</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-sky-950 text-sky-400 border border-sky-800 font-mono font-semibold">
                  KA09MK6792
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Fleet & Partnership Ledger</p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          {showNavControls && (
            <nav className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Controls Right */}
          <div className="hidden sm:flex items-center space-x-3">

            {/* Cloud Sync Button */}
            {showNavControls && (
              <button
                onClick={handleCloudSync}
                disabled={isSyncing}
                title={lastSyncedTime ? `Last Synced: ${lastSyncedTime}` : 'Sync live data from Supabase'}
                className="px-2.5 py-2 rounded-xl bg-sky-950/80 hover:bg-sky-900 border border-sky-800 text-sky-400 text-xs font-semibold transition-all flex items-center space-x-1.5 shadow-sm"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin text-sky-300' : ''}`} />
                <span className="hidden md:inline">{isSyncing ? 'Syncing...' : 'Sync Cloud'}</span>
              </button>
            )}

            {showNavControls && (
              <>
                {/* ₹0 Free Badge */}
                <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/50 text-[11px] font-medium text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Hosting: ₹0</span>
                </div>

                {/* Admin Role Badge */}
                <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-purple-950/80 border border-purple-800 text-purple-300 text-xs font-semibold shadow-sm">
                  <Lock className="h-3.5 w-3.5 text-purple-400" />
                  <span>Admin</span>
                </div>

                {/* System Settings & Safe Danger Zone Button */}
                <button
                  onClick={() => {
                    const l = store.getLoanState();
                    setLoan(l);
                    setResetPrincipal(l.initialPrincipal);
                    setResetEmi(l.monthlyEmi);
                    setConfirmPhrase('');
                    setAckChecked(false);
                    setShowSettingsModal(true);
                  }}
                  title="System Settings & Maintenance"
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-all flex items-center justify-center"
                >
                  <Settings className="h-4 w-4" />
                </button>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  title="Log out of session"
                  className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-800 transition-all flex items-center justify-center"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            )}

            {isLoginPage && (
              <span className="text-xs px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 font-mono">
                Login Portal
              </span>
            )}
          </div>

          {/* Mobile menu trigger */}
          {showNavControls && (
            <div className="flex md:hidden items-center space-x-2">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && showNavControls && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950 px-4 pt-2 pb-4 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive
                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}

          <div className="pt-3 border-t border-slate-800 space-y-3">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                const l = store.getLoanState();
                setLoan(l);
                setResetPrincipal(l.initialPrincipal);
                setResetEmi(l.monthlyEmi);
                setConfirmPhrase('');
                setAckChecked(false);
                setShowSettingsModal(true);
              }}
              className="w-full py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-semibold text-xs flex items-center justify-center space-x-2 hover:bg-slate-850"
            >
              <Settings className="w-4 h-4 text-sky-400" />
              <span>System Settings & Maintenance</span>
            </button>

            <button
              onClick={handleLogout}
              className="w-full py-2.5 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 font-semibold text-xs flex items-center justify-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out Session</span>
            </button>
          </div>
        </div>
      )}

      {/* SAFE SYSTEM SETTINGS & DANGER ZONE MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
          <div className="glass-card w-full max-w-lg p-6 rounded-2xl border-slate-800 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-white">
                <Settings className="w-5 h-5 text-sky-400" />
                <h2 className="text-base font-bold">System Configuration & Maintenance</h2>
              </div>
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Vehicle & Loan Overview */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Car className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-bold text-white">Kia Carens (KA09MK6792)</span>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 font-mono">
                  Cars24 Financed
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                <div>
                  <span className="text-slate-400 block text-[11px]">Remaining Principal</span>
                  <span className="font-bold text-sky-400 font-mono text-sm">
                    ₹{loan.currentPrincipal.toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Monthly EMI</span>
                  <span className="font-bold text-white font-mono text-sm">
                    ₹{loan.monthlyEmi.toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Last Processed EMI</span>
                  <span className="font-medium text-slate-300">
                    {loan.lastDeductedMonth || 'Aug 2026'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Auto 1st-of-Month Rule</span>
                  <span className={`font-semibold ${loan.autoDeductEnabled !== false ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {loan.autoDeductEnabled !== false ? '● Active' : '○ Disabled'}
                  </span>
                </div>
              </div>
            </div>

            {/* Safe Protected Danger Zone */}
            <div className="border border-rose-800/80 bg-rose-950/20 rounded-xl p-4 space-y-4">
              <div className="flex items-start space-x-2 text-rose-400">
                <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-rose-300">
                    Protected Danger Zone: Factory Reset
                  </h3>
                  <p className="text-[11px] text-rose-200/80 mt-0.5 leading-relaxed">
                    Safely isolated from daily operation. Executing Factory Reset will purge all logged bookings, OCR scans, and audit logs. The loan principal and EMI schedule will be re-initialized.
                  </p>
                </div>
              </div>

              <form onSubmit={handleExecuteFactoryReset} className="space-y-3 pt-1 text-xs">
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 text-[11px]">
                      Loan Principal (₹)
                    </label>
                    <input
                      type="number"
                      required
                      value={resetPrincipal || ''}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setResetPrincipal(e.target.value === '' ? ('' as any) : Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 text-[11px]">
                      Monthly EMI (₹)
                    </label>
                    <input
                      type="number"
                      required
                      value={resetEmi || ''}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setResetEmi(e.target.value === '' ? ('' as any) : Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:border-rose-500"
                    />
                  </div>
                </div>

                {/* Safety Checkbox */}
                <label className="flex items-start space-x-2.5 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={ackChecked}
                    onChange={(e) => setAckChecked(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 text-rose-600 focus:ring-rose-500 h-4 w-4 bg-slate-900"
                  />
                  <span className="text-[11px] text-slate-300 select-none">
                    I acknowledge this permanently deletes all booking and expense ledger data.
                  </span>
                </label>

                {/* Confirmation Word Input */}
                <div>
                  <label className="block text-slate-400 mb-1 text-[11px]">
                    Type <span className="font-mono font-bold text-rose-400">RESET</span> to unlock button:
                  </label>
                  <input
                    type="text"
                    placeholder="Type RESET here"
                    value={confirmPhrase}
                    onChange={(e) => setConfirmPhrase(e.target.value)}
                    className="w-full bg-slate-900 border border-rose-900/60 rounded-lg px-3 py-1.5 text-white font-mono text-xs focus:border-rose-500"
                  />
                </div>

                {/* Action Button */}
                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowSettingsModal(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!ackChecked || confirmPhrase.trim().toUpperCase() !== 'RESET' || isResetting}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 shadow-md ${
                      ackChecked && confirmPhrase.trim().toUpperCase() === 'RESET' && !isResetting
                        ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 cursor-pointer'
                        : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                    <span>{isResetting ? 'Resetting...' : 'Execute Factory Reset'}</span>
                  </button>
                </div>
              </form>
            </div>

          </div>
        </div>
      )}

    </header>
  );
}
