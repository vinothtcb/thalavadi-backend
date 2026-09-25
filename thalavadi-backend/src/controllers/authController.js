const pool = require("../config/db");
const { generateOtp, sendOtpSms } = require("../utils/otp");
const { signToken } = require("../utils/jwt");
const { generateRefreshToken, hashToken } = require("../utils/refreshToken");
const { isValidEmail, isValidPhone, isValidImageDataUrl } = require("../utils/validators");

const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES || 5);
const REFRESH_TOKEN_DAYS = Number(process.env.REFRESH_TOKEN_DAYS || 60);

// A single, dedicated account for Google Play / App Store reviewers to
// log in with. Reviewers (often automated systems) can't check a real
// inbox for an OTP, so this one specific email always uses a fixed code
// instead of a real generated one — no email is ever sent for it, and no
// other email can use this shortcut. Paste these exact credentials into
// Play Console's "App access" instructions field.
const REVIEWER_EMAIL = "playstore-reviewer@mythalavadi.com";
const REVIEWER_OTP = "4829";

// POST /api/auth/send-otp   { email }
async function sendOtp(req, res, next) {
  try {
    const { email } = req.body;
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: "Provide a valid email address" });
    }
    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedEmail === REVIEWER_EMAIL) {
      // No real code generated, nothing stored, no email sent — verifyOtp
      // checks this same constant directly.
      return res.json({ message: "OTP sent", expires_in_minutes: OTP_EXPIRY_MINUTES });
    }

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await pool.query(
      `INSERT INTO otp_codes (email, code, expires_at) VALUES ($1, $2, $3)`,
      [normalizedEmail, code, expiresAt]
    );

    await sendOtpSms(normalizedEmail, code);

    res.json({ message: "OTP sent", expires_in_minutes: OTP_EXPIRY_MINUTES });
  } catch (err) {
    next(err);
  }
}

async function issueSession(user, deviceId, deviceLabel) {
  const token = signToken(user); // short-lived access token (JWT)
  const rawRefreshToken = generateRefreshToken();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);

  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, device_id, device_label, expires_at)
     VALUES ($1,$2,$3,$4,$5)`,
    [user.id, hashToken(rawRefreshToken), deviceId || null, deviceLabel || null, expiresAt]
  );

  return { token, refresh_token: rawRefreshToken };
}

// POST /api/auth/verify-otp   { email, code, device_id, device_label }
async function verifyOtp(req, res, next) {
  try {
    const { email, code, device_id, device_label } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: "email and code are required" });
    }
    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedEmail === REVIEWER_EMAIL) {
      if (code !== REVIEWER_OTP) return res.status(400).json({ error: "Incorrect code" });
    } else {
      const { rows } = await pool.query(
        `SELECT * FROM otp_codes
         WHERE email = $1 AND verified = false
         ORDER BY created_at DESC LIMIT 1`,
        [normalizedEmail]
      );
      const record = rows[0];

      if (!record) {
        return res.status(400).json({ error: "No OTP requested for this email" });
      }
      if (new Date(record.expires_at) < new Date()) {
        return res.status(400).json({ error: "OTP expired, request a new one" });
      }
      if (record.attempts >= 5) {
        return res.status(429).json({ error: "Too many attempts, request a new OTP" });
      }
      if (record.code !== code) {
        await pool.query(`UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1`, [record.id]);
        return res.status(400).json({ error: "Incorrect code" });
      }

      await pool.query(`UPDATE otp_codes SET verified = true WHERE id = $1`, [record.id]);
    }

    let { rows: userRows } = await pool.query(`SELECT * FROM users WHERE email = $1`, [normalizedEmail]);
    let user = userRows[0];
    const isNewUser = !user;
    if (!user) {
      const inserted = await pool.query(`INSERT INTO users (email) VALUES ($1) RETURNING *`, [normalizedEmail]);
      user = inserted.rows[0];
    }
    await pool.query(`UPDATE users SET last_login_at = now() WHERE id = $1`, [user.id]);

    const { token, refresh_token } = await issueSession(user, device_id, device_label);

    res.json({
      token,
      refresh_token,
      is_new_user: isNewUser,
      user: {
        id: user.id, phone: user.phone, name: user.name, email: user.email, location: user.location,
        role: user.role, verified_driver: user.verified_driver,
        emergency_contact_name: user.emergency_contact_name, emergency_contact_phone: user.emergency_contact_phone,
        license_image_url: user.license_image_url,
        id_document_image_url: user.id_document_image_url, id_document_type: user.id_document_type,
        id_verification_status: user.id_verification_status, id_verification_note: user.id_verification_note,
        willing_blood_donor: user.willing_blood_donor, blood_group: user.blood_group,
        notification_preferences: user.notification_preferences,
      },
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/refresh   { refresh_token, device_id }
// Exchanges a valid refresh token for a new short-lived access token, and
// rotates the refresh token itself (old one stops working immediately) —
// this limits the damage if a refresh token were ever leaked.
async function refresh(req, res, next) {
  try {
    const { refresh_token, device_id } = req.body;
    if (!refresh_token) return res.status(400).json({ error: "refresh_token is required" });

    const tokenHash = hashToken(refresh_token);
    const { rows } = await pool.query(
      `SELECT * FROM refresh_tokens WHERE token_hash = $1 AND revoked = false`,
      [tokenHash]
    );
    const session = rows[0];
    if (!session || new Date(session.expires_at) < new Date()) {
      return res.status(401).json({ error: "Session expired, please log in again" });
    }

    const { rows: userRows } = await pool.query(`SELECT * FROM users WHERE id = $1`, [session.user_id]);
    const user = userRows[0];
    if (!user) return res.status(401).json({ error: "Account no longer exists" });
    await pool.query(`UPDATE users SET last_login_at = now() WHERE id = $1`, [user.id]);

    // Rotate: issue a new refresh token in place of this one.
    const newRawToken = generateRefreshToken();
    const newExpiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);
    await pool.query(
      `UPDATE refresh_tokens SET token_hash = $1, expires_at = $2, last_used_at = now(), device_id = COALESCE($3, device_id)
       WHERE id = $4`,
      [hashToken(newRawToken), newExpiresAt, device_id, session.id]
    );

    const token = signToken(user);
    res.json({
      token,
      refresh_token: newRawToken,
      user: {
        id: user.id, phone: user.phone, name: user.name, email: user.email, location: user.location,
        role: user.role, verified_driver: user.verified_driver,
        emergency_contact_name: user.emergency_contact_name, emergency_contact_phone: user.emergency_contact_phone,
        license_image_url: user.license_image_url,
        id_document_image_url: user.id_document_image_url, id_document_type: user.id_document_type,
        id_verification_status: user.id_verification_status, id_verification_note: user.id_verification_note,
        willing_blood_donor: user.willing_blood_donor, blood_group: user.blood_group,
        notification_preferences: user.notification_preferences,
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/auth/sessions — list this user's active/remembered devices
async function listSessions(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT id, device_id, device_label, created_at, last_used_at, expires_at
       FROM refresh_tokens WHERE user_id = $1 AND revoked = false AND expires_at > now()
       ORDER BY last_used_at DESC`,
      [req.user.sub]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/auth/sessions/:id — sign out a specific device (or "sign out everywhere")
async function revokeSession(req, res, next) {
  try {
    await pool.query(
      `UPDATE refresh_tokens SET revoked = true WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.sub]
    );
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

const ME_SELECT = `
  id, phone, name, email, location, role, created_at,
  emergency_contact_name, emergency_contact_phone, license_image_url, verified_driver,
  id_document_image_url, id_document_type, id_verification_status, id_verification_note,
  willing_blood_donor, blood_group,
  notification_preferences,
  (SELECT ROUND(AVG(stars)::numeric, 1) FROM ratings WHERE ratee_id = users.id) AS average_rating,
  (SELECT COUNT(*) FROM ratings WHERE ratee_id = users.id) AS rating_count
`;

// GET /api/auth/me
async function getMe(req, res, next) {
  try {
    const { rows } = await pool.query(`SELECT ${ME_SELECT} FROM users WHERE id = $1`, [req.user.sub]);
    if (!rows[0]) return res.status(404).json({ error: "User not found" });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

const VALID_NOTIFICATION_CATEGORIES = ["news", "events", "classifieds", "rides", "blood_donors", "tournaments"];

// PUT /api/auth/me
async function updateMe(req, res, next) {
  try {
    const { name, phone, location, emergency_contact_name, emergency_contact_phone, license_image_url, id_document_image_url, id_document_type, notification_preferences, willing_blood_donor, blood_group } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });
    if (!phone || !isValidPhone(phone)) return res.status(400).json({ error: "Enter a valid 10-digit phone number" });
    if (emergency_contact_phone && !isValidPhone(emergency_contact_phone)) {
      return res.status(400).json({ error: "Enter a valid 10-digit emergency contact number" });
    }
    if (!isValidImageDataUrl(license_image_url)) return res.status(400).json({ error: "Invalid image data" });
    if (!isValidImageDataUrl(id_document_image_url)) return res.status(400).json({ error: "Invalid image data" });
    const VALID_BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
    if (blood_group && !VALID_BLOOD_GROUPS.includes(blood_group)) return res.status(400).json({ error: "Invalid blood group" });

    // Normalize to Title Case ("karthik r" -> "Karthik R") so names display
    // consistently everywhere, regardless of how the person typed it.
    const formattedName = name.trim().replace(/\S+/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());

    let prefsArray = null;
    if (notification_preferences !== undefined) {
      if (!Array.isArray(notification_preferences) || !notification_preferences.every((p) => VALID_NOTIFICATION_CATEGORIES.includes(p))) {
        return res.status(400).json({ error: "Invalid notification preferences" });
      }
      prefsArray = notification_preferences;
    }

    // A fresh ID document submission always resets status to 'pending' — a
    // previous rejection or approval shouldn't silently carry over to a new
    // photo the admin hasn't actually looked at yet.
    const submittingNewId = id_document_image_url !== undefined && id_document_image_url !== null;

    const { rows } = await pool.query(
      `UPDATE users SET
         name = $1, phone = $2, location = COALESCE($3, location),
         emergency_contact_name = COALESCE($4, emergency_contact_name),
         emergency_contact_phone = COALESCE($5, emergency_contact_phone),
         license_image_url = COALESCE($6, license_image_url),
         notification_preferences = COALESCE($7, notification_preferences),
         id_document_image_url = COALESCE($9, id_document_image_url),
         id_document_type = COALESCE($10, id_document_type),
         id_verification_status = CASE WHEN $11 THEN 'pending' ELSE id_verification_status END,
         id_verification_note = CASE WHEN $11 THEN NULL ELSE id_verification_note END,
         willing_blood_donor = COALESCE($12, willing_blood_donor),
         blood_group = COALESCE($13, blood_group)
       WHERE id = $8 RETURNING id`,
      [formattedName, phone, location || null, emergency_contact_name || null, emergency_contact_phone || null, license_image_url || null, prefsArray, req.user.sub, id_document_image_url || null, id_document_type || null, submittingNewId, willing_blood_donor, blood_group || null]
    );
    if (!rows[0]) return res.status(404).json({ error: "User not found" });

    const { rows: full } = await pool.query(`SELECT ${ME_SELECT} FROM users WHERE id = $1`, [req.user.sub]);
    if (!full[0]) return res.status(404).json({ error: "User not found" });

    // Keep the Blood Donors directory in sync with the Profile checkbox —
    // this is the only place that writes a blood_donors row on behalf of a
    // user (as opposed to an admin adding one manually with no user_id).
    if (willing_blood_donor !== undefined) {
      if (willing_blood_donor && full[0].blood_group) {
        await pool.query(
          `INSERT INTO blood_donors (name, blood_group, phone, area, is_available, user_id)
           VALUES ($1,$2,$3,$4,true,$5)
           ON CONFLICT (user_id) WHERE user_id IS NOT NULL DO UPDATE SET name = $1, blood_group = $2, phone = $3, area = $4, is_available = true`,
          [full[0].name, full[0].blood_group, full[0].phone, full[0].location || null, req.user.sub]
        );
      } else if (willing_blood_donor === false) {
        await pool.query(`DELETE FROM blood_donors WHERE user_id = $1`, [req.user.sub]);
      }
    }

    res.json(full[0]);
  } catch (err) {
    next(err);
  }
}

module.exports = { sendOtp, verifyOtp, refresh, listSessions, revokeSession, getMe, updateMe };
