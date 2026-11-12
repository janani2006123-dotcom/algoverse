import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  User,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { login, setCurrentPage, showToast } = useApp();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'both' | 'signer' | 'speaker' | 'learner'>('both');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      showToast('Please enter an email address', 'error');
      return;
    }
    login(email, name || email.split('@')[0], role);
    setCurrentPage('dashboard');
  };

  const handleDemoLogin = (demoEmail: string, demoName: string, demoRole: any) => {
    login(demoEmail, demoName, demoRole);
    setCurrentPage('dashboard');
  };

  return (
    <div className="max-w-md mx-auto py-8 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white font-bold text-xl mx-auto flex items-center justify-center shadow-xs">
          S
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {isRegister ? 'Create your SignBridge Account' : 'Welcome to SignBridge'}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Sign language translation, live conversation rooms, and accessible learning.
        </p>
      </div>

      {/* Main Auth Form Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {isRegister && (
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Your Primary Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="both">Both (Signer & Speaker)</option>
                <option value="signer">Deaf / Hard-of-Hearing (Signer)</option>
                <option value="speaker">Hearing Speaker</option>
                <option value="learner">Student / Sign Learner</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs flex items-center justify-center gap-1.5"
          >
            <span>{isRegister ? 'Create Account' : 'Sign In to Dashboard'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs pt-1">
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
          >
            {isRegister
              ? 'Already have an account? Sign in here'
              : "Don't have an account? Create one now"}
          </button>
        </div>
      </div>

      {/* 1-Click Instant Demo Persona Logins */}
      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            1-Click Demo Profiles
          </span>
          <span className="text-slate-400">Instant Access</span>
        </div>

        <div className="grid grid-cols-1 gap-2 text-xs">
          <button
            type="button"
            onClick={() => handleDemoLogin('alex.signer@example.com', 'Alex Rivera', 'signer')}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 text-left transition-colors flex items-center justify-between"
          >
            <div>
              <span className="font-semibold text-slate-900 dark:text-white block">Alex Rivera</span>
              <span className="text-slate-500">Deaf Signer (ASL & ISL)</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={() => handleDemoLogin('jordan.speaker@example.com', 'Jordan Lee', 'speaker')}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 text-left transition-colors flex items-center justify-between"
          >
            <div>
              <span className="font-semibold text-slate-900 dark:text-white block">Jordan Lee</span>
              <span className="text-slate-500">Hearing Family Member (Voice Communicator)</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={() => handleDemoLogin('elena.learner@example.com', 'Elena Ramos', 'learner')}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 text-left transition-colors flex items-center justify-between"
          >
            <div>
              <span className="font-semibold text-slate-900 dark:text-white block">Elena Ramos</span>
              <span className="text-slate-500">Sign Language Student (Practicing BSL & ASL)</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>
    </div>
  );
};
