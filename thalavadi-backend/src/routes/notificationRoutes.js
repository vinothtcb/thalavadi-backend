const express = require("express");
const { getUnreadCount, getUnreadBreakdown, markRead } = require("../controllers/notificationController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/unread-count", requireAuth, getUnreadCount);
router.get("/unread-breakdown", requireAuth, getUnreadBreakdown);
router.post("/mark-read", requireAuth, markRead);

module.exports = router;
