// ─────────────────────────────────────────────
// IMAGE PAYLOAD SLIMMING
//
// Every photo is stored as {t, m, o} — thumbnail/medium/original — all
// three together as one JSON string in the entity's image_url column
// (see the frontend's processImageFile/resizeImageElement for how that's
// built). That's fine for a single detail view, but a "browse this
// category" list response would otherwise ship all three sizes for every
// row — most of which the list screen never displays, since cards only
// ever show the thumbnail. thumbnailOnly() strips a single value down to
// just the thumbnail; slimImages() applies that across a list of rows.
//
// Detail/single-item endpoints should NOT use this — they legitimately
// need the medium/original sizes for the lightbox/zoom view.
// ─────────────────────────────────────────────

function thumbnailOnly(imageUrlJson) {
  if (!imageUrlJson) return imageUrlJson;
  try {
    const parsed = JSON.parse(imageUrlJson);
    if (parsed && parsed.t) return JSON.stringify({ t: parsed.t });
  } catch {
    // Not JSON — a legacy single-data-URL value from before the {t,m,o}
    // pipeline existed. Left as-is; harmless pre-launch test-data edge case.
  }
  return imageUrlJson;
}

function slimImages(rows, field = "image_url") {
  return rows.map((r) => (r[field] ? { ...r, [field]: thumbnailOnly(r[field]) } : r));
}

module.exports = { thumbnailOnly, slimImages };
