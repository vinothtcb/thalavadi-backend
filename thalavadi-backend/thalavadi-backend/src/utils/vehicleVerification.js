// ─────────────────────────────────────────────
// VEHICLE VERIFICATION
//
// There is no public API for India's VAHAN vehicle registry. Real
// verification requires a paid third-party provider with your own business
// account and API key — e.g. Surepass, IDfy, or Signzy all offer an
// "RC verification" endpoint that takes a registration number and returns
// the registered vehicle class/type, which is what step 4-5 below need.
//
// Until real credentials are wired in here, every new listing is saved as
// 'pending' and stays that way — an admin can manually mark it Verified or
// Verification Failed from the admin panel after checking the vehicle
// themselves. This function is the one place to change once you have a
// provider: replace the body with the real API call, keep the same
// return shape, and every place that calls it (ride requests, Auto/Cab
// classifieds) will start using real verification automatically.
// ─────────────────────────────────────────────

/**
 * @param {string} normalizedNumber - e.g. "TN36AB1234"
 * @param {string} declaredVehicleType - what the poster selected in the form
 * @returns {Promise<{status: 'verified'|'pending'|'failed', note: string}>}
 */
async function verifyVehicleWithAuthorizedSource(normalizedNumber, declaredVehicleType) {
  // TODO: integrate a real RC-verification provider here. Example shape
  // once you have one (pseudocode, not a working call):
  //
  //   const res = await fetch("https://api.<provider>.com/v1/rc-verify", {
  //     method: "POST",
  //     headers: { Authorization: `Bearer ${process.env.RC_VERIFY_API_KEY}` },
  //     body: JSON.stringify({ registration_number: normalizedNumber }),
  //   });
  //   const data = await res.json();
  //   const matches = data.vehicle_class matches declaredVehicleType;
  //   return { status: matches ? "verified" : "failed", note: data.vehicle_class };

  return { status: "pending", note: "Awaiting manual admin review — no verification provider configured." };
}

module.exports = { verifyVehicleWithAuthorizedSource };
