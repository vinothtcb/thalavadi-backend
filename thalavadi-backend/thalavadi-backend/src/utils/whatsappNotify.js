const pool = require("../config/db");

// ─────────────────────────────────────────────
// WHATSAPP NOTIFICATIONS
//
// There's no way to send WhatsApp messages programmatically from a regular
// personal WhatsApp number — sending business-initiated messages requires
// the WhatsApp Business Platform (Meta's Cloud API, or a paid intermediary
// like Twilio/Gupshup), which needs a verified business account and
// Meta-approved message templates before you can message someone who
// hasn't messaged you first. That's a real setup/approval process, not
// something that can be wired up with just an API key.
//
// Until that's set up, sendWhatsAppMessage() just logs what *would* have
// been sent — the matching logic (who should get notified, in what
// language of message) is fully real and working. Once you have a
// provider, replace the body of sendWhatsAppMessage() and every call site
// (new Classifieds, Rides, Events, News, Blood Donor posts) starts sending
// for real without any other change.
// ─────────────────────────────────────────────

/**
 * @param {string} toPhone - 10-digit number
 * @param {string} message
 * @returns {Promise<{status: 'sent'|'failed', note: string}>}
 */
async function sendWhatsAppMessage(toPhone, message) {
  // TODO: integrate a real WhatsApp Business API provider here. Example
  // shape once you have one (pseudocode, not a working call):
  //
  //   const res = await fetch("https://graph.facebook.com/v19.0/<phone-number-id>/messages", {
  //     method: "POST",
  //     headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` },
  //     body: JSON.stringify({
  //       messaging_product: "whatsapp",
  //       to: `91${toPhone}`,
  //       type: "template", // business-initiated messages must use an approved template
  //       template: { name: "new_post_alert", language: { code: "en" }, components: [...] },
  //     }),
  //   });
  //   return res.ok ? { status: "sent", note: "" } : { status: "failed", note: await res.text() };

  return { status: "queued", note: "No WhatsApp provider configured — logged only, not actually sent." };
}

/**
 * Notifies every user who opted into `category` in their notification
 * preferences about a new post. Never throws — a notification failure
 * should never block the actual post from being created.
 * @param {string} category - one of VALID_NOTIFICATION_CATEGORIES
 */
async function notifyUsersForNewPost(category, title, body) {
  try {
    const { rows: users } = await pool.query(
      `SELECT id, phone FROM users WHERE $1 = ANY(notification_preferences)`,
      [category]
    );
    for (const u of users) {
      const result = await sendWhatsAppMessage(u.phone, `${title}${body ? "\n" + body : ""}`);
      await pool.query(
        `INSERT INTO whatsapp_notification_log (category, title, body, recipient_user_id, recipient_phone, status, note)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [category, title, body || null, u.id, u.phone, result.status, result.note || null]
      );
    }
  } catch (err) {
    console.error("notifyUsersForNewPost failed (non-fatal):", err.message);
  }
}

module.exports = { sendWhatsAppMessage, notifyUsersForNewPost };
