const pool = require("../config/db");
const { slimImages } = require("../utils/images");
const { isValidPhone, isValidImageDataUrl, normalizeVehicleNumber, isValidVehicleNumberFormat } = require("../utils/validators");
const { verifyVehicleWithAuthorizedSource } = require("../utils/vehicleVerification");
const { notifyUsersForNewPost } = require("../utils/whatsappNotify");

// GET /api/classifieds  (optional ?type=job&search=)
async function listClassifieds(req, res, next) {
  try {
    const { type, search } = req.query;
    const params = [];
    let query = `SELECT c.*, u.name AS poster_name, u.id_verification_status AS poster_id_verification_status FROM classifieds c LEFT JOIN users u ON u.id = c.posted_by WHERE c.is_active = true`;

    if (type) {
      params.push(type);
      query += ` AND c.type = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (c.title ILIKE $${params.length} OR c.description ILIKE $${params.length})`;
    }
    query += ` ORDER BY c.created_at DESC`;

    const { rows } = await pool.query(query, params);
    res.json(slimImages(rows));
  } catch (err) {
    next(err);
  }
}

// GET /api/classifieds/:id
async function getClassified(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT c.*, u.name AS poster_name, u.id_verification_status AS poster_id_verification_status FROM classifieds c LEFT JOIN users u ON u.id = c.posted_by WHERE c.id = $1`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Listing not found" });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// POST /api/classifieds   (any logged-in user)
async function createClassified(req, res, next) {
  try {
    const { type, title, description, price, location, contact_name, contact_phone, details, image_url, latitude, longitude } = req.body;
    if (!type || !title || !contact_phone) {
      return res.status(400).json({ error: "type, title and contact_phone are required" });
    }
    if (!isValidPhone(contact_phone)) return res.status(400).json({ error: "Enter a valid 10-digit contact phone number" });
    if (!isValidImageDataUrl(image_url)) return res.status(400).json({ error: "Invalid image data" });

    let finalDetails = details || null;
    let verificationStatus = null;
    let verificationNote = null;
    if (type === "auto_cab") {
      const regNumber = details?.vehicle_registration_number;
      if (!regNumber) return res.status(400).json({ error: "Vehicle registration number is required" });
      const normalized = normalizeVehicleNumber(regNumber);
      if (!isValidVehicleNumberFormat(normalized)) {
        return res.status(400).json({ error: "Enter a valid vehicle registration number, e.g. TN36AB1234" });
      }
      finalDetails = { ...details, vehicle_registration_number: normalized };
      const verification = await verifyVehicleWithAuthorizedSource(normalized, details?.vehicle_type);
      verificationStatus = verification.status;
      verificationNote = verification.note;
    }

    const { rows } = await pool.query(
      `INSERT INTO classifieds (type, title, description, price, location, contact_name, contact_phone, details, image_url, latitude, longitude, vehicle_verification_status, vehicle_verification_note, posted_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [type, title, description, price, location, contact_name, contact_phone, finalDetails, image_url, latitude || null, longitude || null, verificationStatus, verificationNote, req.user.sub]
    );
    res.status(201).json(rows[0]);
    notifyUsersForNewPost("classifieds", `New ${type} listing: ${title}`, location ? `Location: ${location}` : "");
  } catch (err) {
    next(err);
  }
}

// Shared check: only the person who posted it, or an admin, may edit/delete
async function canModify(req) {
  const { rows } = await pool.query(`SELECT posted_by FROM classifieds WHERE id = $1`, [req.params.id]);
  if (!rows[0]) return { found: false };
  const isOwner = rows[0].posted_by === req.user.sub;
  const isAdmin = req.user.role === "admin";
  return { found: true, allowed: isOwner || isAdmin };
}

// PUT /api/classifieds/:id
async function updateClassified(req, res, next) {
  try {
    const check = await canModify(req);
    if (!check.found) return res.status(404).json({ error: "Listing not found" });
    if (!check.allowed) return res.status(403).json({ error: "Not allowed to edit this listing" });

    const fields = ["title", "description", "price", "location", "contact_name", "contact_phone", "details", "image_url", "latitude", "longitude", "is_active", "status"];
    if (req.user.role === "admin") fields.push("vehicle_verification_status", "vehicle_verification_note");
    const updates = [];
    const values = [];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) {
        values.push(req.body[f]);
        updates.push(`${f} = $${values.length}`);
      }
    });
    if (updates.length === 0) return res.status(400).json({ error: "No fields to update" });

    values.push(req.params.id);
    const { rows } = await pool.query(
      `UPDATE classifieds SET ${updates.join(", ")} WHERE id = $${values.length} RETURNING *`,
      values
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/classifieds/:id
async function deleteClassified(req, res, next) {
  try {
    const check = await canModify(req);
    if (!check.found) return res.status(404).json({ error: "Listing not found" });
    if (!check.allowed) return res.status(403).json({ error: "Not allowed to delete this listing" });

    await pool.query(`DELETE FROM classifieds WHERE id = $1`, [req.params.id]);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { listClassifieds, getClassified, createClassified, updateClassified, deleteClassified };
