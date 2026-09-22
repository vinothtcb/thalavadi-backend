const express = require("express");
const { getUnreadCount, getUnreadBreakdown, markRead, markTileRead } = require("../controllers/notificationController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/unread-count", requireAuth, getUnreadCount);
router.get("/unread-breakdown", requireAuth, getUnreadBreakdown);
router.post("/mark-read", requireAuth, markRead);
router.post("/mark-tile-read", requireAuth, markTileRead);

module.exports = router;
