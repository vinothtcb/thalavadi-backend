const pool = require("../config/db");

function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;

  pool
    .query(
      `INSERT INTO error_logs (message, path, method, status_code) VALUES ($1,$2,$3,$4)`,
      [err.message || "Unknown error", req.originalUrl, req.method, status]
    )
    .catch(() => {}); // logging must never break the error response

  res.status(status).json({ error: err.message || "Internal server error" });
}

module.exports = errorHandler;
