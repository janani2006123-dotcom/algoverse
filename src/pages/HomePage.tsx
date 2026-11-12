import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Camera,
  Mic,
  MessageSquare,
  AlertTriangle,
  GraduationCap,
  Sliders,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Heart,
  Globe2,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { setCurrentPage } = useApp();

  const heroImage = '/src/assets/images/signbridge_hero_community_1794470892016.jpg';

  const features = [
    {
      id: 'sign-to-voice',
      title: 'Sign to Voice',
      description: 'Webcam-based hand & body tracking translating physical sign gestures into natural spoken voice and readable text.',
      icon: Camera,
      color: 'indigo',
    },
    {
      id: 'voice-to-sign',
      title: 'Voice to Sign',
      description: 'Speech recognition converted into authentic ASL, ISL, or BSL grammar glosses and demonstrated by our animated 3D sign avatar.',
      icon: Mic,
      color: 'emerald',
    },
    {
      id: 'live',
      title: 'Live Speech Captions & Two-Way',
      description: 'Shared split-screen communication environment for simultaneous signer and speaker dialog with large text display.',
      icon: MessageSquare,
      color: 'blue',
    },
    {
      id: 'sos',
      title: 'SOS Emergency Support',
      description: 'Dedicated accessible emergency dispatch with high-urgency preset alerts, GPS coordinates, and verified contact dispatching.',
      icon: AlertTriangle,
      color: 'rose',
    },
    {
      id: 'learn',
      title: 'Sign Language Learning',
      description: 'Structured beginner to advanced curricula, interactive quizzes, handshape breakdowns, and progress tracking.',
      icon: GraduationCap,
      color: 'purple',
    },
    {
      id: 'accessibility',
      title: 'Accessibility Settings',
      description: 'High contrast themes, customizable font scales, reduced motion toggles, and multi-regional sign language selectors.',
      icon: Sliders,
      color: 'amber',
    },
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-md">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Diverse Deaf and hearing individuals communicating in an accessible community center"
            className="w-full h-full object-cover opacity-25"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-transparent" />
        </div>

        <div className="relative max-w-4xl px-6 py-16 sm:px-12 sm:py-24 space-y-6">
          <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-indigo-400 uppercase">
            <span>Inclusive Communication Technology</span>
            <span aria-hidden="true">·</span>
            <span>ASL · ISL · BSL</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight" style={{ textWrap: 'balance' }}>
            Breaking Communication Barriers Through Technology
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
            Communicate freely through sign language, voice and AI-powered translation. Empowering real-time dialogue between Deaf, hard-of-hearing, and hearing individuals.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <button
              type="button"
              onClick={() => setCurrentPage('sign-to-voice')}
              className="px-6 py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-sm transition-colors flex items-center gap-2"
            >
              <span>Start Translating</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('features-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-6 py-3 text-sm font-semibold text-slate-200 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-xl transition-colors"
            >
              Explore Features
            </button>
          </div>

          <div className="pt-6 flex flex-wrap items-center gap-6 text-xs text-slate-400 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Full Browser Camera & Mic Support</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>WCAG 2.1 AA Accessible Interface</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Globe2 className="w-4 h-4 text-amber-400" />
              <span>Multi-Sign Language Support</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section id="features-section" className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Comprehensive Communication Suite
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Designed from the ground up with the Deaf community to ensure authentic linguistic respect, high accessibility, and reliable emergency support.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.id}
                onClick={() => setCurrentPage(feat.id)}
                className="group p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-500/50 dark:hover:border-indigo-500/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {feat.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                      {feat.description}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  <span>Open Tool</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="p-8 sm:p-12 rounded-3xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            How SignBridge Translates
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Sign languages are rich visual languages with spatial grammar, not word-for-word spoken substitutes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">01. CAPTURE</span>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Live Computer Vision & Audio</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Real-time video captures hand shapes, body posture, and facial non-manual markers, or microphone input records spoken speech.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">02. INTERPRET</span>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Linguistic Grammar Transformation</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Synthesizes Topic-Comment syntax, removes English auxiliary artifacts, and tags facial grammatical markers for question or negation rules.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">03. COMMUNICATE</span>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Speech Audio & Sign Avatar</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Signer's expressions are voiced through high-clarity speech synthesis; speaker's voice is enacted by the animated visual sign avatar.
            </p>
          </div>
        </div>
      </section>

      {/* Emergency SOS Quick Banner */}
      <section className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-rose-950 dark:text-rose-200">
              Emergency SOS Support Always Active
            </h3>
            <p className="text-xs text-rose-800 dark:text-rose-300 mt-0.5">
              Need immediate help? Trigger instant emergency notifications with your GPS location to pre-configured family, caregivers, or emergency contacts.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setCurrentPage('sos')}
          className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors whitespace-nowrap shrink-0 shadow-xs"
        >
          Open Emergency SOS
        </button>
      </section>
    </div>
  );
};
