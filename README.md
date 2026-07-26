# 🚗 Kia Carens (KA09MK6792) Partnership & Fleet Management Web App

A high-performance, mobile-first web application built for **Sanjay P** and **Sachin** to manage their shared **Kia Carens (KA09MK6792)** rental fleet, loan amortization tracker, ₹5,000 maintenance fund retention, OCR receipt scanner, pre/post trip photo checklists, and P&L financial analytics.

Designed for **100% ₹0 hosting and database costs** using Vercel Free Tier, Supabase Free Tier, and client-side browser Tesseract.js OCR.

---

## ✨ Features Checklist

1. **Partnership & Loan Amortization Dashboard**
   - **Dual-User Quick Switch**: Easy switching between Sanjay P and Sachin.
   - **Amortization Tracker**: Pre-loaded with ₹11.82 Lakh principal, ₹21,000/month EMI, 84-month tenure.
   - **The "No-Profit" Vault**: Visually locks profit distribution and cash-out buttons with a golden lock indicator until the ₹11.82 Lakh loan principal reaches ₹0.
   - **50:50 Out-of-Pocket Split Calculator**: Evaluates monthly revenue against ₹21,000 EMI + ₹5,000 Maintenance target (₹26,000 total). Automatically calculates partner contribution if revenue falls short and alerts: *"Sanjay & Sachin need to deposit ₹X,XXX each this month."*

2. **Booking & Source Management**
   - **Multi-Channel Source Toggles**: Segmented classification for `Zoomcar`, `Retail Dealer`, and `Private Trip`.
   - **Guest Pre-Onboarding Form**: Captures Name, Phone, Aadhaar, and Driving License (DL).
   - **Auto-Generated PDF Rental Contract**: Auto-fills the Kia Carens agreement template into a PDF.
   - **WhatsApp Deep-Link Trigger**: One-tap trigger launching pre-formatted WhatsApp greetings with digital agreement links.
   - **Pre-Handover Checklist**: Mandates uploading 4 photos (Front, Back, Left, Right), logging odometer KM and fuel level %.
   - **Post-Return Offboarding**: Matching return checklist, calculates excess KM driven (₹15/km), fuel differences, generates final PDF invoice, and sends WhatsApp invoice.

3. **Expense & Maintenance Ledger**
   - **₹5,000 Retention Rule**: Out of monthly revenue, the first ₹5,000 automatically routes to the digital Maintenance Wallet before evaluating EMI payoff.
   - **Client-Side Tesseract.js OCR Scanner**: Snaps/uploads fuel bills or garage receipts directly in the browser (100% free), auto-detecting amount, vendor, and date.

4. **Joint Analytics & Transparency**
   - Monthly downloadable **CSV financial statements** and **PDF P&L reports**.
   - Interactive source channel revenue charts.

5. **Partner Audit Trail**
   - Timestamped log tracking every action taken by Sanjay P or Sachin to eliminate partnership friction.

6. **Public Guest Digital Signature Page (`/sign/[id]`)**
   - Interactive touch/mouse HTML5 canvas signature pad where guests can digitally sign their rental contract on their phone.

---

## ⚡ Quick Start (Local Development)

```bash
# 1. Clone or enter project directory
cd car

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚀 Free 1-Click Deployment to Vercel (₹0 Cost)

### Option A: Using Vercel CLI (Fastest)

Run the following command in your terminal:

```bash
npx vercel
```

Follow the prompt selections:
- Set up and deploy? **Y**
- Which scope? Select your personal Vercel account
- Link to existing project? **N**
- Project name: `kia-carens-fleet`
- In which directory is your code located? `./`
- Want to modify settings? **N**

Vercel will build and deploy your app to a live URL (e.g. `https://kia-carens-fleet.vercel.app`) in under 60 seconds!

---

### Option B: Deploying via GitHub & Vercel Dashboard

1. Initialize git and commit files:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Kia Carens Fleet App"
   ```
2. Push to your GitHub repository.
3. Import the repository in [Vercel Dashboard](https://vercel.com/new).
4. Click **Deploy**.

---

## 🗄️ Supabase Free Tier Database Setup (Optional)

If you wish to sync data to a cloud database (instead of the self-contained persistent state):

1. Create a free account at [Supabase.com](https://supabase.com).
2. Create a new project and open the **SQL Editor**.
3. Copy and execute the contents of [`supabase/schema.sql`](file:///d:/ML%20Projects/antigravity/car/supabase/schema.sql).
4. Add your API credentials to `.env.local` or Vercel Environment Variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

---

## 📄 License & Partnership Terms
Built for Sanjay P and Sachin for Kia Carens KA09MK6792 fleet operations. All rights reserved.
