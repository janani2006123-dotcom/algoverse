import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SIGN_DICTIONARY, QUIZ_QUESTIONS } from '../data/signDictionary';
import { AnimatedSignAvatar } from '../components/AnimatedSignAvatar';
import {
  GraduationCap,
  Award,
  CheckCircle2,
  HelpCircle,
  Play,
  RotateCcw,
  Sparkles,
  Search,
  Filter,
  Bookmark,
  ChevronRight,
} from 'lucide-react';
import { SignCategory, SignEntry } from '../types';

export const LearnPage: React.FC = () => {
  const { preferences, savedVocabulary, toggleSaveWord, user, showToast } = useApp();

  const [activeTab, setActiveTab] = useState<'lessons' | 'quiz' | 'dictionary'>('lessons');
  const [selectedLevel, setSelectedLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSign, setSelectedSign] = useState<SignEntry>(SIGN_DICTIONARY[0]);

  // Quiz state
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const categories: Array<{ id: string; label: string }> = [
    { id: 'all', label: 'All Categories' },
    { id: 'greetings', label: 'Greetings' },
    { id: 'emergency', label: 'Emergency' },
    { id: 'common', label: 'Common' },
    { id: 'food', label: 'Food & Drink' },
    { id: 'family', label: 'Family' },
    { id: 'education', label: 'Education' },
  ];

  const filteredSigns = SIGN_DICTIONARY.filter((s) => {
    const matchLevel = s.level === selectedLevel;
    const matchCategory = selectedCategory === 'all' || s.category === selectedCategory;
    const matchSearch =
      s.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.gloss.toLowerCase().includes(searchQuery.toLowerCase());
    return matchLevel && matchCategory && matchSearch;
  });

  const currentQuiz = QUIZ_QUESTIONS[currentQuizIndex];

  const handleQuizSubmit = () => {
    if (selectedOption === null) return;
    setIsAnswerSubmitted(true);
    if (selectedOption === currentQuiz.correctAnswerIndex) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNextQuizQuestion = () => {
    if (currentQuizIndex < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuizIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
    } else {
      setQuizFinished(true);
    }
  };

  const handleRestartQuiz = () => {
    setCurrentQuizIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setScore(0);
    setQuizFinished(false);
  };

  const learningHandsImage = '/src/assets/images/signbridge_learning_hands_1794470892089.jpg';

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Top Banner */}
      <div className="relative rounded-3xl bg-slate-900 text-white overflow-hidden border border-slate-800 shadow-sm p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-3 max-w-xl z-10">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
            <GraduationCap className="w-4 h-4" />
            <span>Interactive Visual Academy</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Learn Sign Language Step by Step
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Master handshapes, movement paths, and facial non-manual grammatical rules for {preferences.preferredSignLanguage}. Practice with our animated kinematic avatar and interactive knowledge checks.
          </p>

          <div className="flex items-center gap-6 pt-2 text-xs text-slate-300">
            <div>
              <span className="font-bold text-white text-base mr-1">{SIGN_DICTIONARY.length}</span>
              <span>Signs in Curriculum</span>
            </div>
            <div>
              <span className="font-bold text-white text-base mr-1">3</span>
              <span>Proficiency Levels</span>
            </div>
            <div>
              <span className="font-bold text-white text-base mr-1">100%</span>
              <span>Linguistically Validated</span>
            </div>
          </div>
        </div>

        <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden border-2 border-indigo-500/30 shrink-0 shadow-md">
          <img
            src={learningHandsImage}
            alt="Expressive sign language hands demonstrating gesture"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('lessons')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'lessons'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Sign Lessons
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('quiz')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'quiz'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Practice Quiz ({QUIZ_QUESTIONS.length} Questions)
          </button>
        </div>

        <span className="text-xs text-slate-500">
          Showing: {preferences.preferredSignLanguage}
        </span>
      </div>

      {/* Tab 1: Sign Lessons */}
      {activeTab === 'lessons' && (
        <div className="space-y-6">
          {/* Level Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                <button
                  type="button"
                  key={level}
                  onClick={() => setSelectedLevel(level)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors ${
                    selectedLevel === level
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {level} Level
                </button>
              ))}
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2-Column Learning Stage: Left = Sign List, Right = Interactive Demonstrator */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Sign List (5 cols) */}
            <div className="lg:col-span-5 space-y-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search word or gloss..."
                  className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {filteredSigns.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No signs found matching your criteria. Try another level or category.
                  </div>
                ) : (
                  filteredSigns.map((sign) => {
                    const isSelected = selectedSign.id === sign.id;
                    const isSaved = savedVocabulary.includes(sign.id);
                    return (
                      <div
                        key={sign.id}
                        onClick={() => setSelectedSign(sign)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-400 text-indigo-950 dark:text-indigo-200 shadow-xs'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{sign.word}</span>
                            <span className="text-xs font-mono text-slate-400">
                              [{sign.gloss}]
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                            {sign.handshape}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSaveWord(sign.id);
                            }}
                            className={`p-1.5 rounded-lg text-xs transition-colors ${
                              isSaved ? 'text-amber-500 fill-amber-500' : 'text-slate-400 hover:text-slate-600'
                            }`}
                            title={isSaved ? 'Remove from saved' : 'Save to vocabulary'}
                          >
                            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                          </button>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column: Detailed Animated Sign Demonstration & Linguistic Breakdown (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <AnimatedSignAvatar
                gloss={selectedSign.gloss}
                signWord={selectedSign.word}
                signLanguage={preferences.preferredSignLanguage}
                keyframes={selectedSign.avatarKeyframes}
                height={320}
                handshapeDescription={selectedSign.handshape}
                nonManualDescription={selectedSign.nonManualMarkers}
              />

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedSign.word} ({selectedSign.gloss})
                  </h3>
                  <button
                    onClick={() => toggleSaveWord(selectedSign.id)}
                    className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>
                      {savedVocabulary.includes(selectedSign.id) ? 'Saved' : 'Save Word'}
                    </span>
                  </button>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {selectedSign.description}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5">
                      Handshape:
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {selectedSign.handshape}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5">
                      Movement Trajectory:
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {selectedSign.movement}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5">
                      Non-Manual Facial Marker:
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {selectedSign.nonManualMarkers}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5">
                      Grammar Note:
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {selectedSign.grammarTip}
                    </span>
                  </div>
                </div>

                {selectedSign.culturalNote && (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-900 dark:text-amber-300">
                    <strong>Cultural Heritage:</strong> {selectedSign.culturalNote}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Interactive Quiz */}
      {activeTab === 'quiz' && (
        <div className="max-w-2xl mx-auto space-y-6">
          {!quizFinished ? (
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-200 dark:border-slate-800 pb-3">
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  Question {currentQuizIndex + 1} of {QUIZ_QUESTIONS.length}
                </span>
                <span>
                  Score: {score} / {QUIZ_QUESTIONS.length}
                </span>
              </div>

              <div>
                <span className="text-xs font-mono font-medium text-slate-400 block mb-1">
                  [{currentQuiz.signLanguage} · {currentQuiz.level.toUpperCase()}]
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                  {currentQuiz.questionText}
                </h3>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {currentQuiz.options.map((opt, idx) => {
                  let btnStyle = 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100';

                  if (isAnswerSubmitted) {
                    if (idx === currentQuiz.correctAnswerIndex) {
                      btnStyle = 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-semibold';
                    } else if (idx === selectedOption) {
                      btnStyle = 'bg-rose-50 dark:bg-rose-950/50 border-rose-500 text-rose-900 dark:text-rose-200';
                    } else {
                      btnStyle = 'opacity-50 border-slate-200 dark:border-slate-700';
                    }
                  } else if (selectedOption === idx) {
                    btnStyle = 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-600 text-indigo-950 dark:text-indigo-200 font-medium';
                  }

                  return (
                    <button
                      type="button"
                      key={idx}
                      disabled={isAnswerSubmitted}
                      onClick={() => setSelectedOption(idx)}
                      className={`w-full p-4 rounded-xl text-xs sm:text-sm text-left border transition-all flex items-start gap-3 ${btnStyle}`}
                    >
                      <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center shrink-0 text-xs font-semibold mt-0.5">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>

              {/* Explanation card after submit */}
              {isAnswerSubmitted && (
                <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 text-xs space-y-1.5 animate-in fade-in">
                  <div className="font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Linguistic Explanation</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {currentQuiz.explanation}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                {!isAnswerSubmitted ? (
                  <button
                    type="button"
                    onClick={handleQuizSubmit}
                    disabled={selectedOption === null}
                    className="px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition-colors shadow-xs"
                  >
                    Submit Answer
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNextQuizQuestion}
                    className="px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    <span>
                      {currentQuizIndex < QUIZ_QUESTIONS.length - 1 ? 'Next Question' : 'View Results'}
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
                <Award className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Quiz Completed!
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                You scored <strong className="text-indigo-600 dark:text-indigo-400 font-mono text-base">{score}</strong> out of {QUIZ_QUESTIONS.length} ({Math.round((score / QUIZ_QUESTIONS.length) * 100)}%).
              </p>
              <button
                type="button"
                onClick={handleRestartQuiz}
                className="px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors"
              >
                Restart Quiz
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
