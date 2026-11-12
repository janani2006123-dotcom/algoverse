import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  History,
  ShieldAlert,
  Clock,
  MapPin,
  CheckCheck,
  Check,
  Eye,
  AlertTriangle,
  RefreshCw,
  Lock,
  Phone,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { SosEventRecord, WhatsAppDeliveryStatus } from '../types';

export const SosHistoryPage: React.FC = () => {
  const { user, authToken, setCurrentPage, showToast } = useApp();

  const [events, setEvents] = useState<SosEventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  const fetchHistory = async () => {
    if (!authToken) return;
    setLoading(true);
    try {
      const res = await fetch('/api/sos/history', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.events)) {
          setEvents(data.events);
          if (data.events.length > 0 && !expandedEventId) {
            setExpandedEventId(data.events[0].eventId);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load SOS history:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [authToken]);

  if (!authToken || !user) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Authentication Required</h2>
        <p className="text-xs text-slate-500">
          Personal emergency distress history is strictly private. Sign in to review your emergency broadcast records.
        </p>
        <button
          type="button"
          onClick={() => setCurrentPage('auth')}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700"
        >
          Sign In or Register
        </button>
      </div>
    );
  }

  const renderStatusBadge = (status: WhatsAppDeliveryStatus) => {
    switch (status) {
      case 'DELIVERED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
            <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>DELIVERED</span>
          </span>
        );
      case 'READ':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300 border border-violet-300 dark:border-violet-800 flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-violet-600" />
            <span>READ</span>
          </span>
        );
      case 'SENT':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800 flex items-center gap-1">
            <Check className="w-3.5 h-3.5 text-indigo-600" />
            <span>SENT</span>
          </span>
        );
      case 'FAILED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>FAILED</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1">
            <History className="w-4 h-4" />
            <span>Audit Trail & Delivery Telemetry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Personal SOS Emergency History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Detailed log of all emergency alerts sent from your account ({user.email}) with per-recipient delivery confirmation.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchHistory}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 flex items-center gap-1.5 text-xs font-medium shrink-0 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* Events List */}
      {loading ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
          <p className="text-xs text-slate-500">Loading your verified distress history...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">No Emergency Events Dispatched</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You have not triggered any SOS broadcasts yet. When you send an alert, full per-recipient delivery records will appear here.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCurrentPage('sos')}
            className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700"
          >
            Go to SOS Page
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((ev) => {
            const isExpanded = expandedEventId === ev.eventId;
            return (
              <div
                key={ev.eventId}
                className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 transition-all"
              >
                {/* Event Summary Bar */}
                <div
                  onClick={() => setExpandedEventId(isExpanded ? null : ev.eventId)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                          {ev.emergencyReferenceId}
                        </span>
                        {renderStatusBadge(ev.overallStatus)}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(ev.createdAt).toLocaleString()}</span>
                        <span>·</span>
                        <span>{ev.recipients.length} Recipient(s)</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <span className="text-xs text-slate-400 font-medium">
                      {isExpanded ? 'Hide Details' : 'View Recipients'}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Message Content */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                  <span className="font-semibold block mb-0.5 text-slate-900 dark:text-white">Broadcast Message:</span>
                  <span className="italic">"{ev.message}"</span>
                  {ev.latitude && ev.longitude && (
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 pt-1.5 font-mono">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>GPS: {ev.latitude}, {ev.longitude}</span>
                    </div>
                  )}
                </div>

                {/* Expanded Recipient Status Breakdown (Phase 6) */}
                {isExpanded && (
                  <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-150">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Individual Recipient WhatsApp Delivery Status
                    </h4>

                    <div className="grid grid-cols-1 gap-2.5">
                      {ev.recipients.map((rcp) => (
                        <div
                          key={rcp.recipientId}
                          className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                        >
                          <div className="space-y-0.5">
                            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                              <span>{rcp.recipientName}</span>
                              <span className="text-slate-400 font-mono text-[11px]">({rcp.recipientPhone})</span>
                            </div>
                            {rcp.wamid && (
                              <div className="text-[10px] font-mono text-slate-500 truncate max-w-xs">
                                wamid: {rcp.wamid}
                              </div>
                            )}
                            {rcp.errorInformation && (
                              <div className="text-[11px] text-rose-500 flex items-center gap-1 pt-0.5">
                                <AlertTriangle className="w-3 h-3" />
                                <span>{rcp.errorInformation}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                            {renderStatusBadge(rcp.deliveryStatus)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
