"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("./admin.controller");
const auth_1 = require("../../core/middleware/auth");
const router = (0, express_1.Router)();
// Alle Admin-Routen erfordern Login und ADMIN-Rolle
router.use(auth_1.isAuthenticated, auth_1.isAdmin);
// Übersicht
router.get('/', admin_controller_1.AdminController.getDashboard);
// Teams
router.get('/teams', admin_controller_1.AdminController.getTeamsPage);
router.post('/teams/create', admin_controller_1.AdminController.postCreateTeam);
router.post('/teams/delete', admin_controller_1.AdminController.postDeleteTeam);
router.post('/teams/assign', admin_controller_1.AdminController.postAssignDriver);
router.post('/teams/remove', admin_controller_1.AdminController.postRemoveDriver);
// Saisons & Rennkalender
router.get('/seasons', admin_controller_1.AdminController.getSeasonsPage);
router.post('/seasons/create', admin_controller_1.AdminController.postCreateSeason);
router.post('/seasons/create-with-tracks', admin_controller_1.AdminController.postCreateSeasonWithTracks);
router.post('/seasons/status', admin_controller_1.AdminController.postUpdateSeasonStatus);
router.post('/seasons/delete', admin_controller_1.AdminController.postDeleteSeason);
router.post('/races/add', admin_controller_1.AdminController.postAddRace);
router.post('/races/edit', admin_controller_1.AdminController.postEditRace);
router.post('/races/move-up', admin_controller_1.AdminController.postMoveRaceUp);
router.post('/races/move-down', admin_controller_1.AdminController.postMoveRaceDown);
router.post('/races/delete', admin_controller_1.AdminController.postDeleteRace);
// System-Ankündigung
router.post('/announcement', admin_controller_1.AdminController.postSetAnnouncement);
// Stewarding & Strafenkatalog (Verwarnungen, Punkteanpassung, Strafpunkte)
router.get('/stewarding', admin_controller_1.AdminController.getStewardingPage);
router.post('/stewarding/issue', admin_controller_1.AdminController.postIssuePenalty);
router.post('/stewarding/delete', admin_controller_1.AdminController.postDeletePenalty);
// Rennergebnisse
router.get('/races/:raceId/results', admin_controller_1.AdminController.getRaceResultsForm);
router.post('/races/:raceId/results', admin_controller_1.AdminController.postRaceResults);
// Discord Bot Live-Trigger
router.post('/bot/update-standings', admin_controller_1.AdminController.postTriggerBotStandings);
router.post('/discord/sync-embeds', admin_controller_1.AdminController.postSyncDiscordEmbeds);
exports.default = router;
