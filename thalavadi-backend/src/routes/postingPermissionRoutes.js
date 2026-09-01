const express = require("express");
const { listPermissions, setPermission } = require("../controllers/postingPermissionController");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/", listPermissions);
router.put("/:type_key", requireAuth, requireAdmin, setPermission);

module.exports = router;
