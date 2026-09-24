const pool = require("../config/db");

// GET /api/admin/logs/activity?limit=50&offset=0
async function listActivityLogs(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Number(req.query.offset) || 0;
    const { rows } = await pool.query(
      `SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/logs/errors?limit=50&offset=0
async function listErrorLogs(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Number(req.query.offset) || 0;
    const { rows } = await pool.query(
      `SELECT * FROM error_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/logs/archive?source_table=events&limit=50&offset=0
async function listArchivedListings(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Number(req.query.offset) || 0;
    const { source_table } = req.query;
    const params = [];
    let query = `SELECT id, source_table, original_id, title, archived_at FROM archived_listings WHERE 1=1`;
    if (source_table) { params.push(source_table); query += ` AND source_table = $${params.length}`; }
    params.push(limit, offset);
    query += ` ORDER BY archived_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

module.exports = { listActivityLogs, listErrorLogs, listArchivedListings };
