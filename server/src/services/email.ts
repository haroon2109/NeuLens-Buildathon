import { Resend } from 'resend';

/**
 * Transactional email delivery for one-time verification / password-reset
 * codes.
 *
 * Resend is optional: when RESEND_API_KEY is unset the function reports that
 * nothing was delivered and the caller keeps its development fallback (the code
 * is returned only outside production). Codes and API keys are never logged.
 */

const apiKey = (process.env.RESEND_API_KEY || '').trim();
const fromAddress = (process.env.EMAIL_FROM || 'NeuLens <onboarding@resend.dev>').trim();

let client: Resend | null = null;

function getClient(): Resend | null {
  if (!apiKey) return null;
  if (!client) client = new Resend(apiKey);
  return client;
}

export function emailDeliveryConfigured(): boolean {
  return apiKey.length > 0;
}

export type OtpPurpose = 'SIGNUP' | 'PASSWORD_RESET';

const COPY: Record<OtpPurpose, { subject: string; heading: string; intro: string }> = {
  SIGNUP: {
    subject: 'Verify your NeuLens account',
    heading: 'Verify your email',
    intro: 'Enter this code to finish creating your NeuLens account.',
  },
  PASSWORD_RESET: {
    subject: 'Reset your NeuLens password',
    heading: 'Reset your password',
    intro: 'Enter this code to choose a new NeuLens password.',
  },
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return map[char] ?? char;
  });
}

export interface OtpEmailInput {
  to: string;
  code: string;
  purpose: OtpPurpose;
  name?: string;
  expiresInMinutes?: number;
}

/**
 * Sends the code and returns whether the provider accepted it. Callers must
 * keep the HTTP response generic regardless of the result, so a delivery
 * failure cannot be used to probe which addresses are registered.
 */
export async function sendOtpEmail(input: OtpEmailInput): Promise<boolean> {
  const resend = getClient();
  if (!resend) return false;

  const copy = COPY[input.purpose];
  const minutes = input.expiresInMinutes && input.expiresInMinutes > 0 ? input.expiresInMinutes : 10;
  const greeting = input.name ? `Hi ${input.name.trim()},` : 'Hi,';
  const code = input.code;

  const text = [
    greeting,
    '',
    copy.intro,
    '',
    `Code: ${code}`,
    '',
    `This code expires in ${minutes} minutes. If you did not request it, you can ignore this email.`,
    '',
    'NeuLens',
  ].join('\n');

  const html = `<!doctype html>
<html><body style="margin:0;padding:24px;background:#fbf7ef;font-family:system-ui,Segoe UI,Roboto,sans-serif;color:#0f172a;">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:28px;">
    <h1 style="font-size:18px;margin:0 0 12px;">${escapeHtml(copy.heading)}</h1>
    <p style="font-size:14px;line-height:1.6;margin:0 0 8px;">${escapeHtml(greeting)}</p>
    <p style="font-size:14px;line-height:1.6;margin:0 0 20px;">${escapeHtml(copy.intro)}</p>
    <p style="font-size:32px;letter-spacing:8px;font-weight:700;margin:0 0 20px;text-align:center;">${escapeHtml(code)}</p>
    <p style="font-size:12px;line-height:1.6;color:#64748b;margin:0;">This code expires in ${minutes} minutes. If you did not request it, you can ignore this email.</p>
  </div>
</body></html>`;

  try {
    const { error } = await resend.emails.send({
      from: fromAddress,
      to: input.to,
      subject: copy.subject,
      text,
      html,
    });

    if (error) {
      console.error('[Email]: OTP delivery rejected by provider:', input.purpose, error.name);
      return false;
    }
    return true;
  } catch (err) {
    console.error(
      '[Email]: OTP delivery failed:',
      input.purpose,
      err instanceof Error ? err.message : 'unknown error'
    );
    return false;
  }
}
