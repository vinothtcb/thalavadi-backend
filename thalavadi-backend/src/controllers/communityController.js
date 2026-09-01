const pool = require("../config/db");
const { slimImages } = require("../utils/images");

// GET /api/communities
async function listCommunities(req, res, next) {
  try {
    const { rows } = await pool.query(`SELECT * FROM communities ORDER BY name ASC`);
    res.json(slimImages(rows));
  } catch (err) {
    next(err);
  }
}

// POST /api/communities   (admin only)
async function createCommunity(req, res, next) {
  try {
    const { name, category, description, contact_name, contact_phone, meeting_info, image_url } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });
    const { rows } = await pool.query(
      `INSERT INTO communities (name, category, description, contact_name, contact_phone, meeting_info, image_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [name, category, description, contact_name, contact_phone, meeting_info, image_url]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// PUT /api/communities/:id   (admin only)
async function updateCommunity(req, res, next) {
  try {
    const fields = ["name", "category", "description", "contact_name", "contact_phone", "meeting_info", "image_url"];
    const updates = []; const values = [];
    fields.forEach((f) => { if (req.body[f] !== undefined) { values.push(req.body[f]); updates.push(`${f} = $${values.length}`); } });
    if (updates.length === 0) return res.status(400).json({ error: "No fields to update" });
    values.push(req.params.id);
    const { rows } = await pool.query(`UPDATE communities SET ${updates.join(", ")} WHERE id = $${values.length} RETURNING *`, values);
    if (!rows[0]) return res.status(404).json({ error: "Community not found" });
    res.json(rows[0]);
  } catch (err) { next(err); }
}

// DELETE /api/communities/:id   (admin only)
async function deleteCommunity(req, res, next) {
  try {
    await pool.query(`DELETE FROM communities WHERE id = $1`, [req.params.id]);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { listCommunities, createCommunity, updateCommunity, deleteCommunity };
