function generateOtp() {
  return String(Math.floor(1000 + Math.random() * 9000)); // 4-digit code
}

/**
 * Delivers the OTP by email via Brevo's HTTPS transactional email API
 * (https://api.brevo.com/v3/smtp/email), not SMTP. This is deliberate:
 * Railway (and most cloud hosts) block outbound SMTP ports (25/465/587)
 * on free/hobby plans to prevent spam abuse — the connection just times
 * out, even with fully correct SMTP credentials. An HTTPS API call has no
 * such restriction, since it looks like any other web request.
 *
 * Needs BREVO_API_KEY — a real API key (Brevo dashboard → SMTP & API →
 * API Keys tab), NOT the SMTP key used for the old SMTP_PASSWORD setup.
 *
 * If BREVO_API_KEY isn't set, this just logs to the console, so the
 * login flow is fully testable without any external service.
 */
async function sendOtpSms(email, code) {
  if (!process.env.BREVO_API_KEY) {
    console.log(`[OTP][Brevo API key not configured] Sending ${code} to ${email}`);
    return true;
  }

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "api-key": process.env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: { name: "My Thalavadi", email: process.env.SMTP_FROM || "no-reply@thalavadi.local" },
      to: [{ email }],
      subject: "Your My Thalavadi login code",
      textContent: `Your code is ${code}. It expires in ${process.env.OTP_EXPIRY_MINUTES || 5} minutes.`,
      htmlContent: `<p>Your code is <strong>${code}</strong>. It expires in ${process.env.OTP_EXPIRY_MINUTES || 5} minutes.</p>`,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Brevo API error (${res.status}): ${body}`);
  }
  return true;
}

module.exports = { generateOtp, sendOtpSms };
