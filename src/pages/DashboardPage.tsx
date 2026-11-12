import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { SIGN_DICTIONARY } from '../data/signDictionary';
import {
  Camera,
  Mic,
  MessageSquare,
  AlertTriangle,
  GraduationCap,
  Bookmark,
  Clock,
  Volume2,
  ArrowRight,
  TrendingUp,
  User,
  ShieldCheck,
  CheckCircle,
  Users,
  History,
  Settings,
  LogOut,
  Phone,
  ShieldAlert,
  Star,
  CheckCheck,
} from 'lucide-react';
import { SosEventRecord } from '../types';

export const DashboardPage: React.FC = () => {
  const {
    user,
    authToken,
    logout,
    setCurrentPage,
    translationHistory,
    savedVocabulary,
    emergencyContacts,
    speakText,
  } = useApp();

  const [recentSosEvents, setRecentSosEvents] = useState<SosEventRecord[]>([]);
  const [loadingSos, setLoadingSos] = useState(false);

  const guideAvatar = '/src/assets/images/signbridge_interpreter_avatar_1794470891825.jpg';
  const savedSigns = SIGN_DICTIONARY.filter((s) => savedVocabulary.includes(s.id));

  useEffect(() => {
    if (!authToken) {
      setRecentSosEvents([]);
      return;
    }
    let isMounted = true;
    const fetchRecentSos = async () => {
      try {
        setLoadingSos(true);
        const res = await fetch('/api/sos/history', {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success && Array.isArray(data.events)) {
            setRecentSosEvents(data.events.slice(0, 3));
          }
        }
      } catch (e) {
        // quiet fallback
      } finally {
        if (isMounted) setLoadingSos(false);
      }
    };
    fetchRecentSos();
    return () => {
      isMounted = false;
    };
  }, [authToken]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-indigo-500/30 shrink-0 shadow-xs">
            <img
              src={guideAvatar}
              alt="User or Accessibility Guide Profile"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                Welcome back, {user ? user.name : 'SignBridge Guest'}
              </h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                {authToken ? 'Authenticated' : 'Guest'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Role: <strong className="capitalize text-slate-700 dark:text-slate-300">{user?.role || 'Signer & Speaker'}</strong> · Ready for real-time translation and multi-user emergency safety.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setCurrentPage('sign-to-voice')}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs flex items-center gap-1.5"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Launch Camera</span>
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage('sos')}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-xs flex items-center gap-1.5"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>SOS</span>
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage('profile')}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
            title="Profile & Account Settings"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>
          {authToken ? (
            <button
              type="button"
              onClick={() => {
                logout();
                setCurrentPage('auth');
              }}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 hover:bg-rose-100 transition-colors flex items-center gap-1.5"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCurrentPage('auth')}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-xs font-medium text-slate-500">Total Translations</span>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {translationHistory.length + 14}
          </div>
          <span className="text-xs text-emerald-600 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>Active session</span>
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-xs font-medium text-slate-500">Signs Mastered</span>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {user?.completedLessons.length || 3}
          </div>
          <span className="text-xs text-indigo-600">Beginner & Intermediate</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-xs font-medium text-slate-500">Saved Vocabulary</span>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {savedVocabulary.length}
          </div>
          <span className="text-xs text-amber-600">Quick-access signs</span>
        </div>

        <button
          type="button"
          onClick={() => setCurrentPage('emergency-contacts')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 text-left hover:border-indigo-400 transition-colors group cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Emergency Contacts</span>
            <Users className="w-3.5 h-3.5 text-indigo-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {emergencyContacts.length}
          </div>
          <span className="text-xs text-emerald-600 flex items-center gap-1">
            <span>Manage Contacts</span>
            <ArrowRight className="w-3 h-3" />
          </span>
        </button>
      </div>

      {/* Emergency Management & SOS Audit Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emergency Contacts Preview */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-rose-500" />
              <span>Your Emergency Contacts ({emergencyContacts.length})</span>
            </h3>
            <button
              type="button"
              onClick={() => setCurrentPage('emergency-contacts')}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <span>Manage All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {emergencyContacts.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-center space-y-2">
              <p className="text-xs text-slate-500">No emergency contacts saved yet for this account.</p>
              <button
                type="button"
                onClick={() => setCurrentPage('emergency-contacts')}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg inline-flex items-center gap-1"
              >
                <span>Add First Contact</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {emergencyContacts.slice(0, 3).map((contact) => (
                <div
                  key={contact.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{contact.name}</span>
                        {contact.isPreferred && (
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        )}
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 text-xs font-mono">
                        {contact.phone} · {contact.relation}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-mono">
                    Ready
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent SOS History Preview */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <span>Recent SOS Dispatches</span>
            </h3>
            <button
              type="button"
              onClick={() => setCurrentPage('sos-history')}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <span>View Full History</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {recentSosEvents.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-center space-y-2">
              <p className="text-xs text-slate-500">
                {authToken ? 'No past SOS distress calls recorded on this account.' : 'Sign in to access your secure personal SOS dispatch log.'}
              </p>
              <button
                type="button"
                onClick={() => setCurrentPage(authToken ? 'sos' : 'auth')}
                className="px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg inline-flex items-center gap-1"
              >
                <span>{authToken ? 'Test Emergency SOS' : 'Sign In Now'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {recentSosEvents.map((evt) => (
                <div
                  key={evt.eventId}
                  onClick={() => setCurrentPage('sos-history')}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1 cursor-pointer hover:border-indigo-400 transition-colors"
                >
                  <div className="flex items-center justify-between font-mono">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {evt.emergencyReferenceId}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {evt.overallStatus}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 line-clamp-1 italic">
                    "{evt.message}"
                  </p>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>{new Date(evt.createdAt).toLocaleString()}</span>
                    <span>{evt.recipients.length} Recipient(s)</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Quick Translation Shortcuts
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            type="button"
            onClick={() => setCurrentPage('sign-to-voice')}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:shadow-xs transition-all text-left space-y-2 group"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Camera className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Sign to Voice</h3>
            <p className="text-xs text-slate-500">Webcam gesture tracking with spoken audio.</p>
          </button>

          <button
            type="button"
            onClick={() => setCurrentPage('voice-to-sign')}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:shadow-xs transition-all text-left space-y-2 group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Mic className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Voice to Sign</h3>
            <p className="text-xs text-slate-500">Microphone speech into animated sign avatar.</p>
          </button>

          <button
            type="button"
            onClick={() => setCurrentPage('live')}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:shadow-xs transition-all text-left space-y-2 group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Two-Way Live Room</h3>
            <p className="text-xs text-slate-500">Split-screen real-time conversation.</p>
          </button>

          <button
            type="button"
            onClick={() => setCurrentPage('learn')}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500 hover:shadow-xs transition-all text-left space-y-2 group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Sign Academy</h3>
            <p className="text-xs text-slate-500">Vocabulary lessons & interactive quizzes.</p>
          </button>
        </div>
      </div>

      {/* 2-Column Split: Recent Activity & Saved Vocabulary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Translations */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              <span>Recent Translations</span>
            </h3>
            <button
              type="button"
              onClick={() => setCurrentPage('history')}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            {translationHistory.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs flex items-start justify-between gap-3"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="font-mono uppercase font-bold text-slate-700 dark:text-slate-300">
                      {item.type === 'sign-to-voice' ? 'Sign → Voice' : 'Voice → Sign'}
                    </span>
                    <span>·</span>
                    <span>{item.signLanguage}</span>
                    <span>·</span>
                    <span>{item.timestamp}</span>
                  </div>
                  <div className="text-slate-900 dark:text-white font-medium">
                    "{item.target}"
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => speakText(item.target)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"
                  title="Speak audio"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Saved Vocabulary */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-amber-500" />
              <span>Saved Vocabulary ({savedSigns.length})</span>
            </h3>
            <button
              type="button"
              onClick={() => setCurrentPage('dictionary')}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
            >
              <span>Dictionary</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {savedSigns.map((sign) => (
              <div
                key={sign.id}
                onClick={() => setCurrentPage('dictionary')}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 cursor-pointer text-xs space-y-1 transition-colors"
              >
                <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>{sign.word}</span>
                  <span className="font-mono text-xs text-slate-400">[{sign.gloss}]</span>
                </div>
                <div className="text-slate-500 line-clamp-1">
                  {sign.handshape}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
