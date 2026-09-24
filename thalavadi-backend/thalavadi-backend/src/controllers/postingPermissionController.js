const pool = require("../config/db");

// GET /api/posting-permissions — public, so the app can gate "Add/Post"
// buttons for regular users without needing to be logged in first.
async function listPermissions(req, res, next) {
  try {
    const { rows } = await pool.query(`SELECT type_key, label, allowed FROM posting_permissions ORDER BY label ASC`);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// PUT /api/admin/posting-permissions/:type_key   { allowed: true|false }
async function setPermission(req, res, next) {
  try {
    const { allowed } = req.body;
    const { rows } = await pool.query(
      `UPDATE posting_permissions SET allowed = $1, updated_at = now() WHERE type_key = $2 RETURNING *`,
      [!!allowed, req.params.type_key]
    );
    if (!rows[0]) return res.status(404).json({ error: "Unknown content type" });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

module.exports = { listPermissions, setPermission };
