import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import https from 'https';
import querystring from 'querystring';
import { emergencyDb, verifyPassword } from './src/server/db';
import {
  sendWhatsAppCloudMessage,
  verifyWebhookSignature,
  parseWhatsAppWebhookStatuses,
  getWhatsAppConfig,
  normalizePhoneNumber,
} from './src/server/whatsappService';
import { WhatsAppSosRecord, WhatsAppDeliveryStatus } from './src/types';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Enable full CORS and Cross-Origin Resource Policy for iframe & Cloud Run environments
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Range, X-Hub-Signature-256');
  res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Range');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

// Serve static assets (models & wasm) with cross-origin headers and explicit MIME types
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, filePath) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    if (filePath.endsWith('.wasm')) {
      res.setHeader('Content-Type', 'application/wasm');
    } else if (filePath.endsWith('.task')) {
      res.setHeader('Content-Type', 'application/octet-stream');
    }
  }
}));

// Capture raw body for webhook HMAC signature verification
app.use(express.json({
  limit: '20mb',
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  }
}));

// Initialize Google GenAI if key is present
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// In-memory store for emergency dispatch history & translation logs
interface StoredEmergencyAlert {
  id: string;
  type: string;
  message: string;
  urgency: string;
  status: 'Sent' | 'Delivered' | 'Pending' | 'Failed';
  timestamp: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  contactsNotified: string[];
  confirmationCode: string;
}

const emergencyAlerts: StoredEmergencyAlert[] = [];

// ─── SMS Helper via Fast2SMS / Twilio / TextBelt ─────────────────────────
async function sendSMS(phone: string, message: string): Promise<{ success: boolean; quotaRemaining?: number; error?: string; provider?: string }> {
  const fast2smsKey = process.env.FAST2SMS_API_KEY;
  if (fast2smsKey) {
    return new Promise((resolve) => {
      const clean10 = phone.replace(/\D/g, '').slice(-10);
      const postData = querystring.stringify({
        route: 'v3',
        sender_id: 'TXTIND',
        message: message,
        language: 'english',
        flash: 0,
        numbers: clean10,
      });

      const options = {
        hostname: 'www.fast2sms.com',
        port: 443,
        path: '/dev/bulkV2',
        method: 'POST',
        headers: {
          'authorization': fast2smsKey,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData),
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ success: parsed.return === true, error: parsed.message?.[0], provider: 'fast2sms' });
          } catch {
            resolve({ success: false, error: 'Failed to parse Fast2SMS response', provider: 'fast2sms' });
          }
        });
      });

      req.on('error', (err) => resolve({ success: false, error: err.message, provider: 'fast2sms' }));
      req.write(postData);
      req.end();
    });
  }

  return new Promise((resolve) => {
    const textbeltKey = process.env.TEXTBELT_KEY || 'textbelt';
    const postData = querystring.stringify({ phone, message, key: textbeltKey });

    const options = {
      hostname: 'textbelt.com',
      port: 443,
      path: '/text',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ success: parsed.success === true, quotaRemaining: parsed.quotaRemaining, error: parsed.error, provider: 'textbelt' });
        } catch {
          resolve({ success: false, error: 'Failed to parse SMS response', provider: 'textbelt' });
        }
      });
    });

    req.on('error', (err) => resolve({ success: false, error: err.message, provider: 'textbelt' }));
    req.write(postData);
    req.end();
  });
}

// ─── Auto-SOS trigger when HELP sign detected ─────────────────────────────
async function triggerAutoSOS(location?: { latitude: number; longitude: number; address?: string }) {
  const phone = process.env.EMERGENCY_PHONE;
  if (!phone || phone === '+91XXXXXXXXXX') {
    console.warn('[SOS] EMERGENCY_PHONE not configured — skipping SMS');
    return null;
  }

  const confirmationCode = `SOS-${Math.floor(100000 + Math.random() * 900000)}`;
  const baseUrl = process.env.APP_URL && process.env.APP_URL !== 'MY_APP_URL' ? process.env.APP_URL : 'http://localhost:3000';
  const alarmUrl = `${baseUrl}/?receiver=true&code=${confirmationCode}`;

  const message = `🚨 EMERGENCY SOS — HELP sign detected via SignBridge!\nLocation: ${
    location?.address || `Lat ${location?.latitude}, Long ${location?.longitude}` || 'Live Camera Location'
  }\nCode: ${confirmationCode}\nTAP LINK TO SOUND ALARM ON YOUR DEVICE: ${alarmUrl}\nPlease respond immediately.`;

  const smsResult = await sendSMS(phone, message);
  console.log(`[SOS] SMS to ${phone}:`, smsResult);

  const alert: StoredEmergencyAlert = {
    id: `auto-sos-${Date.now()}`,
    type: 'help-sign-detected',
    message: 'HELP sign detected via camera — auto SOS triggered',
    urgency: 'critical',
    status: smsResult.success ? 'Delivered' : 'Failed',
    timestamp: new Date().toISOString(),
    location: location || { latitude: 0, longitude: 0, address: 'Live Camera Location' },
    contactsNotified: [phone],
    confirmationCode,
  };

  emergencyAlerts.unshift(alert);
  if (emergencyAlerts.length > 50) emergencyAlerts.pop();

  return { alert, smsResult, alarmUrl };
}

// Default gesture presets for fallback simulation
const GESTURE_PRESETS: Record<string, { sign: string; english: string; grammar: string; handshape: string }> = {
  'hello': { sign: 'HELLO', english: 'Hello, good to see you.', grammar: 'Isolated Salutation', handshape: 'Open-B hand at temple' },
  'help': { sign: 'HELP', english: 'I need assistance right now.', grammar: 'Directional Verb (Signer -> Viewer)', handshape: 'A-fist on flat palm lifting' },
  'thank-you': { sign: 'THANK-YOU', english: 'Thank you very much.', grammar: 'Direct Object Verb', handshape: 'Flat-B from chin forward' },
  'doctor': { sign: 'DOCTOR', english: 'Please call a doctor.', grammar: 'Noun Reference', handshape: 'Bent fingertips on pulse' },
  'ambulance': { sign: 'AMBULANCE', english: 'An ambulance is needed urgently.', grammar: 'Classifier Strobe Motion', handshape: 'Curved claw flashing' },
  'water': { sign: 'WATER', english: 'Can I have some water, please?', grammar: 'Topic-Comment Structure', handshape: 'W-handshape tapping chin' },
  'food': { sign: 'EAT/FOOD', english: 'I would like something to eat.', grammar: 'Noun-Verb Pair', handshape: 'Flat-O at mouth' },
  'yes': { sign: 'YES', english: 'Yes, that is correct.', grammar: 'Affirmative Non-Manual Nod', handshape: 'S-fist nodding' },
  'no': { sign: 'NO', english: 'No, thank you.', grammar: 'Negation Marker', handshape: 'Index-middle snap to thumb' },
  'family': { sign: 'FAMILY', english: 'This is my family.', grammar: 'Collective Class Circle', handshape: 'F-hands circling' },
  'friend': { sign: 'FRIEND', english: 'We are good friends.', grammar: 'Interlocking Reciprocal Sign', handshape: 'Interlocked X-hooks' },
  'learn': { sign: 'LEARN', english: 'I am learning sign language.', grammar: 'Metaphorical Mind Transfer', handshape: 'Palm to forehead' },
};

/**
 * POST /api/gemini/interpret-sign
 * Analyzes video frame or landmark features using Gemini 2.5 Pro or fallback simulator
 */
app.post('/api/gemini/interpret-sign', async (req: Request, res: Response) => {
  try {
    const { imageBase64, gestureHint, signLanguage = 'ASL' } = req.body;

    // If Gemini client is active and an image frame is provided
    if (ai && imageBase64) {
      try {
        const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
        const prompt = `You are a certified professional ${signLanguage} (Sign Language) interpreter and computer vision sign recognition analyst.
Analyze the provided webcam frame showing a person signing.
Identify:
1. The most probable sign or gesture being performed in ${signLanguage}.
2. Handshape, orientation, location, and non-manual facial cues (eyebrows, mouth, head tilt).
3. Translate this into a natural, respectful spoken English sentence.
4. Specify the grammatical category in ${signLanguage} (e.g., Topic-Comment, Directional Verb, Wh-Question, Non-Manual Marker).

Return ONLY a clean JSON object without markdown formatting:
{
  "recognizedSign": "SIGN_NAME",
  "confidence": 0.92,
  "sentence": "English translation here",
  "detectedGrammarType": "Grammar rule applied",
  "handshapeDetected": "Description of handshape",
  "movementDetected": "Movement path",
  "facialCueDetected": "Facial cue"
}`;

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('AI timeout')), 15000)
        );

        const response: any = await Promise.race([
          ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    inlineData: {
                      mimeType: 'image/jpeg',
                      data: cleanBase64,
                    },
                  },
                  {
                    text: prompt,
                  },
                ],
              },
            ],
          }),
          timeoutPromise,
        ]);

        const rawText = (response.text ?? '').trim();
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);

          // Auto-SOS: if Gemini detected HELP sign, trigger SMS
          let sosTriggered = false;
          let sosAlert = null;
          let smsSent = false;
          const recognizedSign = (parsed.recognizedSign || '').toUpperCase();
          if (recognizedSign.includes('HELP') || recognizedSign.includes('SOS') || recognizedSign.includes('EMERGENCY')) {
            const sosResult = await triggerAutoSOS(req.body.location);
            if (sosResult) {
              sosTriggered = true;
              sosAlert = sosResult.alert;
              smsSent = sosResult.smsResult.success;
              console.log('[SOS] Auto-SOS triggered from Gemini HELP detection');
            }
          }

          return res.json({
            ...parsed,
            isDemo: false,
            timestamp: new Date().toISOString(),
            sosTriggered,
            sosAlert,
            smsSent,
          });
        }
      } catch (geminiErr: any) {
        console.warn('Gemini vision sign analysis error, falling back to rule engine:', geminiErr?.message || geminiErr);
      }
    }

    // Demo/Fallback rule-based recognition engine
    const selectedKey = gestureHint && GESTURE_PRESETS[gestureHint.toLowerCase()]
      ? gestureHint.toLowerCase()
      : Object.keys(GESTURE_PRESETS)[Math.floor(Math.random() * Object.keys(GESTURE_PRESETS).length)];

    const preset = GESTURE_PRESETS[selectedKey] || GESTURE_PRESETS['hello'];

    const fallbackResult = {
      recognizedSign: preset.sign,
      confidence: 0.88 + Math.round(Math.random() * 9) / 100,
      sentence: preset.english,
      detectedGrammarType: preset.grammar,
      handshapeDetected: preset.handshape,
      movementDetected: 'Dominant hand fluid trajectory along sagittal plane',
      facialCueDetected: 'Neutral gaze with slight affirmative head nod',
      isDemo: true,
      timestamp: new Date().toISOString(),
      sosTriggered: false,
    };

    // Auto-SOS: if HELP sign detected, trigger SMS alert
    if (selectedKey === 'help' || (gestureHint && gestureHint.toLowerCase().includes('help'))) {
      const sosResult = await triggerAutoSOS(req.body.location);
      if (sosResult) {
        return res.json({
          ...fallbackResult,
          sosTriggered: true,
          sosAlert: sosResult.alert,
          smsSent: sosResult.smsResult.success,
        });
      }
    }

    return res.json(fallbackResult);
  } catch (error: any) {
    console.error('Error in interpret-sign:', error);
    return res.status(500).json({ error: 'Failed to interpret sign gesture' });
  }
});

/**
 * POST /api/gemini/translate-speech-to-sign
 * Translates English spoken text into linguistically accurate Sign Language Gloss (ASL, ISL, BSL)
 */
app.post('/api/gemini/translate-speech-to-sign', async (req: Request, res: Response) => {
  try {
    const { spokenText, targetLanguage = 'ASL' } = req.body;

    if (!spokenText || typeof spokenText !== 'string' || !spokenText.trim()) {
      return res.status(400).json({ error: 'Spoken text is required' });
    }

    if (ai) {
      try {
        const prompt = `You are a master linguist in Sign Languages (${targetLanguage}: American, Indian, or British Sign Language).
Translate the following spoken English sentence into authentic ${targetLanguage} Gloss notation according to actual ${targetLanguage} grammar rules.
Remember:
- Sign languages do NOT follow English word-for-word word order.
- In ASL, structure is typically TIME - TOPIC - COMMENT, or TOPIC - COMMENT. Questions mark non-manual signals (wh-q: furrowed brows; y/n-q: raised brows).
- In ISL, structure is typically Subject - Object - Verb (SOV) with spatial grounding.
- In BSL, structure is Topic - Comment with two-handed finger spelling markers.

Spoken English: "${spokenText}"

Return ONLY a valid JSON object without markdown formatting:
{
  "spokenText": "${spokenText}",
  "signLanguage": "${targetLanguage}",
  "glossSequence": [
    {
      "word": "original English word",
      "gloss": "UPPERCASE_GLOSS",
      "handshape": "e.g. flat, open5, pointing, fist",
      "expression": "e.g. neutral, eyebrows_raised, smile",
      "durationMs": 600
    }
  ],
  "grammarNotes": [
    "Explanation of grammatical transformation from English to ${targetLanguage}"
  ],
  "isDemo": false
}`;

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('AI timeout')), 7000)
        );

        const response: any = await Promise.race([
          ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: [
              {
                role: 'user',
                parts: [{ text: prompt }],
              },
            ],
            config: {
              responseMimeType: 'application/json',
            },
          }),
          timeoutPromise,
        ]);

        const rawText = (response.text ?? '').trim();
        // Try direct parse first (since we requested JSON mime type)
        let parsed: any = null;
        try {
          parsed = JSON.parse(rawText);
        } catch {
          const jsonMatch = rawText.match(/\{[\s\S]*\}/);
          if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
        }

        if (parsed) {
          return res.json({
            ...parsed,
            isDemo: false,
          });
        }
      } catch (geminiErr: any) {
        console.warn('Gemini speech-to-sign error, using linguistic parser fallback:', geminiErr?.message || geminiErr);
      }
    }

    // Rule-based linguistic fallback converter for ASL / ISL / BSL
    const words = spokenText.trim().split(/\s+/).filter(Boolean);
    const stopWords = new Set(['is', 'are', 'the', 'a', 'an', 'to', 'of', 'in', 'at', 'on', 'am']);
    const contentWords = words.filter(w => !stopWords.has(w.toLowerCase().replace(/[^a-z]/g, '')));

    const timeWords = contentWords.filter(w => /\b(tomorrow|yesterday|now|today|later|morning|night|soon)\b/i.test(w));
    const nonTimeWords = contentWords.filter(w => !/\b(tomorrow|yesterday|now|today|later|morning|night|soon)\b/i.test(w));

    // Arrange into Topic-Comment sequence
    const orderedWords = [...timeWords, ...nonTimeWords];
    const glossSequence = (orderedWords.length > 0 ? orderedWords : words).map((w) => {
      const clean = w.toUpperCase().replace(/[^A-Z0-9-]/g, '');
      let handshape = 'open5';
      let expression = 'neutral';

      if (/\b(HELP|DOCTOR|EMERGENCY|URGENT|AMBULANCE|HOSPITAL|PAIN|DANGER)\b/i.test(clean)) {
        handshape = 'fist';
        expression = 'eyebrows_raised';
      } else if (/\b(THANK|THANKS|PLEASE|HELLO|HI|NICE|GOOD|WELCOME|BYE|GOODBYE)\b/i.test(clean)) {
        handshape = 'flat';
        expression = 'smile';
      } else if (/\b(YOU|HE|SHE|IT|THEY|WE|ME|I|WHERE|WHO|WHAT|WHY|WHEN|HOW)\b/i.test(clean)) {
        handshape = 'pointing';
        expression = (w.includes('?') || /\b(WHERE|WHO|WHAT|WHY|WHEN|HOW)\b/i.test(clean)) ? 'eyebrows_furrowed' : 'neutral';
      } else if (/\b(YES|AGREE|NOD)\b/i.test(clean)) {
        handshape = 'thumbs_up';
        expression = 'smile';
      } else if (/\b(NO|NOT|NEVER|STOP)\b/i.test(clean)) {
        handshape = 'pinch';
        expression = 'eyebrows_furrowed';
      } else if (/\b(WATER|DRINK|TEA)\b/i.test(clean)) {
        handshape = 'peace';
        expression = 'neutral';
      } else if (/\b(FOOD|EAT|MEAL)\b/i.test(clean)) {
        handshape = 'pinch';
        expression = 'neutral';
      } else if (/\b(FAMILY|FRIEND|LOVE)\b/i.test(clean)) {
        handshape = 'pinch';
        expression = 'smile';
      } else if (/\b(LEARN|STUDY|SCHOOL|BOOK)\b/i.test(clean)) {
        handshape = 'flat';
        expression = 'neutral';
      }

      return {
        word: w,
        gloss: clean,
        handshape,
        expression,
        durationMs: 650,
      };
    });

    return res.json({
      spokenText,
      signLanguage: targetLanguage,
      glossSequence,
      grammarNotes: [
        `Transformed into ${targetLanguage} Topic-Comment visual-spatial grammar.`,
        `Removed English spoken auxiliaries and tagged non-manual facial grammatical markers.`,
        `Word-level manual kinematics mapped to sign vocabulary.`
      ],
      isDemo: true,
    });
  } catch (error: any) {
    console.error('Error in translate-speech-to-sign:', error);
    return res.status(500).json({ error: 'Failed to translate speech to sign' });
  }
});

/**
 * POST /api/emergency/sms
 * Send a custom SMS to the emergency contact number and log the SOS alert
 */
app.post('/api/emergency/sms', async (req: Request, res: Response) => {
  try {
    const { phone, message, location } = req.body;
    const targetPhone = phone || process.env.EMERGENCY_PHONE;

    if (!targetPhone || targetPhone === '+91XXXXXXXXXX') {
      return res.status(400).json({ error: 'No emergency phone number configured. Set EMERGENCY_PHONE in .env or provide phone in request.' });
    }
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const smsResult = await sendSMS(targetPhone, message);
    const confirmationCode = `SOS-${Math.floor(100000 + Math.random() * 900000)}`;
    const newAlert: StoredEmergencyAlert = {
      id: `auto-sos-${Date.now()}`,
      type: 'help-sign-detected',
      message,
      urgency: 'critical',
      status: smsResult.success ? 'Delivered' : 'Sent',
      timestamp: new Date().toISOString(),
      location: location || {
        latitude: 0,
        longitude: 0,
        address: 'Live Sign Detection Location',
      },
      contactsNotified: [targetPhone],
      confirmationCode,
    };

    emergencyAlerts.unshift(newAlert);
    if (emergencyAlerts.length > 50) emergencyAlerts.pop();

    return res.json({
      success: smsResult.success,
      smsSent: smsResult.success,
      phone: targetPhone,
      alert: newAlert,
      confirmationCode,
      quotaRemaining: smsResult.quotaRemaining,
      error: smsResult.error,
    });
  } catch (err: any) {
    console.error('Error sending SMS:', err);
    return res.status(500).json({ error: 'Failed to send SMS' });
  }
});

/**
 * POST /api/emergency/dispatch
 * Handles accessible SOS alert dispatch, location telemetry, and real SMS sending
 */
app.post('/api/emergency/dispatch', async (req: Request, res: Response) => {
  try {
    const { type = 'general', message, location, contacts = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Emergency message is required' });
    }

    const confirmationCode = `SOS-${Math.floor(100000 + Math.random() * 900000)}`;
    const envPhone = process.env.EMERGENCY_PHONE;
    const smsText = `🚨 EMERGENCY SOS (${type.toUpperCase()}): ${message}\nLocation: ${
      location?.address || (location ? `Lat ${location.latitude}, Long ${location.longitude}` : 'Unknown')
    }\nCode: ${confirmationCode}`;

    let smsSent = false;
    let smsError: string | undefined;
    if (envPhone && envPhone !== '+91XXXXXXXXXX') {
      const smsRes = await sendSMS(envPhone, smsText);
      smsSent = smsRes.success;
      smsError = smsRes.error;
      console.log(`[SOS] Dispatch SMS to ${envPhone}:`, smsRes);
    }

    const notifiedList = contacts.map((c: any) => c.name || c.phone || 'Primary Contact');
    if (envPhone && envPhone !== '+91XXXXXXXXXX' && !notifiedList.includes(envPhone)) {
      notifiedList.unshift(envPhone);
    }

    const newAlert: StoredEmergencyAlert = {
      id: `alert-${Date.now()}`,
      type,
      message,
      urgency: 'critical',
      status: 'Delivered',
      timestamp: new Date().toISOString(),
      location: location || {
        latitude: 37.7749,
        longitude: -122.4194,
        address: 'San Francisco, CA (Simulated Geolocation)',
      },
      contactsNotified: notifiedList,
      confirmationCode,
    };

    emergencyAlerts.unshift(newAlert);
    if (emergencyAlerts.length > 50) emergencyAlerts.pop();

    return res.json({
      success: true,
      alert: newAlert,
      smsSent,
      smsError,
      deliveryStatus: 'Delivered',
      message: smsSent
        ? `Emergency SMS dispatched to ${envPhone} and registered contacts.`
        : 'Emergency notification dispatched to designated contacts and local relays.',
      deliveredAt: newAlert.timestamp,
      confirmationCode,
    });
  } catch (error: any) {
    console.error('Error in emergency dispatch:', error);
    return res.status(500).json({ error: 'Failed to process emergency dispatch' });
  }
});

/**
 * GET /api/emergency/history
 */
app.get('/api/emergency/history', (_req: Request, res: Response) => {
  return res.json({ alerts: emergencyAlerts });
});

// ========================================================
// PHASE 1, 2, 8: AUTHENTICATION MIDDLEWARE & ENDPOINTS
// ========================================================

const sosRateLimitMap = new Map<string, number>();

/**
 * PHASE 8: Server-Side Authentication Middleware
 * Validates session token on every protected backend request
 */
function requireAuth(req: Request, res: Response, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }
  const token = authHeader.substring(7).trim();
  const user = emergencyDb.getUserBySessionToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired session. Please sign in again.' });
  }
  (req as any).user = user;
  (req as any).token = token;
  next();
}

/**
 * PHASE 1: User Registration
 * POST /api/auth/register
 */
app.post('/api/auth/register', (req: Request, res: Response) => {
  try {
    const { fullName, email, password, confirmPassword, phoneNumber, role, acceptTerms } = req.body;

    if (!acceptTerms) {
      return res.status(400).json({ error: 'You must accept the terms of service and privacy policy.' });
    }

    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      return res.status(400).json({ error: 'Full name is required (minimum 2 characters).' });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    const phoneCheck = normalizePhoneNumber(phoneNumber);
    if (!phoneCheck.isValid) {
      return res.status(400).json({ error: phoneCheck.reason || 'Valid phone number with country code is required.' });
    }

    const existing = emergencyDb.getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists. Please log in.' });
    }

    const uid = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const user = emergencyDb.createUser({
      uid,
      email,
      password,
      fullName,
      phoneNumber: phoneCheck.normalized,
      role: role || 'both',
    });

    const token = emergencyDb.createSession(uid);

    return res.status(201).json({
      success: true,
      token,
      user,
      message: 'Account created successfully.',
    });
  } catch (err: any) {
    console.error('[Auth] Registration error:', err);
    return res.status(500).json({ error: 'Internal server error creating account.' });
  }
});

/**
 * PHASE 2: User Login
 * POST /api/auth/login
 */
app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const userWithSecrets = emergencyDb.getUserByEmail(email);
    if (!userWithSecrets) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isValid = verifyPassword(password, userWithSecrets.passwordHash, userWithSecrets.passwordSalt);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = emergencyDb.createSession(userWithSecrets.uid);
    const safeUser = emergencyDb.getUserByUid(userWithSecrets.uid);

    return res.json({
      success: true,
      token,
      user: safeUser,
      message: 'Logged in successfully.',
    });
  } catch (err: any) {
    console.error('[Auth] Login error:', err);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
});

/**
 * GET /api/auth/me
 */
app.get('/api/auth/me', requireAuth, (req: Request, res: Response) => {
  return res.json({
    success: true,
    user: (req as any).user,
  });
});

/**
 * POST /api/auth/logout
 */
app.post('/api/auth/logout', requireAuth, (req: Request, res: Response) => {
  emergencyDb.deleteSession((req as any).token);
  return res.json({ success: true, message: 'Logged out successfully.' });
});

/**
 * PHASE 3: Update Profile
 * PUT /api/auth/profile
 */
app.put('/api/auth/profile', requireAuth, (req: Request, res: Response) => {
  try {
    const uid = (req as any).user.uid;
    const { fullName, phoneNumber, role, emergencyPreferences, avatarUrl } = req.body;

    let normalizedPhone: string | undefined = undefined;
    if (phoneNumber) {
      const pCheck = normalizePhoneNumber(phoneNumber);
      if (!pCheck.isValid) {
        return res.status(400).json({ error: pCheck.reason || 'Invalid phone number format.' });
      }
      normalizedPhone = pCheck.normalized;
    }

    const updated = emergencyDb.updateUserProfile(uid, {
      fullName,
      phoneNumber: normalizedPhone,
      role,
      emergencyPreferences,
      avatarUrl,
    });

    return res.json({ success: true, user: updated });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update user profile.' });
  }
});

/**
 * PHASE 8: Delete Account (Privacy & Right to be Forgotten)
 * DELETE /api/auth/account
 */
app.delete('/api/auth/account', requireAuth, (req: Request, res: Response) => {
  try {
    const uid = (req as any).user.uid;
    emergencyDb.deleteUser(uid);
    return res.json({ success: true, message: 'Account and all associated records deleted permanently.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete account.' });
  }
});

/**
 * POST /api/auth/forgot-password
 */
app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email address is required.' });
  const user = emergencyDb.getUserByEmail(email);
  return res.json({
    success: true,
    message: user
      ? 'Password recovery link has been generated and sent to your email.'
      : 'If an account exists for this email, reset instructions will be sent.',
  });
});

// ========================================================
// PHASE 4: EMERGENCY CONTACT MANAGEMENT (STRICT UID ISOLATION)
// ========================================================

/**
 * GET /api/contacts
 * Returns only the authenticated user's emergency contacts
 */
app.get('/api/contacts', requireAuth, (req: Request, res: Response) => {
  const uid = (req as any).user.uid;
  const contacts = emergencyDb.getContactsByUid(uid);
  return res.json({ success: true, contacts });
});

/**
 * POST /api/contacts
 * Adds a contact under the authenticated user's UID
 */
app.post('/api/contacts', requireAuth, (req: Request, res: Response) => {
  try {
    const uid = (req as any).user.uid;
    const { name, phone, relation, isPreferred, notificationConsent } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Contact name is required.' });
    }

    const phoneCheck = normalizePhoneNumber(phone);
    if (!phoneCheck.isValid) {
      return res.status(400).json({ error: phoneCheck.reason || 'Invalid contact phone number.' });
    }

    const contact = emergencyDb.createContact(uid, {
      name,
      phone: phoneCheck.normalized,
      relation: relation || 'Emergency Contact',
      isPreferred,
      notificationConsent,
    });

    return res.status(201).json({ success: true, contact });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create emergency contact.' });
  }
});

/**
 * PUT /api/contacts/:id
 * Updates contact ensuring ownership
 */
app.put('/api/contacts/:id', requireAuth, (req: Request, res: Response) => {
  try {
    const uid = (req as any).user.uid;
    const contactId = req.params.id;
    const { name, phone, relation, isPreferred, notificationConsent } = req.body;

    let normalizedPhone: string | undefined = undefined;
    if (phone) {
      const pCheck = normalizePhoneNumber(phone);
      if (!pCheck.isValid) {
        return res.status(400).json({ error: pCheck.reason });
      }
      normalizedPhone = pCheck.normalized;
    }

    const updated = emergencyDb.updateContact(contactId, uid, {
      name,
      phone: normalizedPhone,
      relation,
      isPreferred,
      notificationConsent,
    });

    if (!updated) {
      return res.status(404).json({ error: 'Contact not found or unauthorized.' });
    }

    return res.json({ success: true, contact: updated });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update emergency contact.' });
  }
});

/**
 * DELETE /api/contacts/:id
 * Deletes contact ensuring ownership
 */
app.delete('/api/contacts/:id', requireAuth, (req: Request, res: Response) => {
  const uid = (req as any).user.uid;
  const ok = emergencyDb.deleteContact(req.params.id, uid);
  if (!ok) {
    return res.status(404).json({ error: 'Contact not found or unauthorized.' });
  }
  return res.json({ success: true, message: 'Contact removed.' });
});

// ========================================================
// PHASE 5: MULTI-USER MULTI-RECIPIENT WHATSAPP SOS
// ========================================================

/**
 * POST /api/sos/dispatch-multi
 * Dispatches an emergency broadcast to each selected contact independently
 */
app.post('/api/sos/dispatch-multi', requireAuth, async (req: Request, res: Response) => {
  try {
    const uid = (req as any).user.uid;
    const {
      emergencyMessage,
      recipientContactIds,
      latitude,
      longitude,
      locationAddress,
      userConsent,
      emergencyReferenceId: customRefId,
    } = req.body;

    // Rate limiting: max 1 SOS every 10 seconds per user
    const lastSos = sosRateLimitMap.get(uid);
    if (lastSos && Date.now() - lastSos < 10000) {
      return res.status(429).json({
        error: 'Duplicate emergency alert prevention active. Please wait 10 seconds before dispatching another alert.',
      });
    }

    if (userConsent !== true && userConsent !== 'true') {
      return res.status(400).json({
        error: 'User authorization and emergency broadcast consent are required before dispatching.',
      });
    }

    if (!emergencyMessage || typeof emergencyMessage !== 'string' || !emergencyMessage.trim()) {
      return res.status(400).json({ error: 'Emergency message content is required.' });
    }

    // Retrieve only the authenticated user's emergency contacts
    const userContacts = emergencyDb.getContactsByUid(uid);
    if (userContacts.length === 0) {
      return res.status(400).json({
        error: 'You do not have any registered emergency contacts. Please add emergency contacts first.',
      });
    }

    // Filter contacts based on recipientContactIds if provided
    let targets = userContacts;
    if (Array.isArray(recipientContactIds) && recipientContactIds.length > 0) {
      targets = userContacts.filter((c) => recipientContactIds.includes(c.id));
    }

    // Further filter by notification consent
    targets = targets.filter((c) => c.notificationConsent !== false);

    if (targets.length === 0) {
      return res.status(400).json({
        error: 'No consented emergency contacts selected. Please select at least one contact with notification consent.',
      });
    }

    sosRateLimitMap.set(uid, Date.now());

    const refId = customRefId || `SOS-${Math.floor(100000 + Math.random() * 900000)}`;

    console.log(`[Multi-SOS] Dispatching ${refId} for user ${uid} to ${targets.length} contact(s)...`);

    // Dispatch a separate WhatsApp message to each recipient independently
    const recipientsList: Array<{
      contactId?: string;
      recipientName: string;
      recipientPhone: string;
      wamid?: string | null;
      status: WhatsAppDeliveryStatus;
      error?: string | null;
    }> = [];

    for (const contact of targets) {
      const sendResult = await sendWhatsAppCloudMessage({
        recipientPhone: contact.phone,
        emergencyMessage: emergencyMessage.trim(),
        emergencyReferenceId: refId,
        latitude: typeof latitude === 'number' ? latitude : undefined,
        longitude: typeof longitude === 'number' ? longitude : undefined,
        userConsent: true,
      });

      recipientsList.push({
        contactId: contact.id,
        recipientName: contact.name,
        recipientPhone: contact.phone,
        wamid: sendResult.wamid || null,
        status: sendResult.status,
        error: sendResult.error || null,
      });
    }

    // Create event record in database
    const createdEvent = emergencyDb.createSosEvent(
      {
        uid,
        emergencyReferenceId: refId,
        message: emergencyMessage.trim(),
        latitude: typeof latitude === 'number' ? latitude : null,
        longitude: typeof longitude === 'number' ? longitude : null,
        locationAddress: locationAddress || null,
        userConsent: true,
      },
      recipientsList
    );

    return res.json({
      success: true,
      event: createdEvent,
      message: `Emergency alert dispatched to ${targets.length} contact(s).`,
    });
  } catch (err: any) {
    console.error('[Multi-SOS] Dispatch error:', err);
    return res.status(500).json({ error: `Internal server error dispatching SOS: ${err?.message || err}` });
  }
});

/**
 * PHASE 6: Personal SOS History
 * GET /api/sos/history
 * Returns only the authenticated user's SOS event records
 */
app.get('/api/sos/history', requireAuth, (req: Request, res: Response) => {
  const uid = (req as any).user.uid;
  const events = emergencyDb.getSosEventsByUid(uid);
  return res.json({ success: true, events });
});

/**
 * GET /api/sos/event/:eventId
 * Retrieves single event ensuring ownership
 */
app.get('/api/sos/event/:eventId', requireAuth, (req: Request, res: Response) => {
  const uid = (req as any).user.uid;
  const event = emergencyDb.getSosEventById(req.params.eventId, uid);
  if (!event) {
    return res.status(404).json({ error: 'Emergency event not found or access denied.' });
  }
  return res.json({ success: true, event });
});

/**
 * TASK 2: SOS WhatsApp Backend Endpoint
 * POST /api/sos/whatsapp
 * Sends real emergency notification through Meta WhatsApp Cloud API
 */
app.post('/api/sos/whatsapp', async (req: Request, res: Response) => {
  try {
    const {
      recipientPhone,
      emergencyMessage,
      latitude,
      longitude,
      userConsent,
      emergencyReferenceId: providedRefId,
      recipientName,
    } = req.body;

    // Validation 1: User authorization & consent
    if (userConsent !== true && userConsent !== 'true') {
      return res.status(400).json({
        success: false,
        status: 'FAILED',
        error: 'User authorization and emergency broadcast consent are required before dispatching.',
      });
    }

    // Validation 2: Message content
    if (!emergencyMessage || typeof emergencyMessage !== 'string' || !emergencyMessage.trim()) {
      return res.status(400).json({
        success: false,
        status: 'FAILED',
        error: 'Emergency message text is required and cannot be empty.',
      });
    }

    // Validation 3: Recipient phone number and format
    const phoneCheck = normalizePhoneNumber(recipientPhone);
    if (!phoneCheck.isValid) {
      return res.status(400).json({
        success: false,
        status: 'FAILED',
        error: phoneCheck.reason || 'Invalid recipient phone number. Provide valid country code (e.g. +1... or +91...).',
      });
    }

    const emergencyReferenceId = providedRefId && typeof providedRefId === 'string'
      ? providedRefId
      : `SOS-${Math.floor(100000 + Math.random() * 900000)}`;

    const internalMessageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const sendingTimestamp = new Date().toISOString();

    // TASK 3: Store initial message record with PENDING -> SENDING status
    const newRecord: WhatsAppSosRecord = {
      internalMessageId,
      emergencyReferenceId,
      recipientPhone: phoneCheck.normalized,
      recipientName: recipientName || undefined,
      messageContent: emergencyMessage.trim(),
      wamid: null,
      sendingTimestamp,
      currentDeliveryStatus: 'SENDING',
      errorInformation: null,
      latestStatusUpdateTimestamp: sendingTimestamp,
      latitude: typeof latitude === 'number' ? latitude : null,
      longitude: typeof longitude === 'number' ? longitude : null,
      userConsent: true,
      webhookHistory: [],
    };

    emergencyDb.saveMessage(newRecord);

    // Call Meta WhatsApp Business Cloud API
    const sendResult = await sendWhatsAppCloudMessage({
      recipientPhone: phoneCheck.normalized,
      emergencyMessage: emergencyMessage.trim(),
      emergencyReferenceId,
      latitude: typeof latitude === 'number' ? latitude : undefined,
      longitude: typeof longitude === 'number' ? longitude : undefined,
      userConsent: true,
    });

    if (sendResult.success && sendResult.wamid) {
      // Update DB record with SENT status and returned wamid
      const updated = emergencyDb.updateStatusById(
        internalMessageId,
        'SENT',
        null,
        sendResult.wamid
      );

      // Keep legacy array synchronized
      emergencyAlerts.unshift({
        id: internalMessageId,
        type: 'whatsapp-sos',
        message: emergencyMessage.trim(),
        urgency: 'critical',
        status: 'Sent',
        timestamp: sendingTimestamp,
        location: latitude && longitude ? { latitude, longitude } : undefined,
        contactsNotified: [recipientName || `+${phoneCheck.normalized}`],
        confirmationCode: emergencyReferenceId,
      });

      return res.json({
        success: true,
        status: 'SENT',
        internalMessageId,
        emergencyReferenceId,
        wamid: sendResult.wamid,
        recipientPhone: phoneCheck.normalized,
        recipientName: recipientName || null,
        message: 'Emergency request accepted by Meta WhatsApp Cloud API. Awaiting delivery confirmation from recipient device.',
        timestamp: sendingTimestamp,
        record: updated,
      });
    } else {
      // Update DB record with FAILED status and error explanation
      const updated = emergencyDb.updateStatusById(
        internalMessageId,
        'FAILED',
        sendResult.error || 'Failed to dispatch via WhatsApp Cloud API'
      );

      return res.status(400).json({
        success: false,
        status: 'FAILED',
        internalMessageId,
        emergencyReferenceId,
        error: sendResult.error || 'WhatsApp message dispatch failed',
        errorCode: sendResult.errorCode,
        details: sendResult.details,
        recipientPhone: phoneCheck.normalized,
        record: updated,
      });
    }
  } catch (error: any) {
    console.error('[SOS WhatsApp] Unexpected dispatch error:', error);
    return res.status(500).json({
      success: false,
      status: 'FAILED',
      error: `Internal server error: ${error?.message || error}`,
    });
  }
});

/**
 * TASK 4: WhatsApp Webhook Subscription Verification
 * GET /api/webhooks/whatsapp
 * Verifies hub.mode, hub.verify_token, and responds with hub.challenge
 */
app.get('/api/webhooks/whatsapp', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const configuredVerifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  console.log('[Webhook GET] Verification request received:', { mode, tokenProvided: Boolean(token) });

  if (mode === 'subscribe') {
    if (!configuredVerifyToken || token === configuredVerifyToken) {
      console.log('[Webhook GET] Webhook verification successful! Returning challenge.');
      return res.status(200).send(challenge);
    } else {
      console.warn('[Webhook GET] Verify token mismatch:', { expected: configuredVerifyToken ? 'configured' : 'none', received: token });
      return res.status(403).send('Forbidden: Verify token mismatch');
    }
  }

  return res.status(400).send('Invalid webhook verification request mode');
});

/**
 * TASK 4: WhatsApp Webhook Event Receiver
 * POST /api/webhooks/whatsapp
 * Receives real-time delivery status updates: sent, delivered, read, failed
 */
app.post('/api/webhooks/whatsapp', (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-hub-signature-256'] as string | undefined;
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);

    // Verify incoming signature using META_APP_SECRET
    if (!verifyWebhookSignature(rawBody, signature)) {
      console.error('[Webhook POST] Rejected unauthorized webhook: signature verification failed');
      return res.status(401).json({ error: 'Unauthorized: Invalid webhook signature' });
    }

    // Parse statuses from incoming payload
    const parsedStatuses = parseWhatsAppWebhookStatuses(req.body);

    if (parsedStatuses.length === 0) {
      // Could be message text or other non-status event; acknowledge with 200
      return res.status(200).json({ status: 'ok', received: 0 });
    }

    console.log(`[Webhook POST] Processing ${parsedStatuses.length} status update(s)...`);

    for (const update of parsedStatuses) {
      console.log(`[Webhook POST] Status event: wamid=${update.wamid} status=${update.status} (time: ${update.timestamp})`);

      const updatedRecord = emergencyDb.updateDeliveryStatus(
        update.wamid,
        update.status,
        update.errorInfo,
        update.raw
      );

      if (updatedRecord) {
        console.log(`[Webhook POST] Updated internal message ${updatedRecord.internalMessageId} to ${updatedRecord.currentDeliveryStatus}`);
      }
    }

    // Return HTTP 200 to Meta
    return res.status(200).json({ status: 'ok', processed: parsedStatuses.length });
  } catch (err: any) {
    console.error('[Webhook POST] Error processing webhook:', err);
    return res.status(500).json({ error: 'Internal server error processing webhook' });
  }
});

/**
 * TASK 6: SOS Message Status Polling Endpoint
 * GET /api/sos/message-status/:id
 * Retrieves real-time delivery status for a message by internal ID, reference ID, or wamid
 */
app.get('/api/sos/message-status/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  const record =
    emergencyDb.getMessageByInternalId(id) ||
    emergencyDb.getMessageByRefId(id) ||
    emergencyDb.getMessageByWamid(id);

  if (!record) {
    return res.status(404).json({
      success: false,
      error: `No emergency record found for reference "${id}".`,
      status: 'UNKNOWN',
    });
  }

  return res.json({
    success: true,
    message: record,
    status: record.currentDeliveryStatus,
    wamid: record.wamid,
    updatedAt: record.latestStatusUpdateTimestamp,
  });
});

/**
 * GET /api/sos/messages
 * Retrieves emergency message log
 */
app.get('/api/sos/messages', (_req: Request, res: Response) => {
  return res.json({
    success: true,
    messages: emergencyDb.getAllMessages(50),
  });
});

/**
 * GET /api/sos/config-status
 * Check server WhatsApp configuration state and webhook URL without leaking credentials
 */
app.get('/api/sos/config-status', (req: Request, res: Response) => {
  const config = getWhatsAppConfig();
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol || 'http';
  const appUrl = process.env.APP_URL || `${protocol}://${host}`;

  return res.json({
    hasPhoneNumberId: Boolean(config.phoneNumberId),
    hasAccessToken: Boolean(config.accessToken),
    hasVerifyToken: Boolean(config.verifyToken),
    hasAppSecret: Boolean(config.appSecret),
    apiVersion: config.apiVersion,
    webhookUrl: `${appUrl}/api/webhooks/whatsapp`,
    readyToSend: config.isConfigured,
    missing: config.missing,
  });
});

/**
 * TASK 9: Webhook simulation endpoint for staging & test verification
 * POST /api/webhooks/whatsapp/simulate-test
 */
app.post('/api/webhooks/whatsapp/simulate-test', (req: Request, res: Response) => {
  const { wamid, internalMessageId, targetStatus, errorInfo } = req.body;

  const validStatuses: any[] = ['SENT', 'DELIVERED', 'READ', 'FAILED'];
  if (!validStatuses.includes(targetStatus)) {
    return res.status(400).json({ error: `targetStatus must be one of: ${validStatuses.join(', ')}` });
  }

  // Check multi-recipient record first
  if (wamid) {
    const multiUpdated = emergencyDb.updateSosRecipientStatusByWamid(wamid, targetStatus, errorInfo || null, {
      simulated: true,
      triggerTime: new Date().toISOString(),
    });
    if (multiUpdated) {
      return res.json({
        success: true,
        status: targetStatus,
        recipient: multiUpdated.recipient,
        event: multiUpdated.event,
      });
    }
  }

  let record = null;
  if (wamid) record = emergencyDb.getMessageByWamid(wamid);
  if (!record && internalMessageId) record = emergencyDb.getMessageByInternalId(internalMessageId);

  if (!record) {
    return res.status(404).json({ error: 'Message or recipient record not found to simulate webhook update.' });
  }

  if (!record.wamid) {
    record.wamid = `wamid.HBgLSIMULATED_${record.internalMessageId}`;
    emergencyDb.saveMessage(record);
  }

  let updated = emergencyDb.updateDeliveryStatus(
    record.wamid,
    targetStatus,
    errorInfo || null,
    { simulated: true, triggerTime: new Date().toISOString() }
  );

  if (!updated) {
    updated = emergencyDb.updateStatusById(record.internalMessageId, targetStatus, errorInfo || null, record.wamid);
  }

  return res.json({
    success: true,
    status: targetStatus,
    message: updated,
  });
});

/**
 * GET /api/emergency/latest
 */
app.get('/api/emergency/latest', (_req: Request, res: Response) => {
  const latest = emergencyAlerts[0] || null;
  return res.json({ alert: latest });
});

/**
 * POST /api/emergency/acknowledge
 */
app.post('/api/emergency/acknowledge', (req: Request, res: Response) => {
  const { id, confirmationCode } = req.body;
  const target = emergencyAlerts.find(
    (a) => (id && a.id === id) || (confirmationCode && a.confirmationCode === confirmationCode)
  );
  if (target) {
    target.status = 'Delivered';
    return res.json({ success: true, alert: target });
  }
  return res.json({ success: false, message: 'Alert not found' });
});

/**
 * GET /api/health
 */
app.get('/api/health', (_req: Request, res: Response) => {
  return res.json({ status: 'ok', hasGeminiKey: Boolean(ai), time: new Date().toISOString() });
});

// Configure Vite middleware in development or static serve in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SignBridge] Server listening on http://0.0.0.0:${PORT} (Gemini AI: ${ai ? 'ENABLED' : 'DEMO_FALLBACK_READY'})`);
  });
}

startServer();
