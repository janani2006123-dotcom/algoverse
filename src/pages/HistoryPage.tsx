import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Clock,
  Trash2,
  Download,
  Volume2,
  Search,
  Filter,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { SignLanguageType } from '../types';

export const HistoryPage: React.FC = () => {
  const {
    translationHistory,
    clearTranslationHistory,
    speakText,
    setCurrentPage,
    showToast,
  } = useApp();

  const [filterType, setFilterType] = useState<'all' | 'sign-to-voice' | 'voice-to-sign'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = translationHistory.filter((item) => {
    const matchType = filterType === 'all' || item.type === filterType;
    const matchQuery =
      item.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.target.toLowerCase().includes(searchQuery.toLowerCase());
    return matchType && matchQuery;
  });

  const exportHistoryJSON = () => {
    if (translationHistory.length === 0) {
      showToast('No translation history to export.', 'info');
      return;
    }
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(translationHistory, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `signbridge_history_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Translation history exported successfully', 'success');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
            <Clock className="w-4 h-4" />
            <span>Session Logs</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Translation History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review previous sign and voice translations, replay speech, or export your transcripts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportHistoryJSON}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 transition-colors shadow-xs flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
          <button
            type="button"
            onClick={clearTranslationHistory}
            className="px-3.5 py-2 text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl hover:bg-rose-100 transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            id="history-search-input"
            name="historySearchInput"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transcripts or words..."
            className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs w-full sm:w-auto">
          {(['all', 'sign-to-voice', 'voice-to-sign'] as const).map((type) => (
            <button
              type="button"
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 font-medium rounded-lg capitalize transition-colors ${
                filterType === type
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {type === 'all' ? 'All' : type === 'sign-to-voice' ? 'Sign → Voice' : 'Voice → Sign'}
            </button>
          ))}
        </div>
      </div>

      {/* History List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <Clock className="w-8 h-8 mx-auto text-slate-400" />
            <p>No translation logs found matching your filters.</p>
            <button
              type="button"
              onClick={() => setCurrentPage('sign-to-voice')}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl"
            >
              Start New Translation
            </button>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 text-slate-400">
                  <span className="font-mono font-bold uppercase text-slate-700 dark:text-slate-300">
                    {item.type === 'sign-to-voice' ? 'Sign Gesture → Voice' : 'Spoken Voice → Sign Gloss'}
                  </span>
                  <span>·</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">{item.signLanguage}</span>
                  <span>·</span>
                  <span>{item.timestamp}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-800 dark:text-slate-200">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Input:</span>
                    <span className="font-medium">{item.source}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Translated Output:</span>
                    <span className="font-semibold text-indigo-950 dark:text-indigo-200">
                      "{item.target}"
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => speakText(item.target)}
                  className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-indigo-600 bg-slate-100 dark:bg-slate-800 transition-colors"
                  title="Speak Translation Audio"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Privacy note */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3 text-xs text-slate-500">
        <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
        <span>
          History is saved locally in your browser storage. No audio files or raw camera frames are stored remotely.
        </span>
      </div>
    </div>
  );
};
