const express = require("express");
const {
  listClassifieds,
  getClassified,
  createClassified,
  updateClassified,
  deleteClassified,
} = require("../controllers/classifiedController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", listClassifieds);
router.get("/:id", getClassified);
router.post("/", requireAuth, createClassified);
router.put("/:id", requireAuth, updateClassified);
router.delete("/:id", requireAuth, deleteClassified);

module.exports = router;
