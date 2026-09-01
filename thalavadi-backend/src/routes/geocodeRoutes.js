const express = require("express");
const rateLimit = require("express-rate-limit");
const { search, reverse } = require("../controllers/geocodeController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Nominatim's usage policy asks for no more than ~1 request/second from a
// given source — this comfortably stays under that even with several
// simultaneous users.
const geocodeLimiter = rateLimit({ windowMs: 60 * 1000, max: 30 });

router.get("/search", requireAuth, geocodeLimiter, search);
router.get("/reverse", requireAuth, geocodeLimiter, reverse);

module.exports = router;
