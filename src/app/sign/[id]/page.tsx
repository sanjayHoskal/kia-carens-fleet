'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { 
  Car, 
  FileCheck2, 
  CheckCircle2, 
  RotateCcw, 
  PenTool, 
  ShieldCheck, 
  Calendar,
  UserCheck
} from 'lucide-react';
import { store } from '@/lib/store';
import { Booking } from '@/lib/types';
import jsPDF from 'jspdf';

export default function GuestSignaturePage() {
  const params = useParams();
  const bookingId = params?.id as string;
  const [booking, setBooking] = useState<Booking | null>(null);
  const [signed, setSigned] = useState(false);

  // Signature canvas state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    if (bookingId) {
      const all = store.getBookings();
      const match = all.find((b) => b.id === bookingId);
      if (match) {
        setBooking(match);
      }
    }
  }, [bookingId]);

  // Canvas drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleConfirmSignature = () => {
    if (!hasSignature || !booking) {
      alert('Please draw your digital signature before confirming.');
      return;
    }

    const canvas = canvasRef.current;
    const dataUrl = canvas ? canvas.toDataURL() : '';

    store.updateBooking(booking.id, {
      signatureUrl: dataUrl,
      signedAgreementUrl: 'Signed_Agreement_Verified.pdf',
    });

    store.addAuditLog('Guest Signed Agreement', `Guest ${booking.guestName} digitally signed rental agreement for ${booking.id}`);
    setSigned(true);
  };

  if (!booking) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="glass-card p-6 rounded-2xl text-center max-w-md space-y-3">
          <p className="text-slate-400">Loading booking agreement details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4">
      
      {/* Header Banner */}
      <div className="glass-card p-6 rounded-2xl border-slate-800 text-center space-y-2 bg-gradient-to-b from-slate-900 to-sky-950/40">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/40 flex items-center justify-center">
          <Car className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-white">Kia Carens (KA09MK6792) Rental Agreement</h1>
        <p className="text-xs text-slate-400">Digital Document Verification & Guest Signature Portal</p>
      </div>

      {signed ? (
        <div className="glass-card-emerald p-8 rounded-2xl text-center space-y-4 border border-emerald-500/40">
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white">Rental Agreement Digitally Signed!</h2>
          <p className="text-xs text-emerald-200 max-w-md mx-auto">
            Thank you, <strong>{booking.guestName}</strong>. Your rental contract for Kia Carens (KA09MK6792) has been recorded with a verified timestamp. Have a safe & enjoyable journey!
          </p>
          <div className="pt-2">
            <span className="text-[11px] px-3 py-1 bg-emerald-950 text-emerald-400 rounded-full border border-emerald-800 font-mono">
              Status: Verified & Confirmed
            </span>
          </div>
        </div>
      ) : (
        <>
          {/* Agreement Summary */}
          <div className="glass-card p-6 rounded-2xl border-slate-800 space-y-4 text-xs">
            <h2 className="text-sm font-bold text-white border-b border-slate-800 pb-2">
              Booking Contract Summary
            </h2>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 block">Guest Name</span>
                <span className="font-semibold text-slate-200 text-sm">{booking.guestName}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Phone</span>
                <span className="font-semibold text-slate-200">{booking.guestPhone}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Aadhaar Number</span>
                <span className="font-semibold text-slate-200">{booking.guestAadhaar}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Driving License</span>
                <span className="font-semibold text-slate-200">{booking.guestDl}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-slate-400 block">Rental Dates</span>
                <span className="font-semibold text-slate-200">
                  {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block">Total Rental Amount</span>
                <span className="font-bold text-emerald-400 text-base">
                  ₹{booking.totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1 text-[11px] text-slate-300">
              <p className="font-bold text-white">Terms Acknowledgment:</p>
              <p>• I agree to drive the vehicle within speed limits and return it with equal fuel level.</p>
              <p>• Excess kilometer charge is ₹15/km beyond daily allowance.</p>
              <p>• FASTag tolls, parking, and traffic penalties incurred during the trip are my responsibility.</p>
            </div>
          </div>

          {/* Digital Signature Canvas Box */}
          <div className="glass-card p-6 rounded-2xl border-slate-800 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <PenTool className="w-4 h-4 text-sky-400" />
                Draw Your Signature Below
              </span>
              <button
                type="button"
                onClick={clearCanvas}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 bg-slate-900 px-2.5 py-1 rounded border border-slate-800"
              >
                <RotateCcw className="w-3 h-3" /> Clear
              </button>
            </div>

            <div className="bg-slate-900 rounded-xl border border-slate-700 p-1 flex justify-center touch-none">
              <canvas
                ref={canvasRef}
                width={500}
                height={180}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-44 bg-slate-950 rounded-lg cursor-crosshair"
              />
            </div>

            <button
              onClick={handleConfirmSignature}
              className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-lg shadow-sky-600/30 transition-all flex items-center justify-center space-x-2"
            >
              <FileCheck2 className="w-5 h-5" />
              <span>Confirm & Digitally Sign Agreement</span>
            </button>
          </div>
        </>
      )}

    </div>
  );
}
