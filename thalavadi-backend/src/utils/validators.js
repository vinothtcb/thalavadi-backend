// Server-side validation — mirrors the frontend's checks so the API never
// trusts client-side validation alone (defense in depth).

function isValidPhone(v) {
  return typeof v === "string" && /^\d{10}$/.test(v.replace(/\D/g, ""));
}

function isValidEmail(v) {
  return typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

// Accepts base64 data URLs for images — both a plain "data:image/...;base64,"
// string (the original single-image format), and the newer multi-resolution
// format the ImageUploadField now produces: a JSON string like
// {"t": "<thumbnail data URL>", "m": "<medium data URL>", "o": "<original data URL>"}.
// Rejects anything else, e.g. arbitrary remote URLs or scripts disguised as
// an "image_url".
function isValidImageDataUrl(v) {
  if (v === undefined || v === null || v === "") return true; // optional field
  if (typeof v !== "string") return false;

  const dataUrlPattern = /^data:image\/(png|jpe?g|gif|webp);base64,/;
  if (dataUrlPattern.test(v)) return true;

  try {
    const parsed = JSON.parse(v);
    if (parsed && typeof parsed === "object") {
      return ["t", "m", "o"].every((k) => parsed[k] === undefined || dataUrlPattern.test(parsed[k]));
    }
  } catch {
    // not JSON either — falls through to rejection below
  }
  return false;
}

function isValidLatitude(v) {
  const n = Number(v);
  return v === undefined || v === null || v === "" || (!Number.isNaN(n) && n >= -90 && n <= 90);
}

function isValidLongitude(v) {
  const n = Number(v);
  return v === undefined || v === null || v === "" || (!Number.isNaN(n) && n >= -180 && n <= 180);
}

// Indian vehicle registration numbers, e.g. "TN 36 AB 1234" or "TN36AB1234".
// Normalizes to the compact uppercase form, then checks it against the
// standard state-code + RTO-code + series + number pattern.
function normalizeVehicleNumber(v) {
  if (typeof v !== "string") return "";
  return v.toUpperCase().replace(/\s+/g, "").replace(/[^A-Z0-9]/g, "");
}

const VEHICLE_NUMBER_PATTERN = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{1,4}$/;

function isValidVehicleNumberFormat(v) {
  return VEHICLE_NUMBER_PATTERN.test(normalizeVehicleNumber(v));
}

module.exports = { isValidPhone, isValidEmail, isValidImageDataUrl, isValidLatitude, isValidLongitude, normalizeVehicleNumber, isValidVehicleNumberFormat };
