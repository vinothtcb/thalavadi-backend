const express = require("express");
const { listPhotos, listCounts, addPhoto, updatePhoto, deletePhoto } = require("../controllers/galleryController");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/counts", listCounts);
router.get("/", listPhotos);
router.post("/", requireAuth, requireAdmin, addPhoto);
router.put("/:id", requireAuth, requireAdmin, updatePhoto);
router.delete("/:id", requireAuth, requireAdmin, deletePhoto);

module.exports = router;
