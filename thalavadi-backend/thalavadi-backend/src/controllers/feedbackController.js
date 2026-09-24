const pool = require("../config/db");
const { isValidPhone } = require("../utils/validators");

// POST /api/feedback
async function submitFeedback(req, res, next) {
  try {
    const { name, phone, message } = req.body;
    if (!message) return res.status(400).json({ error: "message is required" });
    if (phone && !isValidPhone(phone)) return res.status(400).json({ error: "Enter a valid 10-digit phone number" });
    const { rows } = await pool.query(
      `INSERT INTO feedback (user_id, name, phone, message) VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.user?.sub || null, name, phone, message]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// GET /api/feedback   (admin only)
async function listFeedback(req, res, next) {
  try {
    const { rows } = await pool.query(`SELECT * FROM feedback ORDER BY created_at DESC`);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

module.exports = { submitFeedback, listFeedback };
