// Uses OpenStreetMap's free Nominatim geocoding service. No API key needed.
// Nominatim's usage policy requires a descriptive User-Agent and asks for
// no more than ~1 request/second — the geocodeLimiter in routes enforces that.

const APP_USER_AGENT = "MyThalavadiApp/1.0 (community directory)";

// Soft bounding box around the Thalavadi / Sathyamangalam / Erode corridor.
// "Soft" (bounded=0) means Nominatim prefers results inside this box but
// won't exclude a genuine match outside it — so a search for a nearby
// village surfaces correctly instead of losing to a more "globally
// important" same-named place elsewhere in India, while a legitimate
// long-distance search (e.g. a return-pickup drop-off in Bangalore) still
// works normally.
const LOCAL_VIEWBOX = "76.55,12.05,77.95,10.95"; // left,top,right,bottom

// GET /api/geocode/search?q=Thalavadi+bus+stand
async function search(req, res, next) {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 3) return res.status(400).json({ error: "Enter at least 3 characters to search" });

    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=8&countrycodes=in&addressdetails=1&viewbox=${LOCAL_VIEWBOX}&bounded=0&q=${encodeURIComponent(q)}`;
    const response = await fetch(url, { headers: { "User-Agent": APP_USER_AGENT } });
    if (!response.ok) throw new Error("Location search unavailable");
    const data = await response.json();

    res.json(
      data.map((r) => ({
        name: r.display_name,
        lat: Number(r.lat),
        lon: Number(r.lon),
      }))
    );
  } catch (err) {
    next(err);
  }
}

// GET /api/geocode/reverse?lat=11.55&lon=77.02
async function reverse(req, res, next) {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: "lat and lon are required" });

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`;
    const response = await fetch(url, { headers: { "User-Agent": APP_USER_AGENT } });
    if (!response.ok) throw new Error("Location lookup unavailable");
    const data = await response.json();

    res.json({ name: data.display_name || `${lat}, ${lon}`, lat: Number(lat), lon: Number(lon) });
  } catch (err) {
    next(err);
  }
}

module.exports = { search, reverse };
