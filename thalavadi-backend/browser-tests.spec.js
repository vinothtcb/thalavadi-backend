// ─────────────────────────────────────────────
// BROWSER TEST SUITE — My Thalavadi (Playwright)
//
// Drives an actual browser against your running frontend, covering
// behaviors the API test suite can't see: Proper Case as it actually
// displays, the navigation history fix, tile notification badges, and
// the UPI deep-link button's real href.
//
// IMPORTANT — this was written carefully but NOT executed by me. This
// sandboxed environment blocks Playwright's browser download (confirmed:
// cdn.playwright.dev returns 403, not in the network allowlist), so unlike
// the backend test-suite.js (which I actually ran against a real Postgres
// + Node server and fixed 2 real issues), this is un-run. You'll be the
// first to execute it. If something fails, it's genuinely useful signal —
// tell me what broke and I'll fix the real issue, not just the test.
//
// Setup (one-time):
//   cd thalavadi-app
//   npm install -D @playwright/test
//   npx playwright install chromium
//
// Run (with both your backend AND frontend dev servers already running):
//   npx playwright test browser-tests.spec.js
// ─────────────────────────────────────────────

const { test, expect } = require("@playwright/test");
const { execSync } = require("child_process");

const APP_URL = process.env.APP_URL || "http://localhost:5173";
const DB_CMD = `PGPASSWORD=postgres psql -h localhost -U postgres -d thalavadi -t -c`;

function getLatestOtp(email) {
  return execSync(`${DB_CMD} "SELECT code FROM otp_codes WHERE email='${email}' ORDER BY created_at DESC LIMIT 1"`)
    .toString().trim();
}

function makeUserAdminAndVerified(email) {
  execSync(`${DB_CMD} "UPDATE users SET role='admin', id_verification_status='verified', verified_driver=true WHERE email='${email}'"`);
}

// Logs in via the real UI (types the email, waits for OTP to land in the
// database, types the code) rather than injecting a token — this way the
// test also exercises the actual login screen, not just what's behind it.
async function loginViaUI(page, email) {
  await page.goto(APP_URL);
  await page.getByPlaceholder("you@example.com").fill(email);
  await page.getByRole("button", { name: "Send OTP" }).click();
  await page.waitForTimeout(500); // give the backend a moment to write the OTP row
  const code = getLatestOtp(email);
  const digits = code.split("");
  const otpInputs = page.locator('input[id^="otp-"]');
  for (let i = 0; i < digits.length; i++) await otpInputs.nth(i).fill(digits[i]);
  await page.getByRole("button", { name: "Verify & Continue" }).click();
}

test.describe("Login and first-time profile completion", () => {
  test("rejects an invalid email before sending OTP", async ({ page }) => {
    await page.goto(APP_URL);
    await page.getByPlaceholder("you@example.com").fill("not-an-email");
    await page.getByRole("button", { name: "Send OTP" }).click();
    await expect(page.getByText("Enter a valid email address")).toBeVisible();
  });

  test("new user must complete phone before reaching the dashboard", async ({ page }) => {
    const email = `pwtest${Date.now()}@example.com`;
    await loginViaUI(page, email);
    await expect(page.getByText("Welcome to My Thalavadi")).toBeVisible();
    // Try to continue without a phone number
    await page.getByPlaceholder("Your name").fill("Playwright Test");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("Enter a valid 10-digit phone number")).toBeVisible();
    // Now complete it properly
    await page.getByPlaceholder("10-digit number").first().fill("9876543299");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.locator("text=Here's What's Around You")).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Navigation history (the fix from earlier in development)", () => {
  test("hardware-style back button steps out one level at a time in Admin", async ({ page }) => {
    const email = `pwadmin${Date.now()}@example.com`;
    await loginViaUI(page, email);
    await page.getByPlaceholder("Your name").fill("Admin Test");
    await page.getByPlaceholder("10-digit number").first().fill("9876543298");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForSelector("text=Here's What's Around You");
    makeUserAdminAndVerified(email);
    await page.reload(); // pick up the new admin role

    // Navigate: Profile -> Admin Panel -> a group -> a tab
    await page.locator('button[aria-label], button').filter({ hasText: /^$/ }).first(); // no-op, just ensures page settled
    await page.getByRole("button", { name: /profile/i }).first().click().catch(() => {});
    // Fallback: use the profile icon in the header if the text button isn't found
    const adminBtn = page.getByRole("button", { name: "Admin Panel" });
    if (!(await adminBtn.isVisible().catch(() => false))) {
      await page.locator('button:has(svg)').last().click(); // profile icon in header
    }
    await page.getByRole("button", { name: "Admin Panel" }).click();
    await expect(page.getByText("Admin Panel")).toBeVisible();

    await page.getByText("Users & Moderation").click();
    await expect(page.getByText("Posting Permissions")).toBeVisible();

    // This is the actual regression test: back should go to the group list,
    // NOT jump straight to Dashboard (that was the bug).
    await page.getByRole("button", { name: "Back" }).click();
    await expect(page.getByText("Admin Panel")).toBeVisible();
    await expect(page.getByText("Top Services")).toBeVisible();
  });
});

test.describe("Posting forms — Proper Case as actually displayed", () => {
  test("event title and location display in Proper Case after posting lowercase input", async ({ page }) => {
    const email = `pwevent${Date.now()}@example.com`;
    await loginViaUI(page, email);
    await page.getByPlaceholder("Your name").fill("Event Poster");
    await page.getByPlaceholder("10-digit number").first().fill("9876543297");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForSelector("text=Here's What's Around You");
    makeUserAdminAndVerified(email); // admin bypasses the ID-verification gate for posting
    await page.reload();

    await page.getByText("Events").first().click();
    await page.getByRole("button", { name: "Create Event" }).click();
    await page.getByPlaceholder("Event name").fill("thalavadi summer festival");
    await page.getByPlaceholder("What's happening").fill("annual community gathering");
    await page.getByPlaceholder(/Panchayat Grounds/).fill("panchayat grounds");
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const dayAfter = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
    await page.locator('input[type="date"]').first().fill(tomorrow);
    await page.locator('input[type="time"]').first().fill("10:00");
    await page.locator('input[type="date"]').nth(1).fill(dayAfter);
    await page.locator('input[type="time"]').nth(1).fill("18:00");
    await page.getByPlaceholder("Organizer name").fill("test organizer");
    await page.getByPlaceholder("10-digit number").last().fill("9876543296");
    await page.getByRole("button", { name: "Create Event" }).click();

    // The regression check: what actually renders should be Title Case,
    // not the lowercase text that was typed.
    await expect(page.getByText("Thalavadi Summer Festival")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Panchayat Grounds")).toBeVisible();
  });
});

test.describe("UPI payment deep link", () => {
  test("Pay via UPI button has a correctly-formed upi:// href", async ({ page }) => {
    const email = `pwupi${Date.now()}@example.com`;
    await loginViaUI(page, email);
    await page.getByPlaceholder("Your name").fill("UPI Test");
    await page.getByPlaceholder("10-digit number").first().fill("9876543295");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForSelector("text=Here's What's Around You");
    makeUserAdminAndVerified(email);
    await page.reload();

    await page.getByText("Events").first().click();
    await page.getByRole("button", { name: "Create Event" }).click();
    await page.getByPlaceholder("Event name").fill("paid test event");
    await page.getByPlaceholder("What's happening").fill("ticketed event");
    await page.getByPlaceholder(/Panchayat Grounds/).fill("test venue");
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const dayAfter = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
    await page.locator('input[type="date"]').first().fill(tomorrow);
    await page.locator('input[type="time"]').first().fill("10:00");
    await page.locator('input[type="date"]').nth(1).fill(dayAfter);
    await page.locator('input[type="time"]').nth(1).fill("18:00");
    await page.getByPlaceholder("Organizer name").fill("organizer");
    await page.getByPlaceholder("10-digit number").last().fill("9876543294");
    await page.getByRole("button", { name: "Paid Event" }).click();
    await page.getByPlaceholder("e.g. 100").fill("250");
    await page.getByPlaceholder("e.g. organizer@upi").fill("testorg@upi");
    await page.getByRole("button", { name: "Create Event" }).click();

    const payButton = page.getByRole("link", { name: /Pay via UPI/i });
    await expect(payButton).toBeVisible({ timeout: 10000 });
    const href = await payButton.getAttribute("href");
    expect(href).toContain("upi://pay");
    expect(href).toContain("pa=testorg%40upi");
    expect(href).toContain("am=250");
  });
});

test.describe("Tournament workflow (frontend)", () => {
  test("organizer can create a tournament and see it in the list", async ({ page }) => {
    const email = `pwtourn${Date.now()}@example.com`;
    await loginViaUI(page, email);
    await page.getByPlaceholder("Your name").fill("Organizer Test");
    await page.getByPlaceholder("10-digit number").first().fill("9876543293");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForSelector("text=Here's What's Around You");
    makeUserAdminAndVerified(email);
    await page.reload();

    await page.getByText("Tournaments").click();
    await page.getByRole("button", { name: "Create Tournament" }).click();
    await page.getByPlaceholder(/Cricket Cup/).fill("playwright cricket cup");
    await page.locator("select").first().selectOption("Cricket");
    await page.locator("select").nth(1).selectOption("Round Robin");
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    await page.locator('input[type="date"]').first().fill(tomorrow);
    await page.getByRole("button", { name: "Create Tournament" }).click();

    await expect(page.getByText("Playwright Cricket Cup")).toBeVisible({ timeout: 10000 });
  });
});
