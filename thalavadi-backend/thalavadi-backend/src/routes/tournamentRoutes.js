const express = require("express");
const {
  listTournaments, getTournament, createTournament, updateTournament, deleteTournament,
  listTeams, registerTeam, updateTeam, deleteTeam,
  generateFixtures, listMatches, addMatch, updateMatch, deleteMatch, getPointsTable,
  getFormatRecommendation, listAgeCategories, addAgeCategory, deleteAgeCategory,
} = require("../controllers/tournamentController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Tournaments
router.get("/", listTournaments);
router.get("/recommend-format", getFormatRecommendation);
router.get("/:id", getTournament);
router.post("/", requireAuth, createTournament);
router.put("/:id", requireAuth, updateTournament);
router.delete("/:id", requireAuth, deleteTournament);

// Teams (nested under a tournament for listing/registering, since a team
// only makes sense in the context of its tournament)
router.get("/:id/teams", listTeams);
router.post("/:id/teams", requireAuth, registerTeam);

// Age categories
router.get("/:id/age-categories", listAgeCategories);
router.post("/:id/age-categories", requireAuth, addAgeCategory);

// Fixtures & matches
router.post("/:id/generate-fixtures", requireAuth, generateFixtures);
router.get("/:id/matches", listMatches);
router.post("/:id/matches", requireAuth, addMatch);
router.get("/:id/points-table", getPointsTable);

// Teams, matches, and age categories also need routes addressed by their
// OWN id (not nested under a tournament) for update/delete — a separate
// router mounted by server.js at its own top-level path.
const teamMatchRouter = express.Router();
teamMatchRouter.put("/teams/:id", requireAuth, updateTeam);
teamMatchRouter.delete("/teams/:id", requireAuth, deleteTeam);
teamMatchRouter.put("/matches/:id", requireAuth, updateMatch);
teamMatchRouter.delete("/matches/:id", requireAuth, deleteMatch);
teamMatchRouter.delete("/age-categories/:id", requireAuth, deleteAgeCategory);

module.exports = { tournamentRouter: router, teamMatchRouter };
