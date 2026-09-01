const express = require("express");
const { listCommunities, createCommunity, updateCommunity, deleteCommunity } = require("../controllers/communityController");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/", listCommunities);
router.post("/", requireAuth, requireAdmin, createCommunity);
router.put("/:id", requireAuth, requireAdmin, updateCommunity);
router.delete("/:id", requireAuth, requireAdmin, deleteCommunity);

module.exports = router;
