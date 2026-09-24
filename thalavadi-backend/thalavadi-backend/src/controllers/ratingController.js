const pool = require("../config/db");

// POST /api/ratings   { ratee_id, context_type, context_id, stars, review_text }
async function createRating(req, res, next) {
  try {
    const { ratee_id, context_type, context_id, stars, review_text } = req.body;
    if (!ratee_id || !context_type || !context_id || !stars) {
      return res.status(400).json({ error: "ratee_id, context_type, context_id and stars are required" });
    }
    if (stars < 1 || stars > 5) return res.status(400).json({ error: "stars must be between 1 and 5" });
    if (ratee_id === req.user.sub) return res.status(400).json({ error: "You can't rate yourself" });

    const { rows } = await pool.query(
      `INSERT INTO ratings (ratee_id, rater_id, context_type, context_id, stars, review_text)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (rater_id, context_type, context_id) DO UPDATE SET stars = $5, review_text = $6
       RETURNING *`,
      [ratee_id, req.user.sub, context_type, context_id, stars, review_text || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// GET /api/ratings?ratee_id=...
async function listRatings(req, res, next) {
  try {
    const { ratee_id } = req.query;
    if (!ratee_id) return res.status(400).json({ error: "ratee_id is required" });
    const { rows } = await pool.query(
      `SELECT r.*, u.name AS rater_name FROM ratings r JOIN users u ON u.id = r.rater_id
       WHERE r.ratee_id = $1 ORDER BY r.created_at DESC`,
      [ratee_id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// GET /api/ratings/mine?context_type=business&context_id=...  (requireAuth)
async function checkMyRating(req, res, next) {
  try {
    const { context_type, context_id } = req.query;
    if (!context_type || !context_id) return res.status(400).json({ error: "context_type and context_id are required" });
    const { rows } = await pool.query(
      `SELECT id, stars FROM ratings WHERE rater_id = $1 AND context_type = $2 AND context_id = $3`,
      [req.user.sub, context_type, context_id]
    );
    res.json({ rated: !!rows[0], stars: rows[0]?.stars || null });
  } catch (err) {
    next(err);
  }
}

module.exports = { createRating, listRatings, checkMyRating };
