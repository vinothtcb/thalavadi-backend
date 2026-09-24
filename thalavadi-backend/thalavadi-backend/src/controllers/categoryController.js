const pool = require("../config/db");

// GET /api/categories
async function listCategories(req, res, next) {
  try {
    const { rows } = await pool.query(`
      SELECT c.id, c.name, c.name_ta, c.name_kn, c.slug, c.icon, c.color, c.sort_order,
             COUNT(b.id) FILTER (WHERE b.is_active) AS listing_count
      FROM categories c
      LEFT JOIN businesses b ON b.category_id = c.id
      GROUP BY c.id
      ORDER BY c.sort_order ASC
    `);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// POST /api/categories   (admin only)
async function createCategory(req, res, next) {
  try {
    const { name, name_ta, name_kn, slug, icon, color, sort_order, image_url } = req.body;
    if (!name || !slug || !icon || !color) {
      return res.status(400).json({ error: "name, slug, icon and color are required" });
    }
    const { rows } = await pool.query(
      `INSERT INTO categories (name, name_ta, name_kn, slug, icon, color, sort_order, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, 0), $8) RETURNING *`,
      [name, name_ta, name_kn, slug, icon, color, sort_order, image_url]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// PUT /api/categories/:id   (admin only)
async function updateCategory(req, res, next) {
  try {
    const fields = ["name", "name_ta", "name_kn", "slug", "icon", "color", "sort_order", "image_url"];
    const updates = [];
    const values = [];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) { values.push(req.body[f]); updates.push(`${f} = $${values.length}`); }
    });
    if (updates.length === 0) return res.status(400).json({ error: "No fields to update" });
    values.push(req.params.id);
    const { rows } = await pool.query(`UPDATE categories SET ${updates.join(", ")} WHERE id = $${values.length} RETURNING *`, values);
    if (!rows[0]) return res.status(404).json({ error: "Category not found" });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/categories/:id   (admin only)
async function deleteCategory(req, res, next) {
  try {
    await pool.query(`DELETE FROM categories WHERE id = $1`, [req.params.id]);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { listCategories, createCategory, updateCategory, deleteCategory };
