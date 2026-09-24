const express = require("express");
const { submitFeedback, listFeedback } = require("../controllers/feedbackController");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.post("/", requireAuth, submitFeedback);
router.get("/", requireAuth, requireAdmin, listFeedback);

module.exports = router;
