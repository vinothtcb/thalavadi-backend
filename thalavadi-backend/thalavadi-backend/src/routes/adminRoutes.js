const express = require("express");
const { listActivityLogs, listErrorLogs, listArchivedListings } = require("../controllers/adminLogController");
const { listUsers, setDriverVerified, setIdVerification } = require("../controllers/adminUserController");
const { listWhatsappLog } = require("../controllers/adminWhatsappController");
const { getStats } = require("../controllers/adminStatsController");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/stats", requireAuth, requireAdmin, getStats);
router.get("/logs/activity", requireAuth, requireAdmin, listActivityLogs);
router.get("/logs/errors", requireAuth, requireAdmin, listErrorLogs);
router.get("/logs/archive", requireAuth, requireAdmin, listArchivedListings);
router.get("/logs/whatsapp", requireAuth, requireAdmin, listWhatsappLog);
router.get("/users", requireAuth, requireAdmin, listUsers);
router.put("/users/:id/verify-driver", requireAuth, requireAdmin, setDriverVerified);
router.put("/users/:id/verify-id", requireAuth, requireAdmin, setIdVerification);

module.exports = router;
