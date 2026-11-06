import { Router } from 'express';
import { AdminController } from './admin.controller';
import { isAuthenticated, isAdmin } from '../../core/middleware/auth';

const router = Router();

// Alle Admin-Routen erfordern Login und ADMIN-Rolle
router.use(isAuthenticated, isAdmin);

// Übersicht
router.get('/', AdminController.getDashboard);

// Teams
router.get('/teams', AdminController.getTeamsPage);
router.post('/teams/create', AdminController.postCreateTeam);
router.post('/teams/delete', AdminController.postDeleteTeam);
router.post('/teams/assign', AdminController.postAssignDriver);
router.post('/teams/remove', AdminController.postRemoveDriver);

// Saisons & Rennkalender
router.get('/seasons', AdminController.getSeasonsPage);
router.post('/seasons/create', AdminController.postCreateSeason);
router.post('/seasons/create-with-tracks', AdminController.postCreateSeasonWithTracks);
router.post('/seasons/status', AdminController.postUpdateSeasonStatus);
router.post('/seasons/delete', AdminController.postDeleteSeason);
router.post('/races/add', AdminController.postAddRace);
router.post('/races/edit', AdminController.postEditRace);
router.post('/races/move-up', AdminController.postMoveRaceUp);
router.post('/races/move-down', AdminController.postMoveRaceDown);
router.post('/races/delete', AdminController.postDeleteRace);

// System-Ankündigung
router.post('/announcement', AdminController.postSetAnnouncement);

// Stewarding & Strafenkatalog (Verwarnungen, Punkteanpassung, Strafpunkte)
router.get('/stewarding', AdminController.getStewardingPage);
router.post('/stewarding/issue', AdminController.postIssuePenalty);
router.post('/stewarding/delete', AdminController.postDeletePenalty);

// Rennergebnisse
router.get('/races/:raceId/results', AdminController.getRaceResultsForm);
router.post('/races/:raceId/results', AdminController.postRaceResults);

// Discord Bot Live-Trigger
router.post('/bot/update-standings', AdminController.postTriggerBotStandings);
router.post('/discord/sync-embeds', AdminController.postSyncDiscordEmbeds);

export default router;

