'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Download, 
  FileText, 
  PieChart, 
  BarChart3, 
  IndianRupee, 
  CheckCircle, 
  ArrowUpRight, 
  ArrowDownRight,
  ShieldCheck
} from 'lucide-react';
import { store } from '@/lib/store';
import { Booking, Expense, LoanState } from '@/lib/types';
import jsPDF from 'jspdf';

export default function AnalyticsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loan, setLoan] = useState<LoanState>(store.getLoanState());

  useEffect(() => {
    setBookings(store.getBookings());
    setExpenses(store.getExpenses());
    setLoan(store.getLoanState());
  }, []);

  // Compute revenue by source
  const zoomcarRevenue = bookings.filter(b => b.source === 'Zoomcar' && b.status !== 'Cancelled').reduce((sum, b) => sum + b.totalAmount, 0);
  const dealerRevenue = bookings.filter(b => b.source === 'Retail Dealer' && b.status !== 'Cancelled').reduce((sum, b) => sum + b.totalAmount, 0);
  const privateRevenue = bookings.filter(b => b.source === 'Private Trip' && b.status !== 'Cancelled').reduce((sum, b) => sum + b.totalAmount, 0);

  const totalRevenue = zoomcarRevenue + dealerRevenue + privateRevenue;
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const emiAllocation = loan.monthlyEmi;
  const maintenanceAllocation = loan.monthlyMaintenanceTarget;

  const totalOutflows = totalExpenses + emiAllocation + maintenanceAllocation;
  const netPnL = totalRevenue - totalOutflows;

  // Export P&L Report as CSV
  const exportCSV = () => {
    const rows = [
      ['Kia Carens (KA09MK6792) Monthly Profit & Loss Statement'],
      ['Generated On', new Date().toLocaleString()],
      [''],
      ['REVENUE BY SOURCE', 'AMOUNT (INR)'],
      ['Zoomcar Fleet Revenue', zoomcarRevenue],
      ['Retail Dealer Revenue', dealerRevenue],
      ['Private Trip Revenue', privateRevenue],
      ['TOTAL REVENUE', totalRevenue],
      [''],
      ['EXPENSES & ALLOCATIONS', 'AMOUNT (INR)'],
      ['Monthly EMI Payoff', emiAllocation],
      ['Maintenance Retention Wallet', maintenanceAllocation],
      ['Fuel & Operational Expenses', totalExpenses],
      ['TOTAL OUTFLOWS', totalOutflows],
      [''],
      ['NET PARTNERSHIP P&L', netPnL],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Kia_Carens_PnL_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    store.addAuditLog('Exported CSV Report', 'Downloaded P&L Monthly Financial Statement in CSV format');
  };

  // Export P&L Report as PDF
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('KIA CARENS (KA09MK6792) P&L STATEMENT', 20, 20);
    doc.setFontSize(10);
    doc.text(`Partners: Sanjay P & Sachin | Generated: ${new Date().toLocaleDateString()}`, 20, 28);
    doc.line(20, 32, 190, 32);

    doc.setFontSize(14);
    doc.text('1. Revenue Summary by Source', 20, 42);
    doc.setFontSize(10);
    doc.text(`Zoomcar Channel: INR ${zoomcarRevenue.toLocaleString('en-IN')}`, 25, 50);
    doc.text(`Retail Dealer Channel: INR ${dealerRevenue.toLocaleString('en-IN')}`, 25, 56);
    doc.text(`Private Trip Channel: INR ${privateRevenue.toLocaleString('en-IN')}`, 25, 62);
    doc.setFontSize(11);
    doc.text(`Total Gross Revenue: INR ${totalRevenue.toLocaleString('en-IN')}`, 25, 70);

    doc.setFontSize(14);
    doc.text('2. Expenses & Fixed Obligations', 20, 82);
    doc.setFontSize(10);
    doc.text(`Vehicle Loan EMI (84 M): INR ${emiAllocation.toLocaleString('en-IN')}`, 25, 90);
    doc.text(`Maintenance Retention Fund: INR ${maintenanceAllocation.toLocaleString('en-IN')}`, 25, 96);
    doc.text(`Fuel & Maintenance Bills: INR ${totalExpenses.toLocaleString('en-IN')}`, 25, 102);
    doc.setFontSize(11);
    doc.text(`Total Outflows: INR ${totalOutflows.toLocaleString('en-IN')}`, 25, 110);

    doc.line(20, 118, 190, 118);
    doc.setFontSize(14);
    doc.text(`NET P&L BALANCE: INR ${netPnL.toLocaleString('en-IN')}`, 20, 128);

    doc.save(`Kia_Carens_PnL_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
    store.addAuditLog('Exported PDF Report', 'Downloaded P&L Monthly Financial Statement in PDF format');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-2xl border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
            Joint Analytics & P&L Reports
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete financial transparency between Sanjay P and Sachin. Downloadable monthly CSV/PDF statements.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={exportCSV}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-all border border-slate-700 flex items-center space-x-2"
          >
            <Download className="w-4 h-4 text-sky-400" />
            <span>Export CSV Report</span>
          </button>

          <button
            onClick={exportPDF}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-lg shadow-emerald-600/30 flex items-center space-x-2"
          >
            <FileText className="w-4 h-4" />
            <span>Download PDF Statement</span>
          </button>
        </div>
      </div>

      {/* Financial P&L Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Gross Revenue */}
        <div className="glass-card p-5 rounded-2xl border-slate-800">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-slate-400">Total Fleet Revenue</span>
            <div className="p-2 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            ₹{totalRevenue.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-slate-400 mt-1">Across 3 Booking Channels</p>
        </div>

        {/* Total Outflows */}
        <div className="glass-card p-5 rounded-2xl border-slate-800">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-slate-400">Total Fixed & Ops Outflows</span>
            <div className="p-2 rounded-lg bg-rose-950 text-rose-400 border border-rose-800">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-400">
            ₹{totalOutflows.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-slate-400 mt-1">EMI (₹21k) + Retention (₹5k) + Ops</p>
        </div>

        {/* Net Balance */}
        <div className="glass-card p-5 rounded-2xl border-slate-800">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-slate-400">Net Financial Position</span>
            <div className="p-2 rounded-lg bg-sky-950 text-sky-400 border border-sky-800">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-bold ${netPnL >= 0 ? 'text-sky-400' : 'text-amber-400'}`}>
            ₹{netPnL.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {netPnL >= 0 ? 'Surplus retained in fleet vault' : 'Deficit split 50:50 between partners'}
          </p>
        </div>

      </div>

      {/* Revenue per Channel Bar Chart Breakdown */}
      <div className="glass-card p-6 rounded-2xl border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-sky-400" />
          Revenue Generated per Source Channel
        </h2>

        <div className="space-y-3">
          {/* Zoomcar */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-purple-300">Zoomcar Fleet Trips</span>
              <span className="text-slate-200">₹{zoomcarRevenue.toLocaleString('en-IN')}</span>
            </div>
            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full"
                style={{ width: `${totalRevenue ? (zoomcarRevenue / totalRevenue) * 100 : 0}%` }}
              ></div>
            </div>
          </div>

          {/* Retail Dealer */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-amber-300">Retail Dealer Rentals</span>
              <span className="text-slate-200">₹{dealerRevenue.toLocaleString('en-IN')}</span>
            </div>
            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full"
                style={{ width: `${totalRevenue ? (dealerRevenue / totalRevenue) * 100 : 0}%` }}
              ></div>
            </div>
          </div>

          {/* Private Trip */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-sky-300">Private Direct Trips</span>
              <span className="text-slate-200">₹{privateRevenue.toLocaleString('en-IN')}</span>
            </div>
            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-sky-500 rounded-full"
                style={{ width: `${totalRevenue ? (privateRevenue / totalRevenue) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
