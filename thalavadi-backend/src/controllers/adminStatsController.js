const pool = require("../config/db");

// GET /api/admin/stats — quick counts for the admin overview dashboard
async function getStats(req, res, next) {
  try {
    const queries = {
      users: `SELECT COUNT(*) FROM users`,
      businesses: `SELECT COUNT(*) FROM businesses WHERE is_active = true`,
      classifieds: `SELECT COUNT(*) FROM classifieds WHERE is_active = true AND status = 'active'`,
      events: `SELECT COUNT(*) FROM events WHERE is_active = true AND (COALESCE(end_date, start_date) + COALESCE(end_time, start_time, '23:59:59'::time)) >= now()`,
      rides: `SELECT COUNT(*) FROM ride_requests WHERE is_active = true AND status = 'open'`,
      pendingDrivers: `SELECT COUNT(*) FROM users WHERE license_image_url IS NOT NULL AND verified_driver = false`,
      openFeedback: `SELECT COUNT(*) FROM feedback`,
      urgentNews: `SELECT COUNT(*) FROM news_alerts WHERE is_urgent = true`,
    };
    const entries = await Promise.all(
      Object.entries(queries).map(async ([key, sql]) => [key, Number((await pool.query(sql)).rows[0].count)])
    );
    res.json(Object.fromEntries(entries));
  } catch (err) {
    next(err);
  }
}

module.exports = { getStats };
