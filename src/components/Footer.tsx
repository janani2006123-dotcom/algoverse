import React from 'react';
import { useApp } from '../context/AppContext';
import { Shield, Heart, Eye } from 'lucide-react';

export const Footer: React.FC = () => {
  const { setCurrentPage } = useApp();

  return (
    <footer className="w-full bg-slate-900 text-slate-400 border-t border-slate-800 text-xs py-10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-800">
          {/* Brand Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                S
              </div>
              <span className="text-base font-bold text-white tracking-tight">SignBridge</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Empowering communication between Deaf, hard-of-hearing, and hearing communities through accessible sign recognition, real-time voice translation, and educational technology.
            </p>
            <div className="flex items-center gap-2 text-slate-500">
              <Eye className="w-3.5 h-3.5 text-indigo-400" />
              <span>WCAG 2.1 AA Compliant</span>
            </div>
          </div>

          {/* Core Tools */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Communication Tools</h4>
            <ul className="space-y-2">
              <li>
                <button
                  type="button"
                  onClick={() => setCurrentPage('sign-to-voice')}
                  className="hover:text-white transition-colors"
                >
                  Sign to Voice Translator
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setCurrentPage('voice-to-sign')}
                  className="hover:text-white transition-colors"
                >
                  Voice to Sign Translator
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setCurrentPage('live')}
                  className="hover:text-white transition-colors"
                >
                  Two-Way Live Session
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setCurrentPage('sos')}
                  className="hover:text-rose-400 transition-colors flex items-center gap-1.5"
                >
                  <span>Emergency SOS Support</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Education & Resources */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Learn & Resources</h4>
            <ul className="space-y-2">
              <li>
                <button
                  type="button"
                  onClick={() => setCurrentPage('learn')}
                  className="hover:text-white transition-colors"
                >
                  Sign Language Lessons & Quizzes
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setCurrentPage('dictionary')}
                  className="hover:text-white transition-colors"
                >
                  Sign Dictionary (ASL, ISL, BSL)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setCurrentPage('history')}
                  className="hover:text-white transition-colors"
                >
                  Translation History & Export
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setCurrentPage('accessibility')}
                  className="hover:text-white transition-colors"
                >
                  Accessibility & Display Settings
                </button>
              </li>
            </ul>
          </div>

          {/* Platform Standards */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Responsible Design</h4>
            <p className="text-slate-400 text-xs leading-relaxed mb-3">
              Sign languages have rich, independent grammar systems. SignBridge distinguishes demonstrated vocabulary from fully trained spatial grammar models to promote respectful learning.
            </p>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Camera & mic data processed locally or ephemeral</span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} SignBridge. Designed with accessibility and human inclusion.
          </div>
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => setCurrentPage('about')} className="hover:text-slate-300">
              About & Mission
            </button>
            <span>·</span>
            <button type="button" onClick={() => setCurrentPage('accessibility')} className="hover:text-slate-300">
              Accessibility Statement
            </button>
            <span>·</span>
            <span className="flex items-center gap-1 text-slate-400">
              Built with <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> for the community
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
