require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const pool = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const businessRoutes = require("./routes/businessRoutes");
const busRoutes = require("./routes/busRoutes");
const bloodDonorRoutes = require("./routes/bloodDonorRoutes");
const governmentOfficeRoutes = require("./routes/governmentOfficeRoutes");
const emergencyContactRoutes = require("./routes/emergencyContactRoutes");
const weatherRoutes = require("./routes/weatherRoutes");
const classifiedRoutes = require("./routes/classifiedRoutes");
const newsAlertRoutes = require("./routes/newsAlertRoutes");
const communityRoutes = require("./routes/communityRoutes");
const adminRoutes = require("./routes/adminRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const galleryRoutes = require("./routes/galleryRoutes");
const eventRoutes = require("./routes/eventRoutes");
const rideRequestRoutes = require("./routes/rideRequestRoutes");
const geocodeRoutes = require("./routes/geocodeRoutes");
const ratingRoutes = require("./routes/ratingRoutes");
const farmerRoutes = require("./routes/farmerRoutes");
const searchRoutes = require("./routes/searchRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const postingPermissionRoutes = require("./routes/postingPermissionRoutes");
const activityLogger = require("./middleware/activityLogger");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(helmet());
app.use(cors());
// Raised so base64-encoded multi-resolution images (thumbnail + medium +
// original bundled together) fit comfortably in one request.
app.use(express.json({ limit: "15mb" }));

app.get("/health", (req, res) => res.json({ status: "ok" }));

// General abuse protection — applies to all API routes. The tighter
// OTP-specific limiter in authRoutes.js still applies on top of this.
const generalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500, standardHeaders: true, legacyHeaders: false });
app.use("/api", generalLimiter);
app.use("/api", activityLogger);

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/businesses", businessRoutes);
app.use("/api/buses", busRoutes);
app.use("/api/blood-donors", bloodDonorRoutes);
app.use("/api/government-offices", governmentOfficeRoutes);
app.use("/api/emergency-contacts", emergencyContactRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/classifieds", classifiedRoutes);
app.use("/api/news", newsAlertRoutes);
app.use("/api/communities", communityRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/ride-requests", rideRequestRoutes);
app.use("/api/geocode", geocodeRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/farmer-services", farmerRoutes);
app.use("/api/farmer-categories", farmerRoutes.categoryRouter);
app.use("/api/search", searchRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/posting-permissions", postingPermissionRoutes);

app.use((req, res) => res.status(404).json({ error: "Route not found" }));
app.use(errorHandler);

// Recommended retention: 90 days for activity logs, 30 days for error logs.
// Runs once at startup, then every 24 hours.
const ACTIVITY_LOG_RETENTION_DAYS = 90;
const ERROR_LOG_RETENTION_DAYS = 30;

function cleanupOldLogs() {
  pool
    .query(`DELETE FROM activity_logs WHERE created_at < now() - interval '${ACTIVITY_LOG_RETENTION_DAYS} days'`)
    .catch((err) => console.error("Activity log cleanup failed:", err.message));
  pool
    .query(`DELETE FROM error_logs WHERE created_at < now() - interval '${ERROR_LOG_RETENTION_DAYS} days'`)
    .catch((err) => console.error("Error log cleanup failed:", err.message));
}
cleanupOldLogs();
setInterval(cleanupOldLogs, 24 * 60 * 60 * 1000);

// ─────────────────────────────────────────────
// LIFECYCLE SWEEP
// Runs every hour. Two jobs:
//  1. Auto-complete return pickups / car pools once their end date+time
//     has passed (their listing stays useful up to that point, then it's
//     stale — nobody should be calling about a ride that's already over).
//  2. Archive anything "done" for long enough that it no longer needs to
//     live in the active table — completed events/rides/classifieds after
//     30 days, and news after 5 days (matching how quickly local news goes
//     stale). Archiving snapshots the full row into archived_listings
//     before deleting it, so nothing is actually lost, just moved out of
//     the way of everyday browsing.
// ─────────────────────────────────────────────
const COMPLETED_RETENTION_DAYS = 30;
const NEWS_RETENTION_DAYS = 5;

async function archiveRows(sourceTable, whereClause, titleColumn) {
  const { rows } = await pool.query(`SELECT * FROM ${sourceTable} WHERE ${whereClause}`);
  if (rows.length === 0) return;
  for (const row of rows) {
    await pool.query(
      `INSERT INTO archived_listings (source_table, original_id, title, payload) VALUES ($1,$2,$3,$4)`,
      [sourceTable, String(row.id), row[titleColumn] || null, JSON.stringify(row)]
    );
  }
  const ids = rows.map((r) => r.id);
  await pool.query(`DELETE FROM ${sourceTable} WHERE id = ANY($1::${sourceTable === "news_alerts" ? "int" : "uuid"}[])`, [ids]);
}

async function runLifecycleSweep() {
  try {
    // 1. Auto-complete rides past their end date/time.
    await pool.query(`
      UPDATE ride_requests SET status = 'completed'
      WHERE status = 'open' AND COALESCE(end_date, travel_date) IS NOT NULL
        AND (COALESCE(end_date, travel_date) + COALESCE(end_time, '23:59:59'::time)) < now()
    `);

    // 2. Archive completed events, 30+ days after they ended.
    await archiveRows(
      "events",
      `(COALESCE(end_date, start_date) + COALESCE(end_time, start_time, '23:59:59'::time)) < now() - interval '${COMPLETED_RETENTION_DAYS} days'`,
      "title"
    );

    // 3. Archive completed rides once the day they ended has passed — a
    // completed ride's listing has no further use once the day is over,
    // unlike Events/Classifieds which stay browsable for a while after.
    await archiveRows(
      "ride_requests",
      `status = 'completed' AND COALESCE(end_date, travel_date, created_at::date) < CURRENT_DATE`,
      "title"
    );

    // 4. Archive completed Jobs/Rentals/Properties, 30+ days after the poster closed them.
    await archiveRows(
      "classifieds",
      `status = 'completed' AND created_at < now() - interval '${COMPLETED_RETENTION_DAYS} days'`,
      "title"
    );

    // 5. Archive news older than 5 days (2 days "Latest", up to 5 days "Old News", then archived).
    await archiveRows(
      "news_alerts",
      `created_at < now() - interval '${NEWS_RETENTION_DAYS} days'`,
      "title"
    );
  } catch (err) {
    console.error("Lifecycle sweep failed:", err.message);
  }
}
runLifecycleSweep();
setInterval(runLifecycleSweep, 60 * 60 * 1000);

const PORT = process.env.PORT || 4000;

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes("replace_with")) {
  console.warn(
    "\n⚠️  WARNING: JWT_SECRET is missing or still set to the example placeholder.\n" +
    "   Set a long, random value in your .env file before exposing this app beyond your own laptop.\n"
  );
}

app.listen(PORT, () => console.log(`Thalavadi API running on port ${PORT}`));
