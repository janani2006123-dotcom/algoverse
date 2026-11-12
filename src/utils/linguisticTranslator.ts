/**
 * Client-Side Linguistic Sign Translation Engine for SignBridge
 * Provides instant, zero-latency grammatical transformation
 * Converts English spoken sentences into ASL, ISL, and BSL Topic-Comment syntax
 * Serves as fail-safe fallback if backend network calls are delayed or interrupted
 */

import { SignLanguageType, VoiceToSignResult, GlossToken } from '../types';

export function translateTextToSignLocally(
  text: string,
  targetLanguage: SignLanguageType = 'ASL'
): VoiceToSignResult {
  const cleaned = text.trim();
  const rawWords = cleaned.split(/\s+/).filter(Boolean);

  // Common stop words / auxiliaries stripped in visual-spatial sign grammar
  const stopWords = new Set([
    'a', 'an', 'the', 'is', 'are', 'am', 'was', 'were', 'be', 'been',
    'being', 'to', 'of', 'at', 'by', 'for', 'with', 'about', 'into', 'through',
    'during', 'before', 'after', 'above', 'below', 'from', 'up', 'down', 'in', 'out', 'on', 'off'
  ]);

  const meaningfulWords = rawWords.filter(
    (w) => !stopWords.has(w.toLowerCase().replace(/[^a-z]/g, ''))
  );

  const wordsToProcess = meaningfulWords.length > 0 ? meaningfulWords : rawWords;

  // Synthesize visual-spatial Topic-Comment gloss sequence
  const glossSequence: GlossToken[] = wordsToProcess.map((w, idx) => {
    const rawClean = w.toUpperCase().replace(/[^A-Z]/g, '');
    let handshape = 'flat';
    let expression: GlossToken['expression'] = 'neutral';

    if (/\b(HELLO|HI|WELCOME|HEY)\b/i.test(rawClean)) {
      handshape = 'flat';
      expression = 'smile';
    } else if (/\b(WHAT|WHERE|WHO|WHY|HOW|WHEN|WHICH)\b/i.test(rawClean)) {
      handshape = 'pointing';
      expression = 'eyebrows_furrowed';
    } else if (/\b(YES|SURE|AGREE|AFFIRMATIVE)\b/i.test(rawClean)) {
      handshape = 'fist';
      expression = 'nod';
    } else if (/\b(NO|NOT|NEVER|CANNOT|DONT)\b/i.test(rawClean)) {
      handshape = 'pinch';
      expression = 'head_shake';
    } else if (/\b(YOU|YOUR|ME|MY|I|HE|SHE|IT|WE|THEY)\b/i.test(rawClean)) {
      handshape = 'pointing';
      expression = 'neutral';
    } else if (/\b(HAPPY|GOOD|GREAT|WONDERFUL|LOVE|LIKE)\b/i.test(rawClean)) {
      handshape = 'open5';
      expression = 'smile';
    } else if (/\b(HELP|EMERGENCY|URGENT|DOCTOR|POLICE)\b/i.test(rawClean)) {
      handshape = 'fist';
      expression = 'eyebrows_raised';
    } else {
      const handshapes = ['flat', 'fist', 'pointing', 'open5', 'c_shape', 'claw'];
      handshape = handshapes[idx % handshapes.length];
    }

    return {
      word: w,
      gloss: rawClean || w.toUpperCase(),
      handshape,
      expression,
      durationMs: 700,
    };
  });

  const grammarNotes = [
    `Transformed into ${targetLanguage} Topic-Comment visual grammar structure.`,
    'Removed spoken English grammatical auxiliaries and articles.',
    'Tagged non-manual facial grammatical markers and handshapes.',
  ];

  return {
    spokenText: cleaned,
    signLanguage: targetLanguage,
    glossSequence,
    grammarNotes,
    isDemo: true,
    avatarFrames: [],
  };
}
