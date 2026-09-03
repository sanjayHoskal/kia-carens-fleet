'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Car, 
  Lock, 
  IndianRupee, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  Receipt, 
  Wallet, 
  Calendar, 
  ArrowRight, 
  Users,
  RotateCcw,
  ShieldAlert,
  X,
  Clock,
  Check,
  Settings,
  Info,
  RefreshCw
} from 'lucide-react';
import { store } from '@/lib/store';
import { Booking, Expense, LoanState, PartnerUser } from '@/lib/types';

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState<PartnerUser>('Sanjay P');
  const [loan, setLoan] = useState<LoanState>(store.getLoanState());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>('');
  const [syncToast, setSyncToast] = useState<string>('');

  // Modals state
  const [showResetModal, setShowResetModal] = useState(false);
  const [showEmiModal, setShowEmiModal] = useState(false);
  const [showForeclosureModal, setShowForeclosureModal] = useState(false);
  const [resetLoanAmount, setResetLoanAmount] = useState(1181000);
  const [resetEmiAmount, setResetEmiAmount] = useState(20918);

  const loadDataFromCloud = async () => {
    setIsSyncing(true);
    const startTime = Date.now();
    const user = store.getCurrentUser();
    if (user) setCurrentUser(user);

    setLoan(store.getLoanState());
    setBookings(store.getBookings());
    setExpenses(store.getExpenses());

    try {
      const res = await store.fetchAllDataAsync();
      setLoan(res.loan);
      setBookings(res.bookings);
      setExpenses(res.expenses);
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSyncedAt(timeStr);

      const totalExpSum = res.expenses.reduce((sum, e) => sum + e.amount, 0);
      setSyncToast(`Live Cloud Synced! Loaded ${res.expenses.length} spendings (₹${totalExpSum.toLocaleString('en-IN')}) & ${res.bookings.length} bookings.`);
      setTimeout(() => setSyncToast(''), 5000);

      const metrics = store.getForeclosureMetrics();
      if (metrics.isForeclosureReady && !res.loan.isForeclosed) {
        setShowForeclosureModal(true);
      }
    } catch (err) {
      console.error('Error fetching dashboard cloud data:', err);
    } finally {
      const elapsed = Date.now() - startTime;
      if (elapsed < 600) {
        await new Promise((r) => setTimeout(r, 600 - elapsed));
      }
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadDataFromCloud();

    const handleSync = () => {
      setLoan(store.getLoanState());
      setBookings(store.getBookings());
      setExpenses(store.getExpenses());
    };

    window.addEventListener('kc_data_sync', handleSync);
    return () => window.removeEventListener('kc_data_sync', handleSync);
  }, []);

  // Foreclosure Metrics
  const foreclosureMetrics = store.getForeclosureMetrics();

  // Helper: current month string (YYYY-MM)
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Filter bookings & expenses to CURRENT CALENDAR MONTH only for monthly P&L
  const currentMonthBookings = bookings.filter((b) => {
    if (b.status === 'Cancelled') return false;
    const bookingMonth = b.createdAt ? b.createdAt.substring(0, 7) : '';
    return bookingMonth === currentMonthStr;
  });
  const actualMonthlyRevenue = currentMonthBookings.reduce((sum, b) => sum + b.totalAmount, 0);
  const displayRevenue = actualMonthlyRevenue;

  const currentMonthExpenses = expenses.filter((e) => {
    const expMonth = e.createdAt ? e.createdAt.substring(0, 7) : '';
    return expMonth === currentMonthStr;
  });
  const monthlyExpenses = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  
  // Rule: Target = ₹21,000 EMI + ₹5,000 Maintenance Retention + Current Month's Operational Expenses
  const emiAmount = loan.monthlyEmi;
  const maintenanceTarget = loan.monthlyMaintenanceTarget;
  const totalFixedTarget = emiAmount + maintenanceTarget; // ₹26,000
  const totalOutflows = monthlyExpenses + totalFixedTarget;

  // Deficit calculation — current month only
  const deficit = Math.max(0, totalOutflows - displayRevenue);
  const partnerSplit = Math.ceil(deficit / 2);

  // All-time totals (for display reference, not used in monthly P&L)
  const allTimeExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Amortization metrics
  const clearedPrincipal = loan.initialPrincipal - loan.currentPrincipal;
  const progressPercent = loan.isForeclosed 
    ? 100 
    : Math.min(100, Math.round((clearedPrincipal / loan.initialPrincipal) * 100));
  const remainingMonths = loan.isForeclosed ? 0 : Math.ceil(loan.currentPrincipal / (loan.monthlyEmi || 1));

  // Maintenance wallet balance
  const maintenanceWalletBalance = Math.min(maintenanceTarget, displayRevenue);

  const activeBooking = bookings.find((b) => b.status === 'Active');

  const handleConfirmFactoryReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetLoanAmount || resetLoanAmount <= 0) {
      alert('Please enter a valid loan principal amount.');
      return;
    }

    store.resetToFreshState(Number(resetLoanAmount), Number(resetEmiAmount));
    setShowResetModal(false);
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between glass-card p-6 rounded-2xl border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-sky-950/40">
        <div className="space-y-1 mb-4 md:mb-0">
          <div className="flex items-center space-x-2">
            <span className="text-xs px-2.5 py-1 rounded-md bg-sky-950 text-sky-400 border border-sky-800 font-semibold">
              Vehicle: Kia Carens (KA09MK6792)
            </span>
            <span className="text-xs px-2.5 py-1 rounded-md bg-purple-950 text-purple-300 border border-purple-800 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Account: Admin
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Partnership & Loan Amortization Dashboard
          </h1>
          <p className="text-sm text-slate-400">
            Real-time financial status, fleet bookings, operational expenses, and Cars24 foreclosure vault.
          </p>
        </div>

        <div className="flex items-center space-x-3 flex-wrap gap-y-2">
          <button
            onClick={loadDataFromCloud}
            disabled={isSyncing}
            className="px-4 py-2.5 rounded-xl bg-sky-950/90 hover:bg-sky-900 border border-sky-800 text-sky-300 font-semibold text-xs transition-all shadow-md flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-sky-400' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : lastSyncedAt ? `Synced (${lastSyncedAt})` : 'Sync Live Cloud'}</span>
          </button>
          <Link
            href="/bookings"
            className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-all shadow-lg shadow-sky-600/30 flex items-center space-x-2"
          >
            <Calendar className="w-4 h-4" />
            <span>Manage Bookings</span>
          </Link>
          <Link
            href="/expenses"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-all border border-slate-700 flex items-center space-x-2"
          >
            <Receipt className="w-4 h-4" />
            <span>Scan Receipt (OCR)</span>
          </Link>
          <button
            onClick={() => {
              setResetLoanAmount(loan.initialPrincipal);
              setResetEmiAmount(loan.monthlyEmi);
              setShowResetModal(true);
            }}
            title="Factory Reset & Set Custom Loan Amount"
            className="p-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800 text-xs transition-all flex items-center gap-1.5 font-semibold"
          >
            <RotateCcw className="w-4 h-4 text-rose-400" />
            <span className="hidden sm:inline">Factory Reset</span>
          </button>
        </div>
      </div>

      {/* Sync Toast Notification */}
      {syncToast && (
        <div className="p-3.5 rounded-xl bg-sky-950/90 border border-sky-600/80 text-sky-200 text-xs font-semibold flex items-center justify-between shadow-lg animate-fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{syncToast}</span>
          </div>
          <button onClick={() => setSyncToast('')} className="text-sky-400 hover:text-white font-bold ml-4">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Grid Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        
        {/* Loan Balance Card */}
        <div className="glass-card p-5 rounded-2xl border-slate-800 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-slate-400">Remaining Loan Balance</span>
              <div className="p-2 rounded-lg bg-sky-950 text-sky-400 border border-sky-800">
                <IndianRupee className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white">
              ₹{loan.currentPrincipal.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Original: ₹{loan.initialPrincipal.toLocaleString('en-IN')} ({loan.tenureMonths} Months)
            </p>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              {loan.autoDeductEnabled !== false ? (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800 font-semibold">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Auto-EMI Active (1st of Mo)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-400 border border-amber-800 font-semibold">
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  Auto-EMI Paused
                </span>
              )}
              <button
                onClick={() => setShowEmiModal(true)}
                className="text-[11px] text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 hover:underline"
              >
                <span>Manage</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Last Deducted: <span className="text-slate-200 font-semibold">{loan.lastDeductedMonth || 'Aug 2026'}</span> (₹{loan.monthlyEmi.toLocaleString('en-IN')})
            </p>
          </div>
        </div>

        {/* Current Revenue */}
        <div className="glass-card p-5 rounded-2xl border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-slate-400">Monthly Fleet Revenue</span>
              <div className="p-2 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-emerald-400">
              ₹{actualMonthlyRevenue.toLocaleString('en-IN')}
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {currentMonthBookings.length} Bookings logged
          </p>
        </div>

        {/* Operational Spendings & Repairs Card */}
        <div className="glass-card p-5 rounded-2xl border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-slate-400">Operational Spendings</span>
              <div className="p-2 rounded-lg bg-rose-950 text-rose-400 border border-rose-800">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-rose-400">
              ₹{monthlyExpenses.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80">
            <span className="text-xs text-slate-400">{currentMonthExpenses.length} Bills This Month</span>
            <Link href="/expenses" className="text-[11px] text-sky-400 hover:underline font-semibold">View All</Link>
          </div>
        </div>

        {/* Maintenance Wallet */}
        <div className="glass-card p-5 rounded-2xl border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-slate-400">Maintenance Retention</span>
              <div className="p-2 rounded-lg bg-amber-950 text-amber-400 border border-amber-800">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-amber-400">
              ₹{maintenanceWalletBalance.toLocaleString('en-IN')}
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Target: ₹5,000 monthly auto-retention
          </p>
        </div>

        {/* Vehicle Fleet Status */}
        <div className="glass-card p-5 rounded-2xl border-slate-800">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-slate-400">Fleet Status</span>
            <div className="p-2 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-800">
              <Car className="w-4 h-4" />
            </div>
          </div>
          {activeBooking ? (
            <div>
              <div className="text-base font-bold text-sky-400 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Active on Trip
              </div>
              <p className="text-xs text-slate-300 font-medium truncate mt-0.5">
                Guest: {activeBooking.guestName}
              </p>
              <p className="text-[11px] text-slate-400">{activeBooking.source}</p>
            </div>
          ) : (
            <div>
              <div className="text-base font-bold text-emerald-400 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                Available for Booking
              </div>
              <p className="text-xs text-slate-400 mt-1">Ready at Garage</p>
            </div>
          )}
        </div>

      </div>

      {/* CORE FEATURE 1: The "No-Profit" Vault & Cars24 Lump-Sum Foreclosure Sinking Fund */}
      <div className={`p-6 rounded-2xl relative overflow-hidden border ${
        loan.isForeclosed 
          ? 'glass-card bg-emerald-950/30 border-emerald-800'
          : foreclosureMetrics.isForeclosureReady 
            ? 'glass-card bg-emerald-950/40 border-emerald-500 shadow-2xl shadow-emerald-500/20'
            : 'glass-card-amber border'
      }`}>
        {/* Foreclosure Alert Notification Banner */}
        {foreclosureMetrics.isForeclosureReady && !loan.isForeclosed && (
          <div className="mb-5 p-4 rounded-xl bg-gradient-to-r from-emerald-950 via-emerald-900 to-sky-950 border border-emerald-500 flex flex-col md:flex-row items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center space-x-3">
              <span className="text-2xl animate-bounce">🎉</span>
              <div>
                <span className="text-sm font-extrabold text-emerald-300 block uppercase tracking-wider">
                  Cars24 Loan Foreclosure Ready!
                </span>
                <p className="text-xs text-emerald-200/90">
                  Accumulated fleet profits (₹{foreclosureMetrics.foreclosureReserve.toLocaleString('en-IN')}) cover the entire remaining Cars24 loan balance (₹{loan.currentPrincipal.toLocaleString('en-IN')}). You can pay off the loan in full at once!
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to execute full 1-time lump-sum loan foreclosure with Cars24? This will update remaining loan balance to ₹0.')) {
                  const updated = store.executeFullLoanForeclosure();
                  setLoan(updated);
                  alert('🎉 Congratulations! Cars24 loan fully foreclosed and cleared. Profit vault unlocked!');
                }
              }}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/30 flex items-center gap-1.5 whitespace-nowrap"
            >
              <CheckCircle2 className="w-4 h-4 text-slate-950" />
              <span>Execute Cars24 Loan Foreclosure</span>
            </button>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-start space-x-3">
            <div className={`p-3 rounded-xl border ${loan.isForeclosed ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-amber-500/20 text-amber-400 border-amber-500/40'}`}>
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white">The "No-Profit" Vault & Cars24 Foreclosure Fund</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                  loan.isForeclosed 
                    ? 'bg-emerald-950 text-emerald-400 border-emerald-800' 
                    : 'bg-amber-950 text-amber-400 border-amber-800'
                }`}>
                  {loan.isForeclosed ? 'UNLOCKED / FORECLOSED' : 'LOCKED FOR FORECLOSURE'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {loan.isForeclosed 
                  ? 'Cars24 loan principal is ₹0! Full profit distribution between Sanjay P & Sachin is unlocked.'
                  : `Cars24 Rule: Partial monthly principal payoff (e.g. ₹50k) is not permitted. All net profits accumulate in the Sinking Fund until full lump-sum payoff (₹${loan.currentPrincipal.toLocaleString('en-IN')}) is reached.`}
              </p>
            </div>
          </div>

          {/* Cash Out Button */}
          <div className="relative group">
            <button
              disabled={!loan.isForeclosed}
              onClick={() => {
                if (loan.isForeclosed) {
                  alert(`Profit distribution of ₹${foreclosureMetrics.foreclosureReserve.toLocaleString('en-IN')} ready for 50:50 partner payout!`);
                }
              }}
              className={`w-full md:w-auto px-5 py-3 rounded-xl font-bold text-xs border flex items-center justify-center space-x-2 transition-all ${
                loan.isForeclosed 
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-600/30 cursor-pointer' 
                  : 'bg-slate-800/80 text-slate-500 border-slate-700 cursor-not-allowed opacity-60'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>{loan.isForeclosed ? 'Cash-Out / Profit Distribution' : 'Profit Distribution (Locked)'}</span>
            </button>
            {!loan.isForeclosed && (
              <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-72 p-3 bg-slate-900 text-amber-300 text-xs rounded-xl shadow-xl border border-amber-900 z-20">
                <p className="font-semibold text-amber-200 mb-1">🔒 Profit Vault Locked for Cars24 Foreclosure</p>
                <p className="text-[11px] leading-relaxed">
                  Earnings are retained in the Cars24 Sinking Fund until accumulated profits reach ₹{loan.currentPrincipal.toLocaleString('en-IN')} for 1-time full loan foreclosure.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Cars24 Foreclosure Sinking Fund Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-emerald-300">
              Accumulated Sinking Fund: ₹{foreclosureMetrics.foreclosureReserve.toLocaleString('en-IN')} ({foreclosureMetrics.progressPercent}%)
            </span>
            <span className="text-slate-300">
              Remaining Cars24 Loan: ₹{loan.currentPrincipal.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-sky-500 via-emerald-400 to-emerald-300 rounded-full transition-all duration-700 shadow-md shadow-emerald-500/50"
              style={{ width: `${foreclosureMetrics.progressPercent}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 pt-1">
            <span>Loan Start: ₹{(loan.initialPrincipal / 100000).toFixed(2)} Lakhs</span>
            <span>Gap to Foreclosure: ₹{foreclosureMetrics.remainingGap.toLocaleString('en-IN')}</span>
            <span>Target: 1-Time Cars24 Lump-Sum Payoff</span>
          </div>
        </div>
      </div>

      {/* Bookings & Operational Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Bookings List */}
        <div className="glass-card p-5 rounded-2xl border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-400" />
              Recent Fleet Bookings
            </h3>
            <Link href="/bookings" className="text-xs text-sky-400 hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {bookings.length > 0 ? (
            <div className="space-y-3">
              {bookings.slice(0, 3).map((b) => (
                <div key={b.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-slate-100 text-sm">{b.guestName}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        b.source === 'Zoomcar' ? 'bg-purple-950 text-purple-300 border border-purple-800' :
                        b.source === 'Retail Dealer' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                        'bg-sky-950 text-sky-300 border border-sky-800'
                      }`}>
                        {b.source}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{b.guestPhone} • {b.status}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-400 text-sm">₹{b.totalAmount.toLocaleString('en-IN')}</span>
                    <span className="text-[10px] text-slate-400 block">{new Date(b.startDate).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl">
              <p className="text-xs text-slate-400">No bookings created yet.</p>
              <Link href="/bookings" className="text-xs text-sky-400 hover:underline font-semibold mt-1 inline-block">
                + Create First Booking
              </Link>
            </div>
          )}
        </div>

        {/* Financial Retention Flow Card */}
        <div className="glass-card p-5 rounded-2xl border-slate-800 space-y-4">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Wallet className="w-4 h-4 text-amber-400" />
            ₹5,000 Maintenance Retention Flow
          </h3>
          
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="text-slate-400">Step 1: Fleet Revenue Generated</span>
              <span className="font-bold text-emerald-400">₹{actualMonthlyRevenue.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="text-amber-300 font-medium">Step 2: Auto Retention to Wallet</span>
              <span className="font-bold text-amber-400">₹{maintenanceWalletBalance.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sky-300 font-medium">Step 3: Available for EMI Payoff</span>
              <span className="font-bold text-sky-400">₹{Math.max(0, actualMonthlyRevenue - maintenanceWalletBalance).toLocaleString('en-IN')}</span>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Rule 3 Enforcement: Out of total monthly revenue, the first ₹5,000 automatically routes to the digital "Maintenance Wallet" balance before evaluating EMI payoff.
          </p>
        </div>

      </div>

      {/* FACTORY RESET CAUTION MODAL */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="glass-card w-full max-w-md p-6 rounded-2xl border-rose-500/40 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-rose-400">
                <ShieldAlert className="w-6 h-6" />
                <h2 className="text-lg font-bold text-white">Factory Reset & Initial Setup</h2>
              </div>
              <button onClick={() => setShowResetModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl space-y-1">
              <span className="text-xs font-bold text-rose-300 block uppercase tracking-wider">
                ⚠️ Caution: Data Reset Notice
              </span>
              <p className="text-xs text-rose-200/90 leading-relaxed">
                Performing a Factory Reset will purge all logged bookings, OCR receipt scans, and audit logs. The loan balance will be re-initialized from scratch.
              </p>
            </div>

            <form onSubmit={handleConfirmFactoryReset} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Initial Vehicle Loan Principal Amount (₹)
                </label>
                <input
                  type="number"
                  required
                  value={resetLoanAmount}
                  onChange={(e) => setResetLoanAmount(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:border-rose-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">Default pre-filled: ₹11,81,000</p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Monthly EMI Amount (₹)
                </label>
                <input
                  type="number"
                  required
                  value={resetEmiAmount}
                  onChange={(e) => setResetEmiAmount(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:border-rose-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">Default pre-filled: ₹21,000</p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-lg shadow-rose-600/30 flex items-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Confirm Factory Reset</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Automated EMI & Amortization Management Modal */}
      {showEmiModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-xl w-full space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-sky-950 text-sky-400 border border-sky-800">
                  <Clock className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Automated EMI Reduction & Amortization</h3>
                  <p className="text-xs text-slate-400">1st-of-month automatic loan principal payoff tracking</p>
                </div>
              </div>
              <button
                onClick={() => setShowEmiModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current EMI Status Card */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Monthly EMI</span>
                <span className="text-base font-bold text-white font-mono">₹{loan.monthlyEmi.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Remaining Balance</span>
                <span className="text-base font-bold text-sky-400 font-mono">₹{loan.currentPrincipal.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Last Deducted Month</span>
                <span className="text-xs font-semibold text-slate-200">{loan.lastDeductedMonth || 'Aug 2026'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Schedule Rule</span>
                <span className="text-xs font-semibold text-emerald-400">Every 1st of Month</span>
              </div>
            </div>

            {/* Automation Controls */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Automated Deduction Controls</h4>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-white block">Auto 1st-of-Month EMI Deduction</span>
                  <p className="text-[11px] text-slate-400">Automatically subtracts ₹{loan.monthlyEmi.toLocaleString('en-IN')} on the 1st of every month</p>
                </div>
                <button
                  onClick={() => {
                    const newStatus = !loan.autoDeductEnabled;
                    const updated = store.toggleAutoDeduct(newStatus);
                    setLoan(updated);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    loan.autoDeductEnabled !== false
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800 hover:bg-emerald-900'
                      : 'bg-rose-950 text-rose-300 border-rose-800 hover:bg-rose-900'
                  }`}
                >
                  {loan.autoDeductEnabled !== false ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-white block">Manual Instant EMI Payoff</span>
                  <p className="text-[11px] text-slate-400">Immediately deduct ₹{loan.monthlyEmi.toLocaleString('en-IN')} from loan balance now</p>
                </div>
                <button
                  onClick={() => {
                    if (confirm(`Deduct ₹${loan.monthlyEmi.toLocaleString('en-IN')} from remaining loan balance right now?`)) {
                      const updated = store.manuallyTriggerEmiDeduction();
                      setLoan(updated);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-600/30 flex items-center gap-1"
                >
                  <IndianRupee className="w-3.5 h-3.5" />
                  <span>Deduct Now</span>
                </button>
              </div>
            </div>

            {/* Information Notice */}
            <div className="p-3 bg-sky-950/40 border border-sky-800/60 rounded-xl flex items-start space-x-2 text-xs">
              <Info className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
              <p className="text-sky-200/90 leading-relaxed text-[11px]">
                The app automatically tracks EMI deductions month-by-month. Next automatic deduction will apply on the 1st of next month or when the app is launched in a new month.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowEmiModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cars24 Full Loan Foreclosure Alert Modal */}
      {showForeclosureModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950/80 border border-emerald-500 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl relative text-center">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 rounded-full flex items-center justify-center mx-auto text-3xl animate-bounce">
              🎉
            </div>

            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-950 text-emerald-300 border border-emerald-800 inline-block uppercase tracking-wider">
                Cars24 Loan Foreclosure Threshold Met!
              </span>
              <h3 className="text-xl font-black text-white">Sufficient Funds to Foreclose Cars24 Loan!</h3>
              <p className="text-xs text-slate-300">
                Your accumulated fleet profits from bookings have reached the required amount to clear your remaining Cars24 loan in a single 1-time lump-sum payment.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-950/90 border border-slate-800 text-left text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Accumulated Sinking Fund</span>
                <span className="text-base font-bold text-emerald-400 font-mono">₹{foreclosureMetrics.foreclosureReserve.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Remaining Cars24 Loan</span>
                <span className="text-base font-bold text-sky-400 font-mono">₹{loan.currentPrincipal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => {
                  const updated = store.executeFullLoanForeclosure();
                  setLoan(updated);
                  setShowForeclosureModal(false);
                  alert('🎉 Congratulations! Cars24 loan principal is fully foreclosed and cleared. Profit vault unlocked!');
                }}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
                <span>Execute 1-Time Lump-Sum Cars24 Foreclosure</span>
              </button>

              <button
                onClick={() => setShowForeclosureModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700"
              >
                Remind Me Later
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
