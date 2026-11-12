import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  User,
  Mail,
  Shield,
  Phone,
  Calendar,
  Key,
  Trash2,
  Save,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  Users,
  History,
  ShieldAlert,
  ArrowRight,
  Sliders,
  MapPin,
  MessageSquare,
} from 'lucide-react';
import { UserAccount, UserProfile } from '../types';

export const ProfilePage: React.FC = () => {
  const {
    user,
    authToken,
    logout,
    updateUserProfileData,
    deleteUserAccount,
    emergencyContacts,
    setCurrentPage,
    showToast,
  } = useApp();

  const [accountDetails, setAccountDetails] = useState<UserAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [fullName, setFullName] = useState(user?.name || '');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState<UserProfile['role']>(user?.role || 'both');
  const [autoAttachLocation, setAutoAttachLocation] = useState(true);
  const [customDiscloseNote, setCustomDiscloseNote] = useState('');

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const guideAvatar = '/src/assets/images/signbridge_interpreter_avatar_1794470891825.jpg';

  // Fetch full account info from backend
  useEffect(() => {
    let isMounted = true;
    const fetchMe = async () => {
      if (!authToken) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success && data.user) {
            setAccountDetails(data.user);
            setFullName(data.user.fullName || '');
            setPhoneNumber(data.user.phoneNumber || '');
            setRole(data.user.role || 'both');
            if (data.user.emergencyPreferences) {
              setAutoAttachLocation(
                data.user.emergencyPreferences.autoAttachLocation ?? true
              );
              setCustomDiscloseNote(
                data.user.emergencyPreferences.customDiscloseNote ?? ''
              );
            }
          }
        }
      } catch (err) {
        console.warn('Failed to fetch full user account:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMe();
    return () => {
      isMounted = false;
    };
  }, [authToken]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken) {
      showToast('Please sign in to update your profile.', 'error');
      return;
    }
    setSaving(true);
    const res = await updateUserProfileData({
      fullName,
      phoneNumber,
      role,
      emergencyPreferences: {
        autoAttachLocation,
        customDiscloseNote,
      },
    });
    setSaving(false);
    if (res.success) {
      if (accountDetails) {
        setAccountDetails({
          ...accountDetails,
          fullName,
          phoneNumber,
          role,
          emergencyPreferences: {
            ...accountDetails.emergencyPreferences,
            autoAttachLocation,
            customDiscloseNote,
          },
        });
      }
    } else {
      showToast(res.error || 'Failed to update profile', 'error');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') {
      showToast('Please type DELETE to confirm account removal.', 'error');
      return;
    }
    setIsDeleting(true);
    const res = await deleteUserAccount();
    setIsDeleting(false);
    if (res.success) {
      setShowDeleteModal(false);
      setCurrentPage('home');
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      {/* Profile Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-indigo-500/30 shrink-0 shadow-xs">
            <img
              src={accountDetails?.avatarUrl || guideAvatar}
              alt="Profile avatar"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {accountDetails?.fullName || user?.name || 'SignBridge Member'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {accountDetails?.email || user?.email || 'guest@signbridge.local'}
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                <Shield className="w-3 h-3" />
                <span className="capitalize">{role}</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                <Key className="w-3 h-3 text-slate-400" />
                <span>UID: {accountDetails?.uid || user?.id || 'guest-001'}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {authToken ? (
            <button
              type="button"
              onClick={() => {
                logout();
                setCurrentPage('auth');
              }}
              className="px-4 py-2 text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl hover:bg-rose-100 transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCurrentPage('auth')}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1.5"
            >
              <User className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>

      {/* Account Details & Metadata Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
            <Key className="w-3.5 h-3.5 text-indigo-500" />
            <span>Unique ID (UID)</span>
          </div>
          <p className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 truncate">
            {accountDetails?.uid || user?.id || 'guest-001'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
            <Phone className="w-3.5 h-3.5 text-emerald-500" />
            <span>Registered Phone</span>
          </div>
          <p className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
            {accountDetails?.phoneNumber || phoneNumber || 'Not configured'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
            <Calendar className="w-3.5 h-3.5 text-amber-500" />
            <span>Account Created</span>
          </div>
          <p className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
            {accountDetails?.createdAt
              ? new Date(accountDetails.createdAt).toLocaleDateString()
              : 'Active'}
          </p>
        </div>
      </div>

      {/* Quick Jump Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setCurrentPage('emergency-contacts')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 transition-colors flex items-center justify-between text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Emergency Contacts ({emergencyContacts.length})
              </div>
              <p className="text-[11px] text-slate-500">Add, edit, and organize trusted distress contacts</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </button>

        <button
          type="button"
          onClick={() => setCurrentPage('sos-history')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 transition-colors flex items-center justify-between text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                SOS Delivery History
              </div>
              <p className="text-[11px] text-slate-500">View sent logs, delivery receipts, and GPS coordinates</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Profile & Emergency Settings Form */}
      <form
        onSubmit={handleSaveProfile}
        className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6"
      >
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-500" />
            <span>Profile & Emergency Preferences</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Update your communication role, personal details, and default SOS dispatch preferences.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Registered Phone Number (E.164)
            </label>
            <input
              type="tel"
              required
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+15551234567"
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Primary Role in Communication
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500"
            >
              <option value="both">Both (Signer & Speaker) – Full Access</option>
              <option value="signer">Deaf / Hard-of-Hearing (Signer)</option>
              <option value="speaker">Hearing (Speech Communicator)</option>
              <option value="learner">Student / Sign Language Learner</option>
            </select>
          </div>

          <div className="sm:col-span-2 space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Emergency SOS Defaults
            </h3>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={autoAttachLocation}
                onChange={(e) => setAutoAttachLocation(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                  Automatically attach high-precision GPS telemetry
                </span>
                <span className="text-[11px] text-slate-500">
                  Includes Google Maps coordinates link in WhatsApp SOS dispatch when permission is granted.
                </span>
              </div>
            </label>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Custom Emergency Disclosure Note (Optional)
              </label>
              <input
                type="text"
                value={customDiscloseNote}
                onChange={(e) => setCustomDiscloseNote(e.target.value)}
                placeholder="e.g. I am Deaf and communicate via Sign Language / text only."
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
          </button>
        </div>
      </form>

      {/* Danger Zone: Account Deletion (Phase 8: Right to be Forgotten) */}
      <div className="p-6 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
          <AlertTriangle className="w-4 h-4" />
          <span>Danger Zone: Account Deletion</span>
        </div>
        <p className="text-xs text-rose-800 dark:text-rose-300">
          In compliance with the "Right to be Forgotten", deleting your account immediately cascades and permanently deletes your user profile, active sessions, saved emergency contacts, and private SOS event history. This operation is non-reversible.
        </p>
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 text-xs font-bold text-rose-700 dark:text-rose-200 bg-rose-100 dark:bg-rose-900/40 hover:bg-rose-200 border border-rose-300 dark:border-rose-800 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Account & Cascaded Records</span>
          </button>
        </div>
      </div>

      {/* Account Deletion Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-rose-300 dark:border-rose-800 shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Delete SignBridge Account?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                This will purge your credentials, emergency contacts, and SOS dispatch logs. To confirm, type <strong className="text-rose-600 dark:text-rose-400">DELETE</strong> below.
              </p>
            </div>

            <div>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText.trim().toUpperCase() !== 'DELETE' || isDeleting}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-40 rounded-xl transition-colors"
              >
                {isDeleting ? 'Deleting...' : 'Permanently Delete Everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
