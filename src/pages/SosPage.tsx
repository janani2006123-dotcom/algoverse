import React, { useState } from 'react';
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
} from 'lucide-react';
import { EmergencyAlert, EmergencyContact } from '../types';

export const SosPage: React.FC = () => {
  const { emergencyContacts, addEmergencyContact, removeEmergencyContact, addAlert, showToast } = useApp();

  const [selectedPreset, setSelectedPreset] = useState<string>('I need urgent help. Please assist me.');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [urgencyType, setUrgencyType] = useState<'medical' | 'ambulance' | 'police' | 'fire' | 'general'>('medical');
  const [isLocating, setIsLocating] = useState(false);
  const [locationData, setLocationData] = useState<{
    latitude: number;
    longitude: number;
    address?: string;
  } | null>(null);

  const [isSending, setIsSending] = useState(false);
  const [activeAlert, setActiveAlert] = useState<EmergencyAlert | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isAudioAlarmActive, setIsAudioAlarmActive] = useState(false);
  const audioContextRef = React.useRef<AudioContext | null>(null);
  const oscillatorRef = React.useRef<OscillatorNode | null>(null);

  // New Contact form modal state
  const [showAddContact, setShowAddContact] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactRelation, setContactRelation] = useState('');

  const PRESET_MESSAGES = [
    'I need help.',
    'Please call an ambulance.',
    'I cannot hear you.',
    'I need assistance.',
    'Medical emergency. I am Deaf/non-verbal and require immediate attention.',
    'I feel unsafe. Please send emergency services.',
  ];

  // Request browser geolocation
  const handleRequestLocation = () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser. Using estimated coordinates.', 'info');
      setLocationData({
        latitude: 37.7749,
        longitude: -122.4194,
        address: 'San Francisco, CA (Simulated Location)',
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
        console.warn('Geolocation error:', err);
        setLocationData({
          latitude: 37.7749,
          longitude: -122.4194,
          address: 'Approx. 37.7749° N, 122.4194° W (Demo Coordinates)',
        });
        setIsLocating(false);
        showToast('Location permission denied or unavailable. Using demonstration coordinates.', 'info');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Audible emergency beacon synthesizer (beeps in browser)
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

  // Dispatch SOS alert via server API
  const handleDispatchAlert = async () => {
    setShowConfirmModal(false);
    setIsSending(true);

    const messageText = customMessage.trim() || selectedPreset;

    try {
      const res = await fetch('/api/emergency/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: urgencyType,
          message: messageText,
          location: locationData,
          contacts: emergencyContacts,
        }),
      });

      if (!res.ok) throw new Error('Dispatch server responded with an error');

      const data = await res.json();
      const dispatchedAlert: EmergencyAlert = data.alert;

      setActiveAlert(dispatchedAlert);
      addAlert(dispatchedAlert);
      showToast(`Emergency alert dispatched! Confirmation: ${dispatchedAlert.confirmationCode}`, 'success');
    } catch (err) {
      console.error('SOS dispatch error:', err);
      showToast('Could not complete dispatch. Please call your local emergency number directly.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleAddNewContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactPhone) {
      showToast('Name and phone number are required', 'error');
      return;
    }
    addEmergencyContact({
      name: contactName,
      phone: contactPhone,
      relation: contactRelation || 'Emergency Contact',
      notifySms: true,
      notifyCall: true,
    });
    setContactName('');
    setContactPhone('');
    setContactRelation('');
    setShowAddContact(false);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Page Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1">
          <ShieldAlert className="w-4 h-4" />
          <span>Priority Emergency Assistance</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          SOS Emergency Support
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Instant accessible distress broadcast with verified contact dispatching, GPS location telemetry, and sound alert beacons.
        </p>
      </div>

      {/* Prominent Emergency Action Zone */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-rose-500/10 via-rose-500/5 to-transparent border-2 border-rose-500/30 dark:border-rose-500/20 shadow-sm flex flex-col items-center text-center space-y-6">
        {/* Massive Touch-Friendly Accessible SOS Button */}
        <div className="relative">
          <div className="absolute -inset-4 rounded-full bg-rose-500/20 animate-pulse pointer-events-none" />
          <button
            type="button"
            onClick={() => setShowConfirmModal(true)}
            className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-gradient-to-tr from-rose-600 to-rose-500 text-white font-extrabold text-2xl sm:text-3xl shadow-lg hover:from-rose-700 hover:to-rose-600 active:scale-95 transition-all flex flex-col items-center justify-center gap-1 border-4 border-white/80 dark:border-slate-900 focus:outline-none focus:ring-4 focus:ring-rose-400"
            aria-label="Send emergency distress alert"
          >
            <AlertTriangle className="w-10 h-10 sm:w-12 sm:h-12" />
            <span>SOS</span>
            <span className="text-xs font-normal tracking-wide opacity-90 uppercase">Press for Help</span>
          </button>
        </div>

        <div className="max-w-md space-y-2">
          <p className="text-xs font-semibold text-rose-950 dark:text-rose-300">
            Emergency alert will be dispatched to your {emergencyContacts.length} registered emergency contacts.
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

      {/* Dispatched Alert Status Banner */}
      {activeAlert && (
        <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>SOS Alert Status: {activeAlert.status}</span>
            </div>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
              Ref: {activeAlert.confirmationCode}
            </span>
          </div>
          <p className="text-xs text-emerald-800 dark:text-emerald-300">
            <strong>Message Broadcast:</strong> "{activeAlert.message}"
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-emerald-700 dark:text-emerald-400 pt-1">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Dispatched at {new Date(activeAlert.timestamp).toLocaleTimeString()}</span>
            </div>
            {activeAlert.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>{activeAlert.location.address || 'GPS Coordinates Attached'}</span>
              </div>
            )}
            <div>
              <span>Contacts notified: {activeAlert.contactsNotified.join(', ')}</span>
            </div>
          </div>
        </div>
      )}

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
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              Custom Distress Message (Optional)
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

        {/* Right: GPS Location & Contact Broadcast List */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-500" />
              <span>Location Coordinates</span>
            </h3>
            <button
              type="button"
              onClick={handleRequestLocation}
              disabled={isLocating}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
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
              <div className="flex items-center justify-between text-slate-500">
                <span>Location not yet acquired. Click Share Location to attach GPS.</span>
              </div>
            )}
          </div>

          {/* Emergency Contacts Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Emergency Contacts ({emergencyContacts.length})
              </h4>
              <button
                type="button"
                onClick={() => setShowAddContact(true)}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
              >
                <Plus className="w-3 h-3" />
                <span>Add Contact</span>
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {emergencyContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {contact.name}
                    </div>
                    <div className="text-slate-500">
                      {contact.phone} · {contact.relation}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeEmergencyContact(contact.id)}
                    className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                    title="Remove Contact"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal to Prevent Accidental Dispatch */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Confirm Emergency Dispatch
                </h3>
                <p className="text-xs text-slate-500">Immediate priority broadcast</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs space-y-1.5">
              <p className="font-semibold text-rose-950 dark:text-rose-200">
                Message to Send:
              </p>
              <p className="text-rose-900 dark:text-rose-300 italic">
                "{customMessage.trim() || selectedPreset}"
              </p>
              {locationData && (
                <p className="text-rose-700 dark:text-rose-400 pt-1">
                  GPS: {locationData.latitude}, {locationData.longitude}
                </p>
              )}
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400">
              This will notify all {emergencyContacts.length} designated emergency contacts. If this is a life-threatening crisis, please also dial 911 / 112 directly.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDispatchAlert}
                disabled={isSending}
                className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSending ? 'Sending Dispatch...' : 'Confirm & Send Alert'}</span>
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
              Add Emergency Contact
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Full Name / Relation
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
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="e.g. +1 (555) 019-2834"
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
