const express = require("express");
const { listCategories, listOffices, createOffice, updateOffice, deleteOffice } = require("../controllers/governmentOfficeController");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/categories", listCategories);
router.get("/", listOffices);
router.post("/", requireAuth, requireAdmin, createOffice);
router.put("/:id", requireAuth, requireAdmin, updateOffice);
router.delete("/:id", requireAuth, requireAdmin, deleteOffice);

module.exports = router;
