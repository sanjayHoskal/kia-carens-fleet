import './globals.css';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import AuthGuard from '@/components/AuthGuard';

export const metadata: Metadata = {
  title: 'Kia Carens Fleet & Partnership Ledger | KA09MK6792',
  description: 'Partnership and loan amortization tracker, ₹5,000 retention maintenance fund, OCR expense ledger, and digital rental contract manager for Sanjay P and Sachin.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col selection:bg-sky-500 selection:text-white">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <AuthGuard>
            {children}
          </AuthGuard>
        </main>
        <footer className="border-t border-slate-900 bg-slate-950/60 py-4 text-center text-xs text-slate-400">
          <p>Kia Carens (KA09MK6792) Partnership Platform • Built for Sanjay P & Sachin • 100% Free Tier Architecture</p>
        </footer>
      </body>
    </html>
  );
}
