const express = require("express");
const {
  listCategories, createCategory, updateCategory, deleteCategory,
  listServices, getService, createService, updateService, deleteService,
} = require("../controllers/farmerController");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// Services (mounted at /api/farmer-services)
router.get("/categories", listCategories); // public listing, used by the app's category screen
router.get("/", listServices);
router.get("/:id", getService);
router.post("/", requireAuth, createService);
router.put("/:id", requireAuth, updateService);
router.delete("/:id", requireAuth, deleteService);

module.exports = router;

// Category admin CRUD (mounted separately at /api/farmer-categories)
const categoryRouter = express.Router();
categoryRouter.get("/", listCategories);
categoryRouter.post("/", requireAuth, requireAdmin, createCategory);
categoryRouter.put("/:id", requireAuth, requireAdmin, updateCategory);
categoryRouter.delete("/:id", requireAuth, requireAdmin, deleteCategory);
module.exports.categoryRouter = categoryRouter;
