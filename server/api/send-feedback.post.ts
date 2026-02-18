import { defineEventHandler, readBody } from 'h3';
import { useRuntimeConfig } from '#imports';
import nodemailer from 'nodemailer';
import validator from 'validator';
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import crypto from 'node:crypto';

// ---- DOMPurify singleton (no leaks, reuse across requests) ----
function getDOMPurify() {
  const g = globalThis as any;
  if (!g.__DOMPURIFY__) {
    const window = new JSDOM('').window as any;
    g.__DOMPURIFY__ = createDOMPurify(window);
  }
  return g.__DOMPURIFY__ as ReturnType<typeof createDOMPurify>;
}
const DOMPurify = getDOMPurify();

/**
 * Feedback Request Interface
 */
interface FeedbackRequest {
  email?: string | null;
  projectName?: string | null;
  rating?: number | null;
  feedback?: string | null;
}

// ---- Helpers ----
const clean = (v: unknown) =>
  DOMPurify.sanitize(String(v ?? ''), {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  }).trim();

function sanitizeAll(body: FeedbackRequest) {
  return {
    email: clean(body.email),
    projectName: clean(body.projectName),
    rating: Number(body.rating) || 0,
    feedback: clean(body.feedback),
  };
}

function validate({
  email,
  projectName,
  rating,
}: {
  email: string;
  projectName: string;
  rating: number;
}) {
  const errors: Record<string, string> = {};

  if (!email || !validator.isEmail(email))
    errors.email = 'Enter a valid email address.';

  if (!projectName || projectName.length < 2)
    errors.projectName = 'Project name is required.';

  if (!rating || rating < 1 || rating > 5)
    errors.rating = 'Rating must be between 1 and 5 stars.';

  return errors;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function feedbackHtmlTable(data: {
  email: string;
  projectName: string;
  rating: number;
  feedback: string;
}) {
  const starRating = '★'.repeat(data.rating) + '☆'.repeat(5 - data.rating);
  const row = (label: string, value: string, opts?: { preLine?: boolean }) => {
    const tdBase = 'padding:8px 12px;border:1px solid #ddd;';
    const valueStyle = `${tdBase}${opts?.preLine ? 'white-space:pre-line;' : ''}`;
    return `<tr>
      <td style="${tdBase}font-weight:600">${escapeHtml(label)}</td>
      <td style="${valueStyle}">${escapeHtml(value || '')}</td>
    </tr>`;
  };

  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-family:Arial,Helvetica,sans-serif">
    <thead>
      <tr>
        <th colspan="2" style="text-align:left;padding:12px;border:1px solid #ddd;background:#0A5F6B;color:white">
          ${escapeHtml(data.projectName)} — Customer Feedback
        </th>
      </tr>
    </thead>
    <tbody>
      ${row('Customer Email', data.email)}
      ${row('Project Name', data.projectName)}
      ${row('Rating', `${starRating} (${data.rating} out of 5 stars)`)}
      ${row('Feedback', data.feedback, { preLine: true })}
      ${row('Submitted At', new Date().toLocaleString('en-US', { timeZone: 'UTC' }) + ' UTC')}
    </tbody>
  </table>`;
}

/**
 * API endpoint to send user feedback via email using SMTP
 */
export default defineEventHandler(async event => {
  const correlationId = crypto.randomUUID();

  const cfg = useRuntimeConfig(event);
  const smtpHost = String(cfg.hostName);
  const smtpPort = String(cfg.portName);
  const smtpUser = String(cfg.userId);
  const smtpPass = String(cfg.password);
  const fromEmail = smtpUser;
  const feedbackTo = smtpUser;

  try {
    const body = await readBody<FeedbackRequest>(event);
    const { email, projectName, rating, feedback } = sanitizeAll(body);
    const errors = validate({ email, projectName, rating });

    if (Object.keys(errors).length) {
      return { ok: false, code: 'VALIDATION_ERROR', correlationId, errors };
    }

    // Create nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(smtpPort),
      secure: smtpPort === '465',
      auth: { user: smtpUser, pass: smtpPass },
    });

    // Generate star rating visual
    const starRating = '★'.repeat(rating) + '☆'.repeat(5 - rating);

    // Plain text version
    const textContent = `New Customer Feedback

Project Name: ${projectName}
Customer Email: ${email}
Rating: ${rating} out of 5 stars (${starRating})

Feedback:
${feedback}

Submitted At: ${new Date().toLocaleString('en-US', { timeZone: 'UTC' })} UTC

---
This feedback was submitted through the ${projectName} intake form.`;

    // Send feedback email
    await transporter.sendMail({
      from: fromEmail,
      to: feedbackTo,
      subject: `New Feedback from ${projectName} - ${rating} Stars`,
      html: feedbackHtmlTable({ email, projectName, rating, feedback }),
      text: textContent,
      // Header injection hardening
      replyTo: email.replace(/[\r\n]/g, ''),
      headers: {
        'X-Correlation-ID': correlationId,
      },
    });

    return { ok: true, code: 'OK', correlationId };
  } catch (err: any) {
    console.error('[feedback]', {
      correlationId,
      name: err?.name,
      message: err?.message,
      stack: err?.stack,
    });
    return {
      ok: false,
      code: 'SERVER_ERROR',
      correlationId,
      message: 'Something went wrong. Please try again later.',
    };
  }
});
