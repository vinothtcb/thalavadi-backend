const pool = require("../config/db");

// GET /api/admin/whatsapp-log?category=rides&limit=50&offset=0
async function listWhatsappLog(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Number(req.query.offset) || 0;
    const { category } = req.query;
    const params = [];
    let query = `SELECT * FROM whatsapp_notification_log WHERE 1=1`;
    if (category) { params.push(category); query += ` AND category = $${params.length}`; }
    params.push(limit, offset);
    query += ` ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

module.exports = { listWhatsappLog };
