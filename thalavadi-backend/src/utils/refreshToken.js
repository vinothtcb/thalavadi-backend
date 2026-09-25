const crypto = require("crypto");

// Refresh tokens are random opaque strings — only their SHA-256 hash is
// stored in the database, so a stolen database dump can't be used to log
// in as anyone (same principle as password hashing, applied to sessions).

function generateRefreshToken() {
  return crypto.randomBytes(48).toString("hex");
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

module.exports = { generateRefreshToken, hashToken };
