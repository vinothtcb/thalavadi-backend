const express = require("express");
const { listBuses, createBus, updateBus, deleteBus } = require("../controllers/busController");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/", listBuses);
router.post("/", requireAuth, requireAdmin, createBus);
router.put("/:id", requireAuth, requireAdmin, updateBus);
router.delete("/:id", requireAuth, requireAdmin, deleteBus);

module.exports = router;
