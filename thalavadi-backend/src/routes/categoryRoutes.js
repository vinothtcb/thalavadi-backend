const express = require("express");
const { listCategories, createCategory, updateCategory, deleteCategory } = require("../controllers/categoryController");
const { listBusinessesByCategory } = require("../controllers/businessController");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/", listCategories);
router.get("/:slug/businesses", listBusinessesByCategory);
router.post("/", requireAuth, requireAdmin, createCategory);
router.put("/:id", requireAuth, requireAdmin, updateCategory);
router.delete("/:id", requireAuth, requireAdmin, deleteCategory);

module.exports = router;
