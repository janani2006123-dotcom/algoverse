import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Phone,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  HelpCircle,
} from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { registerAccount, loginWithCredentials, setCurrentPage, showToast } = useApp();

  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Common Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Registration Specific Fields
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState<'both' | 'signer' | 'speaker' | 'learner'>('both');
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Forgot password modal
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  // Password strength calculation
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: 'None', color: 'bg-slate-200' };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 8) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[A-Z]/.test(pwd) || /[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-rose-500' };
    if (score <= 2) return { score: 2, label: 'Fair', color: 'bg-amber-500' };
    if (score <= 3) return { score: 3, label: 'Good', color: 'bg-indigo-500' };
    return { score: 4, label: 'Strong', color: 'bg-emerald-500' };
  };

  const pwdStrength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (isRegister) {
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match. Please verify your password confirmation.');
        return;
      }
      if (!acceptTerms) {
        setErrorMessage('Please accept the Terms of Service and Privacy Policy to create an account.');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters long.');
        return;
      }

      setLoading(true);
      const res = await registerAccount({
        fullName,
        email,
        password,
        confirmPassword,
        phoneNumber,
        role,
        acceptTerms,
      });
      setLoading(false);

      if (res.success) {
        setCurrentPage('dashboard');
      } else {
        setErrorMessage(res.error || 'Failed to create account.');
      }
    } else {
      setLoading(true);
      const res = await loginWithCredentials(email, password, rememberMe);
      setLoading(false);

      if (res.success) {
        setCurrentPage('dashboard');
      } else {
        setErrorMessage(res.error || 'Invalid email or password.');
      }
    }
  };

  const handleQuickTestAccount = async (testEmail: string, testName: string, testPhone: string, testRole: any) => {
    setLoading(true);
    setErrorMessage(null);
    // Attempt login with standard test password
    const loginRes = await loginWithCredentials(testEmail, 'SignBridge2026!');
    if (loginRes.success) {
      setLoading(false);
      setCurrentPage('dashboard');
      return;
    }

    // Auto-create test account if it doesn't exist yet
    const regRes = await registerAccount({
      fullName: testName,
      email: testEmail,
      password: 'SignBridge2026!',
      confirmPassword: 'SignBridge2026!',
      phoneNumber: testPhone,
      role: testRole,
      acceptTerms: true,
    });
    setLoading(false);

    if (regRes.success) {
      setCurrentPage('dashboard');
    } else {
      setErrorMessage(regRes.error || 'Could not access test account.');
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      setForgotSubmitted(true);
    } catch {
      setForgotSubmitted(true);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white font-bold text-xl mx-auto flex items-center justify-center shadow-xs">
          S
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {isRegister ? 'Create Your SignBridge Account' : 'Welcome to SignBridge'}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Secure multi-user sign language translation, personal emergency contacts & verified SOS messaging.
        </p>
      </div>

      {/* Main Authentication Card */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        {/* Tab Toggle */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setErrorMessage(null);
            }}
            className={`py-2 rounded-xl transition-all ${
              !isRegister
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setErrorMessage(null);
            }}
            className={`py-2 rounded-xl transition-all ${
              isRegister
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-900 dark:text-rose-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="font-medium">{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Registration Fields */}
          {isRegister && (
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Email Address */}
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Registration Phone Number with Country Code */}
          {isRegister && (
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Phone Number (with Country Code) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 555 019 2834 or +91 98765 43210"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Used to verify emergency sender identity in WhatsApp distress alerts.
              </p>
            </div>
          )}

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Password <span className="text-rose-500">*</span>
              </label>
              {!isRegister && (
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setForgotSubmitted(false);
                    setShowForgotPassword(true);
                  }}
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Real-time Password Strength Meter */}
            {isRegister && password && (
              <div className="space-y-1.5 pt-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Password strength:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{pwdStrength.label}</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${pwdStrength.color}`}
                    style={{ width: `${(pwdStrength.score / 4) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          {isRegister && (
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Confirm Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-[11px] text-rose-500 mt-1">Passwords do not match.</p>
              )}
            </div>
          )}

          {/* Role Selection */}
          {isRegister && (
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Primary Communication Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="both">Both (Signer & Voice Speaker)</option>
                <option value="signer">Deaf / Hard-of-Hearing (Sign Language User)</option>
                <option value="speaker">Hearing Speaker</option>
                <option value="learner">Student / Sign Learner</option>
              </select>
            </div>
          )}

          {/* Login "Remember me" option */}
          {!isRegister && (
            <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>Remember session on this device</span>
            </label>
          )}

          {/* Registration Terms & Privacy */}
          {isRegister && (
            <label className="flex items-start gap-2 cursor-pointer text-slate-600 dark:text-slate-400 pt-1">
              <input
                type="checkbox"
                required
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>
                I accept the <strong className="text-slate-900 dark:text-white">Terms of Service</strong> and{' '}
                <strong className="text-slate-900 dark:text-white">Privacy Policy</strong>, including authorized emergency WhatsApp dispatch.
              </span>
            </label>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-xs flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{isRegister ? 'Creating Account...' : 'Signing In...'}</span>
              </>
            ) : (
              <>
                <span>{isRegister ? 'Create Account' : 'Sign In to Dashboard'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* PHASE 11: 1-Click Multi-User Test Accounts */}
      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Multi-User Test Accounts (Phase 11)</span>
          </span>
          <span className="text-slate-400 text-[11px]">Instant Switcher</span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Switch between User A and User B to test isolated emergency contacts, independent SOS records, and strict data isolation.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {/* User A */}
          <button
            type="button"
            onClick={() => handleQuickTestAccount('user.a@signbridge.test', 'User A (Alex)', '+15550192834', 'signer')}
            className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 text-left transition-colors flex items-center justify-between"
          >
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">User A: Alex</span>
              <span className="text-[11px] text-slate-500">Deaf Signer Account</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          </button>

          {/* User B */}
          <button
            type="button"
            onClick={() => handleQuickTestAccount('user.b@signbridge.test', 'User B (Jordan)', '+15550192999', 'speaker')}
            className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 text-left transition-colors flex items-center justify-between"
          >
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">User B: Jordan</span>
              <span className="text-[11px] text-slate-500">Hearing Voice Account</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          </button>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
              <span>Password Recovery</span>
            </h3>

            {forgotSubmitted ? (
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 space-y-2">
                <p className="font-semibold">Reset instructions sent!</p>
                <p className="text-[11px]">
                  If an account exists for <strong>{forgotEmail}</strong>, password reset instructions have been dispatched.
                </p>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="mt-2 px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-3 text-xs">
                <p className="text-slate-500">
                  Enter your registered email address and we'll send you instructions to securely reset your password.
                </p>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="px-3.5 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700"
                  >
                    Send Reset Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
