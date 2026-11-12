import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  AlertTriangle,
  PhoneCall,
  MapPin,
  Send,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Volume2,
  VolumeX,
  AlertCircle,
  FileText,
  RefreshCw,
  Copy,
  Check,
  MessageSquare,
  Eye,
  CheckCheck,
  Info,
  Users,
  History,
  Lock,
} from 'lucide-react';
import {
  EmergencyContact,
  WhatsAppDeliveryStatus,
  WhatsAppConfigStatus,
  SosEventRecord,
} from '../types';

export const SosPage: React.FC = () => {
  const {
    user,
    authToken,
    emergencyContacts,
    addEmergencyContact,
    removeEmergencyContact,
    setCurrentPage,
    showToast,
  } = useApp();

  const [selectedPreset, setSelectedPreset] = useState<string>('I need urgent help. Please assist me.');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [userConsentGiven, setUserConsentGiven] = useState<boolean>(true);
  const [includeLocationInSos, setIncludeLocationInSos] = useState<boolean>(true);

  const [isLocating, setIsLocating] = useState(false);
  const [locationData, setLocationData] = useState<{
    latitude: number;
    longitude: number;
    address?: string;
  } | null>(null);

  // Multi-recipient SOS State Tracking
  const [isSending, setIsSending] = useState(false);
  const [activeEvent, setActiveEvent] = useState<SosEventRecord | null>(null);
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  // Meta WhatsApp Server Config status
  const [configStatus, setConfigStatus] = useState<WhatsAppConfigStatus | null>(null);

  // Confirmation & Contact Modals
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactRelation, setContactRelation] = useState('');

  // Audio Siren Alarm
  const [isAudioAlarmActive, setIsAudioAlarmActive] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);

  // Polling ref for Phase 5 & 10
  const pollingTimerRef = useRef<number | null>(null);

  const PRESET_MESSAGES = [
    'I need urgent help. Please assist me immediately.',
    'Medical emergency. I am Deaf/non-verbal and require immediate attention.',
    'Please call an ambulance to my location.',
    'I feel unsafe. Please send emergency assistance.',
    'I cannot hear or speak right now. Please message or send help.',
    'I am having an emergency. Please contact emergency services on my behalf.',
  ];

  // Select all contacts by default when contacts load
  useEffect(() => {
    if (emergencyContacts.length > 0) {
      setSelectedContactIds((prev) => (prev.length === 0 ? emergencyContacts.map((c) => c.id) : prev));
    }
  }, [emergencyContacts]);

  // Load WhatsApp server configuration status on mount
  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await fetch('/api/sos/config-status');
        if (res.ok) {
          const data = await res.json();
          setConfigStatus(data);
        }
      } catch (e) {
        // ignore
      }
    }
    fetchConfig();
  }, []);

  // Poll for multi-recipient event delivery status updates (Phase 5 & 10)
  useEffect(() => {
    const eventId = activeEvent?.eventId;
    if (!eventId || !authToken) {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
      return;
    }

    const allRecipientsTerminal =
      activeEvent.recipients.length > 0 &&
      activeEvent.recipients.every(
        (r) => r.deliveryStatus === 'DELIVERED' || r.deliveryStatus === 'READ' || r.deliveryStatus === 'FAILED'
      );

    if (allRecipientsTerminal) {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
      return;
    }

    // Start polling every 2 seconds
    pollingTimerRef.current = window.setInterval(async () => {
      try {
        const res = await fetch(`/api/sos/event/${eventId}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (!res.ok) return;

        const data = await res.json();
        if (data.success && data.event) {
          const newEvent: SosEventRecord = data.event;
          setActiveEvent(newEvent);

          const newlyDelivered = newEvent.recipients.some(
            (r) => r.deliveryStatus === 'DELIVERED' && activeEvent.recipients.find((ar) => ar.recipientId === r.recipientId)?.deliveryStatus !== 'DELIVERED'
          );
          if (newlyDelivered) {
            showToast('WhatsApp confirmed delivery to recipient handset!', 'success');
          }
        }
      } catch (err) {
        // network polling error; continue
      }
    }, 2000);

    return () => {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
    };
  }, [activeEvent, authToken, showToast]);

  // Request browser geolocation
  const handleRequestLocation = () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.', 'info');
      setLocationData({
        latitude: 37.7749,
        longitude: -122.4194,
        address: 'San Francisco, CA (Estimated)',
      });
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationData({
          latitude: Number(pos.coords.latitude.toFixed(5)),
          longitude: Number(pos.coords.longitude.toFixed(5)),
          address: `Lat: ${pos.coords.latitude.toFixed(4)}, Long: ${pos.coords.longitude.toFixed(4)}`,
        });
        setIsLocating(false);
        showToast('GPS coordinates acquired with accuracy', 'success');
      },
      (err) => {
        console.warn('Geolocation warning:', err);
        setLocationData({
          latitude: 37.7749,
          longitude: -122.4194,
          address: 'Approx. 37.7749° N, 122.4194° W',
        });
        setIsLocating(false);
        showToast('Using approximate coordinates.', 'info');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Audible emergency beacon synthesizer
  const toggleAudioAlarm = () => {
    if (isAudioAlarmActive) {
      try {
        oscillatorRef.current?.stop();
        audioContextRef.current?.close();
      } catch (e) {
        // ignore
      }
      setIsAudioAlarmActive(false);
    } else {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(850, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(450, ctx.currentTime + 0.5);

        gain.gain.setValueAtTime(0.3, ctx.currentTime);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();

        audioContextRef.current = ctx;
        oscillatorRef.current = osc;
        setIsAudioAlarmActive(true);
        showToast('Audible room alert beacon activated', 'info');
      } catch (e) {
        console.error('Audio alert error:', e);
      }
    }
  };

  const handleToggleContactSelect = (contactId: string) => {
    setSelectedContactIds((prev) =>
      prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId]
    );
  };

  const handleSelectAllContacts = () => {
    if (selectedContactIds.length === emergencyContacts.length) {
      setSelectedContactIds([]);
    } else {
      setSelectedContactIds(emergencyContacts.map((c) => c.id));
    }
  };

  /**
   * PHASE 5: Multi-User Multi-Recipient WhatsApp SOS
   */
  const handleDispatchWhatsAppSos = async () => {
    if (!authToken || !user) {
      showToast('Please sign in or register to dispatch an authenticated emergency broadcast.', 'error');
      setCurrentPage('auth');
      return;
    }

    if (emergencyContacts.length === 0) {
      showToast('Please add at least one emergency contact first.', 'error');
      setShowConfirmModal(false);
      setShowAddContact(true);
      return;
    }

    if (selectedContactIds.length === 0) {
      showToast('Please select at least one contact to receive this alert.', 'error');
      return;
    }

    if (!userConsentGiven) {
      showToast('You must give consent to send an emergency broadcast.', 'error');
      return;
    }

    setShowConfirmModal(false);
    setIsSending(true);
    setDispatchError(null);

    const messageText = customMessage.trim() || selectedPreset;

    try {
      const payload = {
        emergencyMessage: messageText,
        recipientContactIds: selectedContactIds,
        latitude: includeLocationInSos && locationData ? locationData.latitude : null,
        longitude: includeLocationInSos && locationData ? locationData.longitude : null,
        locationAddress: locationData?.address || null,
        userConsent: true,
      };

      const res = await fetch('/api/sos/dispatch-multi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        const errMessage = data.error || 'Emergency broadcast dispatch failed.';
        setDispatchError(errMessage);
        showToast(errMessage, 'error');
        return;
      }

      setActiveEvent(data.event);
      showToast(`Emergency alert dispatched to ${data.event.recipients.length} contact(s)!`, 'info');
    } catch (err: any) {
      console.error('[Multi-SOS] Dispatch network error:', err);
      setDispatchError(`Network communication error: ${err?.message || err}.`);
      showToast('Network error connecting to backend.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  // Simulate webhook delivery on a specific recipient (Phase 10 & 11)
  const handleSimulateRecipientWebhook = async (wamid: string | null, status: 'DELIVERED' | 'READ' | 'FAILED') => {
    if (!wamid) return;
    try {
      const res = await fetch('/api/webhooks/whatsapp/simulate-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wamid,
          targetStatus: status,
          errorInfo: status === 'FAILED' ? 'Simulated recipient offline / undeliverable' : null,
        }),
      });
      const data = await res.json();
      if (data.success && data.event) {
        setActiveEvent(data.event);
        showToast(`Simulated WhatsApp webhook: updated recipient to ${status}`, 'success');
      }
    } catch {
      showToast('Failed to trigger webhook simulation', 'error');
    }
  };

  const handleAddNewContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactPhone) {
      showToast('Name and phone number are required', 'error');
      return;
    }
    await addEmergencyContact({
      name: contactName,
      phone: contactPhone,
      relation: contactRelation || 'Emergency Contact',
      notifySms: true,
      notifyCall: true,
      isPreferred: emergencyContacts.length === 0,
      notificationConsent: true,
    });
    setContactName('');
    setContactPhone('');
    setContactRelation('');
    setShowAddContact(false);
  };

  const copyWebhookUrl = () => {
    if (configStatus?.webhookUrl) {
      navigator.clipboard.writeText(configStatus.webhookUrl);
      setCopiedWebhook(true);
      setTimeout(() => setCopiedWebhook(false), 2000);
      showToast('Webhook URL copied to clipboard', 'info');
    }
  };

  const hasAnySentWaiting =
    activeEvent && activeEvent.recipients.some((r) => r.deliveryStatus === 'SENT');

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span>Priority Multi-User Emergency SOS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            SOS Distress Broadcast
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Accessible multi-recipient distress notification powered by Meta WhatsApp Business Cloud API with independent per-recipient delivery verification.
          </p>
        </div>

        {/* Quick Links */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setCurrentPage('emergency-contacts')}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5 text-indigo-500" />
            <span>Manage Contacts</span>
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage('sos-history')}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5"
          >
            <History className="w-3.5 h-3.5 text-rose-500" />
            <span>SOS History</span>
          </button>
        </div>
      </div>

      {/* Auth Status Notice if Unauthenticated */}
      {!authToken && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>You are currently browsing as a guest. Sign in to enable secure multi-recipient WhatsApp SOS.</span>
          </div>
          <button
            type="button"
            onClick={() => setCurrentPage('auth')}
            className="px-3 py-1 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700 shrink-0"
          >
            Sign In / Register
          </button>
        </div>
      )}

      {/* WhatsApp Cloud API Server Configuration Status Banner */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-3 h-3 rounded-full shrink-0 ${
              configStatus?.readyToSend ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`}
          />
          <div>
            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Central Meta WhatsApp Business Sender:</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  configStatus?.readyToSend
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                {configStatus?.readyToSend ? 'CREDENTIALS CONFIGURED' : 'PENDING CREDENTIALS'}
              </span>
            </div>
            <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
              {configStatus?.readyToSend
                ? `Active Meta Graph API (${configStatus.apiVersion}). Individual users do not need their own WhatsApp developer accounts.`
                : `Missing: ${configStatus?.missing?.join(', ') || 'WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN'}. Configure in server environment.`}
            </div>
          </div>
        </div>

        {configStatus?.webhookUrl && (
          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <span className="text-[11px] font-mono text-slate-500 hidden md:inline truncate max-w-xs">
              {configStatus.webhookUrl}
            </span>
            <button
              type="button"
              onClick={copyWebhookUrl}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 flex items-center gap-1 shrink-0 text-[11px] font-medium"
              title="Copy WhatsApp Webhook URL"
            >
              {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedWebhook ? 'Copied' : 'Copy Webhook URL'}</span>
            </button>
          </div>
        )}
      </div>

      {/* PHASE 5 & 10: Multi-Recipient Real-Time Delivery Tracking Card */}
      {activeEvent && (
        <div className="p-6 rounded-3xl border-2 border-indigo-500/40 bg-gradient-to-b from-indigo-500/10 via-indigo-500/5 to-transparent space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wide">
                    Live Multi-Recipient SOS Tracking
                  </h3>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-black/10 dark:bg-white/10 font-bold">
                    {activeEvent.emergencyReferenceId}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Tracking {activeEvent.recipients.length} recipient(s) independently via Meta WhatsApp callbacks.
                </p>
              </div>
            </div>

            {hasAnySentWaiting && (
              <div className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs font-semibold flex items-center gap-1.5 shrink-0 animate-pulse">
                <Clock className="w-3.5 h-3.5" />
                <span>Message delivery has not yet been confirmed.</span>
              </div>
            )}
          </div>

          {/* Event Content Header */}
          <div className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 text-xs space-y-1">
            <span className="font-semibold text-slate-900 dark:text-white">Broadcast Message: </span>
            <span className="italic text-slate-700 dark:text-slate-300">"{activeEvent.message}"</span>
            {activeEvent.latitude && activeEvent.longitude && (
              <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 pt-1">
                📍 GPS Attached: {activeEvent.latitude}, {activeEvent.longitude}
              </div>
            )}
          </div>

          {/* Independent Recipient Cards (Phase 5 & 10) */}
          <div className="space-y-2.5 pt-1">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              Independent Recipient Delivery States
            </span>

            <div className="grid grid-cols-1 gap-2.5">
              {activeEvent.recipients.map((rcp) => (
                <div
                  key={rcp.recipientId}
                  className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">{rcp.recipientName}</span>
                      <span className="font-mono text-[11px] text-slate-500">({rcp.recipientPhone})</span>
                    </div>
                    {rcp.wamid && (
                      <div className="text-[10px] font-mono text-slate-400 truncate max-w-sm">
                        wamid: {rcp.wamid}
                      </div>
                    )}
                    {rcp.errorInformation && (
                      <div className="text-[11px] text-rose-500 font-medium">
                        {rcp.errorInformation}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
                    {/* Status Badge */}
                    {rcp.deliveryStatus === 'DELIVERED' && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1 border border-emerald-300">
                        <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>DELIVERED</span>
                      </span>
                    )}
                    {rcp.deliveryStatus === 'READ' && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300 flex items-center gap-1 border border-violet-300">
                        <Eye className="w-3.5 h-3.5 text-violet-600" />
                        <span>READ</span>
                      </span>
                    )}
                    {rcp.deliveryStatus === 'SENT' && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 flex items-center gap-1 border border-indigo-300">
                        <Check className="w-3.5 h-3.5 text-indigo-600" />
                        <span>SENT</span>
                      </span>
                    )}
                    {rcp.deliveryStatus === 'FAILED' && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 flex items-center gap-1 border border-rose-300">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        <span>FAILED</span>
                      </span>
                    )}

                    {/* Direct phone call fallback */}
                    <a
                      href={`tel:${rcp.recipientPhone.replace(/[\s\-\(\)]/g, '')}`}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-emerald-600"
                      title="Direct phone call"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                    </a>

                    {/* Phase 10 & 11: Webhook Simulator Buttons per recipient */}
                    {rcp.wamid && (
                      <div className="flex items-center gap-1">
                        {rcp.deliveryStatus === 'SENT' && (
                          <button
                            type="button"
                            onClick={() => handleSimulateRecipientWebhook(rcp.wamid, 'DELIVERED')}
                            className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white hover:bg-emerald-700"
                            title="Simulate Meta delivery webhook"
                          >
                            Delivered
                          </button>
                        )}
                        {rcp.deliveryStatus === 'DELIVERED' && (
                          <button
                            type="button"
                            onClick={() => handleSimulateRecipientWebhook(rcp.wamid, 'READ')}
                            className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-600 text-white hover:bg-violet-700"
                            title="Simulate Meta read webhook"
                          >
                            Read
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Prominent Emergency Action Zone */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-rose-500/10 via-rose-500/5 to-transparent border-2 border-rose-500/30 dark:border-rose-500/20 shadow-sm flex flex-col items-center text-center space-y-6">
        {/* Massive Touch-Friendly Accessible SOS Button */}
        <div className="relative">
          <div className="absolute -inset-4 rounded-full bg-rose-500/20 animate-pulse pointer-events-none" />
          <button
            type="button"
            onClick={() => setShowConfirmModal(true)}
            disabled={isSending}
            className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-gradient-to-tr from-rose-600 to-rose-500 text-white font-extrabold text-2xl sm:text-3xl shadow-lg hover:from-rose-700 hover:to-rose-600 active:scale-95 disabled:opacity-50 transition-all flex flex-col items-center justify-center gap-1 border-4 border-white/80 dark:border-slate-900 focus:outline-none focus:ring-4 focus:ring-rose-400"
            aria-label="Send emergency WhatsApp distress alert"
          >
            <AlertTriangle className="w-10 h-10 sm:w-12 sm:h-12" />
            <span>SOS</span>
            <span className="text-xs font-normal tracking-wide opacity-90 uppercase">
              {isSending ? 'Transmitting...' : 'Press for Help'}
            </span>
          </button>
        </div>

        <div className="max-w-md space-y-2">
          <p className="text-xs font-semibold text-rose-950 dark:text-rose-300">
            Emergency alert will be dispatched to your {selectedContactIds.length} selected emergency contacts independently.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Does not require camera or sign recognition. Tap the button or select a quick message below.
          </p>
        </div>

        {/* Room Audio Alarm Toggle */}
        <button
          type="button"
          onClick={toggleAudioAlarm}
          className={`px-4 py-2 rounded-xl text-xs font-semibold border flex items-center gap-2 transition-colors ${
            isAudioAlarmActive
              ? 'bg-rose-600 text-white border-rose-700 animate-pulse'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50'
          }`}
        >
          {isAudioAlarmActive ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          <span>{isAudioAlarmActive ? 'Stop Audible Alarm Siren' : 'Activate Physical Room Sound Siren'}</span>
        </button>
      </div>

      {/* Message Selection & Composition Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Predefined Emergency Phrases */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-500" />
            <span>Predefined Emergency Messages</span>
          </h3>

          <div className="space-y-2">
            {PRESET_MESSAGES.map((msg, i) => (
              <button
                type="button"
                key={i}
                onClick={() => {
                  setSelectedPreset(msg);
                  setCustomMessage('');
                }}
                className={`w-full text-left p-3 rounded-xl text-xs font-medium border transition-colors ${
                  selectedPreset === msg && !customMessage
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 text-rose-900 dark:text-rose-200 font-semibold'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                {msg}
              </button>
            ))}
          </div>

          <div className="pt-2">
            <label htmlFor="sos-custom-message" className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              Custom Distress Details (Optional)
            </label>
            <textarea
              rows={2}
              id="sos-custom-message"
              name="sosCustomMessage"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Type specific details (e.g. Apartment #302, severe chest pain)..."
              className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-none resize-none"
            />
          </div>
        </div>

        {/* Right: GPS Location & Multi-Recipient Selection */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          {/* Location Box */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-500" />
              <span>Location Coordinates</span>
            </h3>
            <button
              type="button"
              onClick={handleRequestLocation}
              disabled={isLocating}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <span>{locationData ? 'Update GPS' : 'Share Location'}</span>
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
            {locationData ? (
              <div className="space-y-1 text-slate-700 dark:text-slate-300">
                <div className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>GPS Location Acquired</span>
                </div>
                <div className="font-mono text-slate-600 dark:text-slate-400">
                  {locationData.latitude}, {locationData.longitude}
                </div>
                <div className="text-slate-500">{locationData.address}</div>
              </div>
            ) : (
              <div className="text-slate-500 flex items-center justify-between">
                <span>Location not yet acquired. Click Share Location to attach GPS telemetry.</span>
              </div>
            )}
          </div>

          {/* Phase 5 Multi-Contact Checkbox Directory */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-500" />
                <span>Select Contacts to Alert ({selectedContactIds.length}/{emergencyContacts.length})</span>
              </h4>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllContacts}
                  className="text-[11px] text-slate-500 hover:text-indigo-600 font-semibold"
                >
                  {selectedContactIds.length === emergencyContacts.length ? 'Deselect All' : 'Select All'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddContact(true)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {emergencyContacts.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-500">
                  No contacts found. Click Add to register a contact.
                </div>
              ) : (
                emergencyContacts.map((contact) => (
                  <label
                    key={contact.id}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                      selectedContactIds.includes(contact.id)
                        ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-900'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={selectedContactIds.includes(contact.id)}
                        onChange={() => handleToggleContactSelect(contact.id)}
                        className="rounded text-rose-600 focus:ring-rose-500"
                      />
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{contact.name}</span>
                          {contact.isPreferred && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 font-bold">
                              Primary
                            </span>
                          )}
                        </div>
                        <div className="text-slate-500 font-mono text-[11px]">
                          {contact.phone} · {contact.relation}
                        </div>
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PHASE 5 Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Confirm Multi-Recipient WhatsApp SOS
                </h3>
                <p className="text-xs text-slate-500">Official Meta WhatsApp Business Cloud API</p>
              </div>
            </div>

            {/* Recipients Summary */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <div className="font-semibold text-slate-700 dark:text-slate-300">
                Dispatching Separately To ({selectedContactIds.length} Contacts):
              </div>
              <div className="font-medium text-slate-900 dark:text-white">
                {emergencyContacts
                  .filter((c) => selectedContactIds.includes(c.id))
                  .map((c) => c.name)
                  .join(', ') || 'No contacts selected'}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs space-y-1.5">
              <p className="font-semibold text-rose-950 dark:text-rose-200">
                Distress Message:
              </p>
              <p className="text-rose-900 dark:text-rose-300 italic">
                "{customMessage.trim() || selectedPreset}"
              </p>
              {includeLocationInSos && locationData && (
                <p className="text-rose-700 dark:text-rose-400 pt-1 font-mono text-[11px]">
                  📍 GPS Attached: {locationData.latitude}, {locationData.longitude}
                </p>
              )}
            </div>

            {/* User Consent & Options Checkboxes */}
            <div className="space-y-2 text-xs">
              <label className="flex items-start gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={userConsentGiven}
                  onChange={(e) => setUserConsentGiven(e.target.checked)}
                  className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                />
                <span className="font-semibold">
                  I authorize sending this emergency SOS notification to each selected contact via Meta WhatsApp Cloud API.
                </span>
              </label>

              {locationData && (
                <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={includeLocationInSos}
                    onChange={(e) => setIncludeLocationInSos(e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span>Attach my current GPS location telemetry to the WhatsApp message</span>
                </label>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDispatchWhatsAppSos}
                disabled={isSending || !userConsentGiven || selectedContactIds.length === 0}
                className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSending ? 'Sending Dispatch...' : 'Confirm & Send WhatsApp'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Emergency Contact Modal */}
      {showAddContact && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAddNewContact}
            className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 space-y-4"
          >
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Add WhatsApp Emergency Contact
            </h3>
            <p className="text-xs text-slate-500">
              Provide international format with country code (e.g. +1 for US, +91 for India) for Meta WhatsApp delivery.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Sarah Rivera"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Phone Number (with Country Code)
                </label>
                <input
                  type="tel"
                  required
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="e.g. +1 555 019 2834 or +91 98765 43210"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Relationship (Optional)
                </label>
                <input
                  type="text"
                  value={contactRelation}
                  onChange={(e) => setContactRelation(e.target.value)}
                  placeholder="e.g. Family member, Caregiver, Neighbor"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddContact(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
              >
                Save Contact
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
