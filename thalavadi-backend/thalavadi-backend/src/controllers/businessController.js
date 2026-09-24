const pool = require("../config/db");
const { isValidPhone, isValidImageDataUrl, isValidLatitude, isValidLongitude } = require("../utils/validators");
const { slimImages } = require("../utils/images");

// Includes poster info + rating so cards can show "posted by / when" and stars.
const BUSINESS_SELECT = `
  b.*, u.name AS poster_name,
  (SELECT ROUND(AVG(stars)::numeric, 1) FROM ratings WHERE ratee_id = b.posted_by) AS poster_rating,
  (SELECT COUNT(*) FROM ratings WHERE ratee_id = b.posted_by) AS poster_rating_count
`;

// GET /api/businesses   (all businesses, admin panel + browsing)
async function listAllBusinesses(req, res, next) {
  try {
    const { search } = req.query;
    const params = [];
    let query = `SELECT b.*, c.name AS category_name, c.name_ta AS category_name_ta, c.name_kn AS category_name_kn, c.slug AS category_slug, c.color AS category_color
      FROM businesses b JOIN categories c ON c.id = b.category_id WHERE 1=1`;
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (b.name ILIKE $${params.length} OR b.tagline ILIKE $${params.length})`;
    }
    query += ` ORDER BY b.priority DESC, b.created_at DESC`;
    const { rows } = await pool.query(query, params);
    res.json(slimImages(rows));
  } catch (err) {
    next(err);
  }
}

// GET /api/categories/:slug/businesses?search=
async function listBusinessesByCategory(req, res, next) {
  try {
    const { slug } = req.params;
    const { search } = req.query;

    const category = await pool.query(`SELECT id FROM categories WHERE slug = $1`, [slug]);
    if (!category.rows[0]) return res.status(404).json({ error: "Category not found" });

    const params = [category.rows[0].id];
    let query = `SELECT ${BUSINESS_SELECT} FROM businesses b LEFT JOIN users u ON u.id = b.posted_by WHERE b.category_id = $1 AND b.is_active = true`;

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (b.name ILIKE $${params.length} OR b.tagline ILIKE $${params.length})`;
    }
    query += ` ORDER BY b.priority DESC, b.rating DESC NULLS LAST, b.name ASC`;

    const { rows } = await pool.query(query, params);
    res.json(slimImages(rows));
  } catch (err) {
    next(err);
  }
}

// GET /api/businesses/:id
async function getBusiness(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT ${BUSINESS_SELECT} FROM businesses b LEFT JOIN users u ON u.id = b.posted_by WHERE b.id = $1`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Business not found" });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// POST /api/businesses   (any logged-in user can post their own business)
async function createBusiness(req, res, next) {
  try {
    const { category_id, name, tagline, phone, whatsapp, address, latitude, longitude, details, image_url } = req.body;
    if (!category_id || !name || !phone) {
      return res.status(400).json({ error: "category_id, name and phone are required" });
    }
    if (!isValidPhone(phone)) return res.status(400).json({ error: "Enter a valid 10-digit phone number" });
    if (whatsapp && !isValidPhone(whatsapp)) return res.status(400).json({ error: "Enter a valid 10-digit WhatsApp number" });
    if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) return res.status(400).json({ error: "Invalid map location" });
    if (!isValidImageDataUrl(image_url)) return res.status(400).json({ error: "Invalid image data" });

    const { rows } = await pool.query(
      `INSERT INTO businesses
        (category_id, name, tagline, phone, whatsapp, address, latitude, longitude, details, image_url, posted_by, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$11) RETURNING *`,
      [category_id, name, tagline, phone, whatsapp, address, latitude || null, longitude || null, details || null, image_url, req.user.sub]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function canModify(req) {
  const { rows } = await pool.query(`SELECT posted_by FROM businesses WHERE id = $1`, [req.params.id]);
  if (!rows[0]) return { found: false };
  const isOwner = rows[0].posted_by && rows[0].posted_by === req.user.sub;
  const isAdmin = req.user.role === "admin";
  return { found: true, allowed: isOwner || isAdmin, isAdmin };
}

// PUT /api/businesses/:id   (owner or admin; only admin may set "priority")
async function updateBusiness(req, res, next) {
  try {
    const check = await canModify(req);
    if (!check.found) return res.status(404).json({ error: "Business not found" });
    if (!check.allowed) return res.status(403).json({ error: "Not allowed to edit this business" });

    const fields = ["name", "tagline", "phone", "whatsapp", "address", "latitude", "longitude", "details", "image_url", "is_active"];
    if (check.isAdmin) fields.push("priority"); // ordering is an admin-only privilege

    const updates = []; const values = [];
    fields.forEach((f) => { if (req.body[f] !== undefined) { values.push(req.body[f]); updates.push(`${f} = $${values.length}`); } });
    if (updates.length === 0) return res.status(400).json({ error: "No fields to update" });

    values.push(req.params.id);
    const { rows } = await pool.query(
      `UPDATE businesses SET ${updates.join(", ")}, updated_at = now() WHERE id = $${values.length} RETURNING *`,
      values
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/businesses/:id   (owner or admin)
async function deleteBusiness(req, res, next) {
  try {
    const check = await canModify(req);
    if (!check.found) return res.status(404).json({ error: "Business not found" });
    if (!check.allowed) return res.status(403).json({ error: "Not allowed to delete this business" });

    await pool.query(`DELETE FROM businesses WHERE id = $1`, [req.params.id]);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listBusinessesByCategory,
  listAllBusinesses,
  getBusiness,
  createBusiness,
  updateBusiness,
  deleteBusiness,
};
