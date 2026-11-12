import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Heart,
  ShieldCheck,
  Globe2,
  Users,
  Eye,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  const { setCurrentPage } = useApp();

  return (
    <div className="space-y-12 max-w-4xl mx-auto pb-16">
      {/* Hero Statement */}
      <div className="text-center space-y-4 pt-4">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
          <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
          <span>Our Guiding Purpose</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white" style={{ textWrap: 'balance' }}>
          Bridging Silence & Voice Through Human-Centered Tech
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          SignBridge was created to dismantle communication barriers between Deaf, hard-of-hearing, and hearing individuals across everyday interactions, emergencies, and educational journeys.
        </p>
      </div>

      {/* Core Principles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <Globe2 className="w-6 h-6 text-indigo-500" />
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            Linguistic Sovereignty
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Sign languages (ASL, ISL, BSL) are complete, independent natural languages with their own complex morphology and spatial grammar. They are never treated as mere manual codes for spoken English.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <ShieldCheck className="w-6 h-6 text-emerald-500" />
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            Transparent AI Ethics
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            We clearly delineate between fully validated machine learning models and demonstration kinematic modes, never overclaiming automated proficiency or replacing professional human interpreters.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <Eye className="w-6 h-6 text-purple-500" />
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            Radical Accessibility
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Built from line one to exceed WCAG 2.1 AA standards: high contrast options, large text formats, screen-reader compatibility, keyboard navigation, and instant touch-based emergency triggers.
          </p>
        </div>
      </div>

      {/* Community Callout */}
      <div className="p-8 rounded-3xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 space-y-4">
        <h2 className="text-lg font-bold text-indigo-950 dark:text-indigo-200">
          Designed in Collaboration with the Deaf Community
        </h2>
        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          Technology created for the Deaf community must be informed directly by Deaf culture, native signers, and accessibility advocates. We invite Deaf educators, linguists, and researchers to expand and validate our multi-sign dictionary.
        </p>
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setCurrentPage('learn')}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs flex items-center gap-2"
          >
            <span>Explore Learning Curriculum</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
