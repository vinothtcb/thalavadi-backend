# Security Notes — My Thalavadi

## What's already in place

- **Authentication**: OTP-based login (no passwords to leak). JWTs are signed with `JWT_SECRET` and expire after `JWT_EXPIRES_IN` (default 30 days). The server refuses to start quietly if `JWT_SECRET` is missing or left as the example placeholder — it prints a warning.
- **Authorization**: Every write endpoint checks either `requireAuth` (must be logged in) or `requireAdmin` (must have `role = 'admin'`). Classifieds, ride requests, and events can only be edited/deleted by their original poster or an admin — this is checked server-side, not just hidden in the UI.
- **Rate limiting**:
  - OTP requests: 5 per 15 minutes per IP (prevents SMS-cost abuse and OTP brute-forcing).
  - OTP verification: capped at 5 incorrect attempts per code.
  - All other API routes: 500 requests per 15 minutes per IP (general abuse/DoS protection).
  - Geocoding: separately rate-limited to stay within OpenStreetMap Nominatim's usage policy.
- **SQL injection protection**: every database query uses parameterized queries (`$1, $2, ...`); user input is never concatenated into SQL strings. Field *names* used in dynamic UPDATE statements come from fixed, hardcoded whitelists — never from request input.
- **Input validation**: phone numbers, email addresses, and image uploads are validated both client-side (immediate feedback) and server-side (`src/utils/validators.js`) — the server never trusts the client alone.
- **Image uploads**: capped at 5MB, validated server-side to ensure the payload is actually a `data:image/...;base64,` image, not arbitrary data.
- **HTTP headers**: `helmet` sets standard security headers (prevents clickjacking, disables `X-Powered-By`, etc.) on every response.
- **Privilege escalation prevention**: `PUT /api/auth/me` only ever updates `name`, `email`, and `location` — a user can never set their own `role` to `admin` through the API.
- **Audit trail**: every write action is logged (`activity_logs`) with the acting user's phone number, and every server error is logged separately (`error_logs`) — both viewable by admins and auto-purged on a retention schedule (see `README.md`).

## Before you make this public (beyond your own laptop)

- [ ] Set a strong, unique `JWT_SECRET` — never the example value.
- [ ] Change the PostgreSQL password from the `docker-compose.yml` default.
- [ ] Serve the app over **HTTPS** (e.g. behind Nginx/Caddy, or a platform that terminates TLS).
- [ ] Restrict `cors()` in `server.js` to your actual frontend domain instead of allowing all origins.
- [ ] Move `OTP_CHANNEL` off the console-log fallback to a real channel (Kannel or email — see README).
- [ ] Consider moving image storage off the database (e.g. to object storage) if the gallery/classifieds grow large — base64-in-Postgres is fine for a small community app but doesn't scale indefinitely.
- [ ] Review the general rate limit (`500 req / 15 min`) against your real expected traffic and tune if needed.
