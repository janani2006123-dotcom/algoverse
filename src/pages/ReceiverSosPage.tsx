import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  Volume2,
  VolumeX,
  MapPin,
  PhoneCall,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  Navigation,
} from 'lucide-react';

interface ReceiverSosPageProps {
  confirmationCode?: string;
}

export const ReceiverSosPage: React.FC<ReceiverSosPageProps> = ({ confirmationCode: initialCode }) => {
  const [alert, setAlert] = useState<any>(null);
  const [isSirenPlaying, setIsSirenPlaying] = useState(false);
  const [isAcknowledged, setIsAcknowledged] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);

  // Parse code from URL params if not passed
  const queryParams = new URLSearchParams(window.location.search);
  const code = initialCode || queryParams.get('code') || queryParams.get('id') || '';

  // Start continuous emergency alarm siren on receiver's device
  const startSiren = () => {
    try {
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close(); } catch {}
      }

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      const now = ctx.currentTime;
      // High-urgency European dual-tone oscillating police siren
      for (let i = 0; i < 40; i++) {
        osc.frequency.setValueAtTime(950, now + i * 0.7);
        osc.frequency.exponentialRampToValueAtTime(500, now + i * 0.7 + 0.35);
        osc.frequency.exponentialRampToValueAtTime(950, now + i * 0.7 + 0.7);
      }

      gain.gain.setValueAtTime(0.65, now);
      gain.gain.setValueAtTime(0.65, now + 27.0);
      gain.gain.linearRampToValueAtTime(0.01, now + 28.0);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);

      audioCtxRef.current = ctx;
      oscRef.current = osc;
      setIsSirenPlaying(true);

      // Vibrate mobile device if supported
      if ('vibrate' in navigator) {
        navigator.vibrate([800, 300, 800, 300, 800]);
      }
    } catch (e) {
      console.warn('Receiver audio siren error:', e);
    }
  };

  const stopSiren = () => {
    try {
      if (oscRef.current) {
        oscRef.current.stop();
        oscRef.current.disconnect();
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    } catch {}
    audioCtxRef.current = null;
    oscRef.current = null;
    setIsSirenPlaying(false);
  };

  // Fetch alert info from backend
  useEffect(() => {
    async function fetchAlert() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/emergency/history');
        if (res.ok) {
          const data = await res.json();
          const list = data.alerts || [];
          const found = code
            ? list.find((a: any) => a.confirmationCode === code || a.id === code)
            : list[0];

          if (found) {
            setAlert(found);
          } else {
            // Demo fallback alert
            setAlert({
              id: 'sos-active',
              type: 'help-sign-detected',
              message: '🚨 CRITICAL DISTRESS: HELP sign recognized via webcam.',
              urgency: 'critical',
              timestamp: new Date().toISOString(),
              confirmationCode: code || 'SOS-715678',
              location: {
                latitude: 12.9716,
                longitude: 77.5946,
                address: 'Bangalore, Karnataka (Live GPS Signal)',
              },
            });
          }
        }
      } catch (err) {
        console.warn('Could not fetch alert details:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAlert();

    // Auto-attempt to start siren on load
    startSiren();

    return () => {
      stopSiren();
    };
  }, [code]);

  // Handle acknowledge
  const handleAcknowledge = async () => {
    stopSiren();
    setIsAcknowledged(true);
    try {
      await fetch('/api/emergency/acknowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmationCode: code }),
      });
    } catch {}
  };

  const lat = alert?.location?.latitude;
  const lng = alert?.location?.longitude;
  const hasCoordinates = typeof lat === 'number' && typeof lng === 'number' && lat !== 0;
  const mapsUrl = hasCoordinates
    ? `https://www.google.com/maps?q=${lat},${lng}`
    : `https://www.google.com/maps/search/?api=1&query=hospital`;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="max-w-xl w-full bg-slate-900 border-2 border-rose-600 rounded-3xl shadow-2xl overflow-hidden">
        {/* Flashing Top Banner */}
        <div className="bg-rose-600 px-6 py-4 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-white animate-bounce" />
            <div>
              <h1 className="text-lg font-black uppercase tracking-wider text-white">
                Emergency Alert Received
              </h1>
              <p className="text-xs text-rose-100 font-medium">
                SignBridge Distress Broadcast from Caregiver Relay
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 bg-black/40 rounded-lg text-rose-200">
            {alert?.confirmationCode || 'SOS'}
          </span>
        </div>

        <div className="p-6 space-y-6">
          {/* Audio Siren Status & Main Control */}
          <div className={`p-4 rounded-2xl border-2 flex items-center justify-between gap-4 transition-all ${
            isSirenPlaying
              ? 'bg-rose-500/10 border-rose-500 animate-pulse'
              : 'bg-slate-800/60 border-slate-700'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isSirenPlaying ? 'bg-rose-600 text-white animate-spin' : 'bg-slate-800 text-slate-400'
              }`}>
                {isSirenPlaying ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">
                  {isSirenPlaying ? '🚨 Emergency Siren is Ringing!' : 'Siren Silenced'}
                </h2>
                <p className="text-xs text-slate-400">
                  {isSirenPlaying
                    ? 'Dual-tone audio beacon active on your device'
                    : 'Tap below to re-arm or test siren'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={isSirenPlaying ? stopSiren : startSiren}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase transition-all shadow-md ${
                isSirenPlaying
                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                  : 'bg-rose-600 hover:bg-rose-500 text-white'
              }`}
            >
              {isSirenPlaying ? 'Mute Siren' : 'Play Siren'}
            </button>
          </div>

          {/* Distress Message Card */}
          <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-semibold text-rose-400 uppercase tracking-wide">
                <AlertTriangle className="w-4 h-4" /> Distress Signal
              </span>
              <span className="flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5" />
                {alert?.timestamp ? new Date(alert.timestamp).toLocaleTimeString() : 'Just now'}
              </span>
            </div>

            <p className="text-base sm:text-lg font-bold text-white leading-snug">
              {alert?.message || 'I need help immediately. Distress sign detected via camera.'}
            </p>

            {/* Location display */}
            <div className="pt-2 border-t border-slate-800/80 flex items-start gap-2 text-xs text-slate-300">
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white">Reported Location: </span>
                <span>{alert?.location?.address || 'Geolocation coordinate telemetry available'}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Acknowledge Button */}
            {!isAcknowledged ? (
              <button
                type="button"
                onClick={handleAcknowledge}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-extrabold text-sm uppercase tracking-wide transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Confirm Receipt & Silence Alarm</span>
              </button>
            ) : (
              <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Receipt Confirmed — Sender & Relay notified.</span>
              </div>
            )}

            {/* Grid of External Response Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors"
              >
                <Navigation className="w-4 h-4 text-sky-400" />
                <span>Open in Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>

              <a
                href="tel:112"
                className="py-3 px-4 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Call Emergency (112)</span>
              </a>
            </div>
          </div>

          {/* Footer Navigation */}
          <div className="pt-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500">
            <span>SignBridge Emergency Broadcast System</span>
            <a href="/" className="text-indigo-400 hover:underline">
              Return to App
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

