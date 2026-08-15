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
  X
} from 'lucide-react';
import { store } from '@/lib/store';
import { Booking, Expense, LoanState, PartnerUser } from '@/lib/types';

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState<PartnerUser>('Sanjay P');
  const [loan, setLoan] = useState<LoanState>(store.getLoanState());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Simulator state for revenue
  const [simulatedRevenue, setSimulatedRevenue] = useState<number | null>(null);

  // Factory Reset Modal State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetLoanAmount, setResetLoanAmount] = useState(1181000);
  const [resetEmiAmount, setResetEmiAmount] = useState(21000);

  useEffect(() => {
    const user = store.getCurrentUser();
    if (user) setCurrentUser(user);
    setLoan(store.getLoanState());
    setBookings(store.getBookings());
    setExpenses(store.getExpenses());
  }, []);

  // Compute monthly metrics
  const currentMonthBookings = bookings.filter((b) => b.status !== 'Cancelled');
  const actualMonthlyRevenue = currentMonthBookings.reduce((sum, b) => sum + b.totalAmount, 0);
  
  const displayRevenue = simulatedRevenue !== null ? simulatedRevenue : actualMonthlyRevenue;
  
  const monthlyExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  
  // Rule: Target = ₹21,000 EMI + ₹5,000 Maintenance Retention
  const emiAmount = loan.monthlyEmi;
  const maintenanceTarget = loan.monthlyMaintenanceTarget;
  const totalRequiredTarget = emiAmount + maintenanceTarget; // ₹26,000

  // Deficit calculation
  const deficit = Math.max(0, totalRequiredTarget - displayRevenue);
  const partnerSplit = Math.ceil(deficit / 2);

  // Amortization metrics
  const clearedPrincipal = loan.initialPrincipal - loan.currentPrincipal;
  const progressPercent = Math.min(100, Math.round((clearedPrincipal / loan.initialPrincipal) * 100));
  const remainingMonths = Math.ceil(loan.currentPrincipal / (loan.monthlyEmi || 1));

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
            <span className="text-xs px-2.5 py-1 rounded-md bg-emerald-950 text-emerald-400 border border-emerald-800 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Partner Account: {currentUser}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Partnership & Loan Amortization Dashboard
          </h1>
          <p className="text-sm text-slate-400">
            Real-time financial status, out-of-pocket split calculator, and No-Profit vault lock.
          </p>
        </div>

        <div className="flex items-center space-x-3">
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

      {/* Grid Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Loan Balance Card */}
        <div className="glass-card p-5 rounded-2xl border-slate-800 relative overflow-hidden">
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

        {/* Current Revenue */}
        <div className="glass-card p-5 rounded-2xl border-slate-800">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-slate-400">Monthly Fleet Revenue</span>
            <div className="p-2 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            ₹{actualMonthlyRevenue.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {currentMonthBookings.length} Bookings logged
          </p>
        </div>

        {/* Maintenance Wallet */}
        <div className="glass-card p-5 rounded-2xl border-slate-800">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-slate-400">Maintenance Retention Wallet</span>
            <div className="p-2 rounded-lg bg-amber-950 text-amber-400 border border-amber-800">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-400">
            ₹{maintenanceWalletBalance.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-slate-400 mt-1">
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

      {/* CORE FEATURE 1: The "No-Profit" Vault (Lock Feature) */}
      <div className="glass-card-amber p-6 rounded-2xl relative overflow-hidden border">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-start space-x-3">
            <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-amber-200">The "No-Profit" Vault</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-950 text-amber-400 border border-amber-800">
                  LOCKED
                </span>
              </div>
              <p className="text-xs text-amber-300/80 mt-0.5">
                Partnership Rule: Profit distribution is strictly disabled until the total ₹{loan.initialPrincipal.toLocaleString('en-IN')} loan principal balance reaches ₹0.
              </p>
            </div>
          </div>

          {/* Cash Out Button (Visually Disabled) */}
          <div className="relative group">
            <button
              disabled
              className="w-full md:w-auto px-5 py-3 rounded-xl bg-slate-800/80 text-slate-500 font-bold text-xs border border-slate-700 cursor-not-allowed flex items-center justify-center space-x-2 opacity-60"
            >
              <Lock className="w-4 h-4 text-amber-500" />
              <span>Cash-Out / Profit Distribution (Locked)</span>
            </button>
            <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-72 p-3 bg-slate-900 text-amber-300 text-xs rounded-xl shadow-xl border border-amber-900 z-20">
              <p className="font-semibold text-amber-200 mb-1">🔒 Profit Vault is Locked</p>
              <p className="text-[11px] leading-relaxed">
                As per partnership terms for Kia Carens KA09MK6792, all earnings prioritize the ₹{loan.monthlyEmi.toLocaleString('en-IN')} EMI and ₹5,000 maintenance fund until the principal is ₹0.
              </p>
            </div>
          </div>
        </div>

        {/* Amortization Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-amber-200">Principal Cleared: ₹{clearedPrincipal.toLocaleString('en-IN')} ({progressPercent}%)</span>
            <span className="text-slate-400">Remaining Loan: ₹{loan.currentPrincipal.toLocaleString('en-IN')} (~{remainingMonths} months)</span>
          </div>
          <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-amber-950">
            <div
              className="h-full bg-gradient-to-r from-amber-600 via-amber-500 to-emerald-400 rounded-full transition-all duration-700 shadow-md shadow-amber-500/50"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 pt-1">
            <span>Loan Start: ₹{(loan.initialPrincipal / 100000).toFixed(2)} Lakhs ({loan.tenureMonths} Months)</span>
            <span>EMI: ₹{loan.monthlyEmi.toLocaleString('en-IN')} / month</span>
            <span>Goal: ₹0 Principal</span>
          </div>
        </div>
      </div>

      {/* CORE FEATURE 2: 50:50 Out-of-Pocket Split Calculator & Alert */}
      <div className="glass-card p-6 rounded-2xl border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-400" />
              50:50 Out-of-Pocket Split Calculator
            </h2>
            <p className="text-xs text-slate-400">
              Evaluates monthly revenue against ₹{loan.monthlyEmi.toLocaleString('en-IN')} EMI + ₹5,000 Maintenance target (₹{totalRequiredTarget.toLocaleString('en-IN')} total).
            </p>
          </div>

          {/* Revenue Scenario Quick Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-medium">Test Revenue:</span>
            <button
              onClick={() => setSimulatedRevenue(actualMonthlyRevenue)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                simulatedRevenue === null || simulatedRevenue === actualMonthlyRevenue
                  ? 'bg-sky-600 border-sky-500 text-white'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              Actual (₹{actualMonthlyRevenue.toLocaleString('en-IN')})
            </button>
            <button
              onClick={() => setSimulatedRevenue(18000)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                simulatedRevenue === 18000
                  ? 'bg-sky-600 border-sky-500 text-white'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              Shortfall (₹18,000)
            </button>
            <button
              onClick={() => setSimulatedRevenue(30000)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                simulatedRevenue === 30000
                  ? 'bg-sky-600 border-sky-500 text-white'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              Surplus (₹30,000)
            </button>
          </div>
        </div>

        {/* Calculation Breakdown Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Monthly Fleet Revenue</span>
            <span className="text-xl font-bold text-emerald-400">
              ₹{displayRevenue.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Total Target (EMI + Retention)</span>
            <span className="text-xl font-bold text-slate-200">
              ₹{totalRequiredTarget.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              (₹{loan.monthlyEmi.toLocaleString('en-IN')} EMI + ₹5,000 Maintenance)
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Net Deficit / Shortfall</span>
            <span className={`text-xl font-bold ${deficit > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              ₹{deficit.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Automatic Alert Result Box */}
        {deficit > 0 ? (
          <div className="glass-card-amber p-4 rounded-xl border border-rose-500/40 bg-rose-950/30 flex items-center space-x-4 animate-pulse">
            <div className="p-3 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/50 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-rose-300 uppercase tracking-wider block">
                Automatic Out-of-Pocket Alert
              </span>
              <h3 className="text-base sm:text-lg font-black text-rose-100 mt-0.5">
                "Sanjay & Sachin need to deposit ₹{partnerSplit.toLocaleString('en-IN')} each this month."
              </h3>
              <p className="text-xs text-rose-300/80 mt-0.5">
                Total monthly deficit is ₹{deficit.toLocaleString('en-IN')}. Under the 50:50 equal split rule, both partners deposit ₹{partnerSplit.toLocaleString('en-IN')} to cover EMI and maintenance.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-950/30 flex items-center space-x-4">
            <div className="p-3 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider block">
                Monthly Target Fulfilled
              </span>
              <h3 className="text-base font-bold text-emerald-100 mt-0.5">
                No Out-of-Pocket Deposit Required
              </h3>
              <p className="text-xs text-emerald-300/80">
                Monthly fleet revenue covers the ₹{loan.monthlyEmi.toLocaleString('en-IN')} EMI and ₹5,000 maintenance fund retention target cleanly!
              </p>
            </div>
          </div>
        )}
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

    </div>
  );
}
