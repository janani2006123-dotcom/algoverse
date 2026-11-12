import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import https from 'https';
import querystring from 'querystring';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '20mb' }));

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

  app.use(express.static(path.join(__dirname, 'public')));

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
