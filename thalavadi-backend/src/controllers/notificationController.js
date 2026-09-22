const pool = require("../config/db");

// Maps a user's chosen notification_preferences category to the query that
// counts "new since last read" items in that category.
const CATEGORY_COUNT_QUERIES = {
  news: `SELECT COUNT(*) FROM news_alerts WHERE created_at > $1`,
  events: `SELECT COUNT(*) FROM events WHERE is_active = true AND created_at > $1`,
  classifieds: `SELECT COUNT(*) FROM classifieds WHERE is_active = true AND created_at > $1`,
  rides: `SELECT COUNT(*) FROM ride_requests WHERE is_active = true AND status = 'open' AND created_at > $1`,
  blood_donors: `SELECT COUNT(*) FROM blood_donors WHERE created_at > $1`,
};

// Finer-grained than CATEGORY_COUNT_QUERIES — one entry per dashboard tile
// that has a distinct sub-type, so each tile can show its own count rather
// than one lump sum. Keyed by the tile's own identifier (ride_type /
// classified type / etc.), gated by the same broad preference category.
const TILE_COUNT_QUERIES = {
  return_pickup: { pref: "rides", sql: `SELECT COUNT(*) FROM ride_requests WHERE ride_type = 'return_pickup' AND status = 'open' AND created_at > $1` },
  carpool: { pref: "rides", sql: `SELECT COUNT(*) FROM ride_requests WHERE ride_type = 'carpool' AND status = 'open' AND created_at > $1` },
  job: { pref: "classifieds", sql: `SELECT COUNT(*) FROM classifieds WHERE type = 'job' AND is_active = true AND created_at > $1` },
  rental: { pref: "classifieds", sql: `SELECT COUNT(*) FROM classifieds WHERE type = 'rental' AND is_active = true AND created_at > $1` },
  property: { pref: "classifieds", sql: `SELECT COUNT(*) FROM classifieds WHERE type = 'property' AND is_active = true AND created_at > $1` },
  auto_cab: { pref: "classifieds", sql: `SELECT COUNT(*) FROM classifieds WHERE type = 'auto_cab' AND is_active = true AND created_at > $1` },
  event: { pref: "events", sql: `SELECT COUNT(*) FROM events WHERE is_active = true AND created_at > $1` },
  news: { pref: "news", sql: `SELECT COUNT(*) FROM news_alerts WHERE created_at > $1` },
  blood: { pref: "blood_donors", sql: `SELECT COUNT(*) FROM blood_donors WHERE created_at > $1` },
};

// GET /api/notifications/unread-breakdown — one count per dashboard tile,
// for the tiles the user actually opted into. Each tile's count is "since
// that specific tile was last opened" (tile_read_status), falling back to
// the account-wide last_notifications_read_at for tiles never individually
// viewed — so a brand new user doesn't see inflated counts for everything
// that existed before they signed up.
async function getUnreadBreakdown(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT notification_preferences, last_notifications_read_at FROM users WHERE id = $1`,
      [req.user.sub]
    );
    const user = rows[0];
    if (!user) return res.status(404).json({ error: "User not found" });
    const prefs = user.notification_preferences || [];

    const { rows: tileReads } = await pool.query(
      `SELECT tile_key, last_read_at FROM tile_read_status WHERE user_id = $1`,
      [req.user.sub]
    );
    const tileReadMap = Object.fromEntries(tileReads.map((r) => [r.tile_key, r.last_read_at]));

    const entries = Object.entries(TILE_COUNT_QUERIES).filter(([, v]) => prefs.includes(v.pref));
    const results = await Promise.all(entries.map(([key, v]) => {
      const since = tileReadMap[key] || user.last_notifications_read_at;
      return pool.query(v.sql, [since]).then((r) => [key, Number(r.rows[0].count)]);
    }));
    res.json(Object.fromEntries(results));
  } catch (err) {
    next(err);
  }
}

// GET /api/notifications/unread-count
async function getUnreadCount(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT notification_preferences, last_notifications_read_at FROM users WHERE id = $1`,
      [req.user.sub]
    );
    const user = rows[0];
    if (!user) return res.status(404).json({ error: "User not found" });

    const prefs = user.notification_preferences || [];
    if (prefs.length === 0) return res.json({ count: 0 });

    const counts = await Promise.all(
      prefs.filter((p) => CATEGORY_COUNT_QUERIES[p]).map((p) => pool.query(CATEGORY_COUNT_QUERIES[p], [user.last_notifications_read_at]))
    );
    const total = counts.reduce((sum, r) => sum + Number(r.rows[0].count), 0);
    res.json({ count: total });
  } catch (err) {
    next(err);
  }
}

// POST /api/notifications/mark-read — call when the user opens their
// notifications, so the dashboard badge count drops back to reflect what's
// actually new since they last looked.
async function markRead(req, res, next) {
  try {
    await pool.query(`UPDATE users SET last_notifications_read_at = now() WHERE id = $1`, [req.user.sub]);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// POST /api/notifications/mark-tile-read   { tile_key }
// Call when a specific tile's screen is opened — clears just that tile's
// badge, leaving every other tile's count untouched.
async function markTileRead(req, res, next) {
  try {
    const { tile_key } = req.body;
    if (!tile_key || !TILE_COUNT_QUERIES[tile_key]) return res.status(400).json({ error: "Invalid tile_key" });
    await pool.query(
      `INSERT INTO tile_read_status (user_id, tile_key, last_read_at) VALUES ($1, $2, now())
       ON CONFLICT (user_id, tile_key) DO UPDATE SET last_read_at = now()`,
      [req.user.sub, tile_key]
    );
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { getUnreadCount, getUnreadBreakdown, markRead, markTileRead };
