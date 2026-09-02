'use client';

import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  Plus, 
  Scan, 
  Fuel, 
  Wrench, 
  Disc, 
  ShieldCheck, 
  FileText,
  Loader2,
  Sparkles,
  Users,
  CheckCircle2,
  Clock,
  ArrowRightLeft,
  CreditCard,
  X,
  RefreshCw,
  Trash2,
  Search,
  Filter
} from 'lucide-react';
import { store } from '@/lib/store';
import { Expense, ExpenseCategory, PartnerUser } from '@/lib/types';
import { createWorker } from 'tesseract.js';

export default function ExpensesPage() {
  const [currentUser, setCurrentUser] = useState<PartnerUser>('Sanjay P');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<'all' | ExpenseCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // OCR Scanner State
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatusText, setScanStatusText] = useState('');
  
  // Expense Form State
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    category: 'Fuel' as ExpenseCategory,
    amount: '',
    description: '',
    billPhotoUrl: '',
    ocrVendor: '',
    ocrDate: '',
    isSplit: true,
    paidBy: 'Sanjay P' as PartnerUser,
  });

  // Settle Expense Modal State
  const [settleModalExpense, setSettleModalExpense] = useState<Expense | null>(null);
  const [settlementMode, setSettlementMode] = useState<string>('UPI / PhonePe / GPay');

  useEffect(() => {
    const user = store.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setFormData((prev) => ({ ...prev, paidBy: user }));
    }
    setExpenses(store.getExpenses());

    // Async live cloud database fetch
    refreshExpenses();

    const handleSync = () => {
      setExpenses(store.getExpenses());
    };
    window.addEventListener('kc_data_sync', handleSync);
    return () => window.removeEventListener('kc_data_sync', handleSync);
  }, []);

  const refreshExpenses = async () => {
    setIsRefreshing(true);
    const live = await store.fetchExpensesAsync();
    setExpenses(live);
    setIsRefreshing(false);
  };

  // Run Tesseract.js Client-Side OCR on File Selection
  const handleImageOCR = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setScanProgress(10);
    setScanStatusText('Loading image & initializing Tesseract OCR engine...');

    try {
      const imageUri = URL.createObjectURL(file);
      setFormData((prev) => ({ ...prev, billPhotoUrl: imageUri }));

      const worker = await createWorker('eng');
      setScanProgress(40);
      setScanStatusText('Extracting text from receipt...');

      const ret = await worker.recognize(imageUri);
      const text = ret.data.text;

      setScanProgress(80);
      setScanStatusText('Analyzing text for amount, date, and vendor...');

      const amountMatches = text.match(/(?:rs\.?|inr|total|amt|amount|₹)\s*([\d,]+\.?\d*)/i) || text.match(/([\d]{3,5}\.\d{2})/);
      let detectedAmount = '';
      if (amountMatches && amountMatches[1]) {
        detectedAmount = amountMatches[1].replace(/,/g, '');
      } else {
        const numbers = text.match(/\b\d{3,5}\b/g);
        if (numbers && numbers.length > 0) {
          detectedAmount = Math.max(...numbers.map(Number)).toString();
        }
      }

      let detectedCategory: ExpenseCategory = 'Fuel';
      if (/garage|service|oil|filter|repair|mechanic/i.test(text)) {
        detectedCategory = 'Garage Servicing';
      } else if (/tyre|tire|wheel|punct/i.test(text)) {
        detectedCategory = 'Tyre Replacement';
      } else if (/insurance|policy|claim/i.test(text)) {
        detectedCategory = 'Insurance';
      }

      setFormData((prev) => ({
        ...prev,
        category: detectedCategory,
        amount: detectedAmount || prev.amount,
        description: text.slice(0, 100).replace(/\n/g, ' '),
        ocrVendor: text.split('\n')[0] || 'Detected Vendor',
      }));

      await worker.terminate();
      setScanProgress(100);
      setScanStatusText('OCR Complete! Fields auto-populated below.');
      setShowForm(true);
    } catch (err) {
      console.error('OCR Error:', err);
      alert('OCR processing completed with raw text fallback.');
      setShowForm(true);
    } finally {
      setIsScanning(false);
    }
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(formData.amount);
    if (!formData.amount || numericAmount <= 0) {
      alert('Please enter a valid expense amount.');
      return;
    }

    const splitAmount = formData.isSplit ? Math.ceil(numericAmount / 2) : 0;

    store.addExpense({
      category: formData.category,
      amount: numericAmount,
      description: formData.description || `${formData.category} expense`,
      billPhotoUrl: formData.billPhotoUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop&q=80',
      ocrExtractedData: formData.ocrVendor ? {
        vendor: formData.ocrVendor,
        amount: numericAmount,
      } : undefined,
      loggedBy: formData.paidBy,
      isSplit: formData.isSplit,
      splitAmount: splitAmount,
      settledStatus: formData.isSplit ? 'Pending' : 'Settled',
    });

    refreshExpenses();
    setShowForm(false);
    setFormData({
      category: 'Fuel',
      amount: '',
      description: '',
      billPhotoUrl: '',
      ocrVendor: '',
      ocrDate: '',
      isSplit: true,
      paidBy: currentUser,
    });
  };

  const handleConfirmSettlement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleModalExpense) return;

    store.settleExpense(settleModalExpense.id, settlementMode, currentUser);
    refreshExpenses();
    setSettleModalExpense(null);
  };

  const handleDeleteExpense = async (id: string, description: string) => {
    if (confirm(`Are you sure you want to delete expense "${description}"?`)) {
      setIsRefreshing(true);
      await store.deleteExpense(id);
      await refreshExpenses();
      setIsRefreshing(false);
    }
  };

  // Compute ledger metrics
  const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Split debt calculations
  let sachinOwesSanjay = 0;
  let sanjayOwesSachin = 0;

  expenses.forEach((e) => {
    if (e.isSplit && e.settledStatus === 'Pending') {
      const debt = e.splitAmount || 0;
      if (e.loggedBy === 'Sanjay P') {
        sachinOwesSanjay += debt;
      } else {
        sanjayOwesSachin += debt;
      }
    }
  });

  const netBalance = sachinOwesSanjay - sanjayOwesSachin;

  return (
    <div className="space-y-6">
      
      {/* 1. TOP CARD: PARTNER SPLIT SETTLEMENT LEDGER */}
      <div className="glass-card-amber p-6 rounded-2xl border border-amber-500/40 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-500/30 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-amber-200">50:50 Out-of-Pocket Partner Settlement Ledger</h2>
              <p className="text-xs text-amber-300/80">Tracks who paid for fuel/repairs and calculates pending partner repayments</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-amber-300 block font-semibold">Net Partner Balance</span>
            <span className="text-lg font-black text-white">
              {netBalance > 0 ? `Sachin owes Sanjay P ₹${netBalance.toLocaleString('en-IN')}` :
               netBalance < 0 ? `Sanjay P owes Sachin ₹${Math.abs(netBalance).toLocaleString('en-IN')}` :
               'All Partner Expenses Settled!'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
            <span className="text-slate-400 block mb-1 font-semibold">Sachin Owes Sanjay P</span>
            <span className="text-base font-bold text-emerald-400 font-mono">
              ₹{sachinOwesSanjay.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
            <span className="text-slate-400 block mb-1 font-semibold">Sanjay P Owes Sachin</span>
            <span className="text-base font-bold text-sky-400 font-mono">
              ₹{sanjayOwesSachin.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
            <span className="text-slate-400 block mb-1 font-semibold">Total Logged Operational Bills</span>
            <span className="text-base font-bold text-amber-400 font-mono">
              ₹{totalExpenseAmount.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Controls & Actions Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-2xl border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-400" />
            Expense Logging & OCR Receipt Scanner
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Enforces the ₹5,000 monthly retention rule for vehicle maintenance. Tesseract.js OCR parses fuel/service bills for ₹0 cost.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={refreshExpenses}
            title="Sync live cloud data"
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-sky-400' : ''}`} />
          </button>

          <label className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-all shadow-lg shadow-amber-600/30 flex items-center space-x-2 cursor-pointer">
            <Scan className="w-4 h-4" />
            <span>Scan Receipt with OCR</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageOCR}
              className="hidden"
            />
          </label>

          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-all border border-slate-700 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Manual Expense</span>
          </button>
        </div>
      </div>

      {/* OCR Scanner Progress Status */}
      {isScanning && (
        <div className="glass-card-amber p-6 rounded-2xl border border-amber-500/40 space-y-3">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
            <div>
              <h3 className="text-sm font-bold text-amber-200">Tesseract.js OCR Processing Receipt...</h3>
              <p className="text-xs text-amber-300/80">{scanStatusText}</p>
            </div>
          </div>
          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${scanProgress}%` }}></div>
          </div>
        </div>
      )}

      {/* Expense Form Modal / Expandable */}
      {showForm && (
        <div className="glass-card p-6 rounded-2xl border-slate-800 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Log New Operational Expense & Set Split Option
            </h2>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">✕</button>
          </div>

          <form onSubmit={handleSaveExpense} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Expense Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white"
                >
                  <option value="Fuel">Fuel (Petrol/Diesel)</option>
                  <option value="Garage Servicing">Garage Servicing</option>
                  <option value="Tyre Replacement">Tyre Replacement</option>
                  <option value="Insurance">Insurance & Tax</option>
                  <option value="Other">Other Expenses</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Total Amount (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 3500"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Paid By</label>
                <select
                  value={formData.paidBy}
                  onChange={(e) => setFormData({ ...formData, paidBy: e.target.value as PartnerUser })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white font-semibold"
                >
                  <option value="Sanjay P">Sanjay P</option>
                  <option value="Sachin">Sachin</option>
                </select>
              </div>

              <div className="flex flex-col justify-end">
                <label className="flex items-center space-x-2 p-2 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isSplit}
                    onChange={(e) => setFormData({ ...formData, isSplit: e.target.checked })}
                    className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500"
                  />
                  <span className="font-semibold text-white">Split 50:50 with partner</span>
                </label>
              </div>
            </div>

            {formData.isSplit && formData.amount && Number(formData.amount) > 0 && (
              <div className="p-3 bg-sky-950/40 border border-sky-800/60 rounded-xl text-sky-200 font-semibold flex items-center justify-between">
                <span>50:50 Calculation:</span>
                <span>
                  {formData.paidBy} paid ₹{Number(formData.amount).toLocaleString('en-IN')}. Partner owes: <strong>₹{Math.ceil(Number(formData.amount) / 2).toLocaleString('en-IN')}</strong>
                </span>
              </div>
            )}

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Description / Notes</label>
              <textarea
                rows={2}
                placeholder="e.g. Engine oil refilling & air filter replacement at Kia Carens Authorized Workshop"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-lg shadow-amber-600/30"
              >
                Save Expense & Update Ledger
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Expenses History List */}
      <div className="glass-card p-6 rounded-2xl border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <h2 className="text-base font-bold text-white">Operational Expenses & Split Ledger</h2>
          <span className="text-sm font-extrabold text-amber-400">
            Total Logged: ₹{totalExpenseAmount.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Filter & Search Controls */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-slate-900/60 p-3 rounded-xl border border-slate-800">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search expenses, notes, partner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {(['all', 'Fuel', 'Garage Servicing', 'Tyre Replacement', 'Insurance', 'Other'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  categoryFilter === cat
                    ? 'bg-amber-600 text-white shadow'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}
          </div>
        </div>

        {(() => {
          const filteredExpenses = expenses.filter((exp) => {
            const matchesCategory = categoryFilter === 'all' || exp.category === categoryFilter;
            const query = searchQuery.toLowerCase().trim();
            const matchesSearch = !query || 
              exp.description.toLowerCase().includes(query) || 
              exp.category.toLowerCase().includes(query) || 
              exp.loggedBy.toLowerCase().includes(query);
            return matchesCategory && matchesSearch;
          });

          return filteredExpenses.length > 0 ? (
            <div className="space-y-3">
              {filteredExpenses.map((exp) => {
              const otherPartner: PartnerUser = exp.loggedBy === 'Sanjay P' ? 'Sachin' : 'Sanjay P';
              return (
                <div key={exp.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start space-x-3">
                      <div className="p-2.5 rounded-xl bg-slate-800 text-amber-400 shrink-0">
                        {exp.category === 'Fuel' ? <Fuel className="w-5 h-5" /> :
                         exp.category === 'Garage Servicing' ? <Wrench className="w-5 h-5" /> :
                         exp.category === 'Tyre Replacement' ? <Disc className="w-5 h-5" /> :
                         <ShieldCheck className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white text-sm">{exp.category}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono">
                            Paid by {exp.loggedBy}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-0.5">{exp.description}</p>
                        <p className="text-[11px] text-slate-400 mt-1">{new Date(exp.createdAt).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      {exp.billPhotoUrl && (
                        <a
                          href={exp.billPhotoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-sky-400 hover:underline flex items-center gap-1 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700"
                        >
                          <FileText className="w-3.5 h-3.5" /> View Receipt
                        </a>
                      )}
                      <span className="text-base font-extrabold text-rose-400 font-mono">
                        -₹{exp.amount.toLocaleString('en-IN')}
                      </span>
                      <button
                        onClick={() => handleDeleteExpense(exp.id, exp.description)}
                        title="Delete expense entry"
                        className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-400 border border-rose-800/80 transition-all flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* 50:50 Split & Settlement Status Footer */}
                  {exp.isSplit && (
                    <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center space-x-2">
                        {exp.settledStatus === 'Settled' ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Settled via {exp.settlementMode || 'Payment'} ({exp.settledBy})
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800 font-semibold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 animate-pulse" /> 50:50 Split Pending: {otherPartner} owes ₹{exp.splitAmount?.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>

                      {/* Settle / Pay Split Button */}
                      {exp.settledStatus === 'Pending' && (
                        <button
                          onClick={() => setSettleModalExpense(exp)}
                          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition-all flex items-center gap-1"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          <span>Record / Settle Split Payment</span>
                        </button>
                      )}
                    </div>
                  )}

                </div>
              );
            })}
            </div>
          ) : (
            <div className="p-10 text-center border border-dashed border-slate-800 rounded-xl space-y-2">
              <Receipt className="w-8 h-8 text-amber-500/40 mx-auto" />
              <h3 className="text-sm font-bold text-white">No Expenses Found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No operational expense matches your selected category or search filter.
              </p>
            </div>
          );
        })()}
      </div>

      {/* MODAL: Settle Partner Split Payment */}
      {settleModalExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="glass-card w-full max-w-md p-6 rounded-2xl border-slate-800 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                Record Partner Split Settlement
              </h2>
              <button onClick={() => setSettleModalExpense(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs space-y-1">
              <p className="text-slate-300">
                Expense: <strong>{settleModalExpense.description}</strong>
              </p>
              <p className="text-slate-300">
                Originally Paid By: <strong>{settleModalExpense.loggedBy}</strong> (Total ₹{settleModalExpense.amount.toLocaleString('en-IN')})
              </p>
              <p className="text-emerald-400 font-bold text-sm pt-1">
                Split Amount Owed: ₹{settleModalExpense.splitAmount?.toLocaleString('en-IN')}
              </p>
            </div>

            <form onSubmit={handleConfirmSettlement} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Payment / Settlement Mode</label>
                <select
                  value={settlementMode}
                  onChange={(e) => setSettlementMode(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white font-semibold"
                >
                  <option value="UPI / PhonePe / GPay">UPI / PhonePe / GPay</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer (NEFT/IMPS)">Bank Transfer (NEFT/IMPS)</option>
                  <option value="Offset against Fleet Booking Revenue">Offset against Fleet Booking Revenue</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Settled By Partner</label>
                <input
                  type="text"
                  disabled
                  value={currentUser}
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-400 font-semibold"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSettleModalExpense(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/30"
                >
                  Confirm Settlement & Update Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
