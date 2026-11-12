import React from 'react';
import { VoiceSignTranslator } from '../components/VoiceSignTranslator';
import { Info, Sparkles, BookOpen } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const VoiceToSignPage: React.FC = () => {
  const { setCurrentPage } = useApp();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Voice-to-Sign Language Translator
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Speak into the microphone to generate authentic Sign Language Glosses and animated sign demonstrations.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCurrentPage('dictionary')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
        >
          <BookOpen className="w-4 h-4 text-indigo-500" />
          <span>Browse Sign Dictionary</span>
        </button>
      </div>

      {/* Main Voice-to-Sign Translator Component */}
      <VoiceSignTranslator />

      {/* Linguistic Guidelines Box */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
        <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span>Linguistic Translation vs Word-for-Word Substitution</span>
        </div>
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
          Sign languages (ASL, ISL, BSL) have their own grammatical systems that differ fundamentally from spoken English.
          SignBridge applies linguistic gloss transformations (Topic-Comment order, Time-first spatial framing, and facial non-manual marker tagging) rather than mechanically substituting spoken words.
        </p>
      </div>
    </div>
  );
};
