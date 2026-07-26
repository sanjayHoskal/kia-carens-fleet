'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, UserCheck, Clock, Search, Filter } from 'lucide-react';
import { store } from '@/lib/store';
import { AuditLog } from '@/lib/types';

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filterUser, setFilterUser] = useState<'all' | 'Sanjay P' | 'Sachin'>('all');

  useEffect(() => {
    setLogs(store.getAuditLogs());
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (filterUser === 'all') return true;
    return log.userName === filterUser;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-2xl border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-sky-400" />
            Partner Audit Logs & Transparency
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable timestamped activity log for every action taken by Sanjay P or Sachin to eliminate partnership friction.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 p-1 rounded-xl">
          {(['all', 'Sanjay P', 'Sachin'] as const).map((user) => (
            <button
              key={user}
              onClick={() => setFilterUser(user)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterUser === user
                  ? 'bg-sky-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {user === 'all' ? 'All Partners' : user}
            </button>
          ))}
        </div>
      </div>

      {/* Log Entries */}
      <div className="glass-card p-6 rounded-2xl border-slate-800 space-y-4">
        <div className="space-y-3">
          {filteredLogs.map((log) => (
            <div key={log.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start space-x-4">
              <div className={`p-2.5 rounded-xl font-bold text-xs shrink-0 ${
                log.userName === 'Sanjay P' ? 'bg-sky-950 text-sky-400 border border-sky-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
              }`}>
                <UserCheck className="w-4 h-4" />
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white text-sm">{log.userName}</span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-semibold">
                      {log.action}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-slate-300">{log.details}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
