import crypto from 'crypto';
import { WhatsAppDeliveryStatus } from '../types';

export interface SendMessageOptions {
  recipientPhone: string;
  emergencyMessage: string;
  emergencyReferenceId: string;
  latitude?: number | null;
  longitude?: number | null;
  userConsent: boolean;
}

export interface SendMessageResult {
  success: boolean;
  wamid?: string;
  status: WhatsAppDeliveryStatus;
  error?: string;
  errorCode?: number;
  errorType?: string;
  details?: any;
}

/**
 * Normalizes phone numbers to Meta WhatsApp international E.164 digits-only format
 * e.g. "+1 (555) 019-2834" -> "15550192834"
 * e.g. "+91 98765 43210" -> "919876543210"
 */
export function normalizePhoneNumber(rawPhone: string): { normalized: string; isValid: boolean; reason?: string } {
  if (!rawPhone || typeof rawPhone !== 'string') {
    return { normalized: '', isValid: false, reason: 'Phone number is required.' };
  }

  // Remove spaces, hyphens, parentheses, dots
  let cleaned = rawPhone.replace(/[\s\-\(\)\.]/g, '');

  // Strip leading plus if present
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  // Ensure digits only
  if (!/^\d+$/.test(cleaned)) {
    return { normalized: '', isValid: false, reason: 'Phone number contains non-numeric characters.' };
  }

  // Check E.164 length constraints (typically 7 to 15 digits)
  if (cleaned.length < 7 || cleaned.length > 15) {
    return {
      normalized: cleaned,
      isValid: false,
      reason: `Phone number length (${cleaned.length} digits) is invalid for international E.164 format. Include country code (e.g. 1 for US, 91 for India).`,
    };
  }

  return { normalized: cleaned, isValid: true };
}

/**
 * Checks server WhatsApp configuration without exposing secrets
 */
export function getWhatsAppConfig() {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || '';
  const appSecret = process.env.META_APP_SECRET || '';
  const apiVersion = process.env.WHATSAPP_API_VERSION || 'v22.0';

  const missing: string[] = [];
  if (!phoneNumberId) missing.push('WHATSAPP_PHONE_NUMBER_ID');
  if (!accessToken) missing.push('WHATSAPP_ACCESS_TOKEN');
  if (!verifyToken) missing.push('WHATSAPP_VERIFY_TOKEN');

  return {
    phoneNumberId,
    accessToken,
    verifyToken,
    appSecret,
    apiVersion,
    isConfigured: missing.length === 0,
    missing,
  };
}

/**
 * Format a comprehensive, accessible emergency SOS message payload
 */
export function composeEmergencyMessageText(
  baseMessage: string,
  referenceId: string,
  latitude?: number | null,
  longitude?: number | null
): string {
  const lines: string[] = [
    `🚨 *[EMERGENCY SOS ALERT - SIGNBRIDGE]* 🚨`,
    ``,
    `*Distress Message:*`,
    `"${baseMessage.trim()}"`,
    ``,
    `*Reference ID:* ${referenceId}`,
    `*Time:* ${new Date().toUTCString()}`,
  ];

  if (latitude !== undefined && latitude !== null && longitude !== undefined && longitude !== null) {
    lines.push(``);
    lines.push(`📍 *Location Telemetry:*`);
    lines.push(`Coordinates: ${latitude}, ${longitude}`);
    lines.push(`Google Maps: https://maps.google.com/?q=${latitude},${longitude}`);
  }

  lines.push(``);
  lines.push(`_This is an urgent distress broadcast sent via SignBridge Accessible Communication Platform._`);

  return lines.join('\n');
}

/**
 * Sends a real message via Meta WhatsApp Business Cloud API
 */
export async function sendWhatsAppCloudMessage(options: SendMessageOptions): Promise<SendMessageResult> {
  const config = getWhatsAppConfig();

  // Task 1 & 7: Check configuration before sending
  if (!config.isConfigured) {
    const errorMsg = `Meta WhatsApp Cloud API credentials not configured in server environment. Missing: ${config.missing.join(', ')}.`;
    console.warn(`[WhatsApp API] ${errorMsg}`);
    return {
      success: false,
      status: 'FAILED',
      error: errorMsg,
      details: { missingConfig: config.missing },
    };
  }

  // Validate recipient phone number format
  const phoneValidation = normalizePhoneNumber(options.recipientPhone);
  if (!phoneValidation.isValid) {
    return {
      success: false,
      status: 'FAILED',
      error: phoneValidation.reason || 'Invalid recipient phone number format. Must include international country code.',
    };
  }

  // Compose emergency message body
  const messageBody = composeEmergencyMessageText(
    options.emergencyMessage,
    options.emergencyReferenceId,
    options.latitude,
    options.longitude
  );

  const endpoint = `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: phoneValidation.normalized,
    type: 'text',
    text: {
      preview_url: true,
      body: messageBody,
    },
  };

  try {
    console.log(`[WhatsApp API] Sending SOS message to +${phoneValidation.normalized} via ${endpoint}...`);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseData: any = await response.json();

    if (!response.ok) {
      const err = responseData?.error || {};
      const errorCode = err.code;
      const errorSubcode = err.error_subcode;
      let userFriendlyError = err.message || 'WhatsApp Cloud API returned an error';

      // Task 7: Specific error code handling
      if (errorCode === 190) {
        userFriendlyError = 'WhatsApp Access Token is expired or invalid. Please refresh WHATSAPP_ACCESS_TOKEN in server configuration.';
      } else if (errorCode === 131026) {
        userFriendlyError = `Recipient (+${phoneValidation.normalized}) is not registered on WhatsApp or message is undeliverable.`;
      } else if (errorCode === 131047) {
        userFriendlyError = 'WhatsApp 24-hour customer service window expired. Business-initiated templates are required by Meta messaging policy.';
      } else if (errorCode === 132000 || errorCode === 132001) {
        userFriendlyError = 'Template not found or not approved by Meta. Please check your WhatsApp Business template settings.';
      } else if (errorCode === 100) {
        userFriendlyError = `Invalid parameter or Phone Number ID (${config.phoneNumberId}). Check WHATSAPP_PHONE_NUMBER_ID.`;
      } else if (errorCode === 80007) {
        userFriendlyError = 'Meta WhatsApp API rate limit reached. Please wait a moment before retrying.';
      }

      console.error('[WhatsApp API] Delivery request failed:', {
        status: response.status,
        errorCode,
        errorSubcode,
        message: userFriendlyError,
      });

      return {
        success: false,
        status: 'FAILED',
        error: userFriendlyError,
        errorCode,
        errorType: err.type,
        details: err,
      };
    }

    // Success response format from Meta
    const messageInfo = responseData?.messages?.[0];
    const wamid = messageInfo?.id;

    if (!wamid) {
      console.warn('[WhatsApp API] Meta returned 200 but missing wamid in messages array:', responseData);
      return {
        success: false,
        status: 'UNKNOWN',
        error: 'WhatsApp API acknowledged the request but did not return a valid message tracking ID (wamid).',
      };
    }

    console.log(`[WhatsApp API] Message accepted by Meta. wamid: ${wamid}`);

    // Return status SENT (Task 5: Never show DELIVERED just because API returned 200)
    return {
      success: true,
      status: 'SENT',
      wamid,
    };
  } catch (networkError: any) {
    console.error('[WhatsApp API] Network or fetch error during send:', networkError);
    return {
      success: false,
      status: 'FAILED',
      error: `Network error connecting to Meta Graph API: ${networkError?.message || networkError}`,
    };
  }
}

/**
 * Task 4: Verify incoming WhatsApp webhook signature
 * Uses META_APP_SECRET and X-Hub-Signature-256 header with HMAC SHA-256
 */
export function verifyWebhookSignature(rawBody: Buffer | string, signatureHeader?: string): boolean {
  const secret = process.env.META_APP_SECRET;
  if (!secret) {
    // If META_APP_SECRET is not configured, log notice and permit in sandbox mode
    console.warn('[Webhook] META_APP_SECRET is not set. Webhook signature validation skipped.');
    return true;
  }

  if (!signatureHeader) {
    console.error('[Webhook] Missing X-Hub-Signature-256 header from incoming webhook request.');
    return false;
  }

  try {
    const parts = signatureHeader.split('=');
    if (parts.length !== 2 || parts[0] !== 'sha256') {
      console.error('[Webhook] Invalid X-Hub-Signature-256 header format.');
      return false;
    }

    const providedSignatureHex = parts[1];
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(rawBody);
    const expectedSignatureHex = hmac.digest('hex');

    const providedBuffer = Buffer.from(providedSignatureHex, 'hex');
    const expectedBuffer = Buffer.from(expectedSignatureHex, 'hex');

    if (providedBuffer.length !== expectedBuffer.length) {
      console.error('[Webhook] Signature buffer length mismatch.');
      return false;
    }

    const matches = crypto.timingSafeEqual(providedBuffer, expectedBuffer);
    if (!matches) {
      console.error('[Webhook] Webhook signature verification failed. Unauthorized request.');
    }
    return matches;
  } catch (err) {
    console.error('[Webhook] Error validating signature:', err);
    return false;
  }
}

/**
 * Task 4: Parses Meta WhatsApp status callback payloads
 */
export interface ParsedWebhookStatus {
  wamid: string;
  status: WhatsAppDeliveryStatus;
  timestamp: string;
  recipientId: string;
  errorInfo?: string;
  raw: any;
}

export function parseWhatsAppWebhookStatuses(body: any): ParsedWebhookStatus[] {
  const results: ParsedWebhookStatus[] = [];

  if (!body || body.object !== 'whatsapp_business_account' || !Array.isArray(body.entry)) {
    return results;
  }

  for (const entry of body.entry) {
    if (!Array.isArray(entry.changes)) continue;
    for (const change of entry.changes) {
      if (change.field !== 'messages' || !change.value || !Array.isArray(change.value.statuses)) {
        continue;
      }

      for (const st of change.value.statuses) {
        const wamid = st.id;
        const rawStatus = (st.status || '').toLowerCase();
        let status: WhatsAppDeliveryStatus = 'UNKNOWN';

        if (rawStatus === 'sent') status = 'SENT';
        else if (rawStatus === 'delivered') status = 'DELIVERED';
        else if (rawStatus === 'read') status = 'READ';
        else if (rawStatus === 'failed') status = 'FAILED';

        let errorInfo: string | undefined = undefined;
        if (Array.isArray(st.errors) && st.errors.length > 0) {
          const firstErr = st.errors[0];
          errorInfo = `Error ${firstErr.code}: ${firstErr.title || firstErr.message || 'Delivery failure'}`;
        }

        const dateStr = st.timestamp ? new Date(parseInt(st.timestamp, 10) * 1000).toISOString() : new Date().toISOString();

        if (wamid) {
          results.push({
            wamid,
            status,
            timestamp: dateStr,
            recipientId: st.recipient_id || '',
            errorInfo,
            raw: st,
          });
        }
      }
    }
  }

  return results;
}
