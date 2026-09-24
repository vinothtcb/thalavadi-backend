const express = require("express");
const rateLimit = require("express-rate-limit");
const { sendOtp, verifyOtp, refresh, listSessions, revokeSession, getMe, updateMe } = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many OTP requests. Please wait a few minutes and try again." },
});

router.post("/send-otp", otpLimiter, sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/refresh", refresh);
router.get("/sessions", requireAuth, listSessions);
router.delete("/sessions/:id", requireAuth, revokeSession);
router.get("/me", requireAuth, getMe);
router.put("/me", requireAuth, updateMe);

module.exports = router;
