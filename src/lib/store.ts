import { Booking, Expense, AuditLog, LoanState, PartnerUser } from './types';

const INITIAL_LOAN_STATE: LoanState = {
  vehicleNumber: 'KA09MK6792',
  vehicleModel: 'Kia Carens',
  initialPrincipal: 1182000,
  currentPrincipal: 1014000, // ₹1,68,000 cleared so far
  tenureMonths: 84,
  monthlyEmi: 21000,
  monthlyMaintenanceTarget: 5000,
};

const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'bk-101',
    guestName: 'Rahul Sharma',
    guestPhone: '+91 98765 43210',
    guestAadhaar: '5432-8765-1092',
    guestDl: 'KA-09-2021-00892',
    source: 'Private Trip',
    startDate: '2026-07-20T10:00:00.000Z',
    endDate: '2026-07-23T18:00:00.000Z',
    dailyRate: 3500,
    totalAmount: 10500,
    status: 'Completed',
    createdBy: 'Sanjay P',
    createdAt: '2026-07-19T14:30:00.000Z',
    preInspection: {
      frontPhoto: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=500&auto=format&fit=crop&q=80',
      backPhoto: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=500&auto=format&fit=crop&q=80',
      leftPhoto: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=500&auto=format&fit=crop&q=80',
      rightPhoto: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=500&auto=format&fit=crop&q=80',
      fuelLevel: 100,
      odometerKm: 42150,
      timestamp: '2026-07-20T09:45:00.000Z',
      loggedBy: 'Sanjay P',
    },
    postInspection: {
      frontPhoto: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=500&auto=format&fit=crop&q=80',
      backPhoto: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=500&auto=format&fit=crop&q=80',
      leftPhoto: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=500&auto=format&fit=crop&q=80',
      rightPhoto: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=500&auto=format&fit=crop&q=80',
      fuelLevel: 90,
      odometerKm: 42720,
      excessKm: 70,
      excessKmCharge: 1050,
      fuelDiffCharge: 450,
      totalFinalInvoice: 12000,
      timestamp: '2026-07-23T18:15:00.000Z',
      loggedBy: 'Sachin',
    }
  },
  {
    id: 'bk-102',
    guestName: 'Anand Kumar',
    guestPhone: '+91 91234 56789',
    guestAadhaar: '9876-1234-5678',
    guestDl: 'KA-01-2022-77123',
    source: 'Zoomcar',
    startDate: '2026-07-25T08:00:00.000Z',
    endDate: '2026-07-28T20:00:00.000Z',
    dailyRate: 3200,
    totalAmount: 11200,
    status: 'Active',
    createdBy: 'Sachin',
    createdAt: '2026-07-24T11:00:00.000Z',
    preInspection: {
      frontPhoto: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=500&auto=format&fit=crop&q=80',
      backPhoto: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=500&auto=format&fit=crop&q=80',
      leftPhoto: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=500&auto=format&fit=crop&q=80',
      rightPhoto: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=500&auto=format&fit=crop&q=80',
      fuelLevel: 95,
      odometerKm: 42725,
      timestamp: '2026-07-25T07:50:00.000Z',
      loggedBy: 'Sachin',
    }
  },
  {
    id: 'bk-103',
    guestName: 'Priya Nair',
    guestPhone: '+91 99887 76655',
    guestAadhaar: '1122-3344-5566',
    guestDl: 'KA-05-2020-99412',
    source: 'Retail Dealer',
    startDate: '2026-07-29T09:00:00.000Z',
    endDate: '2026-07-31T19:00:00.000Z',
    dailyRate: 3000,
    totalAmount: 7500,
    status: 'Confirmed',
    createdBy: 'Sanjay P',
    createdAt: '2026-07-26T09:15:00.000Z',
  }
];

const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp-201',
    category: 'Fuel',
    amount: 3500,
    description: 'Full tank refuel at HP Petrol Bunk Mysuru Road',
    loggedBy: 'Sachin',
    createdAt: '2026-07-20T10:15:00.000Z',
  },
  {
    id: 'exp-202',
    category: 'Garage Servicing',
    amount: 2800,
    description: 'General oil change & air filter replacement - Kia Carens Service',
    loggedBy: 'Sanjay P',
    createdAt: '2026-07-15T15:20:00.000Z',
  }
];

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-301',
    userName: 'Sanjay P',
    action: 'Created Booking',
    details: 'Created Private Trip booking for Priya Nair (₹7,500)',
    createdAt: '2026-07-26T09:15:00.000Z',
  },
  {
    id: 'log-302',
    userName: 'Sachin',
    action: 'Logged Pre-Handover Checklist',
    details: 'Uploaded 4 photos, logged Odometer: 42,725 KM & Fuel: 95% for Anand Kumar',
    createdAt: '2026-07-25T07:50:00.000Z',
  },
  {
    id: 'log-303',
    userName: 'Sachin',
    action: 'Created Booking',
    details: 'Created Zoomcar trip for Anand Kumar (₹11,200)',
    createdAt: '2026-07-24T11:00:00.000Z',
  },
  {
    id: 'log-304',
    userName: 'Sanjay P',
    action: 'Logged Expense',
    details: 'Logged Garage Servicing expense of ₹2,800',
    createdAt: '2026-07-15T15:20:00.000Z',
  }
];

const STORAGE_KEYS = {
  CURRENT_USER: 'kc_current_user',
  LOAN: 'kc_loan_state',
  BOOKINGS: 'kc_bookings',
  EXPENSES: 'kc_expenses',
  AUDIT: 'kc_audit_logs',
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
    this.addAuditLog('Logged Expense', `Logged ${expense.category} expense of ₹${expense.amount.toLocaleString('en-IN')} (${expense.description})`);
    return newExpense;
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
  }
};
