/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

import { HomePage } from './pages/HomePage';
import { SignToVoicePage } from './pages/SignToVoicePage';
import { VoiceToSignPage } from './pages/VoiceToSignPage';
import { LiveCommunicationPage } from './pages/LiveCommunicationPage';
import { SosPage } from './pages/SosPage';
import { LearnPage } from './pages/LearnPage';
import { DictionaryPage } from './pages/DictionaryPage';
import { HistoryPage } from './pages/HistoryPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { AccessibilityPage } from './pages/AccessibilityPage';
import { AboutPage } from './pages/AboutPage';
import { AuthPage } from './pages/AuthPage';

import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const AppContent: React.FC = () => {
  const { currentPage, toast } = useApp();

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'sign-to-voice':
        return <SignToVoicePage />;
      case 'voice-to-sign':
        return <VoiceToSignPage />;
      case 'live':
        return <LiveCommunicationPage />;
      case 'sos':
        return <SosPage />;
      case 'learn':
        return <LearnPage />;
      case 'dictionary':
        return <DictionaryPage />;
      case 'history':
        return <HistoryPage />;
      case 'dashboard':
        return <DashboardPage />;
      case 'profile':
        return <ProfilePage />;
      case 'accessibility':
        return <AccessibilityPage />;
      case 'about':
        return <AboutPage />;
      case 'auth':
        return <AuthPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Accessible Skip to Content Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-xl focus:shadow-lg focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Top Bar Navigation */}
      <Navbar />

      {/* Main Content Viewport */}
      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        {renderCurrentPage()}
      </main>

      {/* Global Toast Alert */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-lg border text-xs font-medium max-w-sm ${
              toast.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800'
                : toast.type === 'error'
                ? 'bg-rose-50 dark:bg-rose-950 text-rose-900 dark:text-rose-200 border-rose-300 dark:border-rose-800'
                : 'bg-slate-900 text-white border-slate-700 dark:bg-white dark:text-slate-900'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-indigo-400 shrink-0" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Universal Footer */}
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
