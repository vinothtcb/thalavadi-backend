const pool = require("../config/db");
const { notifyUsersForNewPost } = require("../utils/whatsappNotify");
const { slimImages } = require("../utils/images");
const { isValidPhone, isValidImageDataUrl, isValidLatitude, isValidLongitude, normalizeVehicleNumber, isValidVehicleNumberFormat } = require("../utils/validators");
const { verifyVehicleWithAuthorizedSource } = require("../utils/vehicleVerification");

// Includes the poster's trust signals (verified badge + rating average) so
// the app can show them directly on each listing without extra requests.
const RIDE_SELECT = `
  r.*, u.name AS poster_name, u.verified_driver, u.id_verification_status AS poster_id_verification_status,
  (SELECT ROUND(AVG(stars)::numeric, 1) FROM ratings WHERE ratee_id = r.posted_by) AS poster_rating,
  (SELECT COUNT(*) FROM ratings WHERE ratee_id = r.posted_by) AS poster_rating_count
`;

// GET /api/ride-requests  (optional ?type=return_pickup|carpool)
async function listRides(req, res, next) {
  try {
    const { type, search } = req.query;
    const params = [];
    let query = `SELECT ${RIDE_SELECT} FROM ride_requests r JOIN users u ON u.id = r.posted_by WHERE r.is_active = true`;
    if (type) { params.push(type); query += ` AND r.ride_type = $${params.length}`; }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (r.title ILIKE $${params.length} OR r.pickup_name ILIKE $${params.length} OR r.drop_name ILIKE $${params.length})`;
    }
    query += ` ORDER BY (r.status = 'open') DESC, r.created_at DESC`; // active listings first, completed/cancelled last
    const { rows } = await pool.query(query, params);
    res.json(slimImages(rows));
  } catch (err) {
    next(err);
  }
}

// GET /api/ride-requests/:id
async function getRide(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT ${RIDE_SELECT} FROM ride_requests r JOIN users u ON u.id = r.posted_by WHERE r.id = $1`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Ride request not found" });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// POST /api/ride-requests   (verified drivers only)
async function createRide(req, res, next) {
  try {
    const { rows: userRows } = await pool.query(`SELECT verified_driver, license_image_url FROM users WHERE id = $1`, [req.user.sub]);
    const requester = userRows[0];
    if (!requester?.verified_driver) {
      return res.status(403).json({
        error: requester?.license_image_url
          ? "Your license is still pending admin verification. You'll be able to post once approved."
          : "Please upload your driving license in Profile and get admin-verified before posting a ride.",
      });
    }

    const {
      ride_type, title, description,
      pickup_name, pickup_lat, pickup_lng,
      drop_name, drop_lat, drop_lng,
      distance_km, price, negotiable, travel_date, travel_time, end_date, end_time, seats_available,
      vehicle_type, vehicle_registration_number, travelling_status,
      contact_name, contact_phone, image_url,
    } = req.body;

    if (!ride_type || !title || !pickup_name || !drop_name || !contact_phone || !end_date || !end_time) {
      return res.status(400).json({ error: "ride_type, title, pickup_name, drop_name, contact_phone, end_date and end_time are required" });
    }
    if (pickup_name.trim().toLowerCase() === drop_name.trim().toLowerCase()) {
      return res.status(400).json({ error: "Starting From and Going To can't be the same place" });
    }
    if (!isValidPhone(contact_phone)) return res.status(400).json({ error: "Enter a valid 10-digit contact phone number" });
    if (!isValidLatitude(pickup_lat) || !isValidLatitude(drop_lat)) return res.status(400).json({ error: "Invalid latitude" });
    if (!isValidLongitude(pickup_lng) || !isValidLongitude(drop_lng)) return res.status(400).json({ error: "Invalid longitude" });
    if (!isValidImageDataUrl(image_url)) return res.status(400).json({ error: "Invalid image data" });

    if (!vehicle_registration_number) return res.status(400).json({ error: "Vehicle registration number is required" });
    const normalizedRegNumber = normalizeVehicleNumber(vehicle_registration_number);
    if (!isValidVehicleNumberFormat(normalizedRegNumber)) {
      return res.status(400).json({ error: "Enter a valid vehicle registration number, e.g. TN36AB1234" });
    }
    const verification = await verifyVehicleWithAuthorizedSource(normalizedRegNumber, vehicle_type);

    const { rows } = await pool.query(
      `INSERT INTO ride_requests
        (ride_type, title, description, pickup_name, pickup_lat, pickup_lng, drop_name, drop_lat, drop_lng,
         distance_km, price, negotiable, travel_date, travel_time, end_date, end_time, seats_available, vehicle_type, vehicle_registration_number, vehicle_verification_status, vehicle_verification_note, travelling_status,
         contact_name, contact_phone, image_url, posted_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26) RETURNING *`,
      [ride_type, title, description, pickup_name, pickup_lat || null, pickup_lng || null,
        drop_name, drop_lat || null, drop_lng || null, distance_km || null, price, !!negotiable,
        travel_date || null, travel_time || null, end_date || travel_date || null, end_time || null, seats_available || null,
        vehicle_type || null, normalizedRegNumber, verification.status, verification.note, travelling_status || null,
        contact_name, contact_phone, image_url, req.user.sub]
    );
    res.status(201).json(rows[0]);
    notifyUsersForNewPost("rides", `New ${ride_type === "carpool" ? "Car Pooling" : "Return Pickup"} listing: ${title}`, `${pickup_name} to ${drop_name}`);
  } catch (err) {
    next(err);
  }
}

async function canModify(req) {
  const { rows } = await pool.query(`SELECT posted_by FROM ride_requests WHERE id = $1`, [req.params.id]);
  if (!rows[0]) return { found: false };
  return { found: true, allowed: rows[0].posted_by === req.user.sub || req.user.role === "admin" };
}

// PUT /api/ride-requests/:id
async function updateRide(req, res, next) {
  try {
    const check = await canModify(req);
    if (!check.found) return res.status(404).json({ error: "Ride request not found" });
    if (!check.allowed) return res.status(403).json({ error: "Not allowed to edit this listing" });

    const fields = [
      "title", "description", "pickup_name", "pickup_lat", "pickup_lng",
      "drop_name", "drop_lat", "drop_lng", "distance_km", "price", "negotiable",
      "travel_date", "travel_time", "end_date", "end_time", "seats_available", "vehicle_type", "vehicle_registration_number", "travelling_status",
      "contact_name", "contact_phone", "image_url", "is_active", "status",
    ];
    if (req.body.pickup_name && req.body.drop_name && req.body.pickup_name.trim().toLowerCase() === req.body.drop_name.trim().toLowerCase()) {
      return res.status(400).json({ error: "Starting From and Going To can't be the same place" });
    }
    if (req.user.role === "admin") fields.push("vehicle_verification_status", "vehicle_verification_note");
    const updates = []; const values = [];
    if (req.body.vehicle_registration_number !== undefined) {
      const normalized = normalizeVehicleNumber(req.body.vehicle_registration_number);
      if (!isValidVehicleNumberFormat(normalized)) return res.status(400).json({ error: "Enter a valid vehicle registration number, e.g. TN36AB1234" });
      req.body.vehicle_registration_number = normalized;
      // A changed number needs re-verification — unless an admin is the one making the edit.
      if (req.user.role !== "admin" && !fields.includes("vehicle_verification_status")) {
        req.body.vehicle_verification_status = "pending";
        req.body.vehicle_verification_note = null;
        fields.push("vehicle_verification_status", "vehicle_verification_note");
      }
    }
    fields.forEach((f) => { if (req.body[f] !== undefined) { values.push(req.body[f]); updates.push(`${f} = $${values.length}`); } });

    // Marking a listing "completed" also stamps completed_at automatically.
    if (req.body.status === "completed") { updates.push(`completed_at = now()`); }

    if (updates.length === 0) return res.status(400).json({ error: "No fields to update" });

    values.push(req.params.id);
    const { rows } = await pool.query(`UPDATE ride_requests SET ${updates.join(", ")} WHERE id = $${values.length} RETURNING *`, values);
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/ride-requests/:id
async function deleteRide(req, res, next) {
  try {
    const check = await canModify(req);
    if (!check.found) return res.status(404).json({ error: "Ride request not found" });
    if (!check.allowed) return res.status(403).json({ error: "Not allowed to delete this listing" });

    await pool.query(`DELETE FROM ride_requests WHERE id = $1`, [req.params.id]);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { listRides, getRide, createRide, updateRide, deleteRide };
