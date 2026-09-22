function generateOtp() {
  return String(Math.floor(1000 + Math.random() * 9000)); // 4-digit code
}

/**
 * Delivers the OTP by email using Nodemailer (open source) against any SMTP
 * server — a free provider's SMTP (Brevo, Resend, Gmail) or a self-hosted
 * one like Postfix. Email is the only channel now: login is identified by
 * email address (see authController.js), so there's no phone number on
 * file yet at the point an OTP is requested — phone is collected later,
 * during profile completion, and used for contact info elsewhere in the
 * app, not for login.
 *
 * If SMTP isn't configured, this just logs to the console, so the login
 * flow is fully testable without any external service.
 */
async function sendOtpSms(email, code) {
  if (!process.env.SMTP_HOST) {
    console.log(`[OTP][smtp not configured] Sending ${code} to ${email}`);
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
    to: email,
    subject: "Your My Thalavadi login code",
    text: `Your code is ${code}. It expires in ${process.env.OTP_EXPIRY_MINUTES || 5} minutes.`,
  });
  return true;
}

module.exports = { generateOtp, sendOtpSms };
