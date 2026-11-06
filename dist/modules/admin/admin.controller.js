"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const admin_service_1 = require("./admin.service");
const seasons_service_1 = require("../seasons/seasons.service");
const drivers_service_1 = require("../drivers/drivers.service");
const db_1 = require("../../core/db");
const bot_1 = require("../../bot/bot");
const motorsport_assets_1 = require("../../core/motorsport-assets");
class AdminController {
    static async getDashboard(req, res) {
        const stats = await admin_service_1.AdminService.getAdminStats();
        const seasons = await seasons_service_1.SeasonsService.getAllSeasons();
        const recentRaces = await db_1.prisma.race.findMany({
            take: 6,
            orderBy: { date: 'desc' },
            include: {
                season: true,
                _count: { select: { attendances: true, results: true } },
            },
        });
        const announcement = await admin_service_1.AdminService.getAnnouncement();
        res.render('admin/dashboard', {
            pageTitle: 'Admin-Zentrale | the grid. - racing league',
            stats,
            seasons,
            recentRaces,
            announcement,
        });
    }
    // --- Team-Management ---
    static async getTeamsPage(req, res) {
        const teams = await admin_service_1.AdminService.getAllTeamsWithDrivers();
        const unassignedDrivers = await db_1.prisma.user.findMany({
            where: { teamId: null },
            orderBy: { gamertag: 'asc' },
        });
        res.render('admin/teams', {
            pageTitle: 'Team-Management | the grid. Admin',
            teams,
            unassignedDrivers,
        });
    }
    static async postCreateTeam(req, res) {
        const { name, shortCode, colorHex, logoUrl } = req.body;
        if (!name || !shortCode || !colorHex) {
            req.session.flashMessage = {
                type: 'danger',
                text: 'Bitte Name, Team-Kürzel und Akzentfarbe angeben.',
            };
            return res.redirect(303, '/admin/teams');
        }
        try {
            const team = await admin_service_1.AdminService.createTeam({
                name,
                shortCode,
                colorHex,
                logoUrl,
            });
            req.session.flashMessage = {
                type: 'success',
                text: `Rennteam "${team.name}" (${team.shortCode}) erfolgreich angelegt!`,
            };
        }
        catch (err) {
            req.session.flashMessage = {
                type: 'danger',
                text: 'Fehler beim Anlegen des Teams: ' + (err.message || 'Kürzel oder Name bereits vergeben'),
            };
        }
        return res.redirect(303, '/admin/teams');
    }
    static async postDeleteTeam(req, res) {
        const { teamId } = req.body;
        if (teamId) {
            try {
                await admin_service_1.AdminService.deleteTeam(teamId);
                req.session.flashMessage = {
                    type: 'success',
                    text: 'Rennteam wurde gelöscht. Zuvor zugeordnete Fahrer sind nun als freie Fahrer gelistet.',
                };
            }
            catch (err) {
                req.session.flashMessage = {
                    type: 'danger',
                    text: 'Fehler beim Löschen des Teams: ' + err.message,
                };
            }
        }
        return res.redirect(303, '/admin/teams');
    }
    static async postAssignDriver(req, res) {
        const { userId, teamId, role } = req.body;
        if (!userId) {
            req.session.flashMessage = { type: 'danger', text: 'Kein Fahrer ausgewählt.' };
            return res.redirect('/admin/teams');
        }
        try {
            await admin_service_1.AdminService.assignDriverToTeam(userId, teamId || null, role === 'DRIVER' ? 'DRIVER' : 'RESERVE');
            bot_1.DiscordBot.updateLiveRosterMessage().catch((e) => console.warn('Roster Live Update Error:', e.message));
            req.session.flashMessage = { type: 'success', text: 'Fahrerzuordnung erfolgreich aktualisiert.' };
        }
        catch (err) {
            req.session.flashMessage = { type: 'danger', text: err.message || 'Fehler bei der Zuweisung.' };
        }
        return res.redirect('/admin/teams');
    }
    static async postRemoveDriver(req, res) {
        const { userId } = req.body;
        if (userId) {
            await admin_service_1.AdminService.removeDriverFromTeam(userId);
            bot_1.DiscordBot.updateLiveRosterMessage().catch((e) => console.warn('Roster Live Update Error:', e.message));
            req.session.flashMessage = { type: 'info', text: 'Fahrer aus dem Team entfernt (jetzt freier Ersatzfahrer).' };
        }
        return res.redirect('/admin/teams');
    }
    // --- Saison-Management ---
    static async getSeasonsPage(req, res) {
        const seasons = await seasons_service_1.SeasonsService.getAllSeasons();
        res.render('admin/seasons', {
            pageTitle: 'Saison- & Kalender-Verwaltung | the grid. Admin',
            seasons,
            tracks2026: motorsport_assets_1.TRACKS_2026,
        });
    }
    static async postCreateSeason(req, res) {
        const { name, year } = req.body;
        if (!name) {
            req.session.flashMessage = { type: 'danger', text: 'Bitte einen Saison-Namen angeben.' };
            return res.redirect('/admin/seasons');
        }
        await seasons_service_1.SeasonsService.createSeason({
            name,
            year: parseInt(year, 10) || new Date().getFullYear(),
        });
        req.session.flashMessage = { type: 'success', text: `Saison "${name}" erfolgreich angelegt.` };
        return res.redirect('/admin/seasons');
    }
    static async postCreateSeasonWithTracks(req, res) {
        const { name, year, status, firstRaceDate, intervalDays, tracks } = req.body;
        if (!name) {
            req.session.flashMessage = { type: 'danger', text: 'Bitte einen Saison-Namen angeben.' };
            return res.redirect('/admin/seasons');
        }
        // Strecken-Auswahl parsen (einzelner String oder Array von Runden)
        let selectedIndices = [];
        if (Array.isArray(tracks)) {
            selectedIndices = tracks.map((t) => parseInt(t, 10)).filter((n) => !isNaN(n));
        }
        else if (typeof tracks === 'string') {
            const parsed = parseInt(tracks, 10);
            if (!isNaN(parsed))
                selectedIndices = [parsed];
        }
        if (selectedIndices.length === 0) {
            req.session.flashMessage = {
                type: 'danger',
                text: 'Bitte wähle mindestens eine Rennstrecke für die Saison aus.',
            };
            return res.redirect('/admin/seasons');
        }
        const startDate = firstRaceDate ? new Date(firstRaceDate) : new Date();
        const interval = parseInt(intervalDays, 10) || 14;
        try {
            const season = await admin_service_1.AdminService.startSeasonWithTracks({
                name,
                year: parseInt(year, 10) || new Date().getFullYear(),
                status: status === 'ACTIVE' ? 'ACTIVE' : 'UPCOMING',
                firstRaceDate: startDate,
                intervalDays: interval,
                selectedTrackIndices: selectedIndices,
            });
            req.session.flashMessage = {
                type: 'success',
                text: `Meisterschaft "${season.name}" mit ${selectedIndices.length} Strecken erfolgreich angelegt und ${season.status === 'ACTIVE' ? 'direkt gestartet' : 'startklar vorbereitet'}!`,
            };
        }
        catch (err) {
            req.session.flashMessage = {
                type: 'danger',
                text: 'Fehler beim Starten der Saison: ' + err.message,
            };
        }
        return res.redirect('/admin/seasons');
    }
    static async postUpdateSeasonStatus(req, res) {
        const { seasonId, status } = req.body;
        if (seasonId && ['UPCOMING', 'ACTIVE', 'PAUSED', 'COMPLETED'].includes(status)) {
            // Wenn eine Saison auf ACTIVE gesetzt wird, optional andere ACTIVE Saisons pausieren
            if (status === 'ACTIVE') {
                await db_1.prisma.season.updateMany({
                    where: { id: { not: seasonId }, status: 'ACTIVE' },
                    data: { status: 'PAUSED' },
                });
            }
            await seasons_service_1.SeasonsService.updateSeasonStatus(seasonId, status);
            req.session.flashMessage = { type: 'success', text: `Status der Saison auf "${status}" geändert.` };
        }
        return res.redirect('/admin/seasons');
    }
    static async postDeleteSeason(req, res) {
        const { seasonId } = req.body;
        if (seasonId) {
            await seasons_service_1.SeasonsService.deleteSeason(seasonId);
            req.session.flashMessage = { type: 'success', text: 'Saison und zugehörige Rennen wurden gelöscht.' };
        }
        return res.redirect('/admin/seasons');
    }
    // --- Rennkalender & Events ---
    static async postAddRace(req, res) {
        const { seasonId, roundNumber, trackName, country, flagEmoji, date, lengthKm, laps, trackLayoutSvg } = req.body;
        if (!seasonId || !trackName || !date) {
            req.session.flashMessage = { type: 'danger', text: 'Pflichtfelder für das Rennen fehlen.' };
            return res.redirect('/admin/seasons');
        }
        await seasons_service_1.SeasonsService.addRaceToSeason({
            seasonId,
            roundNumber: parseInt(roundNumber, 10) || 1,
            trackName,
            country: country || 'International',
            flagEmoji: flagEmoji || '🏁',
            date: new Date(date),
            lengthKm: lengthKm ? parseFloat(lengthKm) : undefined,
            laps: laps ? parseInt(laps, 10) : undefined,
            trackLayoutSvg,
        });
        req.session.flashMessage = { type: 'success', text: `Rennen "${trackName}" hinzugefügt.` };
        return res.redirect('/admin/seasons');
    }
    static async postDeleteRace(req, res) {
        const { raceId } = req.body;
        if (raceId) {
            await seasons_service_1.SeasonsService.deleteRace(raceId);
            req.session.flashMessage = { type: 'info', text: 'Rennen gelöscht.' };
        }
        return res.redirect(303, '/admin/seasons');
    }
    static async postEditRace(req, res) {
        const { raceId, trackName, country, flagEmoji, date, lengthKm, laps, status } = req.body;
        if (!raceId || !trackName || !date) {
            req.session.flashMessage = { type: 'danger', text: 'Bitte alle Pflichtfelder für das Rennen ausfüllen.' };
            return res.redirect(303, '/admin/seasons');
        }
        try {
            await admin_service_1.AdminService.editRace(raceId, {
                trackName,
                country: country || 'International',
                flagEmoji: flagEmoji || '🏁',
                date: new Date(date),
                lengthKm: lengthKm ? parseFloat(lengthKm) : undefined,
                laps: laps ? parseInt(laps, 10) : undefined,
                status: status || 'UPCOMING',
            });
            req.session.flashMessage = { type: 'success', text: `Rennen "${trackName}" erfolgreich aktualisiert.` };
        }
        catch (err) {
            req.session.flashMessage = { type: 'danger', text: 'Fehler beim Bearbeiten des Rennens: ' + err.message };
        }
        return res.redirect(303, '/admin/seasons');
    }
    static async postMoveRaceUp(req, res) {
        const { raceId } = req.body;
        if (raceId) {
            await admin_service_1.AdminService.moveRaceUp(raceId);
            req.session.flashMessage = { type: 'success', text: 'Rennen um eine Runde nach oben verschoben.' };
        }
        return res.redirect(303, '/admin/seasons');
    }
    static async postMoveRaceDown(req, res) {
        const { raceId } = req.body;
        if (raceId) {
            await admin_service_1.AdminService.moveRaceDown(raceId);
            req.session.flashMessage = { type: 'success', text: 'Rennen um eine Runde nach unten verschoben.' };
        }
        return res.redirect(303, '/admin/seasons');
    }
    static async postSetAnnouncement(req, res) {
        const { text, active, type } = req.body;
        const isChecked = active === 'on' || active === 'true' || active === true;
        await admin_service_1.AdminService.setAnnouncement(text || '', isChecked, type || 'info');
        req.session.flashMessage = {
            type: 'success',
            text: isChecked
                ? 'System-Ankündigung wurde aktiviert und wird nun allen Besuchern angezeigt.'
                : 'System-Ankündigung wurde deaktiviert (standardmäßig unsichtbar).',
        };
        return res.redirect(303, '/admin');
    }
    // --- Schnellerfassung Rennergebnisse ---
    static async getRaceResultsForm(req, res) {
        const raceId = String(req.params.raceId);
        const race = await seasons_service_1.SeasonsService.getRaceDetails(raceId);
        if (!race) {
            req.session.flashMessage = { type: 'danger', text: 'Rennen nicht gefunden.' };
            return res.redirect('/admin');
        }
        const drivers = await db_1.prisma.user.findMany({
            include: { team: true },
            orderBy: { gamertag: 'asc' },
        });
        const teams = await db_1.prisma.team.findMany({
            orderBy: { name: 'asc' },
        });
        res.render('admin/results-entry', {
            pageTitle: `Ergebnisse erfassen: Runde ${race.roundNumber} - ${race.trackName} | the grid. Admin`,
            race,
            drivers,
            teams,
        });
    }
    static async postRaceResults(req, res) {
        const raceId = String(req.params.raceId);
        const { positions, fastestLapPosition } = req.body;
        if (!positions || !Array.isArray(positions)) {
            req.session.flashMessage = { type: 'danger', text: 'Ungültige Ergebnisdaten empfangen.' };
            return res.redirect(`/admin/races/${raceId}/results`);
        }
        try {
            const resultsToSave = [];
            const flPos = parseInt(fastestLapPosition, 10);
            for (let i = 0; i < positions.length; i++) {
                const item = positions[i];
                if (!item || !item.driverName || item.driverName.trim() === '')
                    continue;
                const pos = i + 1;
                const isFastestLap = pos === flPos;
                resultsToSave.push({
                    position: pos,
                    userId: item.userId && item.userId !== '' ? item.userId : null,
                    driverName: item.driverName,
                    teamName: item.teamName || 'Privatier',
                    status: item.status || 'FINISHED',
                    fastestLap: isFastestLap,
                    fastestLapTime: isFastestLap ? item.fastestLapTime : null,
                    penaltySeconds: parseInt(item.penaltySeconds, 10) || 0,
                    penaltyPoints: parseInt(item.penaltyPoints, 10) || 0,
                });
            }
            await admin_service_1.AdminService.submitRaceResultsAndNotifyBot(raceId, resultsToSave);
            req.session.flashMessage = {
                type: 'success',
                text: `Ergebnisse für ${resultsToSave.length} Fahrer gespeichert, Punkte berechnet und Discord-Bot aktualisiert!`,
            };
            return res.redirect(`/races/${raceId}`);
        }
        catch (err) {
            console.error('Fehler beim Speichern der Rennergebnisse:', err);
            req.session.flashMessage = {
                type: 'danger',
                text: 'Fehler beim Speichern: ' + (err.message || 'Unbekannter Fehler'),
            };
            return res.redirect(`/admin/races/${raceId}/results`);
        }
    }
    static async postTriggerBotStandings(req, res) {
        const { seasonId } = req.body;
        try {
            const result = await bot_1.DiscordBot.updateLiveStandingsMessage(seasonId);
            if (result) {
                req.session.flashMessage = { type: 'success', text: 'Discord Live-Rangliste (#rangliste) erfolgreich editiert!' };
            }
            else {
                req.session.flashMessage = { type: 'warning', text: 'Discord-Bot ist offline oder der Zielkanal ist noch nicht eingerichtet.' };
            }
        }
        catch (err) {
            req.session.flashMessage = { type: 'danger', text: 'Fehler beim Aktualisieren des Discord-Bots: ' + err.message };
        }
        return res.redirect('/admin');
    }
    // --- Stewarding & Strafenkatalog ---
    static async getStewardingPage(req, res) {
        const seasons = await seasons_service_1.SeasonsService.getAllSeasons();
        const activeSeason = await seasons_service_1.SeasonsService.getActiveSeason();
        const drivers = await drivers_service_1.DriversService.getAllDrivers();
        const penalties = await admin_service_1.AdminService.getAllPenalties(activeSeason?.id);
        res.render('admin/stewarding', {
            pageTitle: 'Stewarding & Strafen | the grid. Admin',
            seasons,
            activeSeason,
            drivers,
            penalties,
        });
    }
    static async postIssuePenalty(req, res) {
        const { userId, seasonId, raceId, type, amount, reason, stewardName } = req.body;
        if (!userId || !reason) {
            req.session.flashMessage = {
                type: 'danger',
                text: 'Bitte wähle einen Fahrer aus und gib eine Begründung für die Stewarding-Entscheidung an.',
            };
            return res.redirect(303, '/admin/stewarding');
        }
        try {
            const penalty = await admin_service_1.AdminService.issuePenalty({
                userId,
                seasonId: seasonId || undefined,
                raceId: raceId || undefined,
                type: type || 'WARNING',
                amount: parseFloat(amount) || 0,
                reason,
                stewardName: stewardName || (req.session.user?.discordUsername ?? 'Rennleitung'),
            });
            const typeLabel = penalty.type === 'WARNING' ? 'Verwarnung ausgesprochen' :
                penalty.type === 'PENALTY_POINTS' ? `${penalty.penaltyPoints} Strafpunkte erteilt` :
                    penalty.type === 'POINT_DEDUCTION' ? `${Math.abs(penalty.points)} WM-Punkte abgezogen` :
                        `${penalty.points} WM-Punkte gutgeschrieben`;
            req.session.flashMessage = {
                type: 'success',
                text: `Stewarding-Entscheidung erfolgreich dokumentiert: ${penalty.user.gamertag || penalty.user.discordUsername} (${typeLabel}).`,
            };
            // Discord Live-Embeds aktualisieren
            bot_1.DiscordBot.updateLiveStandingsMessage(seasonId || undefined).catch((e) => console.warn('Standings Update Error:', e.message));
            bot_1.DiscordBot.updateLiveRosterMessage().catch((e) => console.warn('Roster Update Error:', e.message));
        }
        catch (err) {
            req.session.flashMessage = {
                type: 'danger',
                text: 'Fehler beim Eintragen der Entscheidung: ' + err.message,
            };
        }
        return res.redirect(303, '/admin/stewarding');
    }
    static async postDeletePenalty(req, res) {
        const { penaltyId } = req.body;
        if (penaltyId) {
            try {
                await admin_service_1.AdminService.deletePenalty(penaltyId);
                bot_1.DiscordBot.updateLiveStandingsMessage().catch((e) => console.warn('Standings Update Error:', e.message));
                bot_1.DiscordBot.updateLiveRosterMessage().catch((e) => console.warn('Roster Update Error:', e.message));
                req.session.flashMessage = {
                    type: 'info',
                    text: 'Entscheidung/Strafe wurde zurückgenommen und gelöscht. WM-Punkte wurden korrigiert.',
                };
            }
            catch (err) {
                req.session.flashMessage = {
                    type: 'danger',
                    text: 'Fehler beim Löschen: ' + err.message,
                };
            }
        }
        return res.redirect(303, '/admin/stewarding');
    }
    static async postSyncDiscordEmbeds(req, res) {
        try {
            await bot_1.DiscordBot.refreshAllLiveEmbeds();
            req.session.flashMessage = {
                type: 'success',
                text: 'Alle Discord Live-Embeds (Fahrerfeld, Rangliste, Renntag Check-In) wurden erfolgreich synchronisiert!',
            };
        }
        catch (err) {
            req.session.flashMessage = {
                type: 'danger',
                text: 'Fehler beim Synchronisieren der Discord Embeds: ' + err.message,
            };
        }
        return res.redirect(303, '/admin');
    }
}
exports.AdminController = AdminController;
