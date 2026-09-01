const pool = require("../config/db");
const { notifyUsersForNewPost } = require("../utils/whatsappNotify");

// GET /api/blood-donors  (optional ?group=O+)
async function listDonors(req, res, next) {
  try {
    const { group } = req.query;
    const params = [];
    let query = `SELECT * FROM blood_donors WHERE is_available = true`;

    if (group) {
      params.push(group);
      query += ` AND blood_group = $${params.length}`;
    }
    query += ` ORDER BY blood_group ASC, name ASC`;

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// POST /api/blood-donors   (register as a donor — open to any logged-in user)
async function addDonor(req, res, next) {
  try {
    const { name, blood_group, phone, area } = req.body;
    if (!name || !blood_group || !phone) {
      return res.status(400).json({ error: "name, blood_group and phone are required" });
    }
    const { rows } = await pool.query(
      `INSERT INTO blood_donors (name, blood_group, phone, area) VALUES ($1,$2,$3,$4) RETURNING *`,
      [name, blood_group, phone, area]
    );
    // Keep the poster's own profile in sync — registering here means they've
    // told us they're willing, so Profile should reflect that automatically
    // rather than asking them to set it separately.
    await pool.query(`UPDATE users SET willing_blood_donor = true, blood_group = COALESCE(blood_group, $1) WHERE id = $2`, [blood_group, req.user.sub]);
    res.status(201).json(rows[0]);
    notifyUsersForNewPost("blood_donors", `New blood donor registered: ${name}`, blood_group ? `Blood group: ${blood_group}` : "");
  } catch (err) {
    next(err);
  }
}

// PUT /api/blood-donors/:id   (admin only)
async function updateDonor(req, res, next) {
  try {
    const fields = ["name", "blood_group", "phone", "area", "is_available"];
    const updates = []; const values = [];
    fields.forEach((f) => { if (req.body[f] !== undefined) { values.push(req.body[f]); updates.push(`${f} = $${values.length}`); } });
    if (updates.length === 0) return res.status(400).json({ error: "No fields to update" });
    values.push(req.params.id);
    const { rows } = await pool.query(`UPDATE blood_donors SET ${updates.join(", ")} WHERE id = $${values.length} RETURNING *`, values);
    if (!rows[0]) return res.status(404).json({ error: "Donor not found" });
    res.json(rows[0]);
  } catch (err) { next(err); }
}

// DELETE /api/blood-donors/:id   (admin only)
async function deleteDonor(req, res, next) {
  try {
    await pool.query(`DELETE FROM blood_donors WHERE id = $1`, [req.params.id]);
    res.status(204).send();
  } catch (err) { next(err); }
}

module.exports = { listDonors, addDonor, updateDonor, deleteDonor };
