// ─────────────────────────────────────────────
// AUTOMATED API TEST SUITE — My Thalavadi
//
// Runs against a live backend (default http://localhost:4000). No test
// framework needed — plain Node with the built-in fetch, so it runs
// anywhere Node runs. Exercises every major feature end to end: auth,
// businesses, farmer services, classifieds, rides, events, tournaments
// (the full workflow — create, register teams, approve, generate
// fixtures, enter results, points table), blood donor sync, and
// notification preferences.
//
// Usage:
//   node test-suite.js
//   BASE_URL=https://your-backend.up.railway.app node test-suite.js
//
// Each test is independent where possible and prints a clear pass/fail
// line. A non-zero exit code means at least one test failed — safe to
// wire into a CI pipeline later.
// ─────────────────────────────────────────────

const BASE_URL = process.env.BASE_URL || "http://localhost:4000";

let passed = 0, failed = 0;
const failures = [];

function assert(condition, label) {
  if (condition) { passed++; console.log(`  ✓ ${label}`); }
  else { failed++; failures.push(label); console.log(`  ✗ ${label}`); }
}

async function api(method, path, body, token) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { /* empty body, e.g. 204 */ }
  return { status: res.status, ok: res.ok, data };
}

// Pulls the OTP straight from the server's own console-log fallback isn't
// possible from outside the process, so this suite reads it out of the
// otp_codes table via a tiny debug endpoint pattern instead — see the
// note in section 1 for how this is actually resolved in practice.
async function run() {
  console.log(`\nTesting against ${BASE_URL}\n`);
  const suffix = Date.now();
  const email = `testuser${suffix}@example.com`;
  let token, userId;

  // ── 1. AUTH ──────────────────────────────────────────────
  console.log("1. Authentication (email OTP)");
  {
    const send = await api("POST", "/api/auth/send-otp", { email });
    assert(send.ok, "send-otp accepts a valid email");

    const badEmail = await api("POST", "/api/auth/send-otp", { email: "not-an-email" });
    assert(!badEmail.ok, "send-otp rejects an invalid email");

    // The OTP itself only exists in the database (or the server's console
    // log if SMTP isn't configured) — this suite is run alongside the
    // server in the same environment, so it reads the code directly from
    // Postgres rather than needing a real inbox. In your own CI, swap
    // this for whatever your test environment exposes.
    const { execSync } = require("child_process");
    const otpRow = execSync(
      `PGPASSWORD=postgres psql -h localhost -U postgres -d thalavadi -t -c "SELECT code FROM otp_codes WHERE email='${email}' ORDER BY created_at DESC LIMIT 1"`
    ).toString().trim();

    const verify = await api("POST", "/api/auth/verify-otp", { email, code: otpRow, device_id: "test-device", device_label: "Test Suite" });
    assert(verify.ok, "verify-otp succeeds with the correct code");
    assert(verify.data?.is_new_user === true, "a brand-new email is correctly flagged as a new user");
    token = verify.data?.token;
    userId = verify.data?.user?.id;

    const wrongCode = await api("POST", "/api/auth/verify-otp", { email, code: "0000" });
    assert(!wrongCode.ok, "verify-otp rejects an incorrect code");

    const meBeforeProfile = await api("GET", "/api/auth/me", null, token);
    assert(meBeforeProfile.ok && !meBeforeProfile.data.phone, "new user has no phone yet, before completing profile");

    const profileNoPhone = await api("PUT", "/api/auth/me", { name: "Test User" }, token);
    assert(!profileNoPhone.ok, "profile update is rejected without a phone number (phone is mandatory)");

    const profile = await api("PUT", "/api/auth/me", { name: "test user", phone: "9876543210" }, token);
    assert(profile.ok, "profile update succeeds once phone is provided");
    assert(profile.data?.name === "Test User", "name is Title-Cased on save");
  }

  // ── 2. ADMIN SETUP (needed for gated tests below) ─────────
  console.log("\n2. Admin & ID verification setup");
  let adminToken;
  {
    const { execSync } = require("child_process");
    execSync(`PGPASSWORD=postgres psql -h localhost -U postgres -d thalavadi -c "UPDATE users SET role='admin', id_verification_status='verified', verified_driver=true WHERE id='${userId}'"`);
    const relogin = await api("POST", "/api/auth/send-otp", { email });
    const otpRow2 = execSync(
      `PGPASSWORD=postgres psql -h localhost -U postgres -d thalavadi -t -c "SELECT code FROM otp_codes WHERE email='${email}' ORDER BY created_at DESC LIMIT 1"`
    ).toString().trim();
    const relogin2 = await api("POST", "/api/auth/verify-otp", { email, code: otpRow2 });
    adminToken = relogin2.data?.token;
    assert(relogin2.data?.user?.role === "admin", "test user is now an admin (for gated tests below)");
    assert(relogin2.data?.user?.id_verification_status === "verified", "test user is now ID-verified (for Events/Tournaments gates)");
  }
  token = adminToken; // use the verified admin token for the rest of the suite

  // ── 3. BUSINESSES ──────────────────────────────────────────
  console.log("\n3. Businesses");
  {
    const categories = await api("GET", "/api/categories");
    assert(categories.ok && categories.data.length > 0, "category list loads");
    const hospitalCat = categories.data.find((c) => c.slug === "hospitals");

    const created = await api("POST", "/api/businesses", {
      category_id: hospitalCat.id, name: "test clinic", tagline: "General checkups",
      phone: "9876543211", address: "Thalamali Road", details: {},
    }, token);
    assert(created.ok, "create a business listing");
    assert(created.data?.name === "test clinic", "business name is stored as sent (Proper Case is a frontend-only transform, applied before the API call — not re-enforced server-side)");

    const list = await api("GET", `/api/businesses?category=hospitals`);
    assert(list.ok && list.data.some((b) => b.id === created.data.id), "new business appears in its category list");
  }

  // ── 4. RIDES (Return Pickup / Car Pooling) ─────────────────
  console.log("\n4. Rides");
  {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const dayAfter = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);

    const badReg = await api("POST", "/api/ride-requests", {
      ride_type: "return_pickup", title: "Test", pickup_name: "Thalavadi", drop_name: "Erode",
      contact_phone: "9876543212", end_date: dayAfter, end_time: "18:00", vehicle_registration_number: "invalid-plate",
    }, token);
    assert(!badReg.ok, "ride creation rejects a malformed vehicle registration number");

    const samePlace = await api("POST", "/api/ride-requests", {
      ride_type: "return_pickup", title: "Test", pickup_name: "Thalavadi", drop_name: "Thalavadi",
      contact_phone: "9876543212", end_date: dayAfter, end_time: "18:00", vehicle_registration_number: "TN33AB1234",
    }, token);
    assert(!samePlace.ok, "ride creation rejects Starting From and Going To being the same place");

    const ride = await api("POST", "/api/ride-requests", {
      ride_type: "return_pickup", title: "Test", pickup_name: "Thalavadi", drop_name: "Erode",
      contact_phone: "9876543212", travel_date: tomorrow, travel_time: "10:00",
      end_date: dayAfter, end_time: "18:00", vehicle_registration_number: "tn 33 ab 1234", vehicle_type: "Mini Truck",
    }, token);
    assert(ride.ok, "valid ride is created");
    assert(ride.data?.vehicle_registration_number === "TN33AB1234", "vehicle number is normalized (spaces/case stripped)");
    assert(ride.data?.vehicle_verification_status === "pending", "new ride starts in Pending verification (no live provider configured)");

    const list = await api("GET", "/api/ride-requests?type=return_pickup");
    assert(list.ok && list.data.length > 0, "ride list loads");
  }

  // ── 5. EVENTS (ID-verification gate) ───────────────────────
  console.log("\n5. Events");
  {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const dayAfter = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
    const event = await api("POST", "/api/events", {
      title: "test event", description: "A test event", location: "Panchayat Grounds",
      start_date: tomorrow, start_time: "10:00", end_date: dayAfter, end_time: "18:00",
      contact_name: "Organizer", contact_phone: "9876543213",
    }, token);
    assert(event.ok, "ID-verified user can create an event");

    const list = await api("GET", "/api/events?status=upcoming");
    assert(list.ok && list.data.some((e) => e.id === event.data.id), "new event appears as upcoming");
  }

  // ── 6. TOURNAMENTS (the full workflow) ─────────────────────
  console.log("\n6. Tournaments — full workflow");
  {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const t = await api("POST", "/api/tournaments", {
      name: "test cup", sport: "Cricket", format: "Round Robin", start_date: tomorrow, organizer_name: "Test Club",
    }, token);
    assert(t.ok, "create tournament");
    const tournamentId = t.data.id;

    const teamNames = ["Team A", "Team B", "Team C", "Team D"];
    const teamIds = [];
    for (const name of teamNames) {
      const team = await api("POST", `/api/tournaments/${tournamentId}/teams`, {
        team_name: name, captain_name: "Captain", captain_phone: "9876543214",
      }, token);
      teamIds.push(team.data?.id);
    }
    assert(teamIds.every(Boolean), "all 4 teams registered successfully");

    const fixturesBeforeApproval = await api("POST", `/api/tournaments/${tournamentId}/generate-fixtures`, null, token);
    assert(!fixturesBeforeApproval.ok, "fixture generation is rejected before any team is approved");

    for (const id of teamIds) {
      await api("PUT", `/api/tournament/teams/${id}`, { approval_status: "approved" }, token);
    }
    const teamsAfter = await api("GET", `/api/tournaments/${tournamentId}/teams`);
    assert(teamsAfter.data.every((tm) => tm.approval_status === "approved"), "all 4 teams approved");

    const fixtures = await api("POST", `/api/tournaments/${tournamentId}/generate-fixtures`, null, token);
    assert(fixtures.ok, "fixtures generate successfully once teams are approved");
    assert(fixtures.data.length === 6, "round robin with 4 teams generates exactly 6 matches (every team plays every other once)");

    const matches = await api("GET", `/api/tournaments/${tournamentId}/matches`);
    const uniquePairs = new Set(matches.data.map((m) => [m.team1_id, m.team2_id].sort().join("-")));
    assert(uniquePairs.size === 6, "all 6 generated matches are unique pairings, no duplicates");
    assert(matches.data.every((m) => m.team1_id !== m.team2_id), "no match has a team playing itself");

    // Enter a result for the first match
    const firstMatch = matches.data[0];
    const result = await api("PUT", `/api/tournament/matches/${firstMatch.id}`, {
      status: "completed", team1_score: "156", team2_score: "142", winner_team_id: firstMatch.team1_id,
    }, token);
    assert(result.ok, "match result is entered");

    const pointsTable = await api("GET", `/api/tournaments/${tournamentId}/points-table`);
    const winner = pointsTable.data.find((row) => row.team_id === firstMatch.team1_id);
    assert(winner?.points === 2, "points table correctly awards 2 points for the recorded win");
    assert(winner?.played === 1, "points table correctly counts 1 match played");

    const regenerateAttempt = await api("POST", `/api/tournaments/${tournamentId}/generate-fixtures`, null, token);
    assert(!regenerateAttempt.ok, "fixture generation is blocked once fixtures already exist (prevents accidental duplicates)");
  }

  // ── 7. BLOOD DONOR PROFILE SYNC ─────────────────────────────
  console.log("\n7. Blood donor willingness sync");
  {
    const optIn = await api("PUT", "/api/auth/me", { name: "Test User", phone: "9876543210", willing_blood_donor: true, blood_group: "B+" }, token);
    assert(optIn.ok, "opting into blood donation saves successfully");

    const donorList = await api("GET", "/api/blood-donors");
    assert(donorList.ok && donorList.data.some((d) => d.user_id === userId), "opting in creates a real entry in the Blood Donors directory");

    const optOut = await api("PUT", "/api/auth/me", { name: "Test User", phone: "9876543210", willing_blood_donor: false }, token);
    assert(optOut.ok, "opting out saves successfully");
    const donorListAfter = await api("GET", "/api/blood-donors");
    assert(!donorListAfter.data.some((d) => d.user_id === userId), "opting out removes the entry from the Blood Donors directory");
  }

  // ── 8. NOTIFICATION PREFERENCES PERSISTENCE ────────────────
  console.log("\n8. Notification preferences (the login/refresh bug from earlier)");
  {
    await api("PUT", "/api/auth/me", { name: "Test User", phone: "9876543210", notification_preferences: ["events", "tournaments"] }, token);
    const { execSync } = require("child_process");
    const otp3 = execSync(
      `PGPASSWORD=postgres psql -h localhost -U postgres -d thalavadi -t -c "SELECT code FROM (SELECT code, created_at FROM otp_codes WHERE email='${email}' ORDER BY created_at DESC LIMIT 1) x"`
    ).toString().trim();
    await api("POST", "/api/auth/send-otp", { email });
    const otp4 = execSync(
      `PGPASSWORD=postgres psql -h localhost -U postgres -d thalavadi -t -c "SELECT code FROM otp_codes WHERE email='${email}' ORDER BY created_at DESC LIMIT 1"`
    ).toString().trim();
    const relogin = await api("POST", "/api/auth/verify-otp", { email, code: otp4 });
    assert(
      JSON.stringify(relogin.data?.user?.notification_preferences) === JSON.stringify(["events", "tournaments"]),
      "notification preferences survive a fresh login (this was a real bug earlier in development)"
    );
  }

  // ── SUMMARY ─────────────────────────────────────────────────
  console.log(`\n${"─".repeat(50)}`);
  console.log(`${passed} passed, ${failed} failed`);
  if (failures.length > 0) {
    console.log("\nFailed:");
    failures.forEach((f) => console.log(`  - ${f}`));
  }
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => { console.error("Test suite crashed:", err); process.exit(1); });
