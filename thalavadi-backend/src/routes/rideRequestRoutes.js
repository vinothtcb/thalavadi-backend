const express = require("express");
const { listRides, getRide, createRide, updateRide, deleteRide } = require("../controllers/rideRequestController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", listRides);
router.get("/:id", getRide);
router.post("/", requireAuth, createRide);
router.put("/:id", requireAuth, updateRide);
router.delete("/:id", requireAuth, deleteRide);

module.exports = router;
