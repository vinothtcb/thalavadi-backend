const pool = require("../config/db");
const { slimImages } = require("../utils/images");

// GET /api/emergency-contacts  (optional ?category=ambulance)
async function listContacts(req, res, next) {
  try {
    const { category } = req.query;
    const params = [];
    let query = `SELECT * FROM emergency_contacts WHERE 1=1`;
    if (category) { params.push(category); query += ` AND category = $${params.length}`; }
    query += ` ORDER BY category ASC, name ASC`;
    const { rows } = await pool.query(query, params);
    res.json(slimImages(rows));
  } catch (err) { next(err); }
}

// POST /api/emergency-contacts   (admin only)
async function createContact(req, res, next) {
  try {
    const { name, category, phone, address, image_url } = req.body;
    if (!name || !category || !phone) return res.status(400).json({ error: "name, category and phone are required" });
    const { rows } = await pool.query(
      `INSERT INTO emergency_contacts (name, category, phone, address, image_url) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [name, category, phone, address, image_url]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
}

// PUT /api/emergency-contacts/:id   (admin only)
async function updateContact(req, res, next) {
  try {
    const fields = ["name", "category", "phone", "address", "image_url"];
    const updates = []; const values = [];
    fields.forEach((f) => { if (req.body[f] !== undefined) { values.push(req.body[f]); updates.push(`${f} = $${values.length}`); } });
    if (updates.length === 0) return res.status(400).json({ error: "No fields to update" });
    values.push(req.params.id);
    const { rows } = await pool.query(`UPDATE emergency_contacts SET ${updates.join(", ")} WHERE id = $${values.length} RETURNING *`, values);
    if (!rows[0]) return res.status(404).json({ error: "Contact not found" });
    res.json(rows[0]);
  } catch (err) { next(err); }
}

// DELETE /api/emergency-contacts/:id   (admin only)
async function deleteContact(req, res, next) {
  try {
    await pool.query(`DELETE FROM emergency_contacts WHERE id = $1`, [req.params.id]);
    res.status(204).send();
  } catch (err) { next(err); }
}

module.exports = { listContacts, createContact, updateContact, deleteContact };
