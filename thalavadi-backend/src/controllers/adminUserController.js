const pool = require("../config/db");

// GET /api/admin/users?hasLicense=true&activeOnly=true&idVerificationStatus=pending&hasIdDocument=true
async function listUsers(req, res, next) {
  try {
    const { hasLicense, activeOnly, idVerificationStatus, hasIdDocument } = req.query;
    let query = `SELECT id, phone, name, email, location, role, verified_driver, license_image_url, id_document_image_url, id_document_type, id_verification_status, id_verification_note, created_at, last_login_at FROM users WHERE 1=1`;
    const params = [];
    if (hasLicense === "true") query += ` AND license_image_url IS NOT NULL`;
    if (activeOnly === "true") query += ` AND last_login_at > now() - interval '7 days'`;
    if (idVerificationStatus) { params.push(idVerificationStatus); query += ` AND id_verification_status = $${params.length}`; }
    if (hasIdDocument === "true") query += ` AND id_document_image_url IS NOT NULL`;
    query += ` ORDER BY last_login_at DESC`;
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// PUT /api/admin/users/:id/verify-driver   { verified: true|false }
async function setDriverVerified(req, res, next) {
  try {
    const { verified } = req.body;
    const { rows } = await pool.query(
      `UPDATE users SET verified_driver = $1 WHERE id = $2 RETURNING id, name, phone, verified_driver`,
      [!!verified, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "User not found" });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// PUT /api/admin/users/:id/verify-id   { status: 'verified'|'rejected', note?: string }
// Manual review of a self-uploaded government ID photo (Aadhaar, Voter ID,
// etc.) — see vehicleVerification.js for why this is manual rather than an
// automated Aadhaar API integration: there isn't a public one, and private
// use of Aadhaar authentication is legally restricted in India outside of
// licensed intermediaries.
async function setIdVerification(req, res, next) {
  try {
    const { status, note } = req.body;
    if (!["verified", "rejected"].includes(status)) {
      return res.status(400).json({ error: "status must be 'verified' or 'rejected'" });
    }
    const { rows } = await pool.query(
      `UPDATE users SET id_verification_status = $1, id_verification_note = $2 WHERE id = $3
       RETURNING id, name, phone, id_verification_status, id_verification_note`,
      [status, note || null, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "User not found" });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

module.exports = { listUsers, setDriverVerified, setIdVerification };
