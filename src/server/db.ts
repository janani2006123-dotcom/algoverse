import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import {
  UserAccount,
  EmergencyContact,
  SosEventRecord,
  SosRecipientRecord,
  WhatsAppSosRecord,
  WhatsAppDeliveryStatus,
} from '../types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const SQLITE_DB_FILE = path.join(DATA_DIR, 'emergency_messages.db');
const JSON_BACKUP_FILE = path.join(DATA_DIR, 'multi_user_store.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create data directory:', err);
  }
}

// Password hashing & verification helpers
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const derived = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(derived, 'hex'));
  } catch {
    return false;
  }
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// In-memory fallback stores
const userStore = new Map<string, any>();
const sessionStore = new Map<string, { uid: string; expiresAt: string }>();
const contactStore = new Map<string, EmergencyContact>();
const eventStore = new Map<string, SosEventRecord>();
const recipientStore = new Map<string, SosRecipientRecord>();
const legacyMessageStore = new Map<string, WhatsAppSosRecord>();

// Initialize SQLite database instance
let sqliteDb: any = null;
try {
  const { DatabaseSync } = (await import('node:sqlite')) as any;
  sqliteDb = new DatabaseSync(SQLITE_DB_FILE);

  // Schema creation
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      uid TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      full_name TEXT NOT NULL,
      phone_number TEXT NOT NULL,
      role TEXT DEFAULT 'both',
      created_at TEXT NOT NULL,
      avatar_url TEXT,
      emergency_preferences TEXT
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      uid TEXT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS emergency_contacts (
      contact_id TEXT PRIMARY KEY,
      uid TEXT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      relation TEXT NOT NULL,
      is_preferred INTEGER DEFAULT 0,
      notification_consent INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_contact_uid ON emergency_contacts(uid);

    CREATE TABLE IF NOT EXISTS sos_events (
      event_id TEXT PRIMARY KEY,
      uid TEXT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
      emergency_reference_id TEXT NOT NULL,
      message TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      location_address TEXT,
      user_consent INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      overall_status TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_event_uid ON sos_events(uid);

    CREATE TABLE IF NOT EXISTS sos_recipients (
      recipient_id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL REFERENCES sos_events(event_id) ON DELETE CASCADE,
      uid TEXT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
      contact_id TEXT,
      recipient_name TEXT NOT NULL,
      recipient_phone TEXT NOT NULL,
      wamid TEXT UNIQUE,
      delivery_status TEXT NOT NULL,
      error_information TEXT,
      sent_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      webhook_history TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_rcp_wamid ON sos_recipients(wamid);
    CREATE INDEX IF NOT EXISTS idx_rcp_event ON sos_recipients(event_id);
    CREATE INDEX IF NOT EXISTS idx_rcp_uid ON sos_recipients(uid);

    CREATE TABLE IF NOT EXISTS emergency_messages (
      internal_message_id TEXT PRIMARY KEY,
      emergency_reference_id TEXT NOT NULL,
      recipient_phone TEXT NOT NULL,
      recipient_name TEXT,
      message_content TEXT NOT NULL,
      wamid TEXT UNIQUE,
      sending_timestamp TEXT NOT NULL,
      current_delivery_status TEXT NOT NULL,
      error_information TEXT,
      latest_status_update_timestamp TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      user_consent INTEGER NOT NULL,
      webhook_history TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_wamid ON emergency_messages(wamid);
  `);

  console.log('[Database] Native SQLite multi-user tables initialized at:', SQLITE_DB_FILE);
} catch (err: any) {
  console.warn('[Database] SQLite native initialization deferred, using memory/JSON store:', err?.message || err);
}

// Backup sync helper
function persistJsonBackup() {
  try {
    const dump = {
      users: Array.from(userStore.values()),
      contacts: Array.from(contactStore.values()),
      events: Array.from(eventStore.values()),
      recipients: Array.from(recipientStore.values()),
      legacyMessages: Array.from(legacyMessageStore.values()),
    };
    fs.writeFileSync(JSON_BACKUP_FILE, JSON.stringify(dump, null, 2), 'utf-8');
  } catch (e) {
    // ignore non-critical backup error
  }
}

// Load initial data from SQLite to memory cache
function loadInitialData() {
  if (!sqliteDb) return;
  try {
    const userRows = sqliteDb.prepare('SELECT * FROM users').all();
    for (const r of userRows) {
      userStore.set(r.uid, {
        uid: r.uid,
        email: r.email,
        passwordHash: r.password_hash,
        passwordSalt: r.password_salt,
        fullName: r.full_name,
        phoneNumber: r.phone_number,
        role: r.role,
        createdAt: r.created_at,
        avatarUrl: r.avatar_url,
        emergencyPreferences: r.emergency_preferences ? JSON.parse(r.emergency_preferences) : {},
      });
    }

    const contactRows = sqliteDb.prepare('SELECT * FROM emergency_contacts').all();
    for (const r of contactRows) {
      contactStore.set(r.contact_id, {
        id: r.contact_id,
        uid: r.uid,
        name: r.name,
        phone: r.phone,
        relation: r.relation,
        notifySms: true,
        notifyCall: true,
        isPreferred: Boolean(r.is_preferred),
        notificationConsent: Boolean(r.notification_consent),
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      });
    }

    const eventRows = sqliteDb.prepare('SELECT * FROM sos_events').all();
    for (const r of eventRows) {
      eventStore.set(r.event_id, {
        eventId: r.event_id,
        uid: r.uid,
        emergencyReferenceId: r.emergency_reference_id,
        message: r.message,
        latitude: r.latitude,
        longitude: r.longitude,
        locationAddress: r.location_address,
        userConsent: Boolean(r.user_consent),
        createdAt: r.created_at,
        overallStatus: r.overall_status,
        recipients: [],
      });
    }

    const recipientRows = sqliteDb.prepare('SELECT * FROM sos_recipients').all();
    for (const r of recipientRows) {
      const rec: SosRecipientRecord = {
        recipientId: r.recipient_id,
        eventId: r.event_id,
        uid: r.uid,
        contactId: r.contact_id,
        recipientName: r.recipient_name,
        recipientPhone: r.recipient_phone,
        wamid: r.wamid,
        deliveryStatus: r.delivery_status,
        errorInformation: r.error_information,
        sentAt: r.sent_at,
        updatedAt: r.updated_at,
        webhookHistory: r.webhook_history ? JSON.parse(r.webhook_history) : [],
      };
      recipientStore.set(r.recipient_id, rec);
      const ev = eventStore.get(r.event_id);
      if (ev) ev.recipients.push(rec);
    }

    const msgRows = sqliteDb.prepare('SELECT * FROM emergency_messages').all();
    for (const row of msgRows) {
      legacyMessageStore.set(row.internal_message_id, {
        internalMessageId: row.internal_message_id,
        emergencyReferenceId: row.emergency_reference_id,
        recipientPhone: row.recipient_phone,
        recipientName: row.recipient_name || undefined,
        messageContent: row.message_content,
        wamid: row.wamid || null,
        sendingTimestamp: row.sending_timestamp,
        currentDeliveryStatus: row.current_delivery_status as WhatsAppDeliveryStatus,
        errorInformation: row.error_information || null,
        latestStatusUpdateTimestamp: row.latest_status_update_timestamp,
        latitude: row.latitude !== null ? row.latitude : null,
        longitude: row.longitude !== null ? row.longitude : null,
        userConsent: Boolean(row.user_consent),
        webhookHistory: row.webhook_history ? JSON.parse(row.webhook_history) : [],
      });
    }
  } catch (e) {
    console.warn('[Database] Initial data sync note:', e);
  }
}

loadInitialData();

export const emergencyDb = {
  // ==========================================
  // PHASE 1, 2, 3: USER ACCOUNT MANAGEMENT
  // ==========================================

  createUser(data: {
    uid: string;
    email: string;
    password: string;
    fullName: string;
    phoneNumber: string;
    role?: 'signer' | 'speaker' | 'both' | 'learner';
    avatarUrl?: string;
  }): UserAccount {
    const { hash, salt } = hashPassword(data.password);
    const createdAt = new Date().toISOString();
    const role = data.role || 'both';

    const account: UserAccount = {
      uid: data.uid,
      email: data.email.toLowerCase().trim(),
      fullName: data.fullName.trim(),
      phoneNumber: data.phoneNumber.trim(),
      role,
      createdAt,
      avatarUrl: data.avatarUrl || '/src/assets/images/signbridge_interpreter_avatar_1794470891825.jpg',
      emergencyPreferences: {
        notifySms: true,
        notifyCall: true,
        autoAttachLocation: true,
      },
    };

    userStore.set(account.uid, {
      ...account,
      passwordHash: hash,
      passwordSalt: salt,
    });

    if (sqliteDb) {
      try {
        const stmt = sqliteDb.prepare(`
          INSERT INTO users (uid, email, password_hash, password_salt, full_name, phone_number, role, created_at, avatar_url, emergency_preferences)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
          account.uid,
          account.email,
          hash,
          salt,
          account.fullName,
          account.phoneNumber,
          account.role,
          account.createdAt,
          account.avatarUrl || null,
          JSON.stringify(account.emergencyPreferences)
        );
      } catch (err) {
        console.error('[Database] Failed to insert user:', err);
      }
    }

    persistJsonBackup();
    return account;
  },

  getUserByEmail(email: string): (UserAccount & { passwordHash: string; passwordSalt: string }) | null {
    const clean = email.toLowerCase().trim();
    for (const u of userStore.values()) {
      if (u.email === clean) return u;
    }
    if (sqliteDb) {
      try {
        const stmt = sqliteDb.prepare('SELECT * FROM users WHERE email = ?');
        const row = stmt.get(clean);
        if (row) {
          return {
            uid: row.uid,
            email: row.email,
            passwordHash: row.password_hash,
            passwordSalt: row.password_salt,
            fullName: row.full_name,
            phoneNumber: row.phone_number,
            role: row.role,
            createdAt: row.created_at,
            avatarUrl: row.avatar_url,
            emergencyPreferences: row.emergency_preferences ? JSON.parse(row.emergency_preferences) : {},
          };
        }
      } catch (e) {
        // ignore
      }
    }
    return null;
  },

  getUserByUid(uid: string): UserAccount | null {
    const u = userStore.get(uid);
    if (u) {
      const { passwordHash, passwordSalt, ...safeUser } = u;
      return safeUser;
    }
    if (sqliteDb) {
      try {
        const stmt = sqliteDb.prepare('SELECT * FROM users WHERE uid = ?');
        const row = stmt.get(uid);
        if (row) {
          return {
            uid: row.uid,
            email: row.email,
            fullName: row.full_name,
            phoneNumber: row.phone_number,
            role: row.role,
            createdAt: row.created_at,
            avatarUrl: row.avatar_url,
            emergencyPreferences: row.emergency_preferences ? JSON.parse(row.emergency_preferences) : {},
          };
        }
      } catch (e) {
        // ignore
      }
    }
    return null;
  },

  updateUserProfile(
    uid: string,
    updates: Partial<Pick<UserAccount, 'fullName' | 'phoneNumber' | 'role' | 'avatarUrl' | 'emergencyPreferences'>>
  ): UserAccount | null {
    const existing = userStore.get(uid);
    if (!existing) return null;

    if (updates.fullName) existing.fullName = updates.fullName.trim();
    if (updates.phoneNumber) existing.phoneNumber = updates.phoneNumber.trim();
    if (updates.role) existing.role = updates.role;
    if (updates.avatarUrl) existing.avatarUrl = updates.avatarUrl;
    if (updates.emergencyPreferences) {
      existing.emergencyPreferences = {
        ...existing.emergencyPreferences,
        ...updates.emergencyPreferences,
      };
    }

    if (sqliteDb) {
      try {
        const stmt = sqliteDb.prepare(`
          UPDATE users SET
            full_name = ?,
            phone_number = ?,
            role = ?,
            avatar_url = ?,
            emergency_preferences = ?
          WHERE uid = ?
        `);
        stmt.run(
          existing.fullName,
          existing.phoneNumber,
          existing.role,
          existing.avatarUrl || null,
          JSON.stringify(existing.emergencyPreferences || {}),
          uid
        );
      } catch (e) {
        console.error('[Database] Failed to update user profile in SQLite:', e);
      }
    }

    persistJsonBackup();
    const { passwordHash, passwordSalt, ...safeUser } = existing;
    return safeUser;
  },

  deleteUser(uid: string): boolean {
    userStore.delete(uid);

    // Cascade delete user's sessions, contacts, events, recipients
    for (const [t, s] of sessionStore.entries()) {
      if (s.uid === uid) sessionStore.delete(t);
    }
    for (const [cid, c] of contactStore.entries()) {
      if (c.uid === uid) contactStore.delete(cid);
    }
    for (const [eid, ev] of eventStore.entries()) {
      if (ev.uid === uid) eventStore.delete(eid);
    }
    for (const [rid, r] of recipientStore.entries()) {
      if (r.uid === uid) recipientStore.delete(rid);
    }

    if (sqliteDb) {
      try {
        sqliteDb.prepare('DELETE FROM users WHERE uid = ?').run(uid);
        sqliteDb.prepare('DELETE FROM sessions WHERE uid = ?').run(uid);
        sqliteDb.prepare('DELETE FROM emergency_contacts WHERE uid = ?').run(uid);
        sqliteDb.prepare('DELETE FROM sos_events WHERE uid = ?').run(uid);
        sqliteDb.prepare('DELETE FROM sos_recipients WHERE uid = ?').run(uid);
      } catch (e) {
        console.error('[Database] Cascade delete error in SQLite:', e);
      }
    }

    persistJsonBackup();
    return true;
  },

  // ==========================================
  // SESSIONS / AUTH TOKEN MANAGEMENT
  // ==========================================

  createSession(uid: string): string {
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
    sessionStore.set(token, { uid, expiresAt });

    if (sqliteDb) {
      try {
        const stmt = sqliteDb.prepare('INSERT INTO sessions (token, uid, created_at, expires_at) VALUES (?, ?, ?, ?)');
        stmt.run(token, uid, new Date().toISOString(), expiresAt);
      } catch (e) {
        console.error('[Database] Session insert error:', e);
      }
    }

    return token;
  },

  getUserBySessionToken(token: string): UserAccount | null {
    if (!token) return null;
    let uid: string | null = null;
    const inMem = sessionStore.get(token);
    if (inMem && new Date(inMem.expiresAt).getTime() > Date.now()) {
      uid = inMem.uid;
    } else if (sqliteDb) {
      try {
        const stmt = sqliteDb.prepare('SELECT uid, expires_at FROM sessions WHERE token = ?');
        const row = stmt.get(token);
        if (row && new Date(row.expires_at).getTime() > Date.now()) {
          uid = row.uid;
          sessionStore.set(token, { uid: row.uid, expiresAt: row.expires_at });
        }
      } catch (e) {
        // ignore
      }
    }

    if (uid) return this.getUserByUid(uid);
    return null;
  },

  deleteSession(token: string): void {
    sessionStore.delete(token);
    if (sqliteDb) {
      try {
        sqliteDb.prepare('DELETE FROM sessions WHERE token = ?').run(token);
      } catch (e) {
        // ignore
      }
    }
  },

  // ==========================================
  // PHASE 4: EMERGENCY CONTACT MANAGEMENT (ISOLATED BY UID)
  // ==========================================

  getContactsByUid(uid: string): EmergencyContact[] {
    const list: EmergencyContact[] = [];
    for (const c of contactStore.values()) {
      if (c.uid === uid) list.push(c);
    }
    list.sort((a, b) => (b.isPreferred ? 1 : 0) - (a.isPreferred ? 1 : 0));
    return list;
  },

  createContact(uid: string, data: {
    name: string;
    phone: string;
    relation: string;
    isPreferred?: boolean;
    notificationConsent?: boolean;
  }): EmergencyContact {
    const id = `cnt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const contact: EmergencyContact = {
      id,
      uid,
      name: data.name.trim(),
      phone: data.phone.trim(),
      relation: data.relation.trim() || 'Emergency Contact',
      notifySms: true,
      notifyCall: true,
      isPreferred: Boolean(data.isPreferred),
      notificationConsent: data.notificationConsent !== false,
      createdAt: now,
      updatedAt: now,
    };

    contactStore.set(id, contact);

    if (sqliteDb) {
      try {
        const stmt = sqliteDb.prepare(`
          INSERT INTO emergency_contacts (contact_id, uid, name, phone, relation, is_preferred, notification_consent, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
          contact.id,
          contact.uid!,
          contact.name,
          contact.phone,
          contact.relation,
          contact.isPreferred ? 1 : 0,
          contact.notificationConsent ? 1 : 0,
          contact.createdAt!,
          contact.updatedAt!
        );
      } catch (e) {
        console.error('[Database] Failed to insert contact in SQLite:', e);
      }
    }

    persistJsonBackup();
    return contact;
  },

  updateContact(contactId: string, uid: string, updates: Partial<EmergencyContact>): EmergencyContact | null {
    const existing = contactStore.get(contactId);
    if (!existing || existing.uid !== uid) return null;

    if (updates.name) existing.name = updates.name.trim();
    if (updates.phone) existing.phone = updates.phone.trim();
    if (updates.relation) existing.relation = updates.relation.trim();
    if (updates.isPreferred !== undefined) existing.isPreferred = Boolean(updates.isPreferred);
    if (updates.notificationConsent !== undefined) existing.notificationConsent = Boolean(updates.notificationConsent);
    existing.updatedAt = new Date().toISOString();

    if (sqliteDb) {
      try {
        const stmt = sqliteDb.prepare(`
          UPDATE emergency_contacts SET
            name = ?,
            phone = ?,
            relation = ?,
            is_preferred = ?,
            notification_consent = ?,
            updated_at = ?
          WHERE contact_id = ? AND uid = ?
        `);
        stmt.run(
          existing.name,
          existing.phone,
          existing.relation,
          existing.isPreferred ? 1 : 0,
          existing.notificationConsent ? 1 : 0,
          existing.updatedAt,
          contactId,
          uid
        );
      } catch (e) {
        console.error('[Database] Failed to update contact:', e);
      }
    }

    persistJsonBackup();
    return existing;
  },

  deleteContact(contactId: string, uid: string): boolean {
    const existing = contactStore.get(contactId);
    if (!existing || existing.uid !== uid) return false;

    contactStore.delete(contactId);

    if (sqliteDb) {
      try {
        sqliteDb.prepare('DELETE FROM emergency_contacts WHERE contact_id = ? AND uid = ?').run(contactId, uid);
      } catch (e) {
        console.error('[Database] Delete contact error:', e);
      }
    }

    persistJsonBackup();
    return true;
  },

  // ==========================================
  // PHASE 5, 6, 7: MULTI-RECIPIENT SOS EVENTS & RECIPIENTS
  // ==========================================

  createSosEvent(
    eventData: {
      uid: string;
      emergencyReferenceId: string;
      message: string;
      latitude?: number | null;
      longitude?: number | null;
      locationAddress?: string | null;
      userConsent: boolean;
    },
    recipientsList: Array<{
      contactId?: string;
      recipientName: string;
      recipientPhone: string;
      wamid?: string | null;
      status: WhatsAppDeliveryStatus;
      error?: string | null;
    }>
  ): SosEventRecord {
    const eventId = `sos_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const recipients: SosRecipientRecord[] = recipientsList.map((r) => {
      const recipientId = `rcp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      return {
        recipientId,
        eventId,
        uid: eventData.uid,
        contactId: r.contactId,
        recipientName: r.recipientName,
        recipientPhone: r.recipientPhone,
        wamid: r.wamid || null,
        deliveryStatus: r.status,
        errorInformation: r.error || null,
        sentAt: now,
        updatedAt: now,
        webhookHistory: [],
      };
    });

    const anySent = recipients.some((r) => r.deliveryStatus === 'SENT' || r.deliveryStatus === 'DELIVERED');
    const allFailed = recipients.length > 0 && recipients.every((r) => r.deliveryStatus === 'FAILED');
    const overallStatus: WhatsAppDeliveryStatus = allFailed ? 'FAILED' : anySent ? 'SENT' : 'SENDING';

    const eventRecord: SosEventRecord = {
      eventId,
      uid: eventData.uid,
      emergencyReferenceId: eventData.emergencyReferenceId,
      message: eventData.message,
      latitude: eventData.latitude ?? null,
      longitude: eventData.longitude ?? null,
      locationAddress: eventData.locationAddress || null,
      userConsent: eventData.userConsent,
      createdAt: now,
      overallStatus,
      recipients,
    };

    eventStore.set(eventId, eventRecord);
    for (const r of recipients) {
      recipientStore.set(r.recipientId, r);
    }

    if (sqliteDb) {
      try {
        const eventStmt = sqliteDb.prepare(`
          INSERT INTO sos_events (event_id, uid, emergency_reference_id, message, latitude, longitude, location_address, user_consent, created_at, overall_status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        eventStmt.run(
          eventId,
          eventData.uid,
          eventData.emergencyReferenceId,
          eventData.message,
          eventData.latitude ?? null,
          eventData.longitude ?? null,
          eventData.locationAddress || null,
          eventData.userConsent ? 1 : 0,
          now,
          overallStatus
        );

        const rcpStmt = sqliteDb.prepare(`
          INSERT INTO sos_recipients (recipient_id, event_id, uid, contact_id, recipient_name, recipient_phone, wamid, delivery_status, error_information, sent_at, updated_at, webhook_history)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const r of recipients) {
          rcpStmt.run(
            r.recipientId,
            eventId,
            eventData.uid,
            r.contactId || null,
            r.recipientName,
            r.recipientPhone,
            r.wamid || null,
            r.deliveryStatus,
            r.errorInformation || null,
            r.sentAt,
            r.updatedAt,
            JSON.stringify(r.webhookHistory || [])
          );
        }
      } catch (e) {
        console.error('[Database] Failed to insert SOS event and recipients into SQLite:', e);
      }
    }

    persistJsonBackup();
    return eventRecord;
  },

  getSosEventsByUid(uid: string): SosEventRecord[] {
    const list: SosEventRecord[] = [];
    for (const ev of eventStore.values()) {
      if (ev.uid === uid) {
        list.push(ev);
      }
    }
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  },

  getSosEventById(eventId: string, uid?: string): SosEventRecord | null {
    const ev = eventStore.get(eventId);
    if (!ev) return null;
    if (uid && ev.uid !== uid) return null; // Phase 7 & 8: Strict authorization check!
    return ev;
  },

  getSosRecipientByWamid(wamid: string): SosRecipientRecord | null {
    if (!wamid) return null;
    for (const r of recipientStore.values()) {
      if (r.wamid === wamid) return r;
    }
    return null;
  },

  updateSosRecipientStatusByWamid(
    wamid: string,
    newStatus: WhatsAppDeliveryStatus,
    errorInfo?: string | null,
    rawWebhook?: any
  ): { recipient: SosRecipientRecord; event: SosEventRecord } | null {
    const rcp = this.getSosRecipientByWamid(wamid);
    if (!rcp) return null;

    rcp.deliveryStatus = newStatus;
    rcp.updatedAt = new Date().toISOString();
    if (errorInfo) rcp.errorInformation = errorInfo;
    if (!rcp.webhookHistory) rcp.webhookHistory = [];
    rcp.webhookHistory.push({
      status: newStatus,
      timestamp: rcp.updatedAt,
      raw: rawWebhook,
    });

    // Update recipient in SQLite
    if (sqliteDb) {
      try {
        sqliteDb.prepare(`
          UPDATE sos_recipients SET
            delivery_status = ?,
            error_information = ?,
            updated_at = ?,
            webhook_history = ?
          WHERE recipient_id = ?
        `).run(
          rcp.deliveryStatus,
          rcp.errorInformation || null,
          rcp.updatedAt,
          JSON.stringify(rcp.webhookHistory),
          rcp.recipientId
        );
      } catch (e) {
        console.error('[Database] Failed to update recipient status in SQLite:', e);
      }
    }

    // Update parent event overall status
    const ev = eventStore.get(rcp.eventId);
    if (ev) {
      const anyDelivered = ev.recipients.some((r) => r.deliveryStatus === 'DELIVERED' || r.deliveryStatus === 'READ');
      const allRead = ev.recipients.every((r) => r.deliveryStatus === 'READ');
      const allFailed = ev.recipients.every((r) => r.deliveryStatus === 'FAILED');

      if (allRead) ev.overallStatus = 'READ';
      else if (anyDelivered) ev.overallStatus = 'DELIVERED';
      else if (allFailed) ev.overallStatus = 'FAILED';

      if (sqliteDb) {
        try {
          sqliteDb.prepare('UPDATE sos_events SET overall_status = ? WHERE event_id = ?').run(ev.overallStatus, ev.eventId);
        } catch (e) {
          // ignore
        }
      }
    }

    persistJsonBackup();
    return { recipient: rcp, event: ev! };
  },

  // ==========================================
  // LEGACY COMPATIBILITY METHODS
  // ==========================================

  saveMessage(record: WhatsAppSosRecord): WhatsAppSosRecord {
    legacyMessageStore.set(record.internalMessageId, record);
    if (sqliteDb) {
      try {
        const stmt = sqliteDb.prepare(`
          INSERT INTO emergency_messages (
            internal_message_id, emergency_reference_id, recipient_phone, recipient_name,
            message_content, wamid, sending_timestamp, current_delivery_status,
            error_information, latest_status_update_timestamp, latitude, longitude,
            user_consent, webhook_history
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(internal_message_id) DO UPDATE SET
            wamid = excluded.wamid,
            current_delivery_status = excluded.current_delivery_status,
            error_information = excluded.error_information,
            latest_status_update_timestamp = excluded.latest_status_update_timestamp,
            webhook_history = excluded.webhook_history
        `);

        stmt.run(
          record.internalMessageId,
          record.emergencyReferenceId,
          record.recipientPhone,
          record.recipientName || null,
          record.messageContent,
          record.wamid || null,
          record.sendingTimestamp,
          record.currentDeliveryStatus,
          record.errorInformation || null,
          record.latestStatusUpdateTimestamp,
          record.latitude ?? null,
          record.longitude ?? null,
          record.userConsent ? 1 : 0,
          JSON.stringify(record.webhookHistory || [])
        );
      } catch (err) {
        // ignore
      }
    }
    persistJsonBackup();
    return record;
  },

  getMessageByInternalId(internalId: string): WhatsAppSosRecord | null {
    return legacyMessageStore.get(internalId) || null;
  },

  getMessageByRefId(refId: string): WhatsAppSosRecord | null {
    for (const r of legacyMessageStore.values()) {
      if (r.emergencyReferenceId === refId) return r;
    }
    return null;
  },

  getMessageByWamid(wamid: string): WhatsAppSosRecord | null {
    if (!wamid) return null;
    for (const r of legacyMessageStore.values()) {
      if (r.wamid === wamid) return r;
    }
    return null;
  },

  updateDeliveryStatus(
    wamid: string,
    newStatus: WhatsAppDeliveryStatus,
    errorInfo?: string | null,
    rawWebhook?: any
  ): WhatsAppSosRecord | null {
    // Also try multi-recipient store update
    this.updateSosRecipientStatusByWamid(wamid, newStatus, errorInfo, rawWebhook);

    const record = this.getMessageByWamid(wamid);
    if (!record) return null;

    if (record.currentDeliveryStatus === 'READ' && (newStatus === 'DELIVERED' || newStatus === 'SENT')) {
      return record;
    }
    if (record.currentDeliveryStatus === 'DELIVERED' && newStatus === 'SENT') {
      return record;
    }

    record.currentDeliveryStatus = newStatus;
    record.latestStatusUpdateTimestamp = new Date().toISOString();
    if (errorInfo) record.errorInformation = errorInfo;
    if (!record.webhookHistory) record.webhookHistory = [];
    record.webhookHistory.push({
      status: newStatus,
      timestamp: record.latestStatusUpdateTimestamp,
      raw: rawWebhook,
    });

    return this.saveMessage(record);
  },

  updateStatusById(
    internalId: string,
    newStatus: WhatsAppDeliveryStatus,
    errorInfo?: string | null,
    wamid?: string | null
  ): WhatsAppSosRecord | null {
    const record = this.getMessageByInternalId(internalId);
    if (!record) return null;

    record.currentDeliveryStatus = newStatus;
    record.latestStatusUpdateTimestamp = new Date().toISOString();
    if (wamid) record.wamid = wamid;
    if (errorInfo !== undefined) record.errorInformation = errorInfo;

    return this.saveMessage(record);
  },

  getAllMessages(limit: number = 50): WhatsAppSosRecord[] {
    const list = Array.from(legacyMessageStore.values());
    list.sort((a, b) => new Date(b.sendingTimestamp).getTime() - new Date(a.sendingTimestamp).getTime());
    return list.slice(0, limit);
  },
};
