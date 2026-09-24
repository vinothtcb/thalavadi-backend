const express = require("express");
const { listAlerts, createAlert, updateAlert, deleteAlert } = require("../controllers/newsAlertController");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/", listAlerts);
router.post("/", requireAuth, requireAdmin, createAlert);
router.put("/:id", requireAuth, requireAdmin, updateAlert);
router.delete("/:id", requireAuth, requireAdmin, deleteAlert);

module.exports = router;
