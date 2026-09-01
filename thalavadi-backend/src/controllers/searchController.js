const pool = require("../config/db");

// GET /api/search?q=...
// Searches across every major content type in one call, capped per-type so
// the home page can show a manageable, mixed set of results instead of
// only ever searching businesses.
async function globalSearch(req, res, next) {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) return res.json({ businesses: [], classifieds: [], farmerServices: [], governmentOffices: [], news: [], events: [] });
    const like = `%${q.trim()}%`;

    const [businesses, classifieds, farmerServices, governmentOffices, news, events] = await Promise.all([
      pool.query(
        `SELECT b.id, b.name, b.tagline, c.name AS category_name, c.slug AS category_slug, c.color AS category_color
         FROM businesses b JOIN categories c ON c.id = b.category_id
         WHERE b.name ILIKE $1 OR b.tagline ILIKE $1 LIMIT 5`,
        [like]
      ),
      pool.query(
        `SELECT id, type, title, price, location FROM classifieds
         WHERE is_active = true AND (title ILIKE $1 OR description ILIKE $1) LIMIT 5`,
        [like]
      ),
      pool.query(
        `SELECT s.id, s.name, s.village, c.name AS category_name, c.slug AS category_slug
         FROM farmer_services s JOIN farmer_categories c ON c.id = s.category_id
         WHERE s.is_active = true AND (s.name ILIKE $1 OR s.description ILIKE $1) LIMIT 5`,
        [like]
      ),
      pool.query(
        `SELECT o.id, o.office_name, c.name AS category_name
         FROM government_offices o LEFT JOIN government_categories c ON c.id = o.category_id
         WHERE o.is_active = true AND (o.office_name ILIKE $1 OR o.services ILIKE $1) LIMIT 5`,
        [like]
      ),
      pool.query(`SELECT id, title, is_urgent FROM news_alerts WHERE title ILIKE $1 OR body ILIKE $1 LIMIT 5`, [like]),
      pool.query(`SELECT id, title, start_date FROM events WHERE is_active = true AND title ILIKE $1 LIMIT 5`, [like]),
    ]);

    res.json({
      businesses: businesses.rows,
      classifieds: classifieds.rows,
      farmerServices: farmerServices.rows,
      governmentOffices: governmentOffices.rows,
      news: news.rows,
      events: events.rows,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { globalSearch };
