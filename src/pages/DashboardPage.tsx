import React from 'react';
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
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const {
    user,
    setCurrentPage,
    translationHistory,
    savedVocabulary,
    emergencyContacts,
    speakText,
  } = useApp();

  const guideAvatar = '/src/assets/images/signbridge_interpreter_avatar_1794470891825.jpg';

  const savedSigns = SIGN_DICTIONARY.filter((s) => savedVocabulary.includes(s.id));

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
                Active Member
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Role: <strong className="capitalize text-slate-700 dark:text-slate-300">{user?.role || 'Signer & Speaker'}</strong> · Ready for real-time translation and learning.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCurrentPage('sign-to-voice')}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs flex items-center gap-2"
          >
            <Camera className="w-4 h-4" />
            <span>Launch Camera</span>
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage('sos')}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-xs flex items-center gap-1.5"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>SOS</span>
          </button>
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

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-xs font-medium text-slate-500">Emergency Contacts</span>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {emergencyContacts.length}
          </div>
          <span className="text-xs text-emerald-600">GPS Broadcast Ready</span>
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
