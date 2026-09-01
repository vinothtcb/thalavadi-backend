const express = require("express");
const { listContacts, createContact, updateContact, deleteContact } = require("../controllers/emergencyContactController");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/", listContacts);
router.post("/", requireAuth, requireAdmin, createContact);
router.put("/:id", requireAuth, requireAdmin, updateContact);
router.delete("/:id", requireAuth, requireAdmin, deleteContact);

module.exports = router;
