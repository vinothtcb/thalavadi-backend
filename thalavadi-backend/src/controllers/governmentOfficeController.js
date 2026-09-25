const pool = require("../config/db");
const { slimImages } = require("../utils/images");

// GET /api/government-categories
async function listCategories(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT c.*, (SELECT COUNT(*) FROM government_offices o WHERE o.category_id = c.id AND o.is_active = true) AS office_count
       FROM government_categories c WHERE c.is_active = true ORDER BY c.display_order ASC`
    );
    res.json(rows);
  } catch (err) { next(err); }
}

// GET /api/government-offices?category_id=  (optional)
async function listOffices(req, res, next) {
  try {
    const { category_id, search } = req.query;
    const params = [];
    let query = `
      SELECT o.*, c.name AS category_name, c.name_ta AS category_name_ta, c.name_kn AS category_name_kn, c.slug AS category_slug
      FROM government_offices o LEFT JOIN government_categories c ON c.id = o.category_id
      WHERE o.is_active = true
    `;
    if (category_id) { params.push(category_id); query += ` AND o.category_id = $${params.length}`; }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (o.office_name ILIKE $${params.length} OR o.services ILIKE $${params.length})`;
    }
    query += ` ORDER BY c.display_order ASC NULLS LAST, o.office_name ASC`;
    const { rows } = await pool.query(query, params);
    res.json(slimImages(rows));
  } catch (err) { next(err); }
}

const OFFICE_FIELDS = [
  "category_id", "office_name", "office_name_tamil", "designation", "officer_name",
  "phone", "mobile", "email", "address", "pincode", "services", "website_url",
  "verification_status", "is_local_office", "image_url",
];

// POST /api/government-offices   (admin only)
// Fields that are NOT NULL in the database and need a real fallback value
// when the admin form doesn't include them — an explicit NULL in an INSERT
// bypasses the column's DEFAULT, so we must supply the default ourselves.
const OFFICE_FIELD_DEFAULTS = {
  verification_status: "verified",
  is_local_office: true,
};

async function createOffice(req, res, next) {
  try {
    const { office_name } = req.body;
    if (!office_name) return res.status(400).json({ error: "office_name is required" });

    const values = OFFICE_FIELDS.map((f) => {
      if (req.body[f] !== undefined && req.body[f] !== null && req.body[f] !== "") return req.body[f];
      return OFFICE_FIELD_DEFAULTS[f] !== undefined ? OFFICE_FIELD_DEFAULTS[f] : null;
    });
    const placeholders = OFFICE_FIELDS.map((_, i) => `$${i + 1}`).join(", ");
    const { rows } = await pool.query(
      `INSERT INTO government_offices (${OFFICE_FIELDS.join(", ")}) VALUES (${placeholders}) RETURNING *`,
      values
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
}

// PUT /api/government-offices/:id   (admin only)
async function updateOffice(req, res, next) {
  try {
    const updates = []; const values = [];
    OFFICE_FIELDS.forEach((f) => { if (req.body[f] !== undefined) { values.push(req.body[f]); updates.push(`${f} = $${values.length}`); } });
    if (updates.length === 0) return res.status(400).json({ error: "No fields to update" });
    values.push(req.params.id);
    const { rows } = await pool.query(`UPDATE government_offices SET ${updates.join(", ")} WHERE id = $${values.length} RETURNING *`, values);
    if (!rows[0]) return res.status(404).json({ error: "Office not found" });
    res.json(rows[0]);
  } catch (err) { next(err); }
}

// DELETE /api/government-offices/:id   (admin only)
async function deleteOffice(req, res, next) {
  try {
    await pool.query(`DELETE FROM government_offices WHERE id = $1`, [req.params.id]);
    res.status(204).send();
  } catch (err) { next(err); }
}

module.exports = { listCategories, listOffices, createOffice, updateOffice, deleteOffice };
