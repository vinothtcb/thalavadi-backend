const pool = require("../config/db");
const { notifyUsersForNewPost } = require("../utils/whatsappNotify");
const { slimImages } = require("../utils/images");
const { isValidPhone, isValidImageDataUrl } = require("../utils/validators");

const EVENT_SELECT = `
  e.*, u.name AS poster_name, u.verified_driver,
  (SELECT ROUND(AVG(stars)::numeric, 1) FROM ratings WHERE ratee_id = e.posted_by) AS poster_rating,
  (SELECT COUNT(*) FROM ratings WHERE ratee_id = e.posted_by) AS poster_rating_count
`;

// "Completed" = the event's end (falling back to start if no end given) has
// already passed. Computed live rather than stored, so it's always correct.
const END_MOMENT_SQL = `COALESCE(e.end_date, e.start_date) + COALESCE(e.end_time, e.start_time, '23:59:59'::time)`;

// GET /api/events  (optional ?status=upcoming|completed)
async function listEvents(req, res, next) {
  try {
    const { status } = req.query;
    let query = `SELECT ${EVENT_SELECT} FROM events e JOIN users u ON u.id = e.posted_by WHERE e.is_active = true`;
    if (status === "upcoming") query += ` AND ${END_MOMENT_SQL} >= now()`;
    if (status === "completed") query += ` AND ${END_MOMENT_SQL} < now()`;
    query += ` ORDER BY e.start_date ASC, e.start_time ASC`;
    const { rows } = await pool.query(query);
    res.json(slimImages(rows));
  } catch (err) {
    next(err);
  }
}

// GET /api/events/:id
async function getEvent(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT ${EVENT_SELECT} FROM events e JOIN users u ON u.id = e.posted_by WHERE e.id = $1`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Event not found" });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// UPI IDs look like "name@bankhandle" — a light format check, not a real
// verification (there's no way to confirm a UPI ID is real/active without
// a payment gateway; this just catches obvious typos).
const isValidUpiId = (v) => /^[\w.\-]{2,256}@[a-zA-Z]{2,64}$/.test(v || "");

// POST /api/events   (any logged-in user)
async function createEvent(req, res, next) {
  try {
    const { title, description, location, start_date, start_time, end_date, end_time, contact_name, contact_phone, image_url, is_paid_event, registration_fee, upi_id, upi_qr_image_url } = req.body;
    if (!title || !start_date || !end_date) return res.status(400).json({ error: "title, start_date and end_date are required" });
    if (contact_phone && !isValidPhone(contact_phone)) return res.status(400).json({ error: "Enter a valid 10-digit contact phone number" });
    if (!isValidImageDataUrl(image_url)) return res.status(400).json({ error: "Invalid image data" });
    if (!isValidImageDataUrl(upi_qr_image_url)) return res.status(400).json({ error: "Invalid QR code image" });
    if (is_paid_event) {
      if (!registration_fee || !String(registration_fee).trim()) return res.status(400).json({ error: "Registration fee is required for a paid event" });
      if (!upi_id || !isValidUpiId(upi_id)) return res.status(400).json({ error: "Enter a valid UPI ID, e.g. name@upi" });
    }

    const { rows } = await pool.query(
      `INSERT INTO events (title, description, location, start_date, start_time, end_date, end_time, contact_name, contact_phone, image_url, is_paid_event, registration_fee, upi_id, upi_qr_image_url, posted_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [title, description, location, start_date, start_time || null, end_date, end_time || null, contact_name, contact_phone, image_url,
        !!is_paid_event, is_paid_event ? registration_fee : null, is_paid_event ? upi_id : null, is_paid_event ? (upi_qr_image_url || null) : null, req.user.sub]
    );
    res.status(201).json(rows[0]);
    notifyUsersForNewPost("events", `New event: ${title}`, location ? `Venue: ${location}` : "");
  } catch (err) {
    next(err);
  }
}

async function canModify(req) {
  const { rows } = await pool.query(`SELECT posted_by FROM events WHERE id = $1`, [req.params.id]);
  if (!rows[0]) return { found: false };
  return { found: true, allowed: rows[0].posted_by === req.user.sub || req.user.role === "admin" };
}

// PUT /api/events/:id
async function updateEvent(req, res, next) {
  try {
    const check = await canModify(req);
    if (!check.found) return res.status(404).json({ error: "Event not found" });
    if (!check.allowed) return res.status(403).json({ error: "Not allowed to edit this event" });

    const fields = ["title", "description", "location", "start_date", "start_time", "end_date", "end_time", "contact_name", "contact_phone", "image_url", "is_active", "is_paid_event", "registration_fee", "upi_id", "upi_qr_image_url"];
    const updates = []; const values = [];
    fields.forEach((f) => { if (req.body[f] !== undefined) { values.push(req.body[f]); updates.push(`${f} = $${values.length}`); } });
    if (updates.length === 0) return res.status(400).json({ error: "No fields to update" });

    values.push(req.params.id);
    const { rows } = await pool.query(`UPDATE events SET ${updates.join(", ")} WHERE id = $${values.length} RETURNING *`, values);
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/events/:id
async function deleteEvent(req, res, next) {
  try {
    const check = await canModify(req);
    if (!check.found) return res.status(404).json({ error: "Event not found" });
    if (!check.allowed) return res.status(403).json({ error: "Not allowed to delete this event" });

    await pool.query(`DELETE FROM events WHERE id = $1`, [req.params.id]);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { listEvents, getEvent, createEvent, updateEvent, deleteEvent };
