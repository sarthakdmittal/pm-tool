const nodemailer = require('nodemailer');

// ─── Email ────────────────────────────────────────────────────────────────────

let emailTransporter = null;

function getEmailTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return null;
  if (!emailTransporter) {
    // If EMAIL_HOST is set, use generic SMTP (any provider).
    // Otherwise fall back to Gmail shorthand for convenience.
    if (process.env.EMAIL_HOST) {
      emailTransporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || '587', 10),
        secure: process.env.EMAIL_SECURE === 'true', // true for port 465, false for 587
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
    } else {
      // Gmail shorthand (no EMAIL_HOST needed)
      emailTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
    }
  }
  return emailTransporter;
}

async function sendEmail({ to, subject, html }) {
  const transporter = getEmailTransporter();
  if (!transporter) throw new Error('Email not configured (EMAIL_USER / EMAIL_PASS missing)');
  const from = process.env.EMAIL_FROM
    ? `"PM Tool" <${process.env.EMAIL_FROM}>`
    : `"PM Tool" <${process.env.EMAIL_USER}>`;
  await transporter.sendMail({ from, to, subject, html });
}

// ─── WhatsApp (Meta Cloud API) ─────────────────────────────────────────────────

async function sendWhatsApp({ phone, message }) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) throw new Error('WhatsApp not configured (WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID missing)');

  // Normalise phone: strip non-digits, ensure country code (no leading +)
  const normalised = phone.replace(/\D/g, '');

  const body = JSON.stringify({
    messaging_product: 'whatsapp',
    to: normalised,
    type: 'text',
    text: { body: message },
  });

  const res = await fetch(
    `https://graph.facebook.com/v19.0/${phoneId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body,
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `WhatsApp API error ${res.status}`);
  }
  return res.json();
}

// ─── Combined ──────────────────────────────────────────────────────────────────

function buildTaskHtml({ taskName, projectName, status, dueDate, assignedTo, customMessage }) {
  const statusColour = status === 'overdue' ? '#dc2626' : status === 'done' ? '#16a34a' : '#2563eb';
  return `
    <div style="font-family:sans-serif;max-width:520px;margin:auto;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden">
      <div style="background:#1e293b;padding:20px 24px">
        <h2 style="color:#fff;margin:0;font-size:18px">PM Tool — Task Alert</h2>
      </div>
      <div style="padding:24px">
        ${customMessage ? `<p style="color:#374151;margin-bottom:16px">${customMessage}</p>` : ''}
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:6px 0;color:#6b7280;width:110px">Task</td><td style="padding:6px 0;font-weight:600;color:#111827">${taskName}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Project</td><td style="padding:6px 0;color:#111827">${projectName}</td></tr>
          ${assignedTo ? `<tr><td style="padding:6px 0;color:#6b7280">Assigned To</td><td style="padding:6px 0;color:#111827">${assignedTo}</td></tr>` : ''}
          <tr><td style="padding:6px 0;color:#6b7280">Status</td><td style="padding:6px 0"><span style="background:${statusColour}20;color:${statusColour};padding:2px 8px;border-radius:4px;font-weight:600;text-transform:capitalize">${status.replace('_', ' ')}</span></td></tr>
          ${dueDate ? `<tr><td style="padding:6px 0;color:#6b7280">Due Date</td><td style="padding:6px 0;color:#111827">${new Date(dueDate).toDateString()}</td></tr>` : ''}
        </table>
      </div>
      <div style="background:#f9fafb;padding:12px 24px;font-size:12px;color:#9ca3af">Sent from PM Tool — do not reply to this email.</div>
    </div>`;
}

function buildTaskText({ taskName, projectName, status, dueDate, assignedTo, customMessage }) {
  const lines = ['*PM Tool — Task Alert*', ''];
  if (customMessage) lines.push(customMessage, '');
  lines.push(`Task: *${taskName}*`, `Project: ${projectName}`);
  if (assignedTo) lines.push(`Assigned To: ${assignedTo}`);
  lines.push(`Status: ${status.replace('_', ' ').toUpperCase()}`);
  if (dueDate) lines.push(`Due: ${new Date(dueDate).toDateString()}`);
  return lines.join('\n');
}

module.exports = {
  sendEmail,
  sendWhatsApp,
  buildTaskHtml,
  buildTaskText,
  isEmailConfigured: () => !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
  isWhatsAppConfigured: () => !!(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID),
};
