-- Schema definition for Kia Carens (KA09MK6792) Fleet & Partnership Management App

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (Sanjay P & Sachin)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'partner',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Loan Settings & Amortization
CREATE TABLE IF NOT EXISTS public.loan_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_number TEXT NOT NULL DEFAULT 'KA09MK6792',
  vehicle_model TEXT NOT NULL DEFAULT 'Kia Carens',
  initial_principal DECIMAL NOT NULL DEFAULT 1182000.00,
  current_principal DECIMAL NOT NULL DEFAULT 1182000.00,
  tenure_months INT NOT NULL DEFAULT 84,
  monthly_emi DECIMAL NOT NULL DEFAULT 21000.00,
  monthly_maintenance_target DECIMAL NOT NULL DEFAULT 5000.00,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default loan settings row
INSERT INTO public.loan_settings (id, vehicle_number, vehicle_model, initial_principal, current_principal, tenure_months, monthly_emi, monthly_maintenance_target)
VALUES ('00000000-0000-0000-0000-000000000001', 'KA09MK6792', 'Kia Carens', 1182000.00, 1182000.00, 84, 21000.00, 5000.00)
ON CONFLICT (id) DO NOTHING;

-- 3. Bookings Table
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL CHECK (category IN ('Fuel', 'Garage Servicing', 'Tyre Replacement', 'Insurance', 'Other')),
  amount DECIMAL NOT NULL,
  description TEXT NOT NULL,
  bill_photo_url TEXT,
  ocr_extracted_data JSONB,
  logged_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Maintenance Wallet Balance Table
CREATE TABLE IF NOT EXISTS public.maintenance_wallet (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  balance DECIMAL NOT NULL DEFAULT 5000.00,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies (Allow authenticated partners full access)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can read all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Partners can manage loan" ON public.loan_settings FOR ALL USING (true);
CREATE POLICY "Partners can manage bookings" ON public.bookings FOR ALL USING (true);
CREATE POLICY "Partners can manage expenses" ON public.expenses FOR ALL USING (true);
CREATE POLICY "Partners can manage maintenance wallet" ON public.maintenance_wallet FOR ALL USING (true);
CREATE POLICY "Partners can manage audit logs" ON public.audit_logs FOR ALL USING (true);
