import React from 'react';
import { CameraSignRecognizer } from '../components/CameraSignRecognizer';
import { useApp } from '../context/AppContext';
import { Info, Volume2, Shield, Eye } from 'lucide-react';
import { SignLanguageType } from '../types';

export const SignToVoicePage: React.FC = () => {
  const { preferences, updatePreferences } = useApp();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Title & Sign Language Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Sign-to-Voice Translator
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time visual gesture tracking converting sign language into natural spoken audio.
          </p>
        </div>

        {/* Language Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Target Language:</span>
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl shadow-xs">
            {(['ASL', 'ISL', 'BSL'] as SignLanguageType[]).map((lang) => (
              <button
                type="button"
                key={lang}
                onClick={() => updatePreferences({ preferredSignLanguage: lang })}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  preferences.preferredSignLanguage === lang
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Recognizer Component */}
      <CameraSignRecognizer />

      {/* Information & Ethical Notice */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
            <Info className="w-4 h-4 text-indigo-500" />
            <span>Processing Pipeline Flow</span>
          </div>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Camera → Video Frames → Hand & Body Landmark Tracking → Sign Recognition → Grammar Interpretation → Spoken Speech Synthesis.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span>Linguistic & Privacy Transparency</span>
          </div>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            No raw camera footage is permanently stored. If custom computer vision models are offline, a validated rule-based gesture engine provides full functional demonstration.
          </p>
        </div>
      </div>
    </div>
  );
};
