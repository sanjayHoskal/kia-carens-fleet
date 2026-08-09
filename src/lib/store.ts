import { Booking, Expense, AuditLog, LoanState, PartnerUser } from './types';
import { supabase } from './supabase';

const INITIAL_LOAN_STATE: LoanState = {
  vehicleNumber: 'KA09MK6792',
  vehicleModel: 'Kia Carens',
  initialPrincipal: 1181000,
  currentPrincipal: 1181000,
  tenureMonths: 84,
  monthlyEmi: 21000,
  monthlyMaintenanceTarget: 5000,
};

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
  THEME: 'kc_theme_v1',
};

export const store = {
  getCurrentUser(): PartnerUser {
    if (typeof window === 'undefined') return 'Sanjay P';
    return (localStorage.getItem(STORAGE_KEYS.CURRENT_USER) as PartnerUser) || 'Sanjay P';
  },

  setCurrentUser(user: PartnerUser) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, user);
  },

  logout() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  isLoggedIn(): boolean {
    if (typeof window === 'undefined') return true;
    return !!localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  },

  getTheme(): 'dark' | 'light' {
    if (typeof window === 'undefined') return 'dark';
    return (localStorage.getItem(STORAGE_KEYS.THEME) as 'dark' | 'light') || 'dark';
  },

  setTheme(theme: 'dark' | 'light') {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  },

  // --- LOAN STATE ---
  getLoanState(): LoanState {
    if (typeof window === 'undefined') return INITIAL_LOAN_STATE;
    const data = localStorage.getItem(STORAGE_KEYS.LOAN);
    return data ? JSON.parse(data) : INITIAL_LOAN_STATE;
  },

  async fetchLoanStateAsync(): Promise<LoanState> {
    try {
      const { data, error } = await supabase.from('loan_settings').select('*').limit(1).single();
      if (data && !error) {
        const loanState: LoanState = {
          vehicleNumber: data.vehicle_number || 'KA09MK6792',
          vehicleModel: data.vehicle_model || 'Kia Carens',
          initialPrincipal: Number(data.initial_principal) || 1181000,
          currentPrincipal: Number(data.current_principal) || 1181000,
          tenureMonths: Number(data.tenure_months) || 84,
          monthlyEmi: Number(data.monthly_emi) || 21000,
          monthlyMaintenanceTarget: Number(data.monthly_maintenance_target) || 5000,
        };
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.LOAN, JSON.stringify(loanState));
        }
        return loanState;
      }
    } catch (err) {
      console.error('Supabase fetch loan error:', err);
    }
    return this.getLoanState();
  },

  // --- BOOKINGS ---
  getBookings(): Booking[] {
    if (typeof window === 'undefined') return INITIAL_BOOKINGS;
    const data = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
    return data ? JSON.parse(data) : INITIAL_BOOKINGS;
  },

  async fetchBookingsAsync(): Promise<Booking[]> {
    try {
      const { data, error } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
      if (data && !error) {
        const formatted: Booking[] = data.map((b: any) => ({
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
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(formatted));
        }
        return formatted;
      }
    } catch (err) {
      console.error('Supabase fetch bookings error:', err);
    }
    return this.getBookings();
  },

  addBooking(booking: Omit<Booking, 'id' | 'createdAt'>): Booking {
    const current = this.getBookings();
    const newBooking: Booking = {
      ...booking,
      id: `bk-${Date.now().toString().slice(-4)}`,
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

  deleteBooking(id: string): boolean {
    const current = this.getBookings();
    const target = current.find((item) => item.id === id);
    const updatedList = current.filter((item) => item.id !== id);

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(updatedList));
    }

    supabase.from('bookings').delete().eq('id', id).then(({ error }) => {
      if (error) console.error('Supabase delete booking error:', error);
    });

    if (target) {
      this.addAuditLog('Deleted Booking', `Deleted booking ${target.id} for guest ${target.guestName} (₹${target.totalAmount.toLocaleString('en-IN')})`);
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
    try {
      const { data, error } = await supabase.from('expenses').select('*').order('created_at', { ascending: false });
      if (data && !error) {
        const formatted: Expense[] = data.map((e: any) => ({
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
          createdAt: e.created_at,
        }));
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(formatted));
        }
        return formatted;
      }
    } catch (err) {
      console.error('Supabase fetch expenses error:', err);
    }
    return this.getExpenses();
  },

  addExpense(expense: Omit<Expense, 'id' | 'createdAt'>): Expense {
    const current = this.getExpenses();
    const newExpense: Expense = {
      ...expense,
      id: `exp-${Date.now().toString().slice(-4)}`,
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
      ocr_extracted_data: expense.ocrExtractedData,
      logged_by: expense.loggedBy,
      is_split: expense.isSplit,
      split_amount: expense.splitAmount,
      settled_status: expense.settledStatus || 'Pending',
      created_at: newExpense.createdAt,
    }]).then(({ error }) => {
      if (error) console.error('Supabase insert expense error:', error);
    });

    const splitNote = expense.isSplit 
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

  deleteExpense(id: string): boolean {
    const current = this.getExpenses();
    const target = current.find((item) => item.id === id);
    const updatedList = current.filter((item) => item.id !== id);

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(updatedList));
    }

    supabase.from('expenses').delete().eq('id', id).then(({ error }) => {
      if (error) console.error('Supabase delete expense error:', error);
    });

    if (target) {
      this.addAuditLog('Deleted Expense', `Deleted ${target.category} expense of ₹${target.amount.toLocaleString('en-IN')} (${target.description})`);
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
    const user = this.getCurrentUser();
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

  resetToFreshState(customInitialPrincipal = 1181000, customEmi = 21000, customTenure = 84) {
    const newLoanState: LoanState = {
      vehicleNumber: 'KA09MK6792',
      vehicleModel: 'Kia Carens',
      initialPrincipal: customInitialPrincipal,
      currentPrincipal: customInitialPrincipal,
      tenureMonths: customTenure,
      monthlyEmi: customEmi,
      monthlyMaintenanceTarget: 5000,
    };

    const newLog: AuditLog = {
      id: `log-${Date.now().toString().slice(-4)}`,
      userName: this.getCurrentUser(),
      action: 'Factory Reset Executed',
      details: `Factory reset performed. New loan principal set to ₹${customInitialPrincipal.toLocaleString('en-IN')}. All bookings & expenses purged.`,
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
    }).eq('id', '00000000-0000-0000-0000-000000000001');
  }
};
