function generateOtp() {
  return String(Math.floor(1000 + Math.random() * 9000)); // 4-digit code
}

/**
 * Delivers the OTP using an open-source channel, selected via OTP_CHANNEL:
 *
 *  - "kannel" (default): Kannel (https://www.kannel.org) is a free, open-source
 *    SMS gateway you self-host on a small Linux box with a GSM modem/SIM, or
 *    point at any provider that exposes Kannel's simple HTTP "sendsms" API.
 *    No vendor lock-in, no per-message SaaS fee beyond your SIM's SMS cost.
 *
 *  - "email": sends the code by email instead of SMS, using Nodemailer
 *    (open source) against any SMTP server — including a self-hosted one
 *    like Postfix. Useful if you don't want to run SMS hardware at all.
 *
 * Both paths just log to the console if not configured, so the login flow
 * is fully testable without any external service.
 */
async function sendOtpSms(phone, code) {
  const channel = process.env.OTP_CHANNEL || "kannel";

  if (channel === "kannel") {
    return sendViaKannel(phone, code);
  }
  if (channel === "email") {
    return sendViaEmail(phone, code);
  }

  console.log(`[OTP] Unknown OTP_CHANNEL "${channel}", falling back to console log: ${code} -> ${phone}`);
  return true;
}

async function sendViaKannel(phone, code) {
  const url = process.env.KANNEL_URL; // e.g. http://localhost:13013/cgi-bin/sendsms
  if (!url) {
    console.log(`[OTP][kannel not configured] Sending ${code} to ${phone}`);
    return true;
  }

  const params = new URLSearchParams({
    username: process.env.KANNEL_USER || "",
    password: process.env.KANNEL_PASSWORD || "",
    to: phone,
    text: `Your Thalavadi Directory code is ${code}`,
  });

  const res = await fetch(`${url}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Kannel gateway responded with ${res.status}`);
  }
  return true;
}

async function sendViaEmail(recipientEmail, code) {
  if (!process.env.SMTP_HOST) {
    console.log(`[OTP][smtp not configured] Sending ${code} to ${recipientEmail}`);
    return true;
  }

  // nodemailer is open source (MIT license): https://nodemailer.com
  const nodemailer = require("nodemailer");
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || "no-reply@thalavadi.local",
    to: recipientEmail,
    subject: "Your Thalavadi Directory login code",
    text: `Your code is ${code}. It expires in ${process.env.OTP_EXPIRY_MINUTES || 5} minutes.`,
  });
  return true;
}

module.exports = { generateOtp, sendOtpSms };
