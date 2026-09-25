const express = require("express");
const {
  listAllBusinesses,
  getBusiness,
  createBusiness,
  updateBusiness,
  deleteBusiness,
} = require("../controllers/businessController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", listAllBusinesses);
router.get("/:id", getBusiness);
router.post("/", requireAuth, createBusiness);
router.put("/:id", requireAuth, updateBusiness);
router.delete("/:id", requireAuth, deleteBusiness);

module.exports = router;
