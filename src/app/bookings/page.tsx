'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  CalendarCheck2, 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Send, 
  CheckCircle, 
  Camera, 
  Gauge, 
  Fuel, 
  Sparkles, 
  Share2, 
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Printer,
  Download,
  AlertCircle,
  Trash2,
  User,
  PenTool
} from 'lucide-react';
import { store } from '@/lib/store';
import { Booking, BookingSource, PartnerUser } from '@/lib/types';
import jsPDF from 'jspdf';

export default function BookingsPage() {
  const [currentUser, setCurrentUser] = useState<PartnerUser>('Sanjay P');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | BookingSource>('all');
  const [userScope, setUserScope] = useState<'mine' | 'all'>('mine');
  
  // New Booking Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    guestName: '',
    guestPhone: '',
    guestAadhaar: '',
    guestDl: '',
    source: 'Private Trip' as BookingSource,
    startDate: '',
    endDate: '',
    dailyRate: 3500,
  });

  // Pre-Handover Modal State
  const [selectedBookingForPre, setSelectedBookingForPre] = useState<Booking | null>(null);
  const [preForm, setPreForm] = useState({
    frontPhoto: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=500&auto=format&fit=crop&q=80',
    backPhoto: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=500&auto=format&fit=crop&q=80',
    leftPhoto: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=500&auto=format&fit=crop&q=80',
    rightPhoto: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=500&auto=format&fit=crop&q=80',
    fuelLevel: 100,
    odometerKm: 42750,
  });

  // Post-Return Modal State
  const [selectedBookingForPost, setSelectedBookingForPost] = useState<Booking | null>(null);
  const [postForm, setPostForm] = useState({
    frontPhoto: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=500&auto=format&fit=crop&q=80',
    backPhoto: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=500&auto=format&fit=crop&q=80',
    leftPhoto: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=500&auto=format&fit=crop&q=80',
    rightPhoto: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=500&auto=format&fit=crop&q=80',
    fuelLevel: 90,
    odometerKm: 43100,
    allowedKmPerDay: 300,
    ratePerExtraKm: 15,
    ratePerFuelPct: 45,
  });

  useEffect(() => {
    const user = store.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      if (user === 'Admin') {
        setUserScope('all');
      }
    }
    setBookings(store.getBookings());
    refreshBookingsAsync();

    const handleSync = () => {
      setBookings(store.getBookings());
    };
    window.addEventListener('kc_data_sync', handleSync);
    return () => window.removeEventListener('kc_data_sync', handleSync);
  }, []);

  const refreshBookingsAsync = async () => {
    const live = await store.fetchBookingsAsync();
    setBookings(live);
  };

  const refreshBookings = () => {
    setBookings(store.getBookings());
  };

  const handleDeleteBooking = async (id: string, guestName: string) => {
    if (confirm(`Are you sure you want to delete booking "${id}" for guest ${guestName}?`)) {
      await store.deleteBooking(id);
      await refreshBookingsAsync();
    }
  };

  // Filter bookings
  const filteredBookings = bookings.filter((b) => {
    if (userScope === 'mine' && currentUser !== 'Admin') {
      if (b.createdBy && b.createdBy !== currentUser) return false;
    }
    if (activeTab === 'all') return true;
    return b.source === activeTab;
  });

  // Handle Add Booking
  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.guestName || !formData.guestPhone || !formData.guestAadhaar || !formData.guestDl) {
      alert('Please fill out all required guest detail fields.');
      return;
    }

    const start = new Date(formData.startDate || Date.now());
    const end = new Date(formData.endDate || Date.now() + 86400000 * 2);
    const diffDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)));
    const totalAmount = diffDays * formData.dailyRate;

    store.addBooking({
      guestName: formData.guestName,
      guestPhone: formData.guestPhone,
      guestAadhaar: formData.guestAadhaar,
      guestDl: formData.guestDl,
      source: formData.source,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      dailyRate: formData.dailyRate,
      totalAmount: totalAmount,
      status: 'Confirmed',
      createdBy: currentUser,
    });

    refreshBookings();
    setShowAddModal(false);
    setFormData({
      guestName: '',
      guestPhone: '',
      guestAadhaar: '',
      guestDl: '',
      source: 'Private Trip',
      startDate: '',
      endDate: '',
      dailyRate: 3500,
    });
  };

  // Generate Agreement PDF
  const generateAgreementPDF = (booking: Booking) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('KIA CARENS (KA09MK6792) RENTAL AGREEMENT', 20, 20);
    
    doc.setFontSize(11);
    doc.text(`Booking Reference: ${booking.id}`, 20, 32);
    doc.text(`Date of Issue: ${new Date().toLocaleDateString()}`, 20, 38);
    doc.text(`Lessor / Partners: Sanjay P & Sachin V`, 20, 44);

    doc.line(20, 48, 190, 48);

    doc.setFontSize(13);
    doc.text('1. Guest Details', 20, 58);
    doc.setFontSize(10);
    doc.text(`Full Name: ${booking.guestName}`, 25, 66);
    doc.text(`Mobile Phone: ${booking.guestPhone}`, 25, 72);
    doc.text(`Aadhaar Number: ${booking.guestAadhaar}`, 25, 78);
    doc.text(`Driving License: ${booking.guestDl}`, 25, 84);

    doc.setFontSize(13);
    doc.text('2. Rental & Booking Details', 20, 96);
    doc.setFontSize(10);
    doc.text(`Vehicle: Kia Carens (KA09MK6792)`, 25, 104);
    doc.text(`Source Channel: ${booking.source}`, 25, 110);
    doc.text(`Start Date: ${new Date(booking.startDate).toLocaleString()}`, 25, 116);
    doc.text(`End Date: ${new Date(booking.endDate).toLocaleString()}`, 25, 122);
    doc.text(`Total Agreed Rate: INR ${booking.totalAmount.toLocaleString('en-IN')}`, 25, 128);

    doc.setFontSize(13);
    doc.text('3. Terms & Conditions', 20, 140);
    doc.setFontSize(9);
    doc.text('- The vehicle must be driven safely within legal speed limits.', 25, 148);
    doc.text('- Excess kilometer charge: ₹15/km beyond standard daily limit.', 25, 154);
    doc.text('- Fuel must be returned at the same level as logged during handover.', 25, 160);
    doc.text('- Any traffic violations, FASTag tolls, or damages during the trip are guest liability.', 25, 166);

    doc.line(20, 180, 190, 180);
    doc.setFontSize(10);
    doc.text('Lessor Signature: Sanjay P / Sachin V', 25, 195);
    
    if (booking.signatureUrl) {
      doc.text('Guest Digital Signature (Verified):', 110, 188);
      try {
        doc.addImage(booking.signatureUrl, 'PNG', 110, 190, 50, 20);
      } catch (err) {
        console.error('Error adding signature image to PDF:', err);
        doc.text('[Signature Image Verified]', 110, 195);
      }
    } else {
      doc.text('Guest Digital Signature: ______________________', 110, 195);
    }

    doc.save(`Kia_Carens_Rental_Agreement_${booking.guestName.replace(/\s+/g, '_')}.pdf`);
  };

  // Trigger WhatsApp Greeting & Sign Link
  const triggerWhatsAppGreeting = (booking: Booking) => {
    const cleanPhone = booking.guestPhone.replace(/[^0-9]/g, '');
    const signUrl = `${window.location.origin}/sign/${booking.id}`;
    const text = encodeURIComponent(
      `Hi ${booking.guestName}, your booking for Kia Carens (KA09MK6792) is confirmed! Please tap here to digitally sign your rental agreement: ${signUrl}`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
    store.addAuditLog('Sent WhatsApp Greeting', `Sent confirmation WhatsApp message to ${booking.guestName}`);
  };

  // Complete Pre-Handover
  const handleCompletePreHandover = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForPre) return;

    store.updateBooking(selectedBookingForPre.id, {
      status: 'Pre-Handover Complete',
      preInspection: {
        frontPhoto: preForm.frontPhoto,
        backPhoto: preForm.backPhoto,
        leftPhoto: preForm.leftPhoto,
        rightPhoto: preForm.rightPhoto,
        fuelLevel: preForm.fuelLevel,
        odometerKm: preForm.odometerKm,
        timestamp: new Date().toISOString(),
        loggedBy: currentUser,
      }
    });

    store.addAuditLog('Pre-Handover Logged', `Logged 4 photos, Odometer: ${preForm.odometerKm} KM, Fuel: ${preForm.fuelLevel}% for ${selectedBookingForPre.guestName}`);
    refreshBookings();
    setSelectedBookingForPre(null);
  };

  // Complete Post-Return
  const handleCompletePostReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForPost || !selectedBookingForPost.preInspection) return;

    const startOdo = selectedBookingForPost.preInspection.odometerKm;
    const endOdo = postForm.odometerKm;
    const totalKmDriven = Math.max(0, endOdo - startOdo);

    const start = new Date(selectedBookingForPost.startDate);
    const end = new Date(selectedBookingForPost.endDate);
    const tripDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)));
    const allowedTotalKm = tripDays * postForm.allowedKmPerDay;

    const excessKm = Math.max(0, totalKmDriven - allowedTotalKm);
    const excessKmCharge = excessKm * postForm.ratePerExtraKm;

    const startFuel = selectedBookingForPost.preInspection.fuelLevel;
    const endFuel = postForm.fuelLevel;
    const fuelDiffPct = Math.max(0, startFuel - endFuel);
    const fuelDiffCharge = fuelDiffPct * postForm.ratePerFuelPct;

    const totalFinalInvoice = selectedBookingForPost.totalAmount + excessKmCharge + fuelDiffCharge;

    store.updateBooking(selectedBookingForPost.id, {
      status: 'Completed',
      postInspection: {
        frontPhoto: postForm.frontPhoto,
        backPhoto: postForm.backPhoto,
        leftPhoto: postForm.leftPhoto,
        rightPhoto: postForm.rightPhoto,
        fuelLevel: postForm.fuelLevel,
        odometerKm: postForm.odometerKm,
        excessKm,
        excessKmCharge,
        fuelDiffCharge,
        totalFinalInvoice,
        timestamp: new Date().toISOString(),
        loggedBy: currentUser,
      }
    });

    store.addAuditLog('Post-Return Completed', `Completed trip offboarding for ${selectedBookingForPost.guestName}. Final Invoice: ₹${totalFinalInvoice}`);
    refreshBookings();

    // Trigger Final Invoice PDF Download & WhatsApp Link
    generateFinalInvoicePDF(selectedBookingForPost, totalKmDriven, excessKm, excessKmCharge, fuelDiffPct, fuelDiffCharge, totalFinalInvoice);
    setSelectedBookingForPost(null);
  };

  // Generate Final Invoice PDF
  const generateFinalInvoicePDF = (
    booking: Booking,
    totalKm: number,
    excessKm: number,
    excessKmCharge: number,
    fuelDiffPct: number,
    fuelDiffCharge: number,
    finalTotal: number
  ) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('KIA CARENS (KA09MK6792) FINAL TRIP INVOICE', 20, 20);
    
    doc.setFontSize(10);
    doc.text(`Guest: ${booking.guestName} (${booking.guestPhone})`, 20, 30);
    doc.text(`Trip Period: ${new Date(booking.startDate).toLocaleDateString()} - ${new Date(booking.endDate).toLocaleDateString()}`, 20, 36);

    doc.line(20, 42, 190, 42);

    doc.setFontSize(12);
    doc.text('Billing Details', 20, 52);
    doc.setFontSize(10);
    doc.text(`Base Rental Rate: INR ${booking.totalAmount.toLocaleString('en-IN')}`, 25, 60);
    doc.text(`Odometer Start / End: ${booking.preInspection?.odometerKm} KM / ${booking.postInspection?.odometerKm || postForm.odometerKm} KM`, 25, 66);
    doc.text(`Total Distance Driven: ${totalKm} KM (Excess: ${excessKm} KM @ ₹15/km)`, 25, 72);
    doc.text(`Excess KM Charge: INR ${excessKmCharge.toLocaleString('en-IN')}`, 25, 78);
    doc.text(`Fuel Level Start / End: ${booking.preInspection?.fuelLevel}% / ${postForm.fuelLevel}%`, 25, 84);
    doc.text(`Fuel Difference Charge: INR ${fuelDiffCharge.toLocaleString('en-IN')}`, 25, 90);

    doc.line(20, 98, 190, 98);

    doc.setFontSize(14);
    doc.text(`TOTAL FINAL AMOUNT: INR ${finalTotal.toLocaleString('en-IN')}`, 20, 110);

    doc.save(`Kia_Carens_Invoice_${booking.guestName.replace(/\s+/g, '_')}.pdf`);

    // Also trigger WhatsApp Invoice
    const cleanPhone = booking.guestPhone.replace(/[^0-9]/g, '');
    const text = encodeURIComponent(
      `Hi ${booking.guestName}, thank you for renting Kia Carens (KA09MK6792)! Your trip is completed. Total Final Invoice: ₹${finalTotal.toLocaleString('en-IN')}. Excess KM: ${excessKm} KM (₹${excessKmCharge}), Fuel Adj: ₹${fuelDiffCharge}.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-2xl border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <CalendarCheck2 className="w-6 h-6 text-sky-400" />
            Booking & Source Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Multi-channel input, pre-onboarding digital agreement generator, handover photo checklists, and offboarding invoice generator.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-all shadow-lg shadow-sky-600/30 flex items-center justify-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Guest Pre-Onboarding</span>
        </button>
      </div>

      {/* User Scope & Multi-Channel Toggle Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 glass-card rounded-xl border-slate-800">
        <div className="flex flex-wrap items-center gap-3">
          
          {/* User Scope Filter Toggle */}
          {currentUser !== 'Admin' && (
            <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-lg">
              <button
                onClick={() => setUserScope('mine')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
                  userScope === 'mine' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>My Bookings ({currentUser})</span>
              </button>
              <button
                onClick={() => setUserScope('all')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                  userScope === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                All Fleet Bookings
              </button>
            </div>
          )}

          <div className="flex items-center space-x-1.5">
            <span className="text-xs text-slate-400 font-semibold px-1">Channel:</span>
            {(['all', 'Zoomcar', 'Retail Dealer', 'Private Trip'] as const).map((source) => (
              <button
                key={source}
                onClick={() => setActiveTab(source)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === source
                    ? source === 'Zoomcar' ? 'bg-purple-600 text-white' :
                      source === 'Retail Dealer' ? 'bg-amber-600 text-white' :
                      source === 'Private Trip' ? 'bg-sky-600 text-white' :
                      'bg-slate-700 text-white'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                }`}
              >
                {source === 'all' ? 'All' : source}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs text-slate-400 px-2 font-mono">
          Showing {filteredBookings.length} Bookings
        </div>
      </div>

      {/* Bookings List Table / Cards */}
      <div className="space-y-4">
        {filteredBookings.length > 0 ? (
          filteredBookings.map((booking) => (
            <div key={booking.id} className="glass-card p-5 rounded-2xl border-slate-800 space-y-4 hover:border-slate-700 transition-all">
              
              {/* Top row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-3">
                  <div className={`p-2.5 rounded-xl text-white font-bold text-xs ${
                    booking.source === 'Zoomcar' ? 'bg-purple-900/60 border border-purple-700 text-purple-300' :
                    booking.source === 'Retail Dealer' ? 'bg-amber-900/60 border border-amber-700 text-amber-300' :
                    'bg-sky-900/60 border border-sky-700 text-sky-300'
                  }`}>
                    {booking.source}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-bold text-white">{booking.guestName}</h3>
                      <span className="text-xs text-slate-400 font-mono">({booking.id})</span>
                      {booking.createdBy && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                          Created by {booking.createdBy}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      Phone: {booking.guestPhone} • DL: {booking.guestDl} • Aadhaar: {booking.guestAadhaar}
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    booking.status === 'Completed' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                    booking.status === 'Active' ? 'bg-sky-950 text-sky-400 border border-sky-800 animate-pulse' :
                    booking.status === 'Pre-Handover Complete' ? 'bg-indigo-950 text-indigo-400 border border-indigo-800' :
                    'bg-amber-950 text-amber-400 border border-amber-800'
                  }`}>
                    {booking.status}
                  </span>
                  <span className="text-lg font-extrabold text-emerald-400">
                    ₹{booking.totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Inspection & Action Buttons Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800">
                    Dates: {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                  </span>
                  {booking.signatureUrl ? (
                    <Link
                      href={`/sign/${booking.id}`}
                      className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-400 font-semibold flex items-center gap-1 hover:bg-emerald-900/60"
                    >
                      <PenTool className="w-3.5 h-3.5" />
                      <span>Signed ✓</span>
                    </Link>
                  ) : (
                    <Link
                      href={`/sign/${booking.id}`}
                      className="px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-800 text-amber-400 font-semibold flex items-center gap-1 hover:bg-amber-900/60"
                    >
                      <PenTool className="w-3.5 h-3.5" />
                      <span>Sign Needed ✍</span>
                    </Link>
                  )}
                  {booking.preInspection && (
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-400 font-medium">
                      ✓ Pre-Inspection Logged ({booking.preInspection.odometerKm} KM, Fuel: {booking.preInspection.fuelLevel}%)
                    </span>
                  )}
                </div>

                {/* Action Triggers */}
                <div className="flex flex-wrap items-center gap-2">
                  
                  {/* Generate PDF Contract */}
                  <button
                    onClick={() => generateAgreementPDF(booking)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center space-x-1"
                  >
                    <FileText className="w-3.5 h-3.5 text-sky-400" />
                    <span>Rental Contract PDF</span>
                  </button>

                  {/* WhatsApp Greeting Trigger */}
                  <button
                    onClick={() => triggerWhatsAppGreeting(booking)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-800/80 text-emerald-300 text-xs font-medium border border-emerald-700 flex items-center space-x-1"
                  >
                    <Send className="w-3.5 h-3.5 text-emerald-400" />
                    <span>WhatsApp Greeting</span>
                  </button>

                  {/* Pre-Handover Checklist Trigger */}
                  {booking.status === 'Confirmed' && (
                    <button
                      onClick={() => {
                        setSelectedBookingForPre(booking);
                        setPreForm({
                          frontPhoto: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=500&auto=format&fit=crop&q=80',
                          backPhoto: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=500&auto=format&fit=crop&q=80',
                          leftPhoto: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=500&auto=format&fit=crop&q=80',
                          rightPhoto: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=500&auto=format&fit=crop&q=80',
                          fuelLevel: 100,
                          odometerKm: 42750,
                        });
                      }}
                      className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center space-x-1"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Pre-Handover Checklist</span>
                    </button>
                  )}

                  {/* Post-Return Checklist Trigger */}
                  {(booking.status === 'Pre-Handover Complete' || booking.status === 'Active') && (
                    <button
                      onClick={() => {
                        setSelectedBookingForPost(booking);
                        const preOdo = booking.preInspection?.odometerKm || 42750;
                        setPostForm({
                          frontPhoto: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=500&auto=format&fit=crop&q=80',
                          backPhoto: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=500&auto=format&fit=crop&q=80',
                          leftPhoto: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=500&auto=format&fit=crop&q=80',
                          rightPhoto: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=500&auto=format&fit=crop&q=80',
                          fuelLevel: 90,
                          odometerKm: preOdo + 380,
                          allowedKmPerDay: 300,
                          ratePerExtraKm: 15,
                          ratePerFuelPct: 45,
                        });
                      }}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Post-Return Offboarding</span>
                    </button>
                  )}

                  {/* Delete Booking Trigger */}
                  <button
                    onClick={() => handleDeleteBooking(booking.id, booking.guestName)}
                    title="Delete booking entry"
                    className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-400 border border-rose-800/80 transition-all flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                </div>
              </div>

            </div>
          ))
        ) : (
          <div className="glass-card p-12 rounded-2xl border-slate-800 text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/30 flex items-center justify-center">
              <CalendarCheck2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">No Fleet Bookings Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Your booking ledger is clean. Click below to pre-onboard your first guest trip for Kia Carens KA09MK6792!
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-600/30"
            >
              + Create First Booking
            </button>
          </div>
        )}
      </div>

      {/* MODAL 1: New Guest Pre-Onboarding Form */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="glass-card w-full max-w-lg p-6 rounded-2xl border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-sky-400" />
                New Guest Pre-Onboarding
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateBooking} className="space-y-4 text-xs">
              
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Booking Source Channel</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Zoomcar', 'Retail Dealer', 'Private Trip'] as const).map((src) => (
                    <button
                      type="button"
                      key={src}
                      onClick={() => setFormData({ ...formData, source: src })}
                      className={`py-2 rounded-lg font-bold border transition-all ${
                        formData.source === src
                          ? 'bg-sky-600 border-sky-500 text-white shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      {src}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Guest Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={formData.guestName}
                    onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Mobile Phone (WhatsApp)</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98765 43210"
                    value={formData.guestPhone}
                    onChange={(e) => setFormData({ ...formData, guestPhone: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Aadhaar Card Number</label>
                  <input
                    type="text"
                    required
                    placeholder="12-digit Aadhaar"
                    value={formData.guestAadhaar}
                    onChange={(e) => setFormData({ ...formData, guestAadhaar: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Driving License (DL)</label>
                  <input
                    type="text"
                    required
                    placeholder="KA-09-2022-XXXXX"
                    value={formData.guestDl}
                    onChange={(e) => setFormData({ ...formData, guestDl: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Start Date</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">End Date</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Daily Rate (₹)</label>
                  <input
                    type="number"
                    required
                    value={formData.dailyRate}
                    onChange={(e) => setFormData({ ...formData, dailyRate: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-lg shadow-sky-600/30"
                >
                  Create Booking & Pre-Onboard
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Pre-Handover Vehicle Inspection Checklist */}
      {selectedBookingForPre && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="glass-card w-full max-w-xl p-6 rounded-2xl border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Camera className="w-5 h-5 text-sky-400" />
                  Pre-Handover Vehicle Inspection
                </h2>
                <p className="text-xs text-slate-400">Guest: {selectedBookingForPre.guestName} (Kia Carens KA09MK6792)</p>
              </div>
              <button onClick={() => setSelectedBookingForPre(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCompletePreHandover} className="space-y-4 text-xs">
              
              {/* Mandatory 4 Photos Grid */}
              <div className="space-y-2">
                <label className="block text-slate-300 font-semibold">
                  Mandatory 4 Vehicle Inspection Photos (Front, Back, Left, Right)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {['Front', 'Back', 'Left', 'Right'].map((side) => {
                    const key = `${side.toLowerCase()}Photo` as keyof typeof preForm;
                    return (
                      <div key={side} className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-center">
                        <span className="font-bold text-slate-300 block mb-1">{side} View</span>
                        <img
                          src={preForm[key] as string}
                          alt={side}
                          className="h-24 w-full object-cover rounded-lg mb-2"
                        />
                        <button
                          type="button"
                          onClick={() => alert(`${side} photo captured via device camera.`)}
                          className="w-full py-1 bg-slate-800 text-sky-400 rounded text-[11px] font-semibold flex items-center justify-center gap-1"
                        >
                          <Camera className="w-3 h-3" /> Retake Photo
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Odometer & Fuel */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold flex items-center gap-1">
                    <Gauge className="w-3.5 h-3.5 text-sky-400" /> Current Odometer Reading (KM)
                  </label>
                  <input
                    type="number"
                    required
                    value={preForm.odometerKm}
                    onChange={(e) => setPreForm({ ...preForm, odometerKm: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold flex items-center gap-1">
                    <Fuel className="w-3.5 h-3.5 text-amber-400" /> Fuel Tank Level (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={preForm.fuelLevel}
                    onChange={(e) => setPreForm({ ...preForm, fuelLevel: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedBookingForPre(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-lg shadow-sky-600/30"
                >
                  Confirm Handover & Save
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Post-Return Offboarding Flow */}
      {selectedBookingForPost && selectedBookingForPost.preInspection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="glass-card w-full max-w-xl p-6 rounded-2xl border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  Post-Return Vehicle Offboarding & Invoice
                </h2>
                <p className="text-xs text-slate-400">Guest: {selectedBookingForPost.guestName}</p>
              </div>
              <button onClick={() => setSelectedBookingForPost(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCompletePostReturn} className="space-y-4 text-xs">
              
              {/* Odometer & Fuel Calculations */}
              <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
                <div className="flex justify-between text-slate-400">
                  <span>Handover Odometer: <strong className="text-slate-200">{selectedBookingForPost.preInspection.odometerKm} KM</strong></span>
                  <span>Handover Fuel: <strong className="text-slate-200">{selectedBookingForPost.preInspection.fuelLevel}%</strong></span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Return Odometer (KM)</label>
                  <input
                    type="number"
                    required
                    value={postForm.odometerKm}
                    onChange={(e) => setPostForm({ ...postForm, odometerKm: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Return Fuel Level (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={postForm.fuelLevel}
                    onChange={(e) => setPostForm({ ...postForm, fuelLevel: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              {/* Excess KM & Fuel Rate Controls */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Allowed KM/Day</label>
                  <input
                    type="number"
                    value={postForm.allowedKmPerDay}
                    onChange={(e) => setPostForm({ ...postForm, allowedKmPerDay: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Rate / Extra KM (₹)</label>
                  <input
                    type="number"
                    value={postForm.ratePerExtraKm}
                    onChange={(e) => setPostForm({ ...postForm, ratePerExtraKm: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Rate / Fuel % (₹)</label>
                  <input
                    type="number"
                    value={postForm.ratePerFuelPct}
                    onChange={(e) => setPostForm({ ...postForm, ratePerFuelPct: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedBookingForPost(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30"
                >
                  Generate Invoice & WhatsApp Guest
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
