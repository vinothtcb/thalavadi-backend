const pool = require("../config/db");
const { isValidImageDataUrl } = require("../utils/validators");

// GET /api/gallery/counts — how many photos per album, without fetching
// any photo data at all. Used by the album-picker screen; previously that
// screen called listPhotos() with no limit and tallied client-side, which
// both downloaded every photo just to count them AND would now be wrong
// since listPhotos is paginated.
async function listCounts(req, res, next) {
  try {
    const { rows } = await pool.query(`SELECT category, COUNT(*)::int AS count FROM gallery_photos GROUP BY category`);
    res.json(rows);
  } catch (err) { next(err); }
}

// GET /api/gallery?category=events&limit=30&offset=0
// Deliberately NOT thumbnail-slimmed like other list endpoints — Gallery's
// whole purpose is viewing photos well (pinch-zoom lightbox), so quality
// stays full. Pagination is how this endpoint stays fast as an album grows
// past 100+ photos, instead of stripping quality.
async function listPhotos(req, res, next) {
  try {
    const { category } = req.query;
    const limit = Math.min(Number(req.query.limit) || 30, 100);
    const offset = Number(req.query.offset) || 0;
    const params = [];
    let query = `SELECT * FROM gallery_photos WHERE 1=1`;
    if (category) { params.push(category); query += ` AND category = $${params.length}`; }
    query += ` ORDER BY created_at DESC`;
    params.push(limit, offset);
    query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) { next(err); }
}

// POST /api/gallery   (admin only)
async function addPhoto(req, res, next) {
  try {
    const { image_url, caption, category } = req.body;
    if (!image_url) return res.status(400).json({ error: "image_url is required" });
    if (!isValidImageDataUrl(image_url)) return res.status(400).json({ error: "Invalid image data" });
    const { rows } = await pool.query(
      `INSERT INTO gallery_photos (image_url, caption, category) VALUES ($1,$2,COALESCE($3,'general')) RETURNING *`,
      [image_url, caption, category]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
}

// PUT /api/gallery/:id   (admin only)
async function updatePhoto(req, res, next) {
  try {
    const { caption, category } = req.body;
    const { rows } = await pool.query(
      `UPDATE gallery_photos SET caption = COALESCE($1, caption), category = COALESCE($2, category) WHERE id = $3 RETURNING *`,
      [caption, category, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Photo not found" });
    res.json(rows[0]);
  } catch (err) { next(err); }
}

// DELETE /api/gallery/:id   (admin only)
async function deletePhoto(req, res, next) {
  try {
    await pool.query(`DELETE FROM gallery_photos WHERE id = $1`, [req.params.id]);
    res.status(204).send();
  } catch (err) { next(err); }
}

module.exports = { listPhotos, listCounts, addPhoto, updatePhoto, deletePhoto };
