'use client';

import React, { useState, useEffect } from 'react';
import { 
  FolderArchive, 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  ShieldCheck, 
  Download, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  FileSpreadsheet, 
  Landmark, 
  Receipt, 
  Car, 
  Scale, 
  Info, 
  X,
  ExternalLink,
  UploadCloud,
  FileCheck
} from 'lucide-react';
import { store } from '@/lib/store';
import { CarDocument, DocumentSection, PartnerUser } from '@/lib/types';

export default function CarDocumentsPage() {
  const [currentUser, setCurrentUser] = useState<PartnerUser>('Sanjay P');
  const [documents, setDocuments] = useState<CarDocument[]>([]);
  const [activeSection, setActiveSection] = useState<'all' | DocumentSection>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<CarDocument | null>(null);

  // New Document Form State
  const [newDocForm, setNewDocForm] = useState({
    title: '',
    section: 'legal' as DocumentSection,
    docType: 'Registration Certificate (RC)',
    description: '',
    expiryDate: '',
    taxCategory: 'Depreciation',
    financialYear: 'FY 2026-27',
    fileName: '',
    fileType: 'pdf',
    fileSize: '',
    fileUrl: '',
  });

  useEffect(() => {
    const user = store.getCurrentUser();
    if (user) setCurrentUser(user);

    setDocuments(store.getCarDocuments());

    const syncDocs = () => {
      setDocuments(store.getCarDocuments());
    };

    window.addEventListener('kc_docs_sync', syncDocs);
    window.addEventListener('kc_data_sync', syncDocs);
    return () => {
      window.removeEventListener('kc_docs_sync', syncDocs);
      window.removeEventListener('kc_data_sync', syncDocs);
    };
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeFormatted = file.size > 1024 * 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
      : `${Math.round(file.size / 1024)} KB`;

    const fileType = file.type.includes('image') ? 'image' : 'pdf';

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target?.result as string;
      setNewDocForm(prev => ({
        ...prev,
        fileName: file.name,
        fileType,
        fileSize: sizeFormatted,
        fileUrl: base64,
        title: prev.title || file.name.replace(/\.[^/.]+$/, ""),
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleCreateDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocForm.title.trim()) {
      alert('Please enter a document title.');
      return;
    }

    store.addCarDocument({
      title: newDocForm.title.trim(),
      section: newDocForm.section,
      docType: newDocForm.docType,
      description: newDocForm.description.trim(),
      expiryDate: newDocForm.expiryDate || undefined,
      taxCategory: newDocForm.section === 'tax_saving' ? newDocForm.taxCategory : undefined,
      financialYear: newDocForm.section === 'tax_saving' ? newDocForm.financialYear : undefined,
      fileName: newDocForm.fileName || `${newDocForm.title.replace(/\s+/g, '_')}.pdf`,
      fileType: newDocForm.fileType,
      fileSize: newDocForm.fileSize || '1.2 MB',
      fileUrl: newDocForm.fileUrl || undefined,
      uploadedBy: currentUser,
    });

    setShowUploadModal(false);
    setNewDocForm({
      title: '',
      section: 'legal',
      docType: 'Registration Certificate (RC)',
      description: '',
      expiryDate: '',
      taxCategory: 'Depreciation',
      financialYear: 'FY 2026-27',
      fileName: '',
      fileType: 'pdf',
      fileSize: '',
      fileUrl: '',
    });
  };

  const handleDeleteDocument = (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete document "${title}"?`)) {
      store.deleteCarDocument(id);
    }
  };

  const handleDownloadFile = (doc: CarDocument) => {
    if (doc.fileUrl) {
      const a = document.createElement('a');
      a.href = doc.fileUrl;
      a.download = doc.fileName || `${doc.title.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      // Create a virtual text receipt document for sample files
      const blob = new Blob([
        `KIA CARENS FLEET DOCUMENT\n\nTitle: ${doc.title}\nSection: ${doc.section === 'legal' ? 'Car Legal Documents' : 'Car Rental Income Tax Saving Documents'}\nType: ${doc.docType}\nVehicle: Kia Carens (KA09MK6792)\nValidity: ${doc.expiryDate || 'N/A'}\nDescription: ${doc.description || 'Verified fleet document'}\nUploaded By: ${doc.uploadedBy}\nUploaded At: ${new Date(doc.uploadedAt).toLocaleString()}`
      ], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc.title.replace(/\s+/g, '_')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Filtered documents
  const filteredDocs = documents.filter((d) => {
    if (activeSection !== 'all' && d.section !== activeSection) return false;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchTitle = d.title.toLowerCase().includes(query);
      const matchType = d.docType.toLowerCase().includes(query);
      const matchDesc = d.description?.toLowerCase().includes(query);
      const matchTax = d.taxCategory?.toLowerCase().includes(query);
      return matchTitle || matchType || matchDesc || matchTax;
    }
    return true;
  });

  const legalCount = documents.filter(d => d.section === 'legal').length;
  const taxCount = documents.filter(d => d.section === 'tax_saving').length;

  return (
    <div className="space-y-6">
      
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 shadow-lg">
        <div className="space-y-1 mb-4 md:mb-0">
          <div className="flex items-center space-x-2">
            <span className="text-xs px-2.5 py-1 rounded-md bg-indigo-950 text-indigo-400 border border-indigo-800 font-semibold flex items-center gap-1.5">
              <FolderArchive className="w-3.5 h-3.5 text-indigo-400" />
              Document Vault
            </span>
            <span className="text-xs px-2.5 py-1 rounded-md bg-sky-950 text-sky-400 border border-sky-800 font-semibold font-mono">
              KA09MK6792
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Kia Carens Fleet Documents Repository
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            Secure cloud storage for mandatory Motor Vehicle legal compliance records and car rental Income Tax saving deduction certificates.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-all shadow-lg shadow-sky-600/30 flex items-center space-x-2 shrink-0 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Metrics Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="glass-card p-4 rounded-xl border-slate-800 flex items-center space-x-3.5">
          <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <FolderArchive className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-400 text-xs block font-medium">Total Stored Documents</span>
            <span className="text-xl font-bold text-white font-mono">{documents.length}</span>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl border-slate-800 flex items-center space-x-3.5">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-400 text-xs block font-medium">Car Legal Documents</span>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold text-emerald-400 font-mono">{legalCount}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                MVA Compliant
              </span>
            </div>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl border-slate-800 flex items-center space-x-3.5">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-400 text-xs block font-medium">Tax Saving Documents</span>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold text-purple-400 font-mono">{taxCount}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                ITR Ready
              </span>
            </div>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl border-slate-800 flex items-center space-x-3.5">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-400 text-xs block font-medium">Compliance Status</span>
            <span className="text-sm font-bold text-white flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              All Critical Files Active
            </span>
          </div>
        </div>

      </div>

      {/* SUBSECTIONS GUIDANCE & EXPLANATORY BANNER (Req 6) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Subsection 1 Guide: Car Legal Documents */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
              <Scale className="w-4 h-4" />
              <span>Subsection 1: Car Legal Documents</span>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
              Indian Motor Vehicles Act
            </span>
          </div>
          
          <p className="text-xs text-slate-300 leading-relaxed">
            Mandatory regulatory, road-worthiness, and ownership compliance documents required by Indian Transport Authorities (RTO) and Law Enforcement to legally operate Kia Carens (KA09MK6792) on public roads and rental fleets:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1 text-slate-300">
            <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="font-bold text-white block">1. RC Smart Card</span>
              <p className="text-slate-400 text-[10px]">Ministry of Road Transport & Highways digital / smart card copy.</p>
            </div>
            <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="font-bold text-white block">2. Comprehensive Insurance</span>
              <p className="text-slate-400 text-[10px]">Bumper-to-Bumper policy with Zero Dep, 1st & 3rd party liability cover.</p>
            </div>
            <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="font-bold text-white block">3. Emission PUCC</span>
              <p className="text-slate-400 text-[10px]">Valid online emission certificate with QR code and validity date.</p>
            </div>
            <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="font-bold text-white block">4. Loan Hypothecation (Form 34)</span>
              <p className="text-slate-400 text-[10px]">Cars24 NBFC loan sanction letter and financier hypothecation deed.</p>
            </div>
          </div>
        </div>

        {/* Subsection 2 Guide: Car Rental Income Tax Saving Documents */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-purple-400 font-bold text-sm">
              <Landmark className="w-4 h-4" />
              <span>Subsection 2: Car Rental Income Tax Saving Documents</span>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800">
              Indian Income Tax Act
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Essential financial expense vouchers, interest certificates, and asset schedules eligible for 100% legitimate business tax deduction against rental revenues to minimize income tax liability:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1 text-slate-300">
            <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="font-bold text-white block">1. 15% Asset Depreciation (Sec 32)</span>
              <p className="text-slate-400 text-[10px]">Annual 15% Written Down Value (WDV) depreciation on vehicle cost.</p>
            </div>
            <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="font-bold text-white block">2. Loan Interest Portion (Sec 36)</span>
              <p className="text-slate-400 text-[10px]">Cars24 loan interest certificate; 100% deductible business borrowing cost.</p>
            </div>
            <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="font-bold text-white block">3. Servicing & Repairs (Sec 37)</span>
              <p className="text-slate-400 text-[10px]">Kia authorized workshop bills for routine 10K km maintenance & parts.</p>
            </div>
            <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="font-bold text-white block">4. Platform TDS Invoices (Sec 194C)</span>
              <p className="text-slate-400 text-[10px]">Zoomcar Form 16A quarterly certificates & platform commission invoices.</p>
            </div>
          </div>
        </div>

      </div>

      {/* Controls & Filtering Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
        
        {/* Subsection Switcher Tabs */}
        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1.5">
          <button
            onClick={() => setActiveSection('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSection === 'all'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            All Documents ({documents.length})
          </button>
          <button
            onClick={() => setActiveSection('legal')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeSection === 'legal'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Car Legal Documents ({legalCount})</span>
          </button>
          <button
            onClick={() => setActiveSection('tax_saving')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeSection === 'tax_saving'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <Landmark className="w-3.5 h-3.5" />
            <span>Tax Saving Documents ({taxCount})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search documents, RC, Sec 32..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

      </div>

      {/* Documents Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.length > 0 ? (
          filteredDocs.map((doc) => {
            const isLegal = doc.section === 'legal';
            return (
              <div 
                key={doc.id}
                className="glass-card p-5 rounded-2xl border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all space-y-4"
              >
                <div className="space-y-3">
                  
                  {/* Card Header & Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2.5">
                      <div className={`p-2 rounded-xl text-white ${
                        isLegal 
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80' 
                          : 'bg-purple-950/80 text-purple-400 border border-purple-800/80'
                      }`}>
                        {isLegal ? <Scale className="w-4 h-4" /> : <Receipt className="w-4 h-4" />}
                      </div>
                      <div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                          isLegal ? 'text-emerald-400' : 'text-purple-400'
                        }`}>
                          {isLegal ? 'Legal Document' : 'Tax Saving Document'}
                        </span>
                        <span className="text-xs font-semibold text-slate-300">
                          {doc.docType}
                        </span>
                      </div>
                    </div>

                    {doc.expiryDate && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-mono">
                        Exp: {doc.expiryDate}
                      </span>
                    )}
                  </div>

                  {/* Document Title */}
                  <div>
                    <h3 className="text-sm font-bold text-white leading-snug">
                      {doc.title}
                    </h3>
                    {doc.description && (
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
                        {doc.description}
                      </p>
                    )}
                  </div>

                  {/* Meta tags (Tax category, Financial Year, File name) */}
                  <div className="flex flex-wrap gap-1.5 pt-1 text-[11px]">
                    {doc.taxCategory && (
                      <span className="px-2 py-0.5 rounded bg-purple-950/60 border border-purple-800 text-purple-300 font-medium">
                        {doc.taxCategory}
                      </span>
                    )}
                    {doc.financialYear && (
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-sky-400 font-mono">
                        {doc.financialYear}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-mono text-[10px]">
                      {doc.fileSize || '1.2 MB'}
                    </span>
                  </div>

                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-500">
                    Logged by {doc.uploadedBy}
                  </span>

                  <div className="flex items-center space-x-1.5">
                    {/* View / Preview */}
                    <button
                      onClick={() => setPreviewDoc(doc)}
                      title="Preview Document Details"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    {/* Download */}
                    <button
                      onClick={() => handleDownloadFile(doc)}
                      title="Download Document"
                      className="p-1.5 rounded-lg bg-sky-950 hover:bg-sky-900 text-sky-300 border border-sky-800 transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDeleteDocument(doc.id, doc.title)}
                      title="Delete Document"
                      className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-400 border border-rose-800/80 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })
        ) : (
          <div className="col-span-full glass-card p-12 rounded-2xl border-slate-800 text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <FolderArchive className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">No Documents Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery ? 'No documents match your search query.' : 'No files found in this section. Click below to upload your first document!'}
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-600/30"
            >
              + Upload Document
            </button>
          </div>
        )}
      </div>

      {/* UPLOAD DOCUMENT MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
          <div className="glass-card w-full max-w-lg p-6 rounded-2xl border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-white">
                <UploadCloud className="w-5 h-5 text-sky-400" />
                <h2 className="text-base font-bold">Store Fleet Document</h2>
              </div>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDocument} className="space-y-4 text-xs">
              
              {/* Target Subsection Choice */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Select Document Subsection *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewDocForm({ 
                      ...newDocForm, 
                      section: 'legal',
                      docType: 'Registration Certificate (RC)'
                    })}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      newDocForm.section === 'legal'
                        ? 'bg-emerald-950/80 border-emerald-500 text-white shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="font-bold text-xs flex items-center gap-1.5 text-emerald-400">
                      <Scale className="w-4 h-4" />
                      1. Car Legal Documents
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      RC, Motor Insurance, PUCC, Hypothecation
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewDocForm({ 
                      ...newDocForm, 
                      section: 'tax_saving',
                      docType: 'Depreciation Schedule (Sec 32)'
                    })}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      newDocForm.section === 'tax_saving'
                        ? 'bg-purple-950/80 border-purple-500 text-white shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="font-bold text-xs flex items-center gap-1.5 text-purple-400">
                      <Landmark className="w-4 h-4" />
                      2. Tax Saving Documents
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Depreciation, Loan Interest, Servicing, TDS
                    </p>
                  </button>
                </div>
              </div>

              {/* Title & Document Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Document Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kia Carens Insurance Policy 2026-27"
                    value={newDocForm.title}
                    onChange={(e) => setNewDocForm({ ...newDocForm, title: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Document Category Type</label>
                  <select
                    value={newDocForm.docType}
                    onChange={(e) => setNewDocForm({ ...newDocForm, docType: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500 text-xs"
                  >
                    {newDocForm.section === 'legal' ? (
                      <>
                        <option value="Registration Certificate (RC)">Registration Certificate (RC)</option>
                        <option value="Insurance Policy">Comprehensive Insurance Policy</option>
                        <option value="PUC Certificate">Pollution Under Control (PUCC)</option>
                        <option value="Loan & Hypothecation">Cars24 Loan Hypothecation (Form 34)</option>
                        <option value="Fitness & Permit">Transport Fitness & Permit</option>
                        <option value="Road Tax & FASTag">Road Tax Receipt & FASTag</option>
                        <option value="Other Legal Record">Other Legal Record</option>
                      </>
                    ) : (
                      <>
                        <option value="Depreciation Schedule (Sec 32)">Vehicle Asset Depreciation (Sec 32)</option>
                        <option value="Loan Interest Certificate (Sec 36)">Cars24 Loan Interest Statement (Sec 36)</option>
                        <option value="Service & Maintenance (Sec 37)">Kia Periodic Servicing Bills (Sec 37)</option>
                        <option value="Fuel Invoices (Sec 37)">Fuel & Petrol Invoices (Sec 37)</option>
                        <option value="Insurance Tax Receipt (Sec 37)">Motor Insurance Tax Receipt (Sec 37)</option>
                        <option value="Platform TDS Statement (Sec 194C)">Zoomcar TDS Statement (Form 16A)</option>
                        <option value="Toll & FASTag Summary">Toll Tax & Parking Expense Records</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Tax specifics if tax saving */}
              {newDocForm.section === 'tax_saving' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Tax Deduction Head</label>
                    <select
                      value={newDocForm.taxCategory}
                      onChange={(e) => setNewDocForm({ ...newDocForm, taxCategory: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500 text-xs"
                    >
                      <option value="Depreciation (Sec 32)">Depreciation (Sec 32 - 15% WDV)</option>
                      <option value="Loan Interest (Sec 36)">Vehicle Loan Interest (Sec 36)</option>
                      <option value="Maintenance & Servicing (Sec 37)">Maintenance & Servicing (Sec 37)</option>
                      <option value="Fuel & Operations (Sec 37)">Fuel & Operations (Sec 37)</option>
                      <option value="Platform Fees & TDS (Sec 194C)">Platform Fees & TDS Credit (Sec 194C)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Financial Year (FY)</label>
                    <input
                      type="text"
                      placeholder="e.g. FY 2026-27"
                      value={newDocForm.financialYear}
                      onChange={(e) => setNewDocForm({ ...newDocForm, financialYear: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500 font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Expiry Date (Optional) */}
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  Document Expiry / Renewal Date (Optional)
                </label>
                <input
                  type="date"
                  value={newDocForm.expiryDate}
                  onChange={(e) => setNewDocForm({ ...newDocForm, expiryDate: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Description / Notes */}
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Description & Filing Notes</label>
                <textarea
                  rows={2}
                  placeholder="Details regarding policy number, coverage, tax deduction clause, etc."
                  value={newDocForm.description}
                  onChange={(e) => setNewDocForm({ ...newDocForm, description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* File Attachment / Upload Input */}
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Upload File (PDF or Image)</label>
                <div className="p-4 rounded-xl border border-dashed border-slate-700 bg-slate-950/60 text-center space-y-2">
                  <input
                    type="file"
                    id="doc-file-input"
                    accept=".pdf,image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="doc-file-input"
                    className="cursor-pointer inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 font-semibold text-xs border border-slate-700"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>Choose File from Device</span>
                  </label>
                  {newDocForm.fileName ? (
                    <div className="text-[11px] text-emerald-400 font-mono font-medium">
                      ✓ Selected: {newDocForm.fileName} ({newDocForm.fileSize})
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-500">
                      Supports PDF, PNG, JPG, WEBP. Files are stored securely for instant viewing and downloading.
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-semibold text-xs hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-600/30 flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Save Document</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* DOCUMENT PREVIEW MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
          <div className="glass-card w-full max-w-2xl p-6 rounded-2xl border-slate-800 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    previewDoc.section === 'legal'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-purple-950 text-purple-300 border border-purple-800'
                  }`}>
                    {previewDoc.section === 'legal' ? 'Legal Compliance' : 'Income Tax Saving'}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {previewDoc.docType}
                  </span>
                </div>
                <h2 className="text-base font-bold text-white">{previewDoc.title}</h2>
              </div>
              <button 
                onClick={() => setPreviewDoc(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Vehicle</span>
                <span className="text-white font-bold">Kia Carens (KA09MK6792)</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Validity / Expiry</span>
                <span className="text-sky-400 font-medium">{previewDoc.expiryDate || 'Valid Permanent'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Uploaded By</span>
                <span className="text-slate-200 font-medium">{previewDoc.uploadedBy}</span>
              </div>
              {previewDoc.taxCategory && (
                <div>
                  <span className="text-slate-400 block text-[11px]">Tax Head</span>
                  <span className="text-purple-300 font-medium">{previewDoc.taxCategory}</span>
                </div>
              )}
              {previewDoc.financialYear && (
                <div>
                  <span className="text-slate-400 block text-[11px]">Financial Year</span>
                  <span className="text-amber-400 font-mono">{previewDoc.financialYear}</span>
                </div>
              )}
              <div>
                <span className="text-slate-400 block text-[11px]">File Format</span>
                <span className="text-slate-300 font-mono uppercase">{previewDoc.fileType || 'PDF'}</span>
              </div>
            </div>

            {/* Description */}
            {previewDoc.description && (
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                  Description & Regulatory Notes
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {previewDoc.description}
                </p>
              </div>
            )}

            {/* File Preview (if image) */}
            {previewDoc.fileUrl && previewDoc.fileType === 'image' && (
              <div className="rounded-xl overflow-hidden border border-slate-800 max-h-80 flex items-center justify-center bg-black/40">
                <img 
                  src={previewDoc.fileUrl} 
                  alt={previewDoc.title}
                  className="max-h-80 object-contain w-full"
                />
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 flex justify-between items-center border-t border-slate-800">
              <button
                onClick={() => {
                  handleDeleteDocument(previewDoc.id, previewDoc.title);
                  setPreviewDoc(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-semibold flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete File</span>
              </button>

              <div className="flex space-x-2">
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Close
                </button>
                <button
                  onClick={() => handleDownloadFile(previewDoc)}
                  className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-600/30 flex items-center space-x-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Document</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
