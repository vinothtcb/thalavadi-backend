const express = require("express");
const { createRating, listRatings, checkMyRating } = require("../controllers/ratingController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/mine", requireAuth, checkMyRating);
router.get("/", listRatings);
router.post("/", requireAuth, createRating);

module.exports = router;
