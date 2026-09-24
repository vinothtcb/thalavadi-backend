const express = require("express");
const { listEvents, getEvent, createEvent, updateEvent, deleteEvent } = require("../controllers/eventController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", listEvents);
router.get("/:id", getEvent);
router.post("/", requireAuth, createEvent);
router.put("/:id", requireAuth, updateEvent);
router.delete("/:id", requireAuth, deleteEvent);

module.exports = router;
