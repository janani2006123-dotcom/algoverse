import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Sliders,
  Eye,
  Sun,
  Moon,
  Volume2,
  Type,
  Move,
  Globe2,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import { SignLanguageType, SpokenLanguageType } from '../types';

export const AccessibilityPage: React.FC = () => {
  const { preferences, updatePreferences, speakText } = useApp();

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
          <Eye className="w-4 h-4" />
          <span>Universal Design Standards</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Accessibility & Display Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Customize high-contrast visibility, typography scaling, voice synthesis parameters, and preferred linguistic modes.
        </p>
      </div>

      <div className="space-y-6">
        {/* Visual Presentation Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Eye className="w-4 h-4 text-indigo-500" />
            <span>Visual & Display Preferences</span>
          </h2>

          {/* Theme Switch */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-semibold text-slate-900 dark:text-white block">Theme Mode</span>
              <span className="text-slate-500">Toggle between clean daylight canvas and dark slate mode.</span>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => updatePreferences({ theme: 'light' })}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                  preferences.theme === 'light'
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => updatePreferences({ theme: 'dark' })}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                  preferences.theme === 'dark'
                    ? 'bg-slate-900 text-white font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span>Dark</span>
              </button>
            </div>
          </div>

          {/* High Contrast Mode */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs pt-4 border-t border-slate-100 dark:border-slate-800">
            <div>
              <span className="font-semibold text-slate-900 dark:text-white block">High Contrast Mode</span>
              <span className="text-slate-500">Boosts element boundary contrast and edge distinction for low-vision readability.</span>
            </div>
            <button
              type="button"
              onClick={() => updatePreferences({ highContrast: !preferences.highContrast })}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                preferences.highContrast
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {preferences.highContrast ? 'Enabled (125% Contrast)' : 'Disabled'}
            </button>
          </div>

          {/* Font Scaling */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs pt-4 border-t border-slate-100 dark:border-slate-800">
            <div>
              <span className="font-semibold text-slate-900 dark:text-white block">Font Scale & Legibility</span>
              <span className="text-slate-500">Increases baseline font sizing across buttons, headings, and transcripts.</span>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              {(['normal', 'large', 'xl'] as const).map((size) => (
                <button
                  type="button"
                  key={size}
                  onClick={() => updatePreferences({ fontSize: size })}
                  className={`px-3 py-1.5 rounded-lg font-medium capitalize transition-colors ${
                    preferences.fontSize === size
                      ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {size === 'normal' ? 'Standard (100%)' : size === 'large' ? 'Large (110%)' : 'Extra Large (120%)'}
                </button>
              ))}
            </div>
          </div>

          {/* Reduced Motion */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs pt-4 border-t border-slate-100 dark:border-slate-800">
            <div>
              <span className="font-semibold text-slate-900 dark:text-white block">Reduced Motion</span>
              <span className="text-slate-500">Minimizes animated screen transitions for vestibular motion sensitivity.</span>
            </div>
            <button
              type="button"
              onClick={() => updatePreferences({ reducedMotion: !preferences.reducedMotion })}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                preferences.reducedMotion
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {preferences.reducedMotion ? 'Reduced Motion Active' : 'Standard Transitions'}
            </button>
          </div>
        </div>

        {/* Voice & Speech Synthesis Controls */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-emerald-500" />
            <span>Spoken Audio & Voice Synthesis</span>
          </h2>

          {/* Speech Rate Slider */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between font-semibold text-slate-900 dark:text-white">
              <span>Speech Rate (Pace)</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400">{preferences.speechRate}x</span>
            </div>
            <input
              type="range"
              min="0.6"
              max="1.4"
              step="0.1"
              value={preferences.speechRate}
              onChange={(e) => updatePreferences({ speechRate: parseFloat(e.target.value) })}
              className="w-full accent-indigo-600"
            />
          </div>

          {/* Speech Pitch Slider */}
          <div className="space-y-2 text-xs pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex justify-between font-semibold text-slate-900 dark:text-white">
              <span>Speech Pitch (Tone)</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400">{preferences.speechPitch}x</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="1.2"
              step="0.05"
              value={preferences.speechPitch}
              onChange={(e) => updatePreferences({ speechPitch: parseFloat(e.target.value) })}
              className="w-full accent-indigo-600"
            />
          </div>

          {/* Voice Sample Tester */}
          <div className="pt-2 flex items-center justify-between text-xs">
            <span className="text-slate-500">Test voice output with your current settings:</span>
            <button
              type="button"
              onClick={() => speakText('Hello! This is a test of your SignBridge voice synthesis audio.')}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Preview Voice</span>
            </button>
          </div>
        </div>

        {/* Linguistic Language Selection */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Globe2 className="w-4 h-4 text-purple-500" />
            <span>Preferred Sign & Spoken Languages</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-900 dark:text-white block mb-1.5">
                Preferred Sign Language
              </label>
              <select
                value={preferences.preferredSignLanguage}
                onChange={(e) => updatePreferences({ preferredSignLanguage: e.target.value as SignLanguageType })}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="ASL">American Sign Language (ASL)</option>
                <option value="ISL">Indian Sign Language (ISL)</option>
                <option value="BSL">British Sign Language (BSL)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-900 dark:text-white block mb-1.5">
                Spoken Speech Recognition Language
              </label>
              <select
                value={preferences.preferredSpokenLanguage}
                onChange={(e) => updatePreferences({ preferredSpokenLanguage: e.target.value as SpokenLanguageType })}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="en-US">English (United States)</option>
                <option value="en-GB">English (United Kingdom)</option>
                <option value="hi-IN">Hindi / Indian English (India)</option>
                <option value="es-ES">Spanish (Español)</option>
                <option value="fr-FR">French (Français)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
