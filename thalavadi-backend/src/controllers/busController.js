const pool = require("../config/db");

// GET /api/buses  (optional ?source=&destination=)
async function listBuses(req, res, next) {
  try {
    const { source, destination } = req.query;
    const params = [];
    let query = `SELECT * FROM bus_schedules WHERE 1=1`;
    if (source) { params.push(`%${source}%`); query += ` AND source ILIKE $${params.length}`; }
    if (destination) { params.push(`%${destination}%`); query += ` AND destination ILIKE $${params.length}`; }
    query += ` ORDER BY (source = 'Thalavadi') DESC, route_name ASC, departure_time ASC`;
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) { next(err); }
}

// POST /api/buses   (admin only)
async function createBus(req, res, next) {
  try {
    const { route_name, source, destination, departure_time, bus_type, operator, notes } = req.body;
    if (!route_name || !source || !destination || !departure_time) {
      return res.status(400).json({ error: "route_name, source, destination and departure_time are required" });
    }
    const { rows } = await pool.query(
      `INSERT INTO bus_schedules (route_name, source, destination, departure_time, bus_type, operator, notes)
       VALUES ($1,$2,$3,$4,COALESCE($5,'Government'),$6,$7) RETURNING *`,
      [route_name, source, destination, departure_time, bus_type, operator, notes]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
}

// PUT /api/buses/:id   (admin only)
async function updateBus(req, res, next) {
  try {
    const fields = ["route_name", "source", "destination", "departure_time", "bus_type", "operator", "notes"];
    const updates = []; const values = [];
    fields.forEach((f) => { if (req.body[f] !== undefined) { values.push(req.body[f]); updates.push(`${f} = $${values.length}`); } });
    if (updates.length === 0) return res.status(400).json({ error: "No fields to update" });
    values.push(req.params.id);
    const { rows } = await pool.query(`UPDATE bus_schedules SET ${updates.join(", ")} WHERE id = $${values.length} RETURNING *`, values);
    if (!rows[0]) return res.status(404).json({ error: "Bus schedule not found" });
    res.json(rows[0]);
  } catch (err) { next(err); }
}

// DELETE /api/buses/:id   (admin only)
async function deleteBus(req, res, next) {
  try {
    await pool.query(`DELETE FROM bus_schedules WHERE id = $1`, [req.params.id]);
    res.status(204).send();
  } catch (err) { next(err); }
}

module.exports = { listBuses, createBus, updateBus, deleteBus };
