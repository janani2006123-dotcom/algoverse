import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  UserProfile,
  UserPreferences,
  EmergencyContact,
  EmergencyAlert,
  ConversationMessage,
  SignLanguageType,
  SpokenLanguageType,
  UserAccount,
} from '../types';

interface AppContextType {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  user: UserProfile | null;
  authToken: string | null;
  registerAccount: (data: {
    fullName: string;
    email: string;
    password: string;
    confirmPassword?: string;
    phoneNumber: string;
    role?: 'signer' | 'speaker' | 'both' | 'learner';
    acceptTerms: boolean;
  }) => Promise<{ success: boolean; error?: string }>;
  loginWithCredentials: (email: string, password: string, remember?: boolean) => Promise<{ success: boolean; error?: string }>;
  login: (email: string, name?: string, role?: UserProfile['role']) => void;
  logout: () => void;
  updateUserProfileData: (data: Partial<Pick<UserAccount, 'fullName' | 'phoneNumber' | 'role' | 'avatarUrl' | 'emergencyPreferences'>>) => Promise<{ success: boolean; error?: string }>;
  deleteUserAccount: () => Promise<{ success: boolean; error?: string }>;
  preferences: UserPreferences;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  emergencyContacts: EmergencyContact[];
  refreshContacts: () => Promise<void>;
  addEmergencyContact: (contact: Omit<EmergencyContact, 'id'>) => Promise<void>;
  updateEmergencyContactRemote: (id: string, contact: Partial<EmergencyContact>) => Promise<boolean>;
  removeEmergencyContact: (id: string) => Promise<void>;
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
  id: 'usr_guest',
  name: 'Alex Rivera',
  email: 'alex@example.com',
  role: 'both',
  completedLessons: ['hello', 'thank-you', 'help'],
  savedVocabulary: ['hello', 'help', 'doctor', 'ambulance'],
  quizScores: [
    { quizId: 'quiz-1', score: 100, total: 100, date: '2026-11-10' },
  ],
  emergencyContacts: [
    {
      id: 'contact-1',
      name: 'Primary SOS Contact',
      phone: '+919916693919',
      relation: 'Emergency Contact',
      notifySms: true,
      notifyCall: true,
      isPreferred: true,
      notificationConsent: true,
    },
  ],
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [authToken, setAuthToken] = useState<string | null>(() => {
    return localStorage.getItem('signbridge_auth_token') || null;
  });

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
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 'h-1',
            type: 'voice-to-sign',
            source: 'Hello, good to see you today.',
            target: 'HELLO SEE TODAY GOOD',
            signLanguage: 'ASL',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ];
  });

  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  }, []);

  // Sync contacts from server when authToken changes
  const refreshContacts = useCallback(async () => {
    if (!authToken) return;
    try {
      const res = await fetch('/api/contacts', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.contacts)) {
          setEmergencyContacts(data.contacts);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch emergency contacts from server:', err);
    }
  }, [authToken]);

  // Restore authenticated session on mount
  useEffect(() => {
    if (!authToken) return;
    async function verifySession() {
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            const profile: UserProfile = {
              id: data.user.uid,
              name: data.user.fullName,
              email: data.user.email,
              role: data.user.role || 'both',
              completedLessons: ['hello', 'thank-you', 'help'],
              savedVocabulary: ['hello', 'help'],
              quizScores: [],
              emergencyContacts: [],
            };
            setUser(profile);
            localStorage.setItem('signbridge_user', JSON.stringify(profile));
            refreshContacts();
          }
        } else {
          // Token invalid or expired
          setAuthToken(null);
          localStorage.removeItem('signbridge_auth_token');
        }
      } catch (e) {
        console.warn('Session verification notice:', e);
      }
    }
    verifySession();
  }, [authToken, refreshContacts]);

  // Apply visual accessibility themes
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

  /**
   * PHASE 1: User Registration
   */
  const registerAccount = async (data: {
    fullName: string;
    email: string;
    password: string;
    confirmPassword?: string;
    phoneNumber: string;
    role?: 'signer' | 'speaker' | 'both' | 'learner';
    acceptTerms: boolean;
  }) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        return { success: false, error: resData.error || 'Registration failed.' };
      }

      const token = resData.token;
      setAuthToken(token);
      localStorage.setItem('signbridge_auth_token', token);

      const profile: UserProfile = {
        id: resData.user.uid,
        name: resData.user.fullName,
        email: resData.user.email,
        role: resData.user.role || 'both',
        completedLessons: ['hello', 'thank-you', 'help'],
        savedVocabulary: ['hello', 'help'],
        quizScores: [],
        emergencyContacts: [],
      };

      setUser(profile);
      localStorage.setItem('signbridge_user', JSON.stringify(profile));
      setEmergencyContacts([]);
      showToast(`Welcome to SignBridge, ${resData.user.fullName}!`, 'success');
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error during registration.' };
    }
  };

  /**
   * PHASE 2: User Login
   */
  const loginWithCredentials = async (email: string, password: string, remember: boolean = true) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        return { success: false, error: resData.error || 'Invalid email or password.' };
      }

      const token = resData.token;
      setAuthToken(token);
      if (remember) {
        localStorage.setItem('signbridge_auth_token', token);
      } else {
        sessionStorage.setItem('signbridge_auth_token', token);
      }

      const profile: UserProfile = {
        id: resData.user.uid,
        name: resData.user.fullName,
        email: resData.user.email,
        role: resData.user.role || 'both',
        completedLessons: ['hello', 'thank-you', 'help'],
        savedVocabulary: ['hello', 'help'],
        quizScores: [],
        emergencyContacts: [],
      };

      setUser(profile);
      localStorage.setItem('signbridge_user', JSON.stringify(profile));

      // Fetch user's isolated emergency contacts
      const cRes = await fetch('/api/contacts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (cRes.ok) {
        const cData = await cRes.json();
        if (cData.success && Array.isArray(cData.contacts)) {
          setEmergencyContacts(cData.contacts);
        }
      }

      showToast(`Welcome back, ${resData.user.fullName}!`, 'success');
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error during login.' };
    }
  };

  // Instant demo persona login helper
  const login = async (email: string, name?: string, role?: UserProfile['role']) => {
    // Try login or register with default demo password
    const loginAttempt = await loginWithCredentials(email, 'SignBridge2026!');
    if (loginAttempt.success) return;

    // Register demo persona on the fly
    await registerAccount({
      fullName: name || email.split('@')[0],
      email,
      password: 'SignBridge2026!',
      confirmPassword: 'SignBridge2026!',
      phoneNumber: '+15550192834',
      role: role || 'both',
      acceptTerms: true,
    });
  };

  const logout = async () => {
    if (authToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${authToken}` },
        });
      } catch {
        // ignore
      }
    }
    setAuthToken(null);
    setUser(null);
    setEmergencyContacts([]);
    localStorage.removeItem('signbridge_auth_token');
    sessionStorage.removeItem('signbridge_auth_token');
    localStorage.removeItem('signbridge_user');
    showToast('Signed out successfully', 'info');
  };

  const updateUserProfileData = async (data: any) => {
    if (!authToken) return { success: false, error: 'Not authenticated.' };
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok || !resData.success) {
        return { success: false, error: resData.error || 'Profile update failed.' };
      }
      if (user) {
        const updated = {
          ...user,
          name: resData.user.fullName,
          role: resData.user.role,
        };
        setUser(updated);
        localStorage.setItem('signbridge_user', JSON.stringify(updated));
      }
      showToast('Profile updated successfully', 'success');
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Network error' };
    }
  };

  const deleteUserAccount = async () => {
    if (!authToken) return { success: false, error: 'Not authenticated.' };
    try {
      const res = await fetch('/api/auth/account', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const resData = await res.json();
      if (!res.ok || !resData.success) {
        return { success: false, error: resData.error || 'Failed to delete account.' };
      }
      logout();
      showToast('Account and all associated records deleted permanently.', 'info');
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Network error' };
    }
  };

  /**
   * PHASE 4: Remote Contact Management
   */
  const addEmergencyContact = async (contact: Omit<EmergencyContact, 'id'>) => {
    if (authToken) {
      try {
        const res = await fetch('/api/contacts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(contact),
        });
        const data = await res.json();
        if (res.ok && data.success && data.contact) {
          setEmergencyContacts((prev) => [data.contact, ...prev]);
          showToast(`Added emergency contact: ${contact.name}`, 'success');
          return;
        }
      } catch (e) {
        console.warn('Backend contact save error, falling back locally:', e);
      }
    }

    // Local fallback
    const newContact: EmergencyContact = {
      ...contact,
      id: `c_${Date.now()}`,
    };
    setEmergencyContacts((prev) => [newContact, ...prev]);
    showToast(`Added emergency contact: ${contact.name}`, 'success');
  };

  const updateEmergencyContactRemote = async (id: string, contact: Partial<EmergencyContact>): Promise<boolean> => {
    if (authToken) {
      try {
        const res = await fetch(`/api/contacts/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(contact),
        });
        const data = await res.json();
        if (res.ok && data.success && data.contact) {
          setEmergencyContacts((prev) => prev.map((c) => (c.id === id ? data.contact : c)));
          showToast('Emergency contact updated', 'success');
          return true;
        }
      } catch (e) {
        console.warn('Update contact error:', e);
      }
    }
    setEmergencyContacts((prev) => prev.map((c) => (c.id === id ? { ...c, ...contact } : c)));
    showToast('Emergency contact updated', 'success');
    return true;
  };

  const removeEmergencyContact = async (id: string) => {
    if (authToken) {
      try {
        await fetch(`/api/contacts/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${authToken}` },
        });
      } catch {
        // ignore
      }
    }
    setEmergencyContacts((prev) => prev.filter((c) => c.id !== id));
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
      showToast(exists ? 'Word removed from saved dictionary' : 'Word bookmarked to your dictionary', 'info');
      return next;
    });
  };

  const addConversationMessage = (msg: Omit<ConversationMessage, 'id' | 'timestamp'>) => {
    const newMsg: ConversationMessage = {
      ...msg,
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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
    const newRecord = {
      id: `rec-${Date.now()}`,
      type,
      source,
      target,
      signLanguage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setTranslationHistory((prev) => [newRecord, ...prev.slice(0, 49)]);
  };

  const clearTranslationHistory = () => {
    setTranslationHistory([]);
    localStorage.removeItem('signbridge_history');
    showToast('Translation history cleared', 'info');
  };

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) {
      showToast('Speech synthesis not supported in this browser.', 'error');
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = preferences.speechRate;
      utterance.pitch = preferences.speechPitch;
      utterance.volume = preferences.speechVolume;
      utterance.lang = preferences.preferredSpokenLanguage;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('Speech synthesis error:', err);
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentPage,
        setCurrentPage,
        user,
        authToken,
        registerAccount,
        loginWithCredentials,
        login,
        logout,
        updateUserProfileData,
        deleteUserAccount,
        preferences,
        updatePreferences,
        emergencyContacts,
        refreshContacts,
        addEmergencyContact,
        updateEmergencyContactRemote,
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
