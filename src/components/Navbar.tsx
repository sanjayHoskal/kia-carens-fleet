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
  ShieldCheck, 
  UserCheck, 
  CheckCircle2, 
  Menu, 
  X,
  Sun,
  Moon,
  LogOut,
  Lock,
  RefreshCw,
  Cloud
} from 'lucide-react';
import { store } from '@/lib/store';
import { PartnerUser } from '@/lib/types';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<PartnerUser | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>('');

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
    };

    syncAuth();

    const savedTheme = store.getTheme();
    setTheme(savedTheme);
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(savedTheme);

    window.addEventListener('kc_auth_change', syncAuth);
    return () => window.removeEventListener('kc_auth_change', syncAuth);
  }, []);

  const handleSwitchUser = (user: PartnerUser) => {
    store.setCurrentUser(user);
    setCurrentUser(user);
    store.addAuditLog('Switched Active Session', `Session switched to ${user}`);
    window.location.reload();
  };

  const handleLogout = () => {
    store.logout();
    if (currentUser) {
      store.addAuditLog('User Logged Out', `${currentUser} logged out`);
    }
    router.push('/login');
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    store.setTheme(nextTheme);
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(nextTheme);
  };

  const isLoginPage = pathname === '/login';
  const isSignPage = pathname?.startsWith('/sign/');
  const showNavControls = isLoggedIn && !isLoginPage && !isSignPage;

  const navLinks = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/bookings', label: 'Bookings', icon: CalendarCheck2 },
    { href: '/expenses', label: 'Expenses & OCR', icon: Receipt },
    { href: '/analytics', label: 'P&L Reports', icon: TrendingUp },
    { href: '/audit', label: 'Audit Log', icon: ShieldCheck },
  ];

  return (
    <header className="sticky top-0 z-50 glass-card border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
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
              <p className="text-[11px] text-slate-400">Sanjay & Sachin Fleet Ledger</p>
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
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
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
            
            {/* Theme Toggle Switch */}
            <button
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all flex items-center justify-center"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-sky-500" />}
            </button>

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

                {/* User Toggle */}
                <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl">
                  <button
                    onClick={() => handleSwitchUser('Sanjay P')}
                    className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      currentUser === 'Sanjay P'
                        ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    <span>Sanjay P</span>
                  </button>
                  <button
                    onClick={() => handleSwitchUser('Sachin')}
                    className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      currentUser === 'Sachin'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    <span>Sachin</span>
                  </button>
                  <button
                    onClick={() => handleSwitchUser('Admin')}
                    className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      currentUser === 'Admin'
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Lock className="h-3.5 w-3.5" />
                    <span>Admin</span>
                  </button>
                </div>

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
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-sky-500" />}
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white"
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
                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                    : 'text-slate-400 hover:bg-slate-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}

          <div className="pt-3 border-t border-slate-800 space-y-3">
            <p className="text-xs text-slate-400">Switch Active Account:</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleSwitchUser('Sanjay P')}
                className={`py-2 rounded-lg text-xs font-semibold text-center border ${
                  currentUser === 'Sanjay P'
                    ? 'bg-sky-600 border-sky-500 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                Sanjay P
              </button>
              <button
                onClick={() => handleSwitchUser('Sachin')}
                className={`py-2 rounded-lg text-xs font-semibold text-center border ${
                  currentUser === 'Sachin'
                    ? 'bg-emerald-600 border-emerald-500 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                Sachin
              </button>
              <button
                onClick={() => handleSwitchUser('Admin')}
                className={`py-2 rounded-lg text-xs font-semibold text-center border ${
                  currentUser === 'Admin'
                    ? 'bg-purple-600 border-purple-500 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                Admin
              </button>
            </div>
            
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
    </header>
  );
}
