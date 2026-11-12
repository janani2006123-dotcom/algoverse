export type SignLanguageType = 'ASL' | 'ISL' | 'BSL';

export type SpokenLanguageType = 'en-US' | 'en-GB' | 'hi-IN' | 'es-ES' | 'fr-FR';

export type SignCategory = 
  | 'greetings' 
  | 'emergency' 
  | 'numbers' 
  | 'family' 
  | 'food' 
  | 'education' 
  | 'common' 
  | 'alphabet';

export interface SignAvatarKeyframe {
  headTilt?: number; // degrees
  eyebrows?: 'neutral' | 'raised' | 'furrowed';
  mouth?: 'neutral' | 'open' | 'smile' | 'round';
  leftHand: {
    x: number;
    y: number;
    z?: number;
    shape: 'flat' | 'fist' | 'pointing' | 'open5' | 'pinch' | 'c_shape' | 'peace' | 'thumbs_up';
    rotation?: number;
  };
  rightHand: {
    x: number;
    y: number;
    z?: number;
    shape: 'flat' | 'fist' | 'pointing' | 'open5' | 'pinch' | 'c_shape' | 'peace' | 'thumbs_up';
    rotation?: number;
  };
  durationMs: number;
}

export interface SignEntry {
  id: string;
  word: string;
  gloss: string;
  languages: SignLanguageType[];
  category: SignCategory;
  level: 'beginner' | 'intermediate' | 'advanced';
  description: string;
  handshape: string;
  movement: string;
  nonManualMarkers: string;
  grammarTip: string;
  culturalNote?: string;
  avatarKeyframes: SignAvatarKeyframe[];
  regionalVariations?: {
    [key in SignLanguageType]?: string;
  };
}

export interface SignToVoiceResult {
  recognizedSign: string;
  confidence: number;
  sentence: string;
  detectedGrammarType: string;
  isDemo: boolean;
  timestamp: string;
  handshapeDetected?: string;
  movementDetected?: string;
  facialCueDetected?: string;
}

export interface VoiceToSignResult {
  spokenText: string;
  signLanguage: SignLanguageType;
  glossSequence: Array<{
    word: string;
    gloss: string;
    handshape: string;
    expression: string;
    durationMs: number;
  }>;
  grammarNotes: string[];
  isDemo: boolean;
  avatarFrames: SignAvatarKeyframe[];
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relation: string;
  notifySms: boolean;
  notifyCall: boolean;
}

export interface EmergencyAlert {
  id: string;
  message: string;
  urgency: 'high' | 'critical' | 'moderate';
  type: 'medical' | 'ambulance' | 'police' | 'fire' | 'general';
  status: 'Pending' | 'Sent' | 'Delivered' | 'Failed';
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    address?: string;
  };
  timestamp: string;
  contactsNotified: string[];
  dispatchNote?: string;
  confirmationCode?: string;
}

export interface ConversationMessage {
  id: string;
  sender: 'signer' | 'speaker';
  text: string;
  gloss?: string;
  signLanguage?: SignLanguageType;
  timestamp: string;
  confidence?: number;
}

export interface QuizQuestion {
  id: string;
  signWord: string;
  signLanguage: SignLanguageType;
  level: 'beginner' | 'intermediate' | 'advanced';
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  handshapeHint: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  highContrast: boolean;
  fontSize: 'normal' | 'large' | 'xl';
  reducedMotion: boolean;
  preferredSignLanguage: SignLanguageType;
  preferredSpokenLanguage: SpokenLanguageType;
  speechRate: number; // 0.7 to 1.3
  speechPitch: number; // 0.8 to 1.2
  speechVolume: number; // 0 to 1
  captionsEnabled: boolean;
  cameraMirror: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'signer' | 'speaker' | 'both' | 'learner';
  completedLessons: string[];
  savedVocabulary: string[];
  quizScores: Array<{
    quizId: string;
    score: number;
    total: number;
    date: string;
  }>;
  emergencyContacts: EmergencyContact[];
}
