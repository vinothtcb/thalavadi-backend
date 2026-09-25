const pool = require("../config/db");
const { notifyUsersForNewPost } = require("../utils/whatsappNotify");
const { slimImages } = require("../utils/images");

// GET /api/news
async function listAlerts(req, res, next) {
  try {
    const { rows } = await pool.query(`SELECT * FROM news_alerts ORDER BY is_urgent DESC, created_at DESC`);
    res.json(slimImages(rows));
  } catch (err) {
    next(err);
  }
}

// POST /api/news   (admin only)
async function createAlert(req, res, next) {
  try {
    const { title, body, is_urgent, image_url } = req.body;
    if (!title) return res.status(400).json({ error: "title is required" });
    const { rows } = await pool.query(
      `INSERT INTO news_alerts (title, body, is_urgent, image_url, posted_by) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [title, body, !!is_urgent, image_url, req.user.sub]
    );
    res.status(201).json(rows[0]);
    notifyUsersForNewPost("news", `${title}`, "");
  } catch (err) {
    next(err);
  }
}

// PUT /api/news/:id   (admin only)
async function updateAlert(req, res, next) {
  try {
    const fields = ["title", "body", "is_urgent", "image_url"];
    const updates = []; const values = [];
    fields.forEach((f) => { if (req.body[f] !== undefined) { values.push(req.body[f]); updates.push(`${f} = $${values.length}`); } });
    if (updates.length === 0) return res.status(400).json({ error: "No fields to update" });
    values.push(req.params.id);
    const { rows } = await pool.query(`UPDATE news_alerts SET ${updates.join(", ")} WHERE id = $${values.length} RETURNING *`, values);
    if (!rows[0]) return res.status(404).json({ error: "Alert not found" });
    res.json(rows[0]);
  } catch (err) { next(err); }
}

// DELETE /api/news/:id   (admin only)
async function deleteAlert(req, res, next) {
  try {
    await pool.query(`DELETE FROM news_alerts WHERE id = $1`, [req.params.id]);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { listAlerts, createAlert, updateAlert, deleteAlert };
