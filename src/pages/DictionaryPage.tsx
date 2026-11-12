import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SIGN_DICTIONARY } from '../data/signDictionary';
import { AnimatedSignAvatar } from '../components/AnimatedSignAvatar';
import {
  Search,
  Filter,
  Bookmark,
  BookOpen,
  X,
  Volume2,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { SignEntry, SignLanguageType, SignCategory } from '../types';

export const DictionaryPage: React.FC = () => {
  const { preferences, savedVocabulary, toggleSaveWord, speakText } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<SignLanguageType>(preferences.preferredSignLanguage);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeModalSign, setActiveModalSign] = useState<SignEntry | null>(null);

  const categories: Array<{ id: string; label: string }> = [
    { id: 'all', label: 'All Categories' },
    { id: 'greetings', label: 'Greetings' },
    { id: 'emergency', label: 'Emergency' },
    { id: 'common', label: 'Common' },
    { id: 'food', label: 'Food & Drink' },
    { id: 'family', label: 'Family' },
    { id: 'education', label: 'Education' },
  ];

  const filteredSigns = SIGN_DICTIONARY.filter((sign) => {
    const matchLang = sign.languages.includes(selectedLanguage);
    const matchCategory = selectedCategory === 'all' || sign.category === selectedCategory;
    const matchQuery =
      sign.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sign.gloss.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sign.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchLang && matchCategory && matchQuery;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4" />
            <span>Validated Lexicon</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Sign Language Dictionary
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Searchable linguistic reference with handshapes, movements, and cultural nuances across ASL, ISL, and BSL.
          </p>
        </div>

        {/* Language Tabs */}
        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl shadow-xs">
          {(['ASL', 'ISL', 'BSL'] as SignLanguageType[]).map((lang) => (
            <button
              type="button"
              key={lang}
              onClick={() => setSelectedLanguage(lang)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                selectedLanguage === lang
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      {/* Search and Category Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            id="dictionary-search-input"
            name="dictionarySearchInput"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${selectedLanguage} words, gloss, or concepts...`}
            className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-auto text-xs p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Dictionary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSigns.length === 0 ? (
          <div className="col-span-full p-12 text-center text-xs text-slate-400 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            No signs found matching "{searchQuery}" in {selectedLanguage}. Try searching another term or resetting the category filter.
          </div>
        ) : (
          filteredSigns.map((sign) => {
            const isSaved = savedVocabulary.includes(sign.id);
            return (
              <div
                key={sign.id}
                onClick={() => setActiveModalSign(sign)}
                className="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400/80 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {sign.word}
                      </h3>
                      <span className="text-xs font-mono font-medium text-slate-400">
                        Gloss: [{sign.gloss}]
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSaveWord(sign.id);
                      }}
                      className={`p-1.5 rounded-lg text-xs transition-colors ${
                        isSaved ? 'text-amber-500 fill-amber-500' : 'text-slate-400 hover:text-slate-600'
                      }`}
                      title={isSaved ? 'Saved to Vocabulary' : 'Save Word'}
                    >
                      <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {sign.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span className="capitalize">{sign.category} · {sign.level}</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    <span>View Demonstration</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Full Animated Demonstration & Linguistic Breakdown */}
      {activeModalSign && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  {selectedLanguage}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {activeModalSign.word} ({activeModalSign.gloss})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalSign(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Animated Avatar Demonstration */}
              <AnimatedSignAvatar
                gloss={activeModalSign.gloss}
                signWord={activeModalSign.word}
                signLanguage={selectedLanguage}
                keyframes={activeModalSign.avatarKeyframes}
                height={280}
                handshapeDescription={activeModalSign.handshape}
                nonManualDescription={activeModalSign.nonManualMarkers}
              />

              <div className="space-y-3 text-xs">
                <div>
                  <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Description & Mechanics
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {activeModalSign.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div>
                    <strong className="text-slate-700 dark:text-slate-300 block mb-0.5">Handshape:</strong>
                    <span className="text-slate-500 dark:text-slate-400">{activeModalSign.handshape}</span>
                  </div>
                  <div>
                    <strong className="text-slate-700 dark:text-slate-300 block mb-0.5">Movement:</strong>
                    <span className="text-slate-500 dark:text-slate-400">{activeModalSign.movement}</span>
                  </div>
                  <div>
                    <strong className="text-slate-700 dark:text-slate-300 block mb-0.5">Non-Manual Marker:</strong>
                    <span className="text-slate-500 dark:text-slate-400">{activeModalSign.nonManualMarkers}</span>
                  </div>
                  <div>
                    <strong className="text-slate-700 dark:text-slate-300 block mb-0.5">Grammar Role:</strong>
                    <span className="text-slate-500 dark:text-slate-400">{activeModalSign.grammarTip}</span>
                  </div>
                </div>

                {activeModalSign.regionalVariations?.[selectedLanguage] && (
                  <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900">
                    <strong>{selectedLanguage} Regional Execution:</strong>{' '}
                    {activeModalSign.regionalVariations[selectedLanguage]}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => speakText(activeModalSign.word)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Hear Word Pronunciation</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  toggleSaveWord(activeModalSign.id);
                }}
                className="px-4 py-1.5 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700"
              >
                {savedVocabulary.includes(activeModalSign.id) ? 'Remove from Saved' : 'Save to My Vocabulary'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
