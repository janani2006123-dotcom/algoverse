import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  User,
  Mail,
  Shield,
  Phone,
  Plus,
  Trash2,
  Award,
  LogOut,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { UserProfile } from '../types';

export const ProfilePage: React.FC = () => {
  const {
    user,
    logout,
    emergencyContacts,
    addEmergencyContact,
    removeEmergencyContact,
    setCurrentPage,
    showToast,
  } = useApp();

  const [name, setName] = useState(user?.name || 'Alex Rivera');
  const [role, setRole] = useState<UserProfile['role']>(user?.role || 'both');
  const [showAddContact, setShowAddContact] = useState(false);
  const [cName, setCName] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cRelation, setCRelation] = useState('');

  const guideAvatar = '/src/assets/images/signbridge_interpreter_avatar_1794470891825.jpg';

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Profile information saved', 'success');
  };

  const handleAddContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName || !cPhone) return;
    addEmergencyContact({
      name: cName,
      phone: cPhone,
      relation: cRelation || 'Family',
      notifySms: true,
      notifyCall: true,
    });
    setCName('');
    setCPhone('');
    setCRelation('');
    setShowAddContact(false);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      {/* Profile Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-indigo-500/30 shrink-0 shadow-xs">
            <img
              src={guideAvatar}
              alt="Profile avatar"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {user ? user.name : 'SignBridge User'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {user ? user.email : 'alex@example.com'}
            </p>
            <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Shield className="w-3.5 h-3.5" />
              <span className="capitalize">{user?.role || 'Both (Signer & Speaker)'}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            logout();
            setCurrentPage('home');
          }}
          className="px-4 py-2 text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl hover:bg-rose-100 transition-colors flex items-center gap-1.5"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Account Settings Form */}
      <form onSubmit={handleSaveProfile} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Profile Preferences
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Display Name
            </label>
            <input
              type="text"
              id="profile-display-name"
              name="profileDisplayName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Primary Role in Communication
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            >
              <option value="both">Both (Signer & Speaker)</option>
              <option value="signer">Deaf / Hard-of-Hearing (Signer)</option>
              <option value="speaker">Hearing (Speech Communicator)</option>
              <option value="learner">Student / Sign Language Learner</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs"
          >
            Save Changes
          </button>
        </div>
      </form>

      {/* Emergency Contacts Manager */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Emergency Contacts
            </h2>
            <p className="text-xs text-slate-500">
              Notified immediately during an SOS broadcast with your GPS coordinates.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddContact(true)}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Contact</span>
          </button>
        </div>

        <div className="space-y-2">
          {emergencyContacts.map((c) => (
            <div
              key={c.id}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-semibold text-slate-900 dark:text-white block">
                  {c.name}
                </span>
                <span className="text-slate-500">
                  {c.phone} · {c.relation}
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeEmergencyContact(c.id)}
                className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                title="Remove Contact"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Add Contact Modal */}
      {showAddContact && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAddContactSubmit}
            className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 space-y-4"
          >
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Add Emergency Contact
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={cName}
                  onChange={(e) => setCName(e.target.value)}
                  placeholder="e.g. Maria Johnson"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={cPhone}
                  onChange={(e) => setCPhone(e.target.value)}
                  placeholder="e.g. +1 (555) 345-6789"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Relationship
                </label>
                <input
                  type="text"
                  value={cRelation}
                  onChange={(e) => setCRelation(e.target.value)}
                  placeholder="e.g. Sibling, Spouse, Friend, Doctor"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddContact(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
              >
                Save Contact
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
