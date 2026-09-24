const pool = require("../config/db");
const { slimImages } = require("../utils/images");
const { isValidPhone, isValidImageDataUrl, isValidLatitude, isValidLongitude } = require("../utils/validators");

// GET /api/farmer-categories
async function listCategories(req, res, next) {
  try {
    const { rows } = await pool.query(`
      SELECT c.*, (SELECT COUNT(*) FROM farmer_services s WHERE s.category_id = c.id AND s.is_active = true) AS listing_count
      FROM farmer_categories c WHERE c.is_active = true ORDER BY c.sort_order ASC
    `);
    res.json(rows);
  } catch (err) { next(err); }
}

// POST /api/farmer-categories   (admin only)
async function createCategory(req, res, next) {
  try {
    const { name, name_ta, name_kn, slug, icon, sort_order } = req.body;
    if (!name || !slug) return res.status(400).json({ error: "name and slug are required" });
    const { rows } = await pool.query(
      `INSERT INTO farmer_categories (name, name_ta, name_kn, slug, icon, sort_order) VALUES ($1,$2,$3,$4,COALESCE($5,'Sprout'),COALESCE($6,0)) RETURNING *`,
      [name, name_ta, name_kn, slug, icon, sort_order]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
}

// PUT /api/farmer-categories/:id   (admin only)
async function updateCategory(req, res, next) {
  try {
    const fields = ["name", "name_ta", "name_kn", "slug", "icon", "sort_order", "is_active"];
    const updates = []; const values = [];
    fields.forEach((f) => { if (req.body[f] !== undefined) { values.push(req.body[f]); updates.push(`${f} = $${values.length}`); } });
    if (updates.length === 0) return res.status(400).json({ error: "No fields to update" });
    values.push(req.params.id);
    const { rows } = await pool.query(`UPDATE farmer_categories SET ${updates.join(", ")} WHERE id = $${values.length} RETURNING *`, values);
    if (!rows[0]) return res.status(404).json({ error: "Category not found" });
    res.json(rows[0]);
  } catch (err) { next(err); }
}

// DELETE /api/farmer-categories/:id   (admin only)
async function deleteCategory(req, res, next) {
  try {
    await pool.query(`DELETE FROM farmer_categories WHERE id = $1`, [req.params.id]);
    res.status(204).send();
  } catch (err) { next(err); }
}

const SERVICE_SELECT = `
  s.*, c.name AS category_name, c.name_ta AS category_name_ta, c.name_kn AS category_name_kn, c.slug AS category_slug, u.name AS poster_name,
  (SELECT ROUND(AVG(stars)::numeric, 1) FROM ratings WHERE ratee_id = s.posted_by) AS poster_rating,
  (SELECT COUNT(*) FROM ratings WHERE ratee_id = s.posted_by) AS poster_rating_count
`;

// GET /api/farmer-services?category_id=&search=
async function listServices(req, res, next) {
  try {
    const { category_id, search } = req.query;
    const params = [];
    let query = `SELECT ${SERVICE_SELECT} FROM farmer_services s
      JOIN farmer_categories c ON c.id = s.category_id
      LEFT JOIN users u ON u.id = s.posted_by
      WHERE s.is_active = true`;
    if (category_id) { params.push(category_id); query += ` AND s.category_id = $${params.length}`; }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (s.name ILIKE $${params.length} OR s.description ILIKE $${params.length} OR s.services ILIKE $${params.length} OR s.village ILIKE $${params.length})`;
    }
    query += ` ORDER BY s.is_verified DESC, s.created_at DESC`;
    const { rows } = await pool.query(query, params);
    res.json(slimImages(rows));
  } catch (err) { next(err); }
}

// GET /api/farmer-services/:id
async function getService(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT ${SERVICE_SELECT} FROM farmer_services s JOIN farmer_categories c ON c.id = s.category_id LEFT JOIN users u ON u.id = s.posted_by WHERE s.id = $1`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Listing not found" });
    res.json(rows[0]);
  } catch (err) { next(err); }
}

// POST /api/farmer-services   (any logged-in user; is_verified always starts false)
async function createService(req, res, next) {
  try {
    const { category_id, name, contact_person, phone, whatsapp, address, village, service_area, latitude, longitude, description, services, opening_hours, rate, details, image_url } = req.body;
    if (!category_id || !name || !phone) return res.status(400).json({ error: "category_id, name and phone are required" });
    if (!isValidPhone(phone)) return res.status(400).json({ error: "Enter a valid 10-digit phone number" });
    if (whatsapp && !isValidPhone(whatsapp)) return res.status(400).json({ error: "Enter a valid 10-digit WhatsApp number" });
    if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) return res.status(400).json({ error: "Invalid map location" });
    if (!isValidImageDataUrl(image_url)) return res.status(400).json({ error: "Invalid image data" });

    const { rows } = await pool.query(
      `INSERT INTO farmer_services
        (category_id, name, contact_person, phone, whatsapp, address, village, service_area, latitude, longitude, description, services, opening_hours, rate, details, image_url, posted_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`,
      [category_id, name, contact_person, phone, whatsapp, address, village, service_area, latitude || null, longitude || null, description, services, opening_hours, rate, details || null, image_url, req.user.sub]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
}

async function canModify(req) {
  const { rows } = await pool.query(`SELECT posted_by FROM farmer_services WHERE id = $1`, [req.params.id]);
  if (!rows[0]) return { found: false };
  const isOwner = rows[0].posted_by && rows[0].posted_by === req.user.sub;
  const isAdmin = req.user.role === "admin";
  return { found: true, allowed: isOwner || isAdmin, isAdmin };
}

// PUT /api/farmer-services/:id   (owner or admin; only admin may set is_verified)
async function updateService(req, res, next) {
  try {
    const check = await canModify(req);
    if (!check.found) return res.status(404).json({ error: "Listing not found" });
    if (!check.allowed) return res.status(403).json({ error: "Not allowed to edit this listing" });

    const fields = ["name", "contact_person", "phone", "whatsapp", "address", "village", "service_area", "latitude", "longitude", "description", "services", "opening_hours", "rate", "details", "image_url", "is_active"];
    if (check.isAdmin) fields.push("is_verified");

    const updates = []; const values = [];
    fields.forEach((f) => { if (req.body[f] !== undefined) { values.push(req.body[f]); updates.push(`${f} = $${values.length}`); } });
    if (updates.length === 0) return res.status(400).json({ error: "No fields to update" });

    values.push(req.params.id);
    const { rows } = await pool.query(`UPDATE farmer_services SET ${updates.join(", ")} WHERE id = $${values.length} RETURNING *`, values);
    res.json(rows[0]);
  } catch (err) { next(err); }
}

// DELETE /api/farmer-services/:id   (owner or admin)
async function deleteService(req, res, next) {
  try {
    const check = await canModify(req);
    if (!check.found) return res.status(404).json({ error: "Listing not found" });
    if (!check.allowed) return res.status(403).json({ error: "Not allowed to delete this listing" });

    await pool.query(`DELETE FROM farmer_services WHERE id = $1`, [req.params.id]);
    res.status(204).send();
  } catch (err) { next(err); }
}

module.exports = { listCategories, createCategory, updateCategory, deleteCategory, listServices, getService, createService, updateService, deleteService };
