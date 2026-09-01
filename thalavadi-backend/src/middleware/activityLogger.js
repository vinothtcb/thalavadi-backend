const pool = require("../config/db");

// Logs write actions (POST/PUT/DELETE) for admin visibility. Runs on every
// /api request but only records the ones that changed something. Reads
// req.user AFTER the response finishes, so it still captures the user even
// though auth middleware runs later in the chain (req is shared by reference).
function activityLogger(req, res, next) {
  res.on("finish", () => {
    if (["POST", "PUT", "DELETE"].includes(req.method) && res.statusCode < 500) {
      pool
        .query(
          `INSERT INTO activity_logs (user_id, phone, action, details) VALUES ($1,$2,$3,$4)`,
          [req.user?.sub || null, req.user?.phone || null, `${req.method} ${req.originalUrl}`, `status ${res.statusCode}`]
        )
        .catch(() => {}); // logging must never break the actual request
    }
  });
  next();
}

module.exports = activityLogger;
