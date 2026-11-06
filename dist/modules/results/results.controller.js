"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultsController = void 0;
const results_service_1 = require("./results.service");
const seasons_service_1 = require("../seasons/seasons.service");
const db_1 = require("../../core/db");
class ResultsController {
    static async getStandingsPage(req, res) {
        const seasonId = req.query.seasonId;
        const { season, driverStandings, teamStandings } = await results_service_1.ResultsService.getSeasonStandings(seasonId);
        const allSeasons = await seasons_service_1.SeasonsService.getAllSeasons();
        res.render('results/standings', {
            pageTitle: 'WM-Standings: Fahrer & Konstrukteure | the grid. - racing league',
            season,
            driverStandings,
            teamStandings,
            allSeasons,
            selectedSeasonId: season?.id,
        });
    }
    static async exportStandingsCsv(req, res) {
        const seasonId = req.query.seasonId;
        const { season, driverStandings, teamStandings } = await results_service_1.ResultsService.getSeasonStandings(seasonId);
        let csv = `sep=,\n`;
        csv += `FAHRERWERTUNG - ${season?.name || 'Aktuelle Saison'}\n`;
        csv += `Position,Startnummer,Fahrer,Team,Punkte,Siege,Podien,Schnellste Runden,Gefahrene Rennen\n`;
        for (const d of driverStandings) {
            csv += `${d.position},"${d.raceNumber ?? '-'}","${d.driverName.replace(/"/g, '""')}","${d.teamName.replace(/"/g, '""')}",${d.points},${d.wins},${d.podiums},${d.fastestLaps},${d.racesCount}\n`;
        }
        csv += `\nKONSTRUKTEURSWERTUNG\n`;
        csv += `Position,Kuerzel,Team,Punkte,Siege,Podien\n`;
        for (const t of teamStandings) {
            csv += `${t.position},"${t.shortCode}","${t.teamName.replace(/"/g, '""')}",${t.points},${t.wins},${t.podiums}\n`;
        }
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="thegrid-standings-${season?.id || 'export'}.csv"`);
        res.send('\uFEFF' + csv);
    }
    static async exportStandingsJson(req, res) {
        const seasonId = req.query.seasonId;
        const standings = await results_service_1.ResultsService.getSeasonStandings(seasonId);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="thegrid-standings-${seasonId || 'export'}.json"`);
        res.json(standings);
    }
    static async exportAttendanceCsv(req, res) {
        const raceId = String(req.params.raceId);
        const race = await db_1.prisma.race.findUnique({
            where: { id: raceId },
            include: {
                attendances: {
                    include: {
                        user: {
                            include: { team: true },
                        },
                    },
                },
            },
        });
        if (!race) {
            return res.status(404).send('Rennen nicht gefunden');
        }
        let csv = `sep=,\n`;
        csv += `ANWESENHEITSLISTE: Runde ${race.roundNumber} - ${race.trackName} (${race.country})\n`;
        csv += `Status,Fahrer,Startnummer,Plattform,Team,Notiz,Zeitstempel\n`;
        for (const a of race.attendances) {
            const statusLabel = a.status === 'ATTENDING' ? 'Teilnahme' : a.status === 'ABSENT' ? 'Abgemeldet' : 'Reserve';
            csv += `"${statusLabel}","${(a.user.gamertag || a.user.discordUsername).replace(/"/g, '""')}","${a.user.raceNumber ?? '-'}","${a.user.platform ?? '-'}","${(a.user.team?.name ?? 'Kein Team').replace(/"/g, '""')}","${(a.notes || '').replace(/"/g, '""')}","${a.updatedAt.toISOString()}"\n`;
        }
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="thegrid-attendance-race-${race.roundNumber}.csv"`);
        res.send('\uFEFF' + csv);
    }
}
exports.ResultsController = ResultsController;
