# Automated Testing — My Thalavadi

`test-suite.js` is a real, runnable test suite — no test framework needed, just Node's built-in `fetch`. It exercises every major feature end to end against your actual running backend: auth, businesses, rides (including the vehicle-verification and same-place validation), events (ID-verification gate), the full tournament workflow (create → register teams → approve → generate fixtures → enter results → points table), blood donor profile sync, and the notification-preferences persistence that was a real bug earlier in development.

**This was not just written — it was actually run.** I installed Postgres and your real backend in my own environment, loaded your actual `schema.sql`/`seed.sql`, and executed this suite against it. First run caught two real gaps in the *test* (not the app): it didn't realize rides require Verified Driver status separately from ID verification, and it wrongly assumed the backend re-applies Proper Case (that's a frontend-only transform). After fixing the test's own assumptions, **all 40 checks passed against your real backend.**

## Running it yourself

You need `psql` on your PATH (comes with any local Postgres install, or use the one inside your Docker setup).

```powershell
cd C:\Projects\thalavadi-backend
docker compose up -d          # make sure the backend + Postgres are running
node test-suite.js
```

By default it targets `http://localhost:4000`. To test a deployed backend instead:
```powershell
$env:BASE_URL="https://your-backend.up.railway.app"; node test-suite.js
```

**One thing to know**: the suite reads OTP codes directly from the `otp_codes` table via `psql` (since there's no real inbox to check in an automated test) — it assumes it can reach the same Postgres your backend uses, with the default `postgres`/`postgres` credentials from your local `docker-compose.yml`. If you've changed those, edit the `PGPASSWORD=postgres psql -h localhost -U postgres` lines near the top of the file to match.

**Also worth knowing**: this suite creates real test data (a test user, a business, a ride, an event, a tournament with 4 teams) in whatever database you point it at. Don't run it against your real production database — use a local or staging instance.

## What's *not* covered by test-suite.js

That suite tests the backend API directly — it doesn't drive the actual React UI (no clicking through screens), and it doesn't test frontend-only behaviors (Proper Case formatting, the navigation history stack, the tile notification badges, the UPI deep-link button). See below for that layer.

---

# Browser tests (browser-tests.spec.js)

This one drives an actual Chromium browser against your running frontend with Playwright — the layer `test-suite.js` can't reach.

**Important, and worth being upfront about**: unlike `test-suite.js`, I could not run this one myself. My sandboxed environment explicitly blocks Playwright's browser download (`cdn.playwright.dev` isn't reachable), and the system's own `chromium-browser` package is a non-functional Snap stub in this container. I wrote it carefully and cross-checked every button/placeholder text against the real frontend source so it isn't just guessing at strings, but you'll be the one to actually run it for the first time. If something fails, that's genuinely useful — tell me what broke and I'll fix the real cause, not just patch the test.

## Setup (one-time)

```powershell
cd C:\Projects\thalavadi-app
npm install -D @playwright/test
npx playwright install chromium
```

Copy `browser-tests.spec.js` into your `thalavadi-app` folder (or a `tests/` subfolder — adjust the run command below to match).

## Running it

Both your backend and frontend dev servers need to already be running:
```powershell
# Terminal 1
cd C:\Projects\thalavadi-backend
docker compose up -d

# Terminal 2
cd C:\Projects\thalavadi-app
npm run dev

# Terminal 3
npx playwright test browser-tests.spec.js --headed
```
`--headed` opens a real visible browser window so you can watch it click through the app — drop it for headless (faster, no window) once you trust it's working.

Like `test-suite.js`, this reads OTP codes straight from Postgres via `psql` and needs the same default `postgres`/`postgres` local credentials — adjust the `DB_CMD` line near the top of the file if yours differ.

## What it covers

Login validation, the mandatory-phone-before-dashboard flow, the navigation-history regression fix (stepping back one level at a time in the Admin panel instead of jumping straight to Dashboard), Proper Case as it actually renders after posting an Event, the UPI "Pay via UPI" button's real `href` (confirms it's a genuine `upi://pay` deep link with the right amount and UPI ID encoded), and creating a tournament through the real form.

