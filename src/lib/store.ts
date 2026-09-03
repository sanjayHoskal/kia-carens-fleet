import { Booking, Expense, AuditLog, LoanState, PartnerUser } from './types';
import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

let realtimeChannel: RealtimeChannel | null = null;

const INITIAL_LOAN_STATE: LoanState = {
  vehicleNumber: 'KA09MK6792',
  vehicleModel: 'Kia Carens',
  initialPrincipal: 1181000,
  currentPrincipal: 1181000,
  tenureMonths: 84,
  monthlyEmi: 20918,
  monthlyMaintenanceTarget: 5000,
  startDate: '2026-08-01',
  lastDeductedMonth: '2026-08', // August initial balance (no EMI deducted yet). 1st EMI debits on Sep 1st.
  autoDeductEnabled: true,
};

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getCurrentMonthString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function getMonthsDifference(startYearMonth: string, endYearMonth: string): number {
  const [sy, sm] = startYearMonth.split('-').map(Number);
  const [ey, em] = endYearMonth.split('-').map(Number);
  return (ey - sy) * 12 + (em - sm);
}

const INITIAL_BOOKINGS: Booking[] = [];
const INITIAL_EXPENSES: Expense[] = [];

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-001',
    userName: 'Sanjay P',
    action: 'Fleet System Initialized',
    details: 'Kia Carens (KA09MK6792) Partnership ledger initialized with ₹11,81,000 loan principal.',
    createdAt: new Date().toISOString(),
  }
];

const STORAGE_KEYS = {
  CURRENT_USER: 'kc_current_user_v6',
  LOAN: 'kc_loan_state_v6',
  BOOKINGS: 'kc_bookings_v6',
  EXPENSES: 'kc_expenses_v6',
  AUDIT: 'kc_audit_logs_v6',
};

export const store = {
  getCurrentUser(): PartnerUser | null {
    if (typeof window === 'undefined') return null;
    const user = sessionStorage.getItem(STORAGE_KEYS.CURRENT_USER) || localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return user ? (user as PartnerUser) : null;
  },

  getActiveUser(): PartnerUser {
    if (typeof window === 'undefined') return 'Admin';
    const current = this.getCurrentUser();
    return current || 'Admin';
  },

  setCurrentUser(user: PartnerUser) {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER, user);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, user);
    window.dispatchEvent(new Event('kc_auth_change'));
  },

  logout() {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    window.dispatchEvent(new Event('kc_auth_change'));
  },

  isLoggedIn(): boolean {
    if (typeof window === 'undefined') return false;
    return !!this.getCurrentUser();
  },

  // --- LOAN STATE & AUTOMATED EMI DEDUCTION ---
  saveLoanState(loanState: LoanState) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.LOAN, JSON.stringify(loanState));
    }
    supabase.from('loan_settings').update({
      initial_principal: loanState.initialPrincipal,
      current_principal: loanState.currentPrincipal,
      tenure_months: loanState.tenureMonths,
      monthly_emi: loanState.monthlyEmi,
      monthly_maintenance_target: loanState.monthlyMaintenanceTarget,
      start_date: loanState.startDate || '2026-08-01',
      last_deducted_month: loanState.lastDeductedMonth || '2026-08',
      auto_deduct_enabled: loanState.autoDeductEnabled ?? true,
      foreclosure_reserve: loanState.foreclosureReserve || 0,
      is_foreclosed: loanState.isForeclosed ?? false,
      updated_at: new Date().toISOString(),
    }).eq('id', '00000000-0000-0000-0000-000000000001').then(({ error }) => {
      if (error) console.error('Supabase save loan state error:', error);
    });
  },

  checkAndApplyMonthlyEmiDeduction(loan: LoanState): LoanState {
    if (loan.autoDeductEnabled === false || loan.isForeclosed) return loan;

    const currentMonth = getCurrentMonthString();
    const lastMonth = loan.lastDeductedMonth || '2026-08';

    if (lastMonth < currentMonth) {
      const monthsDiff = getMonthsDifference(lastMonth, currentMonth);
      if (monthsDiff > 0) {
        const totalDeduction = monthsDiff * loan.monthlyEmi;
        const newPrincipal = Math.max(0, loan.currentPrincipal - totalDeduction);
        
        const updatedLoan: LoanState = {
          ...loan,
          currentPrincipal: newPrincipal,
          lastDeductedMonth: currentMonth,
        };

        this.saveLoanState(updatedLoan);

        this.addAuditLog(
          'Automated 1st-of-Month EMI Reduction',
          `Automated EMI deduction of ₹${totalDeduction.toLocaleString('en-IN')} applied for ${monthsDiff} month(s) up to ${currentMonth}. Remaining principal updated to ₹${newPrincipal.toLocaleString('en-IN')}.`
        );

        return updatedLoan;
      }
    }
    return loan;
  },

  getLoanState(): LoanState {
    if (typeof window === 'undefined') return INITIAL_LOAN_STATE;
    const data = localStorage.getItem(STORAGE_KEYS.LOAN);
    let loan: LoanState = data ? JSON.parse(data) : INITIAL_LOAN_STATE;

    // Self-healing migration for August 2026 initial state
    if (loan.lastDeductedMonth === '2026-07') {
      loan = {
        ...loan,
        currentPrincipal: loan.initialPrincipal,
        lastDeductedMonth: '2026-08',
      };
      this.saveLoanState(loan);
    }

    return this.checkAndApplyMonthlyEmiDeduction(loan);
  },

  async fetchLoanStateAsync(): Promise<LoanState> {
    try {
      const { data, error } = await supabase.from('loan_settings').select('*').limit(1).single();
      if (data && !error) {
        let rawLoanState: LoanState = {
          vehicleNumber: data.vehicle_number || 'KA09MK6792',
          vehicleModel: data.vehicle_model || 'Kia Carens',
          initialPrincipal: Number(data.initial_principal) || 1181000,
          currentPrincipal: Number(data.current_principal) || 1181000,
          tenureMonths: Number(data.tenure_months) || 84,
          monthlyEmi: Number(data.monthly_emi) || 20918,
          monthlyMaintenanceTarget: Number(data.monthly_maintenance_target) || 5000,
          startDate: data.start_date || '2026-08-01',
          lastDeductedMonth: data.last_deducted_month || '2026-08',
          autoDeductEnabled: data.auto_deduct_enabled ?? true,
          foreclosureReserve: Number(data.foreclosure_reserve) || 0,
          isForeclosed: data.is_foreclosed ?? false,
        };

        if (rawLoanState.lastDeductedMonth === '2026-07') {
          rawLoanState.lastDeductedMonth = '2026-08';
          rawLoanState.currentPrincipal = rawLoanState.initialPrincipal;
        }

        const updatedLoan = this.checkAndApplyMonthlyEmiDeduction(rawLoanState);
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.LOAN, JSON.stringify(updatedLoan));
        }
        return updatedLoan;
      }
    } catch (err) {
      console.error('Supabase fetch loan error:', err);
    }
    return this.getLoanState();
  },

  manuallyTriggerEmiDeduction(): LoanState {
    const loan = this.getLoanState();
    const currentMonth = getCurrentMonthString();
    const newPrincipal = Math.max(0, loan.currentPrincipal - loan.monthlyEmi);
    
    const updatedLoan: LoanState = {
      ...loan,
      currentPrincipal: newPrincipal,
      lastDeductedMonth: currentMonth,
    };

    this.saveLoanState(updatedLoan);

    this.addAuditLog(
      'Manual EMI Payoff Applied',
      `Manual EMI deduction of ₹${loan.monthlyEmi.toLocaleString('en-IN')} recorded. Remaining loan principal updated to ₹${newPrincipal.toLocaleString('en-IN')}.`
    );

    return updatedLoan;
  },

  toggleAutoDeduct(enabled: boolean): LoanState {
    const loan = this.getLoanState();
    const updatedLoan: LoanState = {
      ...loan,
      autoDeductEnabled: enabled,
    };
    this.saveLoanState(updatedLoan);
    this.addAuditLog(
      'Updated EMI Settings',
      `Automated monthly EMI deduction was ${enabled ? 'ENABLED' : 'DISABLED'}.`
    );
    return updatedLoan;
  },

  // --- CARS24 LUMP-SUM FORECLOSURE CALCULATIONS ---
  getForeclosureMetrics() {
    const loan = this.getLoanState();
    const bookings = this.getBookings().filter(b => b.status !== 'Cancelled');
    const expenses = this.getExpenses();

    // All revenue from fleet bookings redirects directly into the Cars24 Foreclosure Sinking Fund
    const totalGrossRevenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    // Sum of expenses paid/deducted directly from fleet booking revenue
    const bookingDeductedExpenses = expenses
      .filter(e => e.paidFromBookingRevenue || e.settlementMode === 'Deducted from Booking Revenue' || e.settlementMode === 'Offset against Booking Revenue')
      .reduce((sum, e) => sum + e.amount, 0);

    // Sinking Fund = Gross booking revenue minus any expenses deducted from booking revenue
    const foreclosureReserve = Math.max(0, totalGrossRevenue - bookingDeductedExpenses);
    const remainingGap = Math.max(0, loan.currentPrincipal - foreclosureReserve);
    const rawPct = loan.currentPrincipal > 0 
      ? (foreclosureReserve / loan.currentPrincipal) * 100
      : 100;
    const progressPercent = rawPct > 0 && rawPct < 1 
      ? Number(rawPct.toFixed(2)) 
      : Math.min(100, Math.round(rawPct));
    const isForeclosureReady = loan.currentPrincipal > 0 && foreclosureReserve >= loan.currentPrincipal;

    return {
      loan,
      totalGrossRevenue,
      totalExpenses,
      bookingDeductedExpenses,
      foreclosureReserve,
      remainingGap,
      progressPercent,
      isForeclosureReady,
      isForeclosed: !!loan.isForeclosed,
    };
  },

  executeFullLoanForeclosure(): LoanState {
    const loan = this.getLoanState();
    const updatedLoan: LoanState = {
      ...loan,
      currentPrincipal: 0,
      isForeclosed: true,
      foreclosedAt: new Date().toISOString(),
    };

    this.saveLoanState(updatedLoan);

    this.addAuditLog(
      'Cars24 Full Loan Foreclosure Executed',
      `🎉 Cars24 loan principal fully foreclosed & paid off in 1-time lump-sum payment! Loan principal balance set to ₹0. No-Profit Vault unlocked.`
    );

    return updatedLoan;
  },

  // --- BOOKINGS ---
  getBookings(): Booking[] {
    if (typeof window === 'undefined') return INITIAL_BOOKINGS;
    const data = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
    return data ? JSON.parse(data) : INITIAL_BOOKINGS;
  },

  async fetchBookingsAsync(): Promise<Booking[]> {
    const local = this.getBookings();
    try {
      const { data, error } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
      if (data && !error) {
        const cloudFormatted: Booking[] = data.map((b: any) => ({
          id: b.id,
          guestName: b.guest_name,
          guestPhone: b.guest_phone,
          guestAadhaar: b.guest_aadhaar,
          guestDl: b.guest_dl,
          source: b.source,
          startDate: b.start_date,
          endDate: b.end_date,
          dailyRate: Number(b.daily_rate),
          totalAmount: Number(b.total_amount),
          status: b.status,
          signatureUrl: b.signature_url,
          signedAgreementUrl: b.signed_agreement_url,
          preInspection: b.pre_inspection,
          postInspection: b.post_inspection,
          createdBy: b.created_by,
          createdAt: b.created_at,
        }));

        // Cloud is the source of truth — replace localStorage with cloud data
        // Do NOT push local-only items back to cloud, as they may have been deleted on another device
        const finalList = cloudFormatted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(finalList));
        }
        return finalList;
      }
    } catch (err) {
      console.error('Supabase fetch bookings error:', err);
    }
    return local;
  },

  addBooking(booking: Omit<Booking, 'id' | 'createdAt'>): Booking {
    const current = this.getBookings();
    const newBooking: Booking = {
      ...booking,
      id: generateUUID(),
      createdAt: new Date().toISOString(),
    };
    const updated = [newBooking, ...current];
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(updated));
    }

    supabase.from('bookings').insert([{
      id: newBooking.id,
      guest_name: booking.guestName,
      guest_phone: booking.guestPhone,
      guest_aadhaar: booking.guestAadhaar,
      guest_dl: booking.guestDl,
      source: booking.source,
      start_date: booking.startDate,
      end_date: booking.endDate,
      daily_rate: booking.dailyRate,
      total_amount: booking.totalAmount,
      status: booking.status,
      created_by: booking.createdBy,
      created_at: newBooking.createdAt,
    }]).then(({ error }) => {
      if (error) console.error('Supabase insert booking error:', error);
    });

    this.addAuditLog('Created Booking', `Created ${booking.source} booking for ${booking.guestName} (₹${booking.totalAmount.toLocaleString('en-IN')})`);
    return newBooking;
  },

  updateBooking(id: string, updates: Partial<Booking>): Booking | null {
    const current = this.getBookings();
    let updatedItem: Booking | null = null;
    const updatedList = current.map((item) => {
      if (item.id === id) {
        updatedItem = { ...item, ...updates };
        return updatedItem;
      }
      return item;
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(updatedList));
    }

    const sbUpdates: any = {};
    if (updates.status) sbUpdates.status = updates.status;
    if (updates.signatureUrl) sbUpdates.signature_url = updates.signatureUrl;
    if (updates.signedAgreementUrl) sbUpdates.signed_agreement_url = updates.signedAgreementUrl;
    if (updates.preInspection) sbUpdates.pre_inspection = updates.preInspection;
    if (updates.postInspection) sbUpdates.post_inspection = updates.postInspection;

    supabase.from('bookings').update(sbUpdates).eq('id', id).then(({ error }) => {
      if (error) console.error('Supabase update booking error:', error);
    });

    return updatedItem;
  },

  async deleteBooking(id: string): Promise<boolean> {
    const current = this.getBookings();
    const target = current.find((item) => item.id === id);
    const updatedList = current.filter((item) => item.id !== id);

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(updatedList));
    }

    try {
      const { error } = await supabase.from('bookings').delete().eq('id', id);
      if (error) console.error('Supabase delete booking error:', error);
    } catch (e) {
      console.error('Supabase delete booking exception:', e);
    }

    if (target) {
      this.addAuditLog('Deleted Booking', `Deleted booking ${target.id} for guest ${target.guestName} (₹${target.totalAmount.toLocaleString('en-IN')})`);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('kc_data_sync'));
    }

    return true;
  },

  // --- EXPENSES ---
  getExpenses(): Expense[] {
    if (typeof window === 'undefined') return INITIAL_EXPENSES;
    const data = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    return data ? JSON.parse(data) : INITIAL_EXPENSES;
  },

  async fetchExpensesAsync(): Promise<Expense[]> {
    const local = this.getExpenses();
    try {
      const { data, error } = await supabase.from('expenses').select('*').order('created_at', { ascending: false });
      if (data && !error) {
        const cloudFormatted: Expense[] = data.map((e: any) => ({
          id: e.id,
          category: e.category,
          amount: Number(e.amount),
          description: e.description,
          billPhotoUrl: e.bill_photo_url,
          ocrExtractedData: e.ocr_extracted_data,
          loggedBy: e.logged_by,
          isSplit: e.is_split,
          splitAmount: e.split_amount ? Number(e.split_amount) : undefined,
          settledStatus: e.settled_status || 'Pending',
          settlementMode: e.settlement_mode,
          settledAt: e.settled_at,
          settledBy: e.settled_by,
          paidFromBookingRevenue: !!(
            e.paid_from_booking_revenue || 
            e.settlement_mode === 'Deducted from Booking Revenue' || 
            e.settlement_mode === 'Offset against Booking Revenue' || 
            e.ocr_extracted_data?.paidFromBookingRevenue
          ),
          createdAt: e.created_at,
        }));

        // Cloud is the source of truth — replace localStorage with cloud data
        // Do NOT push local-only items back to cloud, as they may have been deleted on another device
        const finalList = cloudFormatted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(finalList));
        }
        return finalList;
      }
    } catch (err) {
      console.error('Supabase fetch expenses error:', err);
    }
    return local;
  },

  addExpense(expense: Omit<Expense, 'id' | 'createdAt'>): Expense {
    const current = this.getExpenses();
    const isFromRevenue = !!(
      expense.paidFromBookingRevenue || 
      expense.settlementMode === 'Deducted from Booking Revenue'
    );

    const newExpense: Expense = {
      ...expense,
      id: generateUUID(),
      paidFromBookingRevenue: isFromRevenue,
      isSplit: isFromRevenue ? false : expense.isSplit,
      splitAmount: isFromRevenue ? 0 : expense.splitAmount,
      settledStatus: isFromRevenue ? 'Settled' : (expense.settledStatus || 'Pending'),
      settlementMode: isFromRevenue ? 'Deducted from Booking Revenue' : (expense.settlementMode || ''),
      settledAt: isFromRevenue ? new Date().toISOString() : expense.settledAt,
      settledBy: isFromRevenue ? (expense.loggedBy || 'Booking Revenue') : expense.settledBy,
      createdAt: new Date().toISOString(),
    };
    const updated = [newExpense, ...current];
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(updated));
    }

    supabase.from('expenses').insert([{
      id: newExpense.id,
      category: expense.category,
      amount: expense.amount,
      description: expense.description,
      bill_photo_url: expense.billPhotoUrl,
      ocr_extracted_data: {
        ...(expense.ocrExtractedData || {}),
        paidFromBookingRevenue: isFromRevenue,
      },
      logged_by: expense.loggedBy,
      is_split: newExpense.isSplit,
      split_amount: newExpense.splitAmount,
      settled_status: newExpense.settledStatus,
      settlement_mode: newExpense.settlementMode,
      settled_at: newExpense.settledAt,
      settled_by: newExpense.settledBy,
      created_at: newExpense.createdAt,
    }]).then(({ error }) => {
      if (error) console.error('Supabase insert expense error:', error);
    });

    const splitNote = isFromRevenue
      ? ` (Deducted from Booking Revenue - Sinking Fund adjusted)`
      : expense.isSplit 
        ? ` (50:50 Split: ₹${expense.splitAmount?.toLocaleString('en-IN')} pending from partner)`
        : '';
    this.addAuditLog('Logged Expense', `Logged ${expense.category} expense of ₹${expense.amount.toLocaleString('en-IN')} (${expense.description})${splitNote}`);
    return newExpense;
  },

  settleExpense(expenseId: string, settlementMode: string, partner: PartnerUser): Expense | null {
    const current = this.getExpenses();
    let updatedItem: Expense | null = null;
    const updatedList = current.map((item) => {
      if (item.id === expenseId) {
        updatedItem = {
          ...item,
          settledStatus: 'Settled' as const,
          settlementMode,
          settledAt: new Date().toISOString(),
          settledBy: partner,
        };
        return updatedItem;
      }
      return item;
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(updatedList));
    }

    supabase.from('expenses').update({
      settled_status: 'Settled',
      settlement_mode: settlementMode,
      settled_at: new Date().toISOString(),
      settled_by: partner,
    }).eq('id', expenseId).then(({ error }) => {
      if (error) console.error('Supabase settle expense error:', error);
    });

    if (updatedItem) {
      this.addAuditLog('Settled Expense Split', `${partner} settled split amount of ₹${(updatedItem as Expense).splitAmount?.toLocaleString('en-IN')} via ${settlementMode} for expense ${(updatedItem as Expense).description}`);
    }
    return updatedItem;
  },

  async deleteExpense(id: string): Promise<boolean> {
    const current = this.getExpenses();
    const target = current.find((item) => item.id === id);
    const updatedList = current.filter((item) => item.id !== id);

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(updatedList));
    }

    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) console.error('Supabase delete expense error:', error);
    } catch (e) {
      console.error('Supabase delete expense exception:', e);
    }

    if (target) {
      this.addAuditLog('Deleted Expense', `Deleted ${target.category} expense of ₹${target.amount.toLocaleString('en-IN')} (${target.description})`);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('kc_data_sync'));
    }

    return true;
  },

  // --- AUDIT LOGS ---
  getAuditLogs(): AuditLog[] {
    if (typeof window === 'undefined') return INITIAL_AUDIT_LOGS;
    const data = localStorage.getItem(STORAGE_KEYS.AUDIT);
    return data ? JSON.parse(data) : INITIAL_AUDIT_LOGS;
  },

  async fetchAuditLogsAsync(): Promise<AuditLog[]> {
    try {
      const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false });
      if (data && !error) {
        const formatted: AuditLog[] = data.map((l: any) => ({
          id: l.id,
          userName: l.user_name,
          action: l.action,
          details: typeof l.details === 'string' ? l.details : JSON.stringify(l.details),
          createdAt: l.created_at,
        }));
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(formatted));
        }
        return formatted;
      }
    } catch (err) {
      console.error('Supabase fetch audit error:', err);
    }
    return this.getAuditLogs();
  },

  addAuditLog(action: string, details: string) {
    const current = this.getAuditLogs();
    const user = this.getActiveUser();
    const newLog: AuditLog = {
      id: `log-${Date.now().toString().slice(-4)}`,
      userName: user,
      action,
      details,
      createdAt: new Date().toISOString(),
    };
    const updated = [newLog, ...current];
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(updated));
    }

    supabase.from('audit_logs').insert([{
      id: newLog.id,
      user_name: user,
      action,
      details,
      created_at: newLog.createdAt,
    }]).then(({ error }) => {
      if (error) console.error('Supabase insert audit log error:', error);
    });

    return newLog;
  },

  resetToFreshState(customInitialPrincipal = 1181000, customEmi = 20918, customTenure = 84) {
    const currentMonth = getCurrentMonthString();
    const newLoanState: LoanState = {
      vehicleNumber: 'KA09MK6792',
      vehicleModel: 'Kia Carens',
      initialPrincipal: customInitialPrincipal,
      currentPrincipal: customInitialPrincipal,
      tenureMonths: customTenure,
      monthlyEmi: customEmi,
      monthlyMaintenanceTarget: 5000,
      startDate: currentMonth + '-01',
      lastDeductedMonth: currentMonth,
      autoDeductEnabled: true,
    };

    const newLog: AuditLog = {
      id: `log-${Date.now().toString().slice(-4)}`,
      userName: this.getActiveUser(),
      action: 'Factory Reset Executed',
      details: `Factory reset performed. New loan principal set to ₹${customInitialPrincipal.toLocaleString('en-IN')}. All bookings & expenses purged. Automated 1st-of-month EMI reduction active.`,
      createdAt: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.LOAN, JSON.stringify(newLoanState));
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify([newLog]));
    }

    supabase.from('bookings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    supabase.from('expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    supabase.from('loan_settings').update({
      initial_principal: customInitialPrincipal,
      current_principal: customInitialPrincipal,
      monthly_emi: customEmi,
      start_date: currentMonth + '-01',
      last_deducted_month: currentMonth,
      auto_deduct_enabled: true,
    }).eq('id', '00000000-0000-0000-0000-000000000001');
  },

  async fetchAllDataAsync(): Promise<{ loan: LoanState; bookings: Booking[]; expenses: Expense[]; auditLogs: AuditLog[] }> {
    const [loan, bookings, expenses, auditLogs] = await Promise.all([
      this.fetchLoanStateAsync(),
      this.fetchBookingsAsync(),
      this.fetchExpensesAsync(),
      this.fetchAuditLogsAsync(),
    ]);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('kc_data_sync'));
    }

    return { loan, bookings, expenses, auditLogs };
  },

  // --- SUPABASE REALTIME SUBSCRIPTIONS ---
  subscribeToRealtimeChanges() {
    if (typeof window === 'undefined') return;
    if (realtimeChannel) return; // Already subscribed

    realtimeChannel = supabase
      .channel('fleet-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bookings' },
        async () => {
          console.log('[Realtime] bookings INSERT');
          try {
            await this.fetchBookingsAsync();
            window.dispatchEvent(new Event('kc_data_sync'));
          } catch (e) {
            console.error('Realtime bookings insert sync error:', e);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bookings' },
        async () => {
          console.log('[Realtime] bookings UPDATE');
          try {
            await this.fetchBookingsAsync();
            window.dispatchEvent(new Event('kc_data_sync'));
          } catch (e) {
            console.error('Realtime bookings update sync error:', e);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'bookings' },
        async () => {
          console.log('[Realtime] bookings DELETE');
          try {
            await this.fetchBookingsAsync();
            window.dispatchEvent(new Event('kc_data_sync'));
          } catch (e) {
            console.error('Realtime bookings delete sync error:', e);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'expenses' },
        async () => {
          console.log('[Realtime] expenses INSERT');
          try {
            await this.fetchExpensesAsync();
            window.dispatchEvent(new Event('kc_data_sync'));
          } catch (e) {
            console.error('Realtime expenses insert sync error:', e);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'expenses' },
        async () => {
          console.log('[Realtime] expenses UPDATE');
          try {
            await this.fetchExpensesAsync();
            window.dispatchEvent(new Event('kc_data_sync'));
          } catch (e) {
            console.error('Realtime expenses update sync error:', e);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'expenses' },
        async () => {
          console.log('[Realtime] expenses DELETE');
          try {
            await this.fetchExpensesAsync();
            window.dispatchEvent(new Event('kc_data_sync'));
          } catch (e) {
            console.error('Realtime expenses delete sync error:', e);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'loan_settings' },
        async () => {
          console.log('[Realtime] loan_settings INSERT');
          try {
            await this.fetchLoanStateAsync();
            window.dispatchEvent(new Event('kc_data_sync'));
          } catch (e) {
            console.error('Realtime loan insert sync error:', e);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'loan_settings' },
        async () => {
          console.log('[Realtime] loan_settings UPDATE');
          try {
            await this.fetchLoanStateAsync();
            window.dispatchEvent(new Event('kc_data_sync'));
          } catch (e) {
            console.error('Realtime loan update sync error:', e);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'audit_logs' },
        async () => {
          console.log('[Realtime] audit_logs INSERT');
          try {
            await this.fetchAuditLogsAsync();
            window.dispatchEvent(new Event('kc_data_sync'));
          } catch (e) {
            console.error('Realtime audit insert sync error:', e);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'audit_logs' },
        async () => {
          console.log('[Realtime] audit_logs UPDATE');
          try {
            await this.fetchAuditLogsAsync();
            window.dispatchEvent(new Event('kc_data_sync'));
          } catch (e) {
            console.error('Realtime audit update sync error:', e);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'audit_logs' },
        async () => {
          console.log('[Realtime] audit_logs DELETE');
          try {
            await this.fetchAuditLogsAsync();
            window.dispatchEvent(new Event('kc_data_sync'));
          } catch (e) {
            console.error('Realtime audit delete sync error:', e);
          }
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Subscription status:', status);
      });
  },

  unsubscribeFromRealtimeChanges() {
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
      realtimeChannel = null;
    }
  },
};
