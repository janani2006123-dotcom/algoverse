import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Users,
  Plus,
  Trash2,
  Edit2,
  Star,
  ShieldCheck,
  Phone,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Lock,
} from 'lucide-react';
import { EmergencyContact } from '../types';

export const EmergencyContactsPage: React.FC = () => {
  const {
    user,
    authToken,
    emergencyContacts,
    addEmergencyContact,
    updateEmergencyContactRemote,
    removeEmergencyContact,
    setCurrentPage,
    showToast,
  } = useApp();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relation, setRelation] = useState('Family');
  const [isPreferred, setIsPreferred] = useState(false);
  const [notificationConsent, setNotificationConsent] = useState(true);

  if (!authToken || !user) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Authentication Required</h2>
        <p className="text-xs text-slate-500">
          Emergency contacts are strictly protected and isolated by user account. Please sign in to manage your contacts.
        </p>
        <button
          type="button"
          onClick={() => setCurrentPage('auth')}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700"
        >
          Sign In or Register
        </button>
      </div>
    );
  }

  const handleOpenAdd = () => {
    setEditingContact(null);
    setName('');
    setPhone('');
    setRelation('Family');
    setIsPreferred(emergencyContacts.length === 0);
    setNotificationConsent(true);
    setShowAddModal(true);
  };

  const handleOpenEdit = (contact: EmergencyContact) => {
    setEditingContact(contact);
    setName(contact.name);
    setPhone(contact.phone);
    setRelation(contact.relation);
    setIsPreferred(Boolean(contact.isPreferred));
    setNotificationConsent(contact.notificationConsent !== false);
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      showToast('Name and phone number are required', 'error');
      return;
    }

    if (editingContact) {
      await updateEmergencyContactRemote(editingContact.id, {
        name,
        phone,
        relation,
        isPreferred,
        notificationConsent,
      });
    } else {
      await addEmergencyContact({
        name,
        phone,
        relation,
        notifySms: true,
        notifyCall: true,
        isPreferred,
        notificationConsent,
      });
    }
    setShowAddModal(false);
  };

  const handleTogglePreferred = async (contact: EmergencyContact) => {
    await updateEmergencyContactRemote(contact.id, {
      isPreferred: !contact.isPreferred,
    });
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>Multi-User Isolated Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Emergency Contacts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Registered recipients for your personal WhatsApp SOS broadcasts. Isolated strictly to your account UID.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Emergency Contact</span>
        </button>
      </div>

      {/* Security Privacy Notice */}
      <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-950 dark:text-indigo-200 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold">Zero-Trust Contact Isolation (Phase 4 & 7):</span>
          <p className="text-[11px] opacity-80 leading-relaxed">
            Contacts belong exclusively to <strong>{user.email}</strong>. When you dispatch an SOS, messages are transmitted only to your checked contacts with recorded consent. No other SignBridge user can access or view this list.
          </p>
        </div>
      </div>

      {/* Contacts List Grid */}
      {emergencyContacts.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Phone className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">No Emergency Contacts Registered</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Add at least one verified contact with international WhatsApp phone format (e.g. +1... or +91...) to enable priority SOS alerts.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700"
          >
            Add Your First Contact
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {emergencyContacts.map((contact) => (
            <div
              key={contact.id}
              className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all flex flex-col justify-between gap-4 ${
                contact.isPreferred
                  ? 'border-indigo-500/60 shadow-xs ring-1 ring-indigo-500/20'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{contact.name}</h3>
                      {contact.isPreferred && (
                        <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] flex items-center gap-1">
                          <Star className="w-3 h-3 fill-indigo-500" />
                          <span>Primary</span>
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">{contact.relation}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleTogglePreferred(contact)}
                    className={`p-1.5 rounded-lg border transition-colors ${
                      contact.isPreferred
                        ? 'text-amber-500 border-amber-300 bg-amber-50 dark:bg-amber-950/40'
                        : 'text-slate-400 border-slate-200 dark:border-slate-700 hover:text-amber-500'
                    }`}
                    title={contact.isPreferred ? 'Primary Contact' : 'Mark as Primary Contact'}
                  >
                    <Star className={`w-3.5 h-3.5 ${contact.isPreferred ? 'fill-amber-400' : ''}`} />
                  </button>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-mono">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{contact.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>
                      {contact.notificationConsent !== false
                        ? 'WhatsApp Emergency Consent: Recorded'
                        : 'WhatsApp Consent: Paused'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <a
                  href={`tel:${contact.phone.replace(/[\s\-\(\)]/g, '')}`}
                  className="text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 font-medium"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Call Directly</span>
                </a>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(contact)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    title="Edit Contact"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeEmergencyContact(contact.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 transition-colors"
                    title="Delete Contact"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmit}
            className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 space-y-4 animate-in fade-in zoom-in-95"
          >
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {editingContact ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
            </h3>
            <p className="text-xs text-slate-500">
              Provide recipient phone with country code (e.g. +1 for US, +91 for India) for Meta WhatsApp delivery.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sarah Rivera"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  WhatsApp Phone Number (with Country Code)
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 555 019 2834 or +91 98765 43210"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Relationship
                </label>
                <input
                  type="text"
                  value={relation}
                  onChange={(e) => setRelation(e.target.value)}
                  placeholder="e.g. Spouse, Parent, Physician, Neighbor"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={isPreferred}
                    onChange={(e) => setIsPreferred(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Mark as Preferred Primary Contact</span>
                </label>

                <label className="flex items-start gap-2 cursor-pointer text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={notificationConsent}
                    onChange={(e) => setNotificationConsent(e.target.checked)}
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Record user authorization to transmit urgent WhatsApp emergency alerts to this contact.</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
              >
                {editingContact ? 'Save Changes' : 'Add Contact'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
