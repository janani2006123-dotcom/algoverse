import React, { useState } from 'react';
import { CameraSignRecognizer } from '../components/CameraSignRecognizer';
import { VoiceSignTranslator } from '../components/VoiceSignTranslator';
import { useApp } from '../context/AppContext';
import {
  MessageSquare,
  Trash2,
  Pause,
  Play,
  Maximize2,
  Minimize2,
  Volume2,
  User,
  Bot,
  Languages,
} from 'lucide-react';
import { SignLanguageType } from '../types';

export const LiveCommunicationPage: React.FC = () => {
  const {
    conversationHistory,
    addConversationMessage,
    clearConversation,
    preferences,
    updatePreferences,
    speakText,
  } = useApp();

  const [isPaused, setIsPaused] = useState(false);
  const [largeTextMode, setLargeTextMode] = useState(false);

  // Callback when signer recognizes a sign/sentence
  const handleSignRecognized = (sentence: string, gloss: string) => {
    if (isPaused) return;
    addConversationMessage({
      sender: 'signer',
      text: sentence,
      gloss,
      signLanguage: preferences.preferredSignLanguage,
      confidence: 0.95,
    });
  };

  // Callback when speaker speaks
  const handleSpeechTranslated = (spokenText: string, glossSequence: string) => {
    if (isPaused) return;
    addConversationMessage({
      sender: 'speaker',
      text: spokenText,
      gloss: glossSequence,
      signLanguage: preferences.preferredSignLanguage,
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header & Live Session Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Two-Way Live Conversation Room
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time bridge connecting Deaf/signing participants and hearing/speaking participants simultaneously.
          </p>
        </div>

        {/* Global Live Room Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Language Selector */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
            {(['ASL', 'ISL', 'BSL'] as SignLanguageType[]).map((lang) => (
              <button
                type="button"
                key={lang}
                onClick={() => updatePreferences({ preferredSignLanguage: lang })}
                className={`px-2.5 py-1 font-semibold rounded-lg transition-colors ${
                  preferences.preferredSignLanguage === lang
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>

          {/* Large Text Mode Toggle */}
          <button
            type="button"
            onClick={() => setLargeTextMode(!largeTextMode)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-colors ${
              largeTextMode
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-300 dark:border-indigo-800'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
            }`}
          >
            {largeTextMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{largeTextMode ? 'Standard Text' : 'Large Text Display'}</span>
          </button>

          {/* Pause / Resume Session */}
          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-colors ${
              isPaused
                ? 'bg-amber-500 text-white border-amber-600'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700'
            }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{isPaused ? 'Resume Session' : 'Pause'}</span>
          </button>

          {/* Clear Transcript */}
          <button
            type="button"
            onClick={clearConversation}
            className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Clear Conversation Transcript"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Split Screen 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* LEFT COLUMN: Signer Interface (Camera, Landmark Recognition & Audio Playback) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Left Section: Signer (Camera → Voice)
              </h2>
            </div>
            <span className="text-xs text-slate-400">Webcam & Hand Landmarks</span>
          </div>

          <CameraSignRecognizer onRecognized={handleSignRecognized} compact />
        </div>

        {/* RIGHT COLUMN: Speaker Interface (Microphone, Speech Recognition & Sign Avatar) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Right Section: Speaker (Voice → Sign Avatar)
              </h2>
            </div>
            <span className="text-xs text-slate-400">Microphone & Kinematic Avatar</span>
          </div>

          <VoiceSignTranslator onTranslated={handleSpeechTranslated} compact />
        </div>
      </div>

      {/* Live Shared Conversation Transcript */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Session Live Transcript
            </h3>
            <span className="text-xs text-slate-400">
              ({conversationHistory.length} messages in current session)
            </span>
          </div>

          {conversationHistory.length > 0 && (
            <button
              type="button"
              onClick={clearConversation}
              className="text-xs text-slate-400 hover:text-rose-500 transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        <div className="p-6 max-h-96 overflow-y-auto space-y-4">
          {conversationHistory.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No messages yet in this session. Start signing into the camera on the left or speak into the microphone on the right.
            </div>
          ) : (
            conversationHistory.map((msg) => {
              const isSigner = msg.sender === 'signer';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isSigner ? 'items-start' : 'items-end'}`}
                >
                  <div className="flex items-center gap-2 mb-1 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {isSigner ? 'Signer (Camera)' : 'Speaker (Voice)'}
                    </span>
                    <span>·</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <div
                    className={`max-w-2xl rounded-2xl p-4 shadow-xs ${
                      isSigner
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 text-slate-900 dark:text-slate-100 rounded-tl-xs'
                        : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-tr-xs'
                    }`}
                  >
                    <p
                      className={`leading-relaxed font-medium ${
                        largeTextMode ? 'text-lg sm:text-xl font-semibold' : 'text-sm'
                      }`}
                    >
                      {msg.text}
                    </p>

                    {msg.gloss && (
                      <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-4 text-xs">
                        <div className="font-mono text-indigo-600 dark:text-indigo-400">
                          <span className="text-slate-400 mr-1.5">Gloss:</span>
                          {msg.gloss}
                        </div>
                        <button
                          type="button"
                          onClick={() => speakText(msg.text)}
                          className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
                          title="Speak audio"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
