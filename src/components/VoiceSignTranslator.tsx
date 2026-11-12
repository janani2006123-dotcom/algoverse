import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  RotateCcw,
  Volume2,
  Trash2,
  BookOpen,
  ArrowRight,
  Info,
  AlertCircle,
  Play,
  Pause,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AnimatedSignAvatar } from './AnimatedSignAvatar';
import { SIGN_DICTIONARY } from '../data/signDictionary';
import { SignLanguageType, VoiceToSignResult, SignAvatarKeyframe, SignEntry } from '../types';
import { translateTextToSignLocally } from '../utils/linguisticTranslator';

interface VoiceSignTranslatorProps {
  onTranslated?: (spokenText: string, glossSequence: string) => void;
  compact?: boolean;
}

export const VoiceSignTranslator: React.FC<VoiceSignTranslatorProps> = ({
  onTranslated,
  compact = false,
}) => {
  const { preferences, updatePreferences, addTranslationRecord, showToast, speakText, isSpeaking, stopSpeaking } = useApp();

  const [isRecording, setIsRecording] = useState(false);
  const [spokenText, setSpokenText] = useState('Where is the nearest doctor or hospital?');
  const [targetLanguage, setTargetLanguage] = useState<SignLanguageType>(preferences.preferredSignLanguage || 'ASL');
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string>('');
  const [translationResult, setTranslationResult] = useState<VoiceToSignResult | null>(null);
  const [selectedWordIndex, setSelectedWordIndex] = useState(0);
  const [isPlayingFullSequence, setIsPlayingFullSequence] = useState(false);
  const [speechApiSupported, setSpeechApiSupported] = useState(true);

  const recognitionRef = useRef<any>(null);
  const sequenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize SpeechRecognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechApiSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = preferences.preferredSpokenLanguage || 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
        setError('');
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          setSpokenText(transcript);
          setError('');
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsRecording(false);
        if (event.error === 'not-allowed') {
          setError('Microphone permission was denied. You can type directly in the text field.');
          showToast('Microphone permission denied.', 'error');
        } else if (event.error !== 'no-speech') {
          showToast(`Speech error: ${event.error}`, 'info');
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('Failed to initialize speech recognition:', e);
      setSpeechApiSupported(false);
    }

    return () => {
      try {
        recognitionRef.current?.abort();
      } catch (e) {
        // ignore
      }
    };
  }, [preferences.preferredSpokenLanguage, showToast]);

  const toggleRecording = () => {
    if (!speechApiSupported) {
      showToast('Live Speech API is not supported in this browser. Please type directly in the text field.', 'info');
      return;
    }

    if (isRecording) {
      try {
        recognitionRef.current?.stop();
      } catch (e) {
        // ignore
      }
      setIsRecording(false);
    } else {
      try {
        setError('');
        recognitionRef.current?.start();
        showToast('Listening... Speak clearly into your microphone', 'info');
      } catch (err: any) {
        console.error('Failed to start speech recognition:', err);
        setIsRecording(false);
        // If already started, try aborting and starting again
        try {
          recognitionRef.current?.abort();
          setTimeout(() => recognitionRef.current?.start(), 150);
        } catch (e) {
          // ignore
        }
      }
    }
  };

  /**
   * Main Translation Pipeline
   * User Input → State → Validation → API Request → Sign Mapping → Output Display
   */
  const translateMessage = async (overrideText?: string, overrideLang?: SignLanguageType) => {
    const textToTranslate = typeof overrideText === 'string' ? overrideText : spokenText;
    const langToUse = overrideLang || targetLanguage;

    // Validation step: Check if input is empty
    if (!textToTranslate || !textToTranslate.trim()) {
      setError('Please enter a message to translate.');
      showToast('Please enter a message.', 'error');
      return;
    }

    setIsTranslating(true);
    setError('');

    try {
      const res = await fetch('/api/gemini/translate-speech-to-sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spokenText: textToTranslate.trim(),
          targetLanguage: langToUse,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server responded with status ${res.status}`);
      }

      const data: VoiceToSignResult = await res.json();
      setTranslationResult(data);
      setSelectedWordIndex(0);

      const glossStr = data.glossSequence.map((g) => g.gloss).join(' ');
      addTranslationRecord('voice-to-sign', textToTranslate.trim(), glossStr, langToUse);

      if (onTranslated) {
        onTranslated(textToTranslate.trim(), glossStr);
      }

      showToast(`Translated into ${langToUse} Sign Structure`, 'success');
    } catch (err: any) {
      console.warn('Network translation unavailable, using client linguistic engine:', err?.message || err);
      // Seamless fallback to client-side linguistic translation
      const fallbackData = translateTextToSignLocally(textToTranslate.trim(), langToUse);
      setTranslationResult(fallbackData);
      setSelectedWordIndex(0);

      const glossStr = fallbackData.glossSequence.map((g) => g.gloss).join(' ');
      addTranslationRecord('voice-to-sign', textToTranslate.trim(), glossStr, langToUse);

      if (onTranslated) {
        onTranslated(textToTranslate.trim(), glossStr);
      }

      showToast(`Translated into ${langToUse} Sign Structure`, 'success');
    } finally {
      setIsTranslating(false);
    }
  };

  // Run initial translation on mount
  useEffect(() => {
    if (spokenText.trim()) {
      translateMessage(spokenText, targetLanguage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle Full Sentence sequential playback
  useEffect(() => {
    if (!isPlayingFullSequence || !translationResult || translationResult.glossSequence.length === 0) {
      if (sequenceTimerRef.current) clearTimeout(sequenceTimerRef.current);
      return;
    }

    const currentToken = translationResult.glossSequence[selectedWordIndex];
    const duration = currentToken?.durationMs || 1000;

    sequenceTimerRef.current = setTimeout(() => {
      setSelectedWordIndex((prev) => {
        if (prev >= translationResult.glossSequence.length - 1) {
          setIsPlayingFullSequence(false);
          return 0;
        }
        return prev + 1;
      });
    }, duration);

    return () => {
      if (sequenceTimerRef.current) clearTimeout(sequenceTimerRef.current);
    };
  }, [isPlayingFullSequence, selectedWordIndex, translationResult]);

  // Map currently selected gloss token to Sign Dictionary or generate procedural kinematics
  const activeToken = translationResult?.glossSequence[selectedWordIndex];
  const activeGlossWord = activeToken?.gloss || (spokenText.trim().split(/\s+/)[0]?.toUpperCase() || 'HELLO');

  // Search in validated dictionary
  const matchedEntry: SignEntry | undefined = SIGN_DICTIONARY.find((entry) => {
    const cleanWord = entry.word.toLowerCase();
    const cleanGloss = entry.gloss.toUpperCase();
    const targetWord = (activeToken?.word || activeGlossWord).toLowerCase().replace(/[^a-z]/g, '');
    const targetGloss = activeGlossWord.replace(/[^A-Z]/g, '');
    return cleanGloss === targetGloss || cleanWord === targetWord || cleanWord.includes(targetWord) || targetWord.includes(cleanWord);
  });

  // Generate responsive kinematic frames if not in static dictionary
  const getAvatarKeyframes = (): SignAvatarKeyframe[] => {
    if (matchedEntry?.avatarKeyframes && matchedEntry.avatarKeyframes.length > 0) {
      return matchedEntry.avatarKeyframes;
    }

    const shape = (activeToken?.handshape as any) || 'open5';
    const expr = (activeToken?.expression as any) || 'neutral';

    let eyebrowState: 'neutral' | 'raised' | 'furrowed' = 'neutral';
    if (expr.includes('furrowed') || activeGlossWord.includes('?') || /WHERE|WHAT|WHY|WHO|HOW/i.test(activeGlossWord)) {
      eyebrowState = 'furrowed';
    } else if (expr.includes('raised') || /HELP|URGENT|DOCTOR/i.test(activeGlossWord)) {
      eyebrowState = 'raised';
    }

    let mouthState: 'neutral' | 'smile' | 'open' | 'round' = 'neutral';
    if (expr.includes('smile') || /HELLO|THANK|PLEASE|GOOD/i.test(activeGlossWord)) {
      mouthState = 'smile';
    } else if (/DOCTOR|AMBULANCE|HURT/i.test(activeGlossWord)) {
      mouthState = 'round';
    }

    return [
      {
        headTilt: 0,
        eyebrows: eyebrowState,
        mouth: mouthState,
        leftHand: { x: 35, y: 68, shape: 'open5' },
        rightHand: { x: 62, y: 55, shape: shape, rotation: 10 },
        durationMs: 450,
      },
      {
        headTilt: eyebrowState === 'furrowed' ? 2 : 0,
        eyebrows: eyebrowState,
        mouth: mouthState,
        leftHand: { x: 35, y: 68, shape: 'open5' },
        rightHand: { x: 55, y: 38, shape: shape, rotation: -15 },
        durationMs: 650,
      },
    ];
  };

  const activeKeyframes = getAvatarKeyframes();

  const quickPresets = [
    'Hello, how are you?',
    'Where is the nearest doctor or hospital?',
    'I need urgent assistance with medication.',
    'Thank you so much for your help.',
    'Can I have a glass of water please?',
    'I am learning sign language today.',
  ];

  const handleLanguageChange = (lang: SignLanguageType) => {
    setTargetLanguage(lang);
    updatePreferences({ preferredSignLanguage: lang });
    if (spokenText.trim()) {
      translateMessage(spokenText, lang);
    }
  };

  const handleClear = () => {
    setSpokenText('');
    setError('');
    setTranslationResult(null);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
      {/* Top Header */}
      <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Voice-to-Sign Language Translator
          </h3>
        </div>

        {/* Sign Language Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">Target Sign Language:</span>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            {(['ASL', 'ISL', 'BSL'] as SignLanguageType[]).map((lang) => (
              <button
                type="button"
                key={lang}
                onClick={() => handleLanguageChange(lang)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  targetLanguage === lang
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

      <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Voice/Text Input, Controls, Validation & Grammar Notes (6 cols) */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="voice-translate-input"
                className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
              >
                <Mic className="w-3.5 h-3.5 text-indigo-500" />
                <span>Text or Microphone Speech Input</span>
              </label>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                {isRecording ? (
                  <span className="text-rose-600 dark:text-rose-400 font-medium animate-pulse flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    Listening...
                  </span>
                ) : (
                  <span>Ready to type or speak</span>
                )}
              </div>
            </div>

            {/* Controlled Textarea with clear button and mic trigger */}
            <div className="relative">
              <textarea
                id="voice-translate-input"
                name="voiceTranslateInput"
                rows={3}
                value={spokenText}
                onChange={(e) => {
                  setSpokenText(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Type your message here or click the microphone to speak..."
                className="w-full text-sm p-3.5 pr-20 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none leading-relaxed"
              />

              <div className="absolute right-3 bottom-3 flex items-center gap-1.5">
                {spokenText && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Clear input text"
                    aria-label="Clear input text"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`p-2 rounded-xl transition-all shadow-xs ${
                    isRecording
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                  title={isRecording ? 'Stop Recording' : 'Start Microphone Speech Input'}
                  aria-label={isRecording ? 'Stop recording microphone' : 'Start microphone recording'}
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Validation Error Message Box */}
            {error && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2 animate-in fade-in"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Quick Sample Prompts */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 mr-1">Quick Prompts:</span>
              {quickPresets.slice(0, 3).map((prompt, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => {
                    setSpokenText(prompt);
                    setError('');
                    translateMessage(prompt);
                  }}
                  className="text-xs px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Main Translate Action Buttons */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => translateMessage()}
                disabled={isTranslating}
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-semibold text-white transition-all flex items-center justify-center gap-2 shadow-xs ${
                  isTranslating
                    ? 'bg-indigo-400 cursor-not-allowed opacity-80'
                    : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99]'
                }`}
              >
                <Sparkles className={`w-4 h-4 ${isTranslating ? 'animate-spin' : ''}`} />
                <span>
                  {isTranslating
                    ? 'Translating Syntax...'
                    : `Translate into ${targetLanguage} Sign Structure`}
                </span>
              </button>

              {spokenText.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    if (isSpeaking) stopSpeaking();
                    else speakText(spokenText);
                  }}
                  className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                  title={isSpeaking ? 'Stop speech' : 'Hear spoken text aloud'}
                  aria-label="Hear spoken text aloud"
                >
                  <Volume2 className={`w-4 h-4 ${isSpeaking ? 'text-indigo-600 animate-pulse' : ''}`} />
                </button>
              )}
            </div>
          </div>

          {/* Grammar & Linguistic Structure Explanation */}
          {translationResult && (
            <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 space-y-2 text-xs">
              <div className="flex items-center justify-between font-semibold text-indigo-950 dark:text-indigo-200">
                <div className="flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{targetLanguage} Linguistic Grammar Structure</span>
                </div>
                <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400">
                  {translationResult.isDemo ? 'Rule Parser Active' : 'AI Multimodal Model'}
                </span>
              </div>
              <ul className="space-y-1 text-slate-600 dark:text-slate-300 pl-4 list-disc">
                {translationResult.grammarNotes?.map((note, i) => (
                  <li key={i}>{note}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right Column: Animated Sign Avatar & Gloss Breakdown (6 cols) */}
        <div className="lg:col-span-6 flex flex-col space-y-4">
          {/* Avatar Demonstration */}
          <div className="relative">
            <AnimatedSignAvatar
              gloss={activeGlossWord}
              signWord={activeToken?.word || activeGlossWord}
              signLanguage={targetLanguage}
              keyframes={activeKeyframes}
              height={compact ? 240 : 280}
              handshapeDescription={matchedEntry?.handshape || `Shape: ${activeToken?.handshape || 'Dynamic'}`}
              nonManualDescription={matchedEntry?.nonManualMarkers || `Expression: ${activeToken?.expression || 'Grammatical Marker'}`}
            />

            {/* Validation badge */}
            <div className="absolute top-11 right-3 text-[11px] px-2 py-0.5 rounded bg-slate-900/80 backdrop-blur-xs text-slate-300 border border-slate-700">
              {matchedEntry ? (
                <span className="text-emerald-400 font-medium">Validated Dictionary Sign</span>
              ) : (
                <span className="text-indigo-300 font-medium">Kinematic Model Sequence</span>
              )}
            </div>
          </div>

          {/* Gloss Sequence Chips & Sequential Playback Bar */}
          {translationResult && translationResult.glossSequence.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Translated {targetLanguage} Gloss Sequence:
                </span>
                <button
                  type="button"
                  onClick={() => setIsPlayingFullSequence(!isPlayingFullSequence)}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  {isPlayingFullSequence ? (
                    <>
                      <Pause className="w-3 h-3" />
                      <span>Pause Full Sequence</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3" />
                      <span>Play Sentence Continuously</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                {translationResult.glossSequence.map((item, idx) => {
                  const isSelected = selectedWordIndex === idx;
                  return (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => {
                        setIsPlayingFullSequence(false);
                        setSelectedWordIndex(idx);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-xs scale-105 ring-2 ring-indigo-400'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-indigo-400 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {item.gloss}
                    </button>
                  );
                })}
              </div>

              <div className="text-[11px] text-slate-400 flex items-center justify-between px-1">
                <span>Click any gloss token to demonstrate its gesture</span>
                <span>Word {selectedWordIndex + 1} of {translationResult.glossSequence.length}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
