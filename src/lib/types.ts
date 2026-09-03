export type PartnerUser = 'Sanjay P' | 'Sachin' | 'Admin';

export type BookingSource = 'Zoomcar' | 'Retail Dealer' | 'Private Trip';

export type BookingStatus = 
  | 'Confirmed' 
  | 'Pre-Handover Complete' 
  | 'Active' 
  | 'Completed' 
  | 'Cancelled';

export type ExpenseCategory = 
  | 'Fuel' 
  | 'Garage Servicing' 
  | 'Tyre Replacement' 
  | 'Insurance' 
  | 'Other';

export interface PreHandoverInspection {
  frontPhoto: string;
  backPhoto: string;
  leftPhoto: string;
  rightPhoto: string;
  fuelLevel: number; // percentage 0-100
  odometerKm: number;
  timestamp: string;
  loggedBy: PartnerUser;
}

export interface PostReturnInspection {
  frontPhoto: string;
  backPhoto: string;
  leftPhoto: string;
  rightPhoto: string;
  fuelLevel: number;
  odometerKm: number;
  excessKm: number;
  excessKmCharge: number;
  fuelDiffCharge: number;
  totalFinalInvoice: number;
  timestamp: string;
  loggedBy: PartnerUser;
}

export interface Booking {
  id: string;
  guestName: string;
  guestPhone: string;
  guestAadhaar: string;
  guestDl: string;
  source: BookingSource;
  startDate: string;
  endDate: string;
  dailyRate: number;
  totalAmount: number;
  status: BookingStatus;
  signatureUrl?: string;
  signedAgreementUrl?: string;
  preInspection?: PreHandoverInspection;
  postInspection?: PostReturnInspection;
  createdBy: PartnerUser;
  createdAt: string;
}

export interface Expense {
  id: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  billPhotoUrl?: string;
  ocrExtractedData?: {
    vendor?: string;
    date?: string;
    amount?: number;
    confidence?: number;
  };
  loggedBy: PartnerUser;
  // Expense 50:50 Split & Partner Settlement Fields
  isSplit?: boolean;
  splitAmount?: number;
  settledStatus?: 'Pending' | 'Settled';
  settlementMode?: string; // 'UPI', 'Cash', 'Bank Transfer', 'Offset against Booking Revenue'
  settledAt?: string;
  settledBy?: PartnerUser;
  paidFromBookingRevenue?: boolean; // When true, deducted directly from fleet booking revenue/sinking fund
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userName: PartnerUser;
  action: string;
  details: string;
  createdAt: string;
}

export interface LoanState {
  vehicleNumber: string;
  vehicleModel: string;
  initialPrincipal: number;
  currentPrincipal: number;
  tenureMonths: number;
  monthlyEmi: number;
  monthlyMaintenanceTarget: number;
  startDate?: string;
  lastDeductedMonth?: string; // 'YYYY-MM'
  autoDeductEnabled?: boolean;
  foreclosureReserve?: number;
  isForeclosed?: boolean;
  foreclosedAt?: string;
}
