import { Booking, Expense, AuditLog, LoanState, PartnerUser } from './types';

const INITIAL_LOAN_STATE: LoanState = {
  vehicleNumber: 'KA09MK6792',
  vehicleModel: 'Kia Carens',
  initialPrincipal: 1181000,
  currentPrincipal: 1181000, // Fresh start: ₹0 cleared so far
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
  CURRENT_USER: 'kc_current_user_v4',
  LOAN: 'kc_loan_state_v4',
  BOOKINGS: 'kc_bookings_v4',
  EXPENSES: 'kc_expenses_v4',
  AUDIT: 'kc_audit_logs_v4',
  THEME: 'kc_theme_v1',
};

// Purge legacy cache on browser startup
if (typeof window !== 'undefined') {
  ['kc_loan_state', 'kc_bookings', 'kc_expenses', 'kc_audit_logs', 'kc_current_user', 'kc_loan_state_v2', 'kc_bookings_v2', 'kc_expenses_v2', 'kc_loan_state_v3', 'kc_bookings_v3'].forEach(key => {
    localStorage.removeItem(key);
  });
}

export const store = {
  getCurrentUser(): PartnerUser {
    if (typeof window === 'undefined') return 'Sanjay P';
    return (localStorage.getItem(STORAGE_KEYS.CURRENT_USER) as PartnerUser) || 'Sanjay P';
  },

  setCurrentUser(user: PartnerUser) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, user);
  },

  getTheme(): 'dark' | 'light' {
    if (typeof window === 'undefined') return 'dark';
    return (localStorage.getItem(STORAGE_KEYS.THEME) as 'dark' | 'light') || 'dark';
  },

  setTheme(theme: 'dark' | 'light') {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  },

  getLoanState(): LoanState {
    if (typeof window === 'undefined') return INITIAL_LOAN_STATE;
    const data = localStorage.getItem(STORAGE_KEYS.LOAN);
    return data ? JSON.parse(data) : INITIAL_LOAN_STATE;
  },

  updateLoanPrincipal(amountCleared: number) {
    const state = this.getLoanState();
    const newPrincipal = Math.max(0, state.currentPrincipal - amountCleared);
    const updated = { ...state, currentPrincipal: newPrincipal };
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.LOAN, JSON.stringify(updated));
    }
    return updated;
  },

  getBookings(): Booking[] {
    if (typeof window === 'undefined') return INITIAL_BOOKINGS;
    const data = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
    return data ? JSON.parse(data) : INITIAL_BOOKINGS;
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
    return updatedItem;
  },

  getExpenses(): Expense[] {
    if (typeof window === 'undefined') return INITIAL_EXPENSES;
    const data = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    return data ? JSON.parse(data) : INITIAL_EXPENSES;
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

    if (updatedItem) {
      this.addAuditLog('Settled Expense Split', `${partner} settled split amount of ₹${(updatedItem as Expense).splitAmount?.toLocaleString('en-IN')} via ${settlementMode} for expense ${(updatedItem as Expense).description}`);
    }
    return updatedItem;
  },

  getAuditLogs(): AuditLog[] {
    if (typeof window === 'undefined') return INITIAL_AUDIT_LOGS;
    const data = localStorage.getItem(STORAGE_KEYS.AUDIT);
    return data ? JSON.parse(data) : INITIAL_AUDIT_LOGS;
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
    return newLog;
  },

  resetToFreshState(customInitialPrincipal = 1181000, customEmi = 21000, customTenure = 84) {
    const newLoanState: LoanState = {
      vehicleNumber: 'KA09MK6792',
      vehicleModel: 'Kia Carens',
      initialPrincipal: customInitialPrincipal,
      currentPrincipal: customInitialPrincipal, // 0 cleared
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
  }
};
