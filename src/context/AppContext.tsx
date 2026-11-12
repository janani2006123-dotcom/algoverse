import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  SignLanguageType,
  SpokenLanguageType,
  UserPreferences,
  UserProfile,
  EmergencyContact,
  EmergencyAlert,
  ConversationMessage,
} from '../types';

interface AppContextType {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  user: UserProfile | null;
  login: (email: string, name?: string, role?: UserProfile['role']) => void;
  logout: () => void;
  preferences: UserPreferences;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  emergencyContacts: EmergencyContact[];
  addEmergencyContact: (contact: Omit<EmergencyContact, 'id'>) => void;
  removeEmergencyContact: (id: string) => void;
  recentAlerts: EmergencyAlert[];
  addAlert: (alert: EmergencyAlert) => void;
  savedVocabulary: string[];
  toggleSaveWord: (wordId: string) => void;
  conversationHistory: ConversationMessage[];
  addConversationMessage: (msg: Omit<ConversationMessage, 'id' | 'timestamp'>) => void;
  clearConversation: () => void;
  translationHistory: Array<{
    id: string;
    type: 'sign-to-voice' | 'voice-to-sign';
    source: string;
    target: string;
    signLanguage: SignLanguageType;
    timestamp: string;
  }>;
  addTranslationRecord: (
    type: 'sign-to-voice' | 'voice-to-sign',
    source: string,
    target: string,
    signLanguage: SignLanguageType
  ) => void;
  clearTranslationHistory: () => void;
  speakText: (text: string) => void;
  isSpeaking: boolean;
  stopSpeaking: () => void;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'light',
  highContrast: false,
  fontSize: 'normal',
  reducedMotion: false,
  preferredSignLanguage: 'ASL',
  preferredSpokenLanguage: 'en-US',
  speechRate: 1.0,
  speechPitch: 1.0,
  speechVolume: 1.0,
  captionsEnabled: true,
  cameraMirror: true,
};

const DEFAULT_USER: UserProfile = {
  id: 'usr_demo_101',
  name: 'Alex Rivera',
  email: 'alex@example.com',
  role: 'both',
  completedLessons: ['hello', 'thank-you', 'help'],
  savedVocabulary: ['hello', 'help', 'doctor', 'ambulance'],
  quizScores: [
    { quizId: 'quiz-1', score: 100, total: 100, date: '2026-11-10' },
    { quizId: 'quiz-2', score: 100, total: 100, date: '2026-11-11' },
  ],
  emergencyContacts: [
    {
      id: 'contact-1',
      name: 'Primary SOS Contact',
      phone: '+919916693919',
      relation: 'Emergency Contact',
      notifySms: true,
      notifyCall: true,
    },
    {
      id: 'contact-2',
      name: 'Dr. Michael Chen (Care Team)',
      phone: '+1 (555) 876-5432',
      relation: 'Physician',
      notifySms: true,
      notifyCall: false,
    },
  ],
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('signbridge_user');
    return saved ? JSON.parse(saved) : DEFAULT_USER;
  });

  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    const saved = localStorage.getItem('signbridge_prefs');
    return saved ? JSON.parse(saved) : DEFAULT_PREFERENCES;
  });

  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>(() => {
    return user?.emergencyContacts || DEFAULT_USER.emergencyContacts;
  });

  const [recentAlerts, setRecentAlerts] = useState<EmergencyAlert[]>([]);
  const [savedVocabulary, setSavedVocabulary] = useState<string[]>(() => {
    return user?.savedVocabulary || DEFAULT_USER.savedVocabulary;
  });

  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([
    {
      id: 'msg-1',
      sender: 'signer',
      text: 'Hello, good morning! How are you?',
      gloss: 'HELLO MORNING! YOU HOW?',
      signLanguage: 'ASL',
      timestamp: '10:02 AM',
      confidence: 0.94,
    },
    {
      id: 'msg-2',
      sender: 'speaker',
      text: 'Good morning! I am glad to meet with you today.',
      gloss: 'MORNING! TODAY MEET GLAD.',
      signLanguage: 'ASL',
      timestamp: '10:03 AM',
    },
  ]);

  const [translationHistory, setTranslationHistory] = useState<
    Array<{
      id: string;
      type: 'sign-to-voice' | 'voice-to-sign';
      source: string;
      target: string;
      signLanguage: SignLanguageType;
      timestamp: string;
    }>
  >(() => {
    const saved = localStorage.getItem('signbridge_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return [
      {
        id: 'hist-1',
        type: 'sign-to-voice',
        source: 'HELP (thumbs up lifting on flat palm)',
        target: 'I need assistance right now.',
        signLanguage: 'ASL',
        timestamp: '10 mins ago',
      },
      {
        id: 'hist-2',
        type: 'voice-to-sign',
        source: 'Where is the doctor clinic?',
        target: 'DOCTOR CLINIC WHERE?',
        signLanguage: 'ASL',
        timestamp: '25 mins ago',
      },
      {
        id: 'hist-3',
        type: 'sign-to-voice',
        source: 'THANK-YOU',
        target: 'Thank you very much.',
        signLanguage: 'ISL',
        timestamp: '1 hour ago',
      },
    ];
  });

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Sync theme and accessibility class on html root element
  useEffect(() => {
    const root = document.documentElement;
    if (preferences.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    if (preferences.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    root.classList.remove('text-size-lg', 'text-size-xl');
    if (preferences.fontSize === 'large') {
      root.classList.add('text-size-lg');
    } else if (preferences.fontSize === 'xl') {
      root.classList.add('text-size-xl');
    }

    if (preferences.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }

    localStorage.setItem('signbridge_prefs', JSON.stringify(preferences));
  }, [preferences]);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('signbridge_history', JSON.stringify(translationHistory));
  }, [translationHistory]);

  const updatePreferences = (prefs: Partial<UserPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...prefs }));
    showToast('Preferences updated', 'info');
  };

  const login = (email: string, name?: string, role?: UserProfile['role']) => {
    const newUser: UserProfile = {
      ...DEFAULT_USER,
      email,
      name: name || email.split('@')[0],
      role: role || 'both',
    };
    setUser(newUser);
    localStorage.setItem('signbridge_user', JSON.stringify(newUser));
    showToast(`Welcome back, ${newUser.name}!`, 'success');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('signbridge_user');
    showToast('Signed out successfully', 'info');
  };

  const addEmergencyContact = (contact: Omit<EmergencyContact, 'id'>) => {
    const newContact: EmergencyContact = {
      ...contact,
      id: `c_${Date.now()}`,
    };
    const updated = [...emergencyContacts, newContact];
    setEmergencyContacts(updated);
    if (user) {
      const updatedUser = { ...user, emergencyContacts: updated };
      setUser(updatedUser);
      localStorage.setItem('signbridge_user', JSON.stringify(updatedUser));
    }
    showToast(`Added emergency contact: ${contact.name}`, 'success');
  };

  const removeEmergencyContact = (id: string) => {
    const updated = emergencyContacts.filter((c) => c.id !== id);
    setEmergencyContacts(updated);
    if (user) {
      const updatedUser = { ...user, emergencyContacts: updated };
      setUser(updatedUser);
      localStorage.setItem('signbridge_user', JSON.stringify(updatedUser));
    }
    showToast('Emergency contact removed', 'info');
  };

  const addAlert = (alert: EmergencyAlert) => {
    setRecentAlerts((prev) => [alert, ...prev]);
  };

  const toggleSaveWord = (wordId: string) => {
    setSavedVocabulary((prev) => {
      const exists = prev.includes(wordId);
      const next = exists ? prev.filter((id) => id !== wordId) : [...prev, wordId];
      if (user) {
        const updatedUser = { ...user, savedVocabulary: next };
        setUser(updatedUser);
        localStorage.setItem('signbridge_user', JSON.stringify(updatedUser));
      }
      showToast(exists ? 'Word removed from saved list' : 'Word saved to your vocabulary', 'info');
      return next;
    });
  };

  const addConversationMessage = (msg: Omit<ConversationMessage, 'id' | 'timestamp'>) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg: ConversationMessage = {
      ...msg,
      id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      timestamp: time,
    };
    setConversationHistory((prev) => [...prev, newMsg]);
  };

  const clearConversation = () => {
    setConversationHistory([]);
    showToast('Conversation cleared', 'info');
  };

  const addTranslationRecord = (
    type: 'sign-to-voice' | 'voice-to-sign',
    source: string,
    target: string,
    signLanguage: SignLanguageType
  ) => {
    const record = {
      id: `tr_${Date.now()}`,
      type,
      source,
      target,
      signLanguage,
      timestamp: 'Just now',
    };
    setTranslationHistory((prev) => [record, ...prev.slice(0, 49)]);
  };

  const clearTranslationHistory = () => {
    setTranslationHistory([]);
    localStorage.removeItem('signbridge_history');
    showToast('Translation history cleared', 'info');
  };

  // Browser SpeechSynthesis API handler
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) {
      showToast('Text-to-speech is not supported in this browser', 'error');
      return;
    }
    window.speechSynthesis.cancel();
    if (!text.trim()) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = preferences.speechRate;
    utterance.pitch = preferences.speechPitch;
    utterance.volume = preferences.speechVolume;
    utterance.lang = preferences.preferredSpokenLanguage;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((curr) => (curr?.message === message ? null : curr));
    }, 3500);
  };

  return (
    <AppContext.Provider
      value={{
        currentPage,
        setCurrentPage,
        user,
        login,
        logout,
        preferences,
        updatePreferences,
        emergencyContacts,
        addEmergencyContact,
        removeEmergencyContact,
        recentAlerts,
        addAlert,
        savedVocabulary,
        toggleSaveWord,
        conversationHistory,
        addConversationMessage,
        clearConversation,
        translationHistory,
        addTranslationRecord,
        clearTranslationHistory,
        speakText,
        isSpeaking,
        stopSpeaking,
        toast,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
