import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Sun,
  Moon,
  Menu,
  X,
  User as UserIcon,
  AlertTriangle,
  Settings,
  Languages,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { currentPage, setCurrentPage, preferences, updatePreferences, user } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleTheme = () => {
    updatePreferences({ theme: preferences.theme === 'dark' ? 'light' : 'dark' });
  };

  const navLinks = [
    { id: 'sign-to-voice', label: 'Sign to Voice' },
    { id: 'voice-to-sign', label: 'Voice to Sign' },
    { id: 'live', label: 'Two-Way Live' },
    { id: 'learn', label: 'Learn' },
    { id: 'dictionary', label: 'Dictionary' },
  ];

  const handleNavClick = (pageId: string) => {
    setCurrentPage(pageId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single Brand Title */}
          <button
            type="button"
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg p-1"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white font-bold shadow-xs">
              <span className="text-lg">S</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0">
              SignBridge
            </span>
          </button>

          {/* Zone 2: 4-5 Concise Single-Line Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
            {navLinks.map((link) => {
              const isActive = currentPage === link.id;
              return (
                <button
                  type="button"
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                    isActive
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold'
                      : 'border-transparent text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary Action + Utility Controls */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Red SOS Quick Trigger Button */}
            <button
              type="button"
              onClick={() => handleNavClick('sos')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0 focus-visible:ring-2 focus-visible:ring-rose-400"
              title="Emergency SOS Support"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>SOS</span>
            </button>

            {/* Receiver Siren Monitor Link (For Caregiver / Receiver Device) */}
            <a
              href="/?receiver=true"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 rounded-lg hover:bg-rose-100 transition-colors whitespace-nowrap shrink-0"
              title="Open Receiver Emergency Alarm Screen"
            >
              <span>🚨 Receiver Monitor</span>
            </a>

            {/* Language Selector */}
            <button
              type="button"
              onClick={() => handleNavClick('accessibility')}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Accessibility & Language Preferences"
              aria-label="Accessibility settings"
            >
              <Languages className="w-4 h-4" />
            </button>

            {/* Light / Dark Theme Switch */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={`Switch to ${preferences.theme === 'dark' ? 'Light' : 'Dark'} mode`}
              aria-label="Toggle theme"
            >
              {preferences.theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {/* User Dashboard / Auth Trigger */}
            <button
              type="button"
              onClick={() => handleNavClick(user ? 'dashboard' : 'auth')}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>{user ? user.name.split(' ')[0] : 'Sign In'}</span>
            </button>

            {/* Mobile menu hamburger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => (
            <button
              type="button"
              key={link.id}
              onClick={() => handleNavClick(link.id)}
              className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {link.label}
            </button>
          ))}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-1">
            <button
              type="button"
              onClick={() => handleNavClick('history')}
              className="w-full text-left px-3 py-2 rounded-md text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Translation History
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('about')}
              className="w-full text-left px-3 py-2 rounded-md text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              About Us
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('accessibility')}
              className="w-full text-left px-3 py-2 rounded-md text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between"
            >
              <span>Accessibility Settings</span>
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
