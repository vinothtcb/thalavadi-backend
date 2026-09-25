const pool = require("../config/db");
const { isValidPhone, isValidImageDataUrl } = require("../utils/validators");
const { notifyUsersForNewPost } = require("../utils/whatsappNotify");

// ─────────────────────────────────────────────
// TOURNAMENTS — core CRUD
// ─────────────────────────────────────────────

// GET /api/tournaments  (optional ?status=registration_open|in_progress|completed)
async function listTournaments(req, res, next) {
  try {
    const { status } = req.query;
    const params = [];
    let query = `SELECT t.*, u.name AS poster_name FROM tournaments t LEFT JOIN users u ON u.id = t.posted_by WHERE t.is_active = true`;
    if (status) { params.push(status); query += ` AND t.status = $${params.length}`; }
    query += ` ORDER BY t.start_date DESC`;
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) { next(err); }
}

// GET /api/tournaments/:id
async function getTournament(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT t.*, u.name AS poster_name FROM tournaments t LEFT JOIN users u ON u.id = t.posted_by WHERE t.id = $1`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Tournament not found" });
    res.json(rows[0]);
  } catch (err) { next(err); }
}

const SPORTS = ["Cricket", "Football", "Volleyball", "Kabaddi", "Badminton", "Chess", "Carrom", "Esports", "Custom"];
const FORMATS = ["Knockout", "Double Elimination", "Round Robin", "Group + Knockout", "League", "Swiss", "League + Knockout", "Custom"];
const PARTICIPATION_TYPES = ["Individual", "Team", "Pair / Doubles", "Team Event", "Individual + Team", "Custom"];

// POST /api/tournaments — same ID-verification gate as Events, since a
// tournament organizer is making commitments (schedules, prize money) on
// behalf of the community the same way an event organizer does.
async function createTournament(req, res, next) {
  try {
    if (req.user.role !== "admin") {
      const { rows: posterRows } = await pool.query(`SELECT id_verification_status FROM users WHERE id = $1`, [req.user.sub]);
      if (posterRows[0]?.id_verification_status !== "verified") {
        return res.status(403).json({ error: "Only ID-verified users can create tournaments. Upload a government ID in Profile → Identity Verification and wait for admin approval." });
      }
    }
    const { name, sport, custom_sport_name, participation_type, sport_config, organizer_name, location, start_date, end_date, registration_deadline, entry_fee, prize_details, rules, format, image_url } = req.body;
    if (!name || !sport || !start_date || !format) return res.status(400).json({ error: "name, sport, start_date and format are required" });
    if (!SPORTS.includes(sport)) return res.status(400).json({ error: "Invalid sport" });
    if (sport === "Custom" && !custom_sport_name) return res.status(400).json({ error: "Enter the custom game name" });
    if (!FORMATS.includes(format)) return res.status(400).json({ error: "Invalid format" });
    if (participation_type && !PARTICIPATION_TYPES.includes(participation_type)) return res.status(400).json({ error: "Invalid participation type" });
    if (!isValidImageDataUrl(image_url)) return res.status(400).json({ error: "Invalid image data" });

    const { rows } = await pool.query(
      `INSERT INTO tournaments (name, sport, custom_sport_name, participation_type, sport_config, organizer_name, location, start_date, end_date, registration_deadline, entry_fee, prize_details, rules, format, image_url, posted_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
      [name, sport, sport === "Custom" ? custom_sport_name : null, participation_type || "Team", sport_config || {}, organizer_name, location, start_date, end_date || null, registration_deadline || null, entry_fee, prize_details, rules, format, image_url, req.user.sub]
    );
    res.status(201).json(rows[0]);
    notifyUsersForNewPost("tournaments", `New tournament: ${name}`, `${sport === "Custom" ? custom_sport_name : sport} — registration open`);
  } catch (err) { next(err); }
}

async function canModifyTournament(req) {
  const { rows } = await pool.query(`SELECT posted_by FROM tournaments WHERE id = $1`, [req.params.id]);
  if (!rows[0]) return { found: false };
  return { found: true, allowed: rows[0].posted_by === req.user.sub || req.user.role === "admin" };
}

// PUT /api/tournaments/:id
async function updateTournament(req, res, next) {
  try {
    const check = await canModifyTournament(req);
    if (!check.found) return res.status(404).json({ error: "Tournament not found" });
    if (!check.allowed) return res.status(403).json({ error: "Not allowed to edit this tournament" });

    const fields = ["name", "sport", "custom_sport_name", "participation_type", "sport_config", "organizer_name", "location", "start_date", "end_date", "registration_deadline", "entry_fee", "prize_details", "rules", "format", "status", "image_url", "is_active"];
    const updates = []; const values = [];
    fields.forEach((f) => { if (req.body[f] !== undefined) { values.push(req.body[f]); updates.push(`${f} = $${values.length}`); } });
    if (updates.length === 0) return res.status(400).json({ error: "No fields to update" });

    values.push(req.params.id);
    const { rows } = await pool.query(`UPDATE tournaments SET ${updates.join(", ")} WHERE id = $${values.length} RETURNING *`, values);
    res.json(rows[0]);
  } catch (err) { next(err); }
}

// DELETE /api/tournaments/:id
async function deleteTournament(req, res, next) {
  try {
    const check = await canModifyTournament(req);
    if (!check.found) return res.status(404).json({ error: "Tournament not found" });
    if (!check.allowed) return res.status(403).json({ error: "Not allowed to delete this tournament" });
    await pool.query(`DELETE FROM tournaments WHERE id = $1`, [req.params.id]);
    res.status(204).send();
  } catch (err) { next(err); }
}

// ─────────────────────────────────────────────
// TEAMS & PLAYERS
// ─────────────────────────────────────────────

// GET /api/tournaments/:id/teams
async function listTeams(req, res, next) {
  try {
    const { rows: teams } = await pool.query(
      `SELECT * FROM tournament_teams WHERE tournament_id = $1 ORDER BY created_at ASC`,
      [req.params.id]
    );
    const { rows: players } = await pool.query(
      `SELECT p.* FROM tournament_players p JOIN tournament_teams t ON t.id = p.team_id WHERE t.tournament_id = $1 ORDER BY p.created_at ASC`,
      [req.params.id]
    );
    const byTeam = {};
    players.forEach((p) => { (byTeam[p.team_id] ||= []).push(p); });
    res.json(teams.map((t) => ({ ...t, players: byTeam[t.id] || [] })));
  } catch (err) { next(err); }
}

// POST /api/tournaments/:id/teams   { team_name, captain_name, captain_phone, logo_url, players: [{name, role, phone, jersey_number}] }
// Registration stays open regardless of tournament.status — organizers close
// it by generating fixtures, not by a separate flag, keeping this simple.
async function registerTeam(req, res, next) {
  try {
    const { rows: tRows } = await pool.query(`SELECT id, status FROM tournaments WHERE id = $1`, [req.params.id]);
    if (!tRows[0]) return res.status(404).json({ error: "Tournament not found" });
    if (tRows[0].status !== "registration_open") return res.status(400).json({ error: "Registration is closed for this tournament" });

    const { team_name, captain_name, captain_phone, logo_url, age_category_id, players } = req.body;
    if (!team_name || !captain_name || !captain_phone) return res.status(400).json({ error: "team_name, captain_name and captain_phone are required" });
    if (!isValidPhone(captain_phone)) return res.status(400).json({ error: "Enter a valid 10-digit captain phone number" });
    if (!isValidImageDataUrl(logo_url)) return res.status(400).json({ error: "Invalid image data" });
    if (age_category_id) {
      const { rows: catRows } = await pool.query(`SELECT id FROM tournament_age_categories WHERE id = $1 AND tournament_id = $2`, [age_category_id, req.params.id]);
      if (!catRows[0]) return res.status(400).json({ error: "Invalid age category for this tournament" });
    }

    const { rows } = await pool.query(
      `INSERT INTO tournament_teams (tournament_id, team_name, captain_name, captain_phone, logo_url, age_category_id, registered_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.params.id, team_name, captain_name, captain_phone, logo_url || null, age_category_id || null, req.user.sub]
    );
    const team = rows[0];

    if (Array.isArray(players)) {
      for (const p of players) {
        if (!p.name) continue;
        await pool.query(
          `INSERT INTO tournament_players (team_id, name, role, phone, jersey_number, is_captain) VALUES ($1,$2,$3,$4,$5,$6)`,
          [team.id, p.name, p.role || null, p.phone || null, p.jersey_number || null, !!p.is_captain]
        );
      }
    }
    const { rows: fullPlayers } = await pool.query(`SELECT * FROM tournament_players WHERE team_id = $1`, [team.id]);
    res.status(201).json({ ...team, players: fullPlayers });
  } catch (err) { next(err); }
}

// PUT /api/tournament-teams/:id   { approval_status?, payment_status?, team_name?, captain_name?, captain_phone?, logo_url? }
async function updateTeam(req, res, next) {
  try {
    const { rows: teamRows } = await pool.query(
      `SELECT tt.*, t.posted_by AS tournament_owner FROM tournament_teams tt JOIN tournaments t ON t.id = tt.tournament_id WHERE tt.id = $1`,
      [req.params.id]
    );
    if (!teamRows[0]) return res.status(404).json({ error: "Team not found" });
    const isOrganizerOrAdmin = teamRows[0].tournament_owner === req.user.sub || req.user.role === "admin";
    const isRegisteredBy = teamRows[0].registered_by === req.user.sub;

    const { approval_status, payment_status, team_name, captain_name, captain_phone, logo_url } = req.body;
    if ((approval_status || payment_status) && !isOrganizerOrAdmin) {
      return res.status(403).json({ error: "Only the tournament organizer or an admin can approve teams or set payment status" });
    }
    if ((team_name || captain_name || captain_phone || logo_url) && !isOrganizerOrAdmin && !isRegisteredBy) {
      return res.status(403).json({ error: "Not allowed to edit this team" });
    }
    if (approval_status && !["pending", "approved", "rejected"].includes(approval_status)) return res.status(400).json({ error: "Invalid approval_status" });
    if (payment_status && !["pending", "paid", "waived"].includes(payment_status)) return res.status(400).json({ error: "Invalid payment_status" });

    const fields = { approval_status, payment_status, team_name, captain_name, captain_phone, logo_url };
    const updates = []; const values = [];
    Object.entries(fields).forEach(([k, v]) => { if (v !== undefined) { values.push(v); updates.push(`${k} = $${values.length}`); } });
    if (updates.length === 0) return res.status(400).json({ error: "No fields to update" });
    values.push(req.params.id);
    const { rows } = await pool.query(`UPDATE tournament_teams SET ${updates.join(", ")} WHERE id = $${values.length} RETURNING *`, values);
    res.json(rows[0]);
  } catch (err) { next(err); }
}

// DELETE /api/tournament-teams/:id
async function deleteTeam(req, res, next) {
  try {
    const { rows: teamRows } = await pool.query(
      `SELECT tt.registered_by, t.posted_by AS tournament_owner FROM tournament_teams tt JOIN tournaments t ON t.id = tt.tournament_id WHERE tt.id = $1`,
      [req.params.id]
    );
    if (!teamRows[0]) return res.status(404).json({ error: "Team not found" });
    const allowed = teamRows[0].tournament_owner === req.user.sub || teamRows[0].registered_by === req.user.sub || req.user.role === "admin";
    if (!allowed) return res.status(403).json({ error: "Not allowed to delete this team" });
    await pool.query(`DELETE FROM tournament_teams WHERE id = $1`, [req.params.id]);
    res.status(204).send();
  } catch (err) { next(err); }
}

// ─────────────────────────────────────────────
// FIXTURE GENERATION
// Only Round Robin and Knockout are auto-generated — both are simple,
// well-defined algorithms. League + Knockout auto-generates its Round
// Robin league stage the same way; the knockout stage after that is
// added manually (via addMatch) once the organizer knows who advances.
// Double Elimination isn't auto-generated at all — its bracket logic
// (winners bracket + losers bracket with re-entry) is genuinely complex
// to get right, and a subtly-wrong bracket is worse than none. Organizers
// build it manually with addMatch, same as the knockout stage above.
// ─────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Round-robin pairing via the standard "circle method" — one team fixed,
// the rest rotate each round, giving every team exactly one match per
// round with no repeats. Handles an odd team count with a bye per round.
function generateRoundRobinPairs(teamIds) {
  const teams = teamIds.length % 2 === 0 ? [...teamIds] : [...teamIds, null]; // null = bye
  const n = teams.length;
  const rounds = [];
  const fixed = teams[0];
  let rotating = teams.slice(1);
  for (let r = 0; r < n - 1; r++) {
    const roundTeams = [fixed, ...rotating];
    const pairs = [];
    for (let i = 0; i < n / 2; i++) {
      const a = roundTeams[i], b = roundTeams[n - 1 - i];
      if (a !== null && b !== null) pairs.push([a, b]);
    }
    rounds.push(pairs);
    rotating = [rotating[rotating.length - 1], ...rotating.slice(0, -1)]; // rotate
  }
  return rounds; // array of rounds, each an array of [teamA, teamB] pairs
}

// Splits teams into groups as evenly as possible for a given target group
// size — group sizes never differ by more than 1, every team is placed
// exactly once. Verified standalone before being wired in here.
function divideIntoGroups(teamIds, targetGroupSize) {
  const numGroups = Math.max(1, Math.round(teamIds.length / targetGroupSize));
  const groups = Array.from({ length: numGroups }, () => []);
  teamIds.forEach((id, i) => groups[i % numGroups].push(id));
  return groups;
}

// GET /api/tournaments/:id/recommend-format?participantCount=16
// A simple, deterministic suggestion — never forces a format, the
// organizer can always pick something else.
function recommendFormat(count) {
  if (count <= 8) return { format: "Round Robin", note: "Small field — round robin or straight knockout works well." };
  if (count <= 16) return { format: "Group + Knockout", groupSize: 4, note: "Suggested: groups of 4, top 2 from each group advance to the knockout stage." };
  if (count <= 32) return { format: "Group + Knockout", groupSize: 4, note: "Suggested: groups of 4, top 2 from each group advance to the knockout stage." };
  return { format: "Swiss", note: "Large field — Swiss or a qualification round usually works best. Automatic Swiss pairing isn't built yet; set this up with manually-added matches." };
}

async function getFormatRecommendation(req, res, next) {
  try {
    const count = Number(req.query.participantCount) || 0;
    res.json(recommendFormat(count));
  } catch (err) { next(err); }
}

// POST /api/tournaments/:id/generate-fixtures
async function generateFixtures(req, res, next) {
  try {
    const check = await canModifyTournament(req);
    if (!check.found) return res.status(404).json({ error: "Tournament not found" });
    if (!check.allowed) return res.status(403).json({ error: "Only the tournament organizer or an admin can generate fixtures" });

    const { rows: tRows } = await pool.query(`SELECT * FROM tournaments WHERE id = $1`, [req.params.id]);
    const tournament = tRows[0];
    if (!["Round Robin", "Knockout", "League", "League + Knockout", "Group + Knockout"].includes(tournament.format)) {
      return res.status(400).json({ error: "Automatic fixture generation isn't available for this format — add matches manually instead (see tournamentController.js for why Double Elimination and Swiss aren't auto-generated)." });
    }

    const { rows: teams } = await pool.query(
      `SELECT id FROM tournament_teams WHERE tournament_id = $1 AND approval_status = 'approved'`,
      [req.params.id]
    );
    if (teams.length < 2) return res.status(400).json({ error: "At least 2 approved teams are required to generate fixtures" });
    const teamIds = shuffle(teams.map((t) => t.id));

    const { rows: existing } = await pool.query(`SELECT id FROM tournament_matches WHERE tournament_id = $1 LIMIT 1`, [req.params.id]);
    if (existing.length > 0) return res.status(400).json({ error: "Fixtures already exist for this tournament — delete existing matches first if you want to regenerate" });

    const inserted = [];
    if (tournament.format === "Knockout") {
      // Single elimination, round 1 only — later rounds are added once
      // round 1 results are in, since who plays whom in Round 2 depends
      // on who won Round 1.
      let round = [...teamIds];
      if (round.length % 2 !== 0) round.push(null); // bye
      for (let i = 0; i < round.length; i += 2) {
        const { rows } = await pool.query(
          `INSERT INTO tournament_matches (tournament_id, round_name, team1_id, team2_id, status)
           VALUES ($1, 'Round 1', $2, $3, $4) RETURNING *`,
          [req.params.id, round[i], round[i + 1], round[i + 1] === null ? "completed" : "scheduled"]
        );
        inserted.push(rows[0]);
      }
    } else if (tournament.format === "Group + Knockout") {
      // Group stage only — round robin within each group. The knockout
      // stage is added manually (via addMatch) once the organizer knows
      // who topped each group, same pattern as League + Knockout.
      const groupSize = Number(req.body?.groupSize) || 4;
      const groups = divideIntoGroups(teamIds, groupSize);
      for (let g = 0; g < groups.length; g++) {
        const groupLabel = `Group ${String.fromCharCode(65 + g)}`; // Group A, B, C...
        const rounds = generateRoundRobinPairs(groups[g]);
        for (let r = 0; r < rounds.length; r++) {
          for (const [a, b] of rounds[r]) {
            const { rows } = await pool.query(
              `INSERT INTO tournament_matches (tournament_id, round_name, team1_id, team2_id, status)
               VALUES ($1, $2, $3, $4, 'scheduled') RETURNING *`,
              [req.params.id, `${groupLabel} — Round ${r + 1}`, a, b]
            );
            inserted.push(rows[0]);
          }
        }
      }
    } else {
      // Round Robin (and the league stage of League / League + Knockout)
      const rounds = generateRoundRobinPairs(teamIds);
      for (let r = 0; r < rounds.length; r++) {
        for (const [a, b] of rounds[r]) {
          const { rows } = await pool.query(
            `INSERT INTO tournament_matches (tournament_id, round_name, team1_id, team2_id, status)
             VALUES ($1, $2, $3, $4, 'scheduled') RETURNING *`,
            [req.params.id, `League Round ${r + 1}`, a, b]
          );
          inserted.push(rows[0]);
        }
      }
    }

    await pool.query(`UPDATE tournaments SET status = 'fixtures_generated' WHERE id = $1`, [req.params.id]);
    res.status(201).json(inserted);
  } catch (err) { next(err); }
}

// ─────────────────────────────────────────────
// MATCHES
// ─────────────────────────────────────────────

// GET /api/tournaments/:id/matches
async function listMatches(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT m.*, t1.team_name AS team1_name, t2.team_name AS team2_name, tw.team_name AS winner_name
       FROM tournament_matches m
       LEFT JOIN tournament_teams t1 ON t1.id = m.team1_id
       LEFT JOIN tournament_teams t2 ON t2.id = m.team2_id
       LEFT JOIN tournament_teams tw ON tw.id = m.winner_team_id
       WHERE m.tournament_id = $1
       ORDER BY m.scheduled_date ASC NULLS LAST, m.scheduled_time ASC NULLS LAST, m.created_at ASC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
}

// POST /api/tournaments/:id/matches — organizer manually adds a match
// (used for Double Elimination, the knockout stage of League +
// Knockout, Semi-Final/Final rounds, or fixing up auto-generated ones).
async function addMatch(req, res, next) {
  try {
    const check = await canModifyTournament(req);
    if (!check.found) return res.status(404).json({ error: "Tournament not found" });
    if (!check.allowed) return res.status(403).json({ error: "Only the tournament organizer or an admin can add matches" });

    const { round_name, team1_id, team2_id, scheduled_date, scheduled_time, venue } = req.body;
    if (!round_name) return res.status(400).json({ error: "round_name is required" });
    const { rows } = await pool.query(
      `INSERT INTO tournament_matches (tournament_id, round_name, team1_id, team2_id, scheduled_date, scheduled_time, venue)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.params.id, round_name, team1_id || null, team2_id || null, scheduled_date || null, scheduled_time || null, venue || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
}

// PUT /api/tournament-matches/:id — schedule/reschedule/cancel, or enter
// the result (team1_score, team2_score, winner_team_id, status).
async function updateMatch(req, res, next) {
  try {
    const { rows: mRows } = await pool.query(
      `SELECT m.*, t.posted_by AS tournament_owner FROM tournament_matches m JOIN tournaments t ON t.id = m.tournament_id WHERE m.id = $1`,
      [req.params.id]
    );
    if (!mRows[0]) return res.status(404).json({ error: "Match not found" });
    if (mRows[0].tournament_owner !== req.user.sub && req.user.role !== "admin") {
      return res.status(403).json({ error: "Only the tournament organizer or an admin can update matches" });
    }

    const fields = ["round_name", "team1_id", "team2_id", "scheduled_date", "scheduled_time", "venue", "status", "team1_score", "team2_score", "winner_team_id", "notes"];
    const updates = []; const values = [];
    fields.forEach((f) => { if (req.body[f] !== undefined) { values.push(req.body[f]); updates.push(`${f} = $${values.length}`); } });
    if (updates.length === 0) return res.status(400).json({ error: "No fields to update" });
    values.push(req.params.id);
    const { rows } = await pool.query(`UPDATE tournament_matches SET ${updates.join(", ")} WHERE id = $${values.length} RETURNING *`, values);
    res.json(rows[0]);
  } catch (err) { next(err); }
}

// DELETE /api/tournament-matches/:id
async function deleteMatch(req, res, next) {
  try {
    const { rows: mRows } = await pool.query(
      `SELECT m.id, t.posted_by AS tournament_owner FROM tournament_matches m JOIN tournaments t ON t.id = m.tournament_id WHERE m.id = $1`,
      [req.params.id]
    );
    if (!mRows[0]) return res.status(404).json({ error: "Match not found" });
    if (mRows[0].tournament_owner !== req.user.sub && req.user.role !== "admin") {
      return res.status(403).json({ error: "Only the tournament organizer or an admin can delete matches" });
    }
    await pool.query(`DELETE FROM tournament_matches WHERE id = $1`, [req.params.id]);
    res.status(204).send();
  } catch (err) { next(err); }
}

// GET /api/tournaments/:id/points-table — computed live from completed
// matches (win=2, draw=1, loss=0), not stored, so it's always correct
// even if a result gets corrected after the fact.
async function getPointsTable(req, res, next) {
  try {
    const { rows: teams } = await pool.query(
      `SELECT id, team_name FROM tournament_teams WHERE tournament_id = $1 AND approval_status = 'approved'`,
      [req.params.id]
    );
    const { rows: matches } = await pool.query(
      `SELECT * FROM tournament_matches WHERE tournament_id = $1 AND status = 'completed' AND team1_id IS NOT NULL AND team2_id IS NOT NULL`,
      [req.params.id]
    );

    const table = Object.fromEntries(teams.map((t) => [t.id, {
      team_id: t.id, team_name: t.team_name, played: 0, wins: 0, draws: 0, losses: 0, points: 0,
    }]));

    matches.forEach((m) => {
      const a = table[m.team1_id], b = table[m.team2_id];
      if (!a || !b) return; // team no longer approved/exists — skip rather than crash
      a.played++; b.played++;
      if (m.winner_team_id === m.team1_id) { a.wins++; a.points += 2; b.losses++; }
      else if (m.winner_team_id === m.team2_id) { b.wins++; b.points += 2; a.losses++; }
      else { a.draws++; b.draws++; a.points += 1; b.points += 1; }
    });

    const sorted = Object.values(table).sort((x, y) => y.points - x.points || y.wins - x.wins);
    res.json(sorted);
  } catch (err) { next(err); }
}

// ─────────────────────────────────────────────
// AGE CATEGORIES
// An organizer defines as many as needed for a tournament — Under 16,
// Open, a custom age range, or a birth-year range. Teams optionally
// register into one (see registerTeam).
// ─────────────────────────────────────────────

// GET /api/tournaments/:id/age-categories
async function listAgeCategories(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM tournament_age_categories WHERE tournament_id = $1 ORDER BY created_at ASC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
}

// POST /api/tournaments/:id/age-categories   { label, min_age?, max_age?, birth_year_min?, birth_year_max? }
async function addAgeCategory(req, res, next) {
  try {
    const check = await canModifyTournament(req);
    if (!check.found) return res.status(404).json({ error: "Tournament not found" });
    if (!check.allowed) return res.status(403).json({ error: "Only the tournament organizer or an admin can add age categories" });

    const { label, min_age, max_age, birth_year_min, birth_year_max } = req.body;
    if (!label) return res.status(400).json({ error: "label is required" });
    const { rows } = await pool.query(
      `INSERT INTO tournament_age_categories (tournament_id, label, min_age, max_age, birth_year_min, birth_year_max)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.params.id, label, min_age || null, max_age || null, birth_year_min || null, birth_year_max || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
}

// DELETE /api/tournament-age-categories/:id
async function deleteAgeCategory(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT tac.id, t.posted_by AS tournament_owner FROM tournament_age_categories tac JOIN tournaments t ON t.id = tac.tournament_id WHERE tac.id = $1`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Age category not found" });
    if (rows[0].tournament_owner !== req.user.sub && req.user.role !== "admin") {
      return res.status(403).json({ error: "Only the tournament organizer or an admin can delete age categories" });
    }
    await pool.query(`DELETE FROM tournament_age_categories WHERE id = $1`, [req.params.id]);
    res.status(204).send();
  } catch (err) { next(err); }
}

module.exports = {
  listTournaments, getTournament, createTournament, updateTournament, deleteTournament, canModifyTournament,
  listTeams, registerTeam, updateTeam, deleteTeam,
  generateFixtures, listMatches, addMatch, updateMatch, deleteMatch, getPointsTable,
  getFormatRecommendation, listAgeCategories, addAgeCategory, deleteAgeCategory,
};
