-- Schema definition for Kia Carens (KA09MK6792) Fleet & Partnership Management App

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (Sanjay P & Sachin)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'partner',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Loan Settings & Amortization
CREATE TABLE IF NOT EXISTS public.loan_settings (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  vehicle_number TEXT NOT NULL DEFAULT 'KA09MK6792',
  vehicle_model TEXT NOT NULL DEFAULT 'Kia Carens',
  initial_principal DECIMAL NOT NULL DEFAULT 1181000.00,
  current_principal DECIMAL NOT NULL DEFAULT 1181000.00,
  tenure_months INT NOT NULL DEFAULT 84,
  monthly_emi DECIMAL NOT NULL DEFAULT 21000.00,
  monthly_maintenance_target DECIMAL NOT NULL DEFAULT 5000.00,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default loan settings row
INSERT INTO public.loan_settings (id, vehicle_number, vehicle_model, initial_principal, current_principal, tenure_months, monthly_emi, monthly_maintenance_target)
VALUES ('00000000-0000-0000-0000-000000000001', 'KA09MK6792', 'Kia Carens', 1181000.00, 1181000.00, 84, 21000.00, 5000.00)
ON CONFLICT (id) DO NOTHING;

-- 3. Bookings Table
CREATE TABLE IF NOT EXISTS public.bookings (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  guest_name TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  guest_aadhaar TEXT NOT NULL,
  guest_dl TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('Zoomcar', 'Retail Dealer', 'Private Trip')),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  daily_rate DECIMAL NOT NULL,
  total_amount DECIMAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'Confirmed' CHECK (status IN ('Confirmed', 'Pre-Handover Complete', 'Active', 'Completed', 'Cancelled')),
  signature_url TEXT,
  signed_agreement_url TEXT,
  pre_inspection JSONB,
  post_inspection JSONB,
  created_by TEXT NOT NULL DEFAULT 'Sanjay P',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Expenses & Operational Ledger Table
CREATE TABLE IF NOT EXISTS public.expenses (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  category TEXT NOT NULL CHECK (category IN ('Fuel', 'Garage Servicing', 'Tyre Replacement', 'Insurance', 'Other')),
  amount DECIMAL NOT NULL,
  description TEXT NOT NULL,
  bill_photo_url TEXT,
  ocr_extracted_data JSONB,
  logged_by TEXT NOT NULL,
  is_split BOOLEAN DEFAULT true,
  split_amount DECIMAL,
  settled_status TEXT DEFAULT 'Pending',
  settlement_mode TEXT,
  settled_at TIMESTAMPTZ,
  settled_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Maintenance Wallet Balance Table
CREATE TABLE IF NOT EXISTS public.maintenance_wallet (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  balance DECIMAL NOT NULL DEFAULT 5000.00,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS or set completely open permissive policies for shared partnership ledger
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_wallet DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;
