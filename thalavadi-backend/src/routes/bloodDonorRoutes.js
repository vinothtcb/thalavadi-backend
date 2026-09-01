const express = require("express");
const { listDonors, addDonor, updateDonor, deleteDonor } = require("../controllers/bloodDonorController");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/", listDonors);
router.post("/", requireAuth, addDonor);
router.put("/:id", requireAuth, requireAdmin, updateDonor);
router.delete("/:id", requireAuth, requireAdmin, deleteDonor);

module.exports = router;
