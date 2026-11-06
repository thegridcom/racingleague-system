"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeasonsController = void 0;
const seasons_service_1 = require("./seasons.service");
class SeasonsController {
    static async getCalendarPage(req, res) {
        const season = await seasons_service_1.SeasonsService.getActiveSeason();
        const allSeasons = await seasons_service_1.SeasonsService.getAllSeasons();
        res.render('seasons/calendar', {
            pageTitle: 'Rennkalender & Strecken | the grid. - racing league',
            activeSeason: season,
            allSeasons,
        });
    }
    static async getRaceDetailPage(req, res) {
        const id = String(req.params.id);
        const race = await seasons_service_1.SeasonsService.getRaceDetails(id);
        if (!race) {
            req.session.flashMessage = {
                type: 'danger',
                text: 'Rennen nicht gefunden.',
            };
            return res.redirect('/calendar');
        }
        // Nutzer-spezifischer Check-in-Status
        let userAttendance = null;
        if (req.session.user) {
            userAttendance = race.attendances.find((a) => a.userId === req.session.user.id);
        }
        const attendingCount = race.attendances.filter((a) => a.status === 'ATTENDING').length;
        const absentCount = race.attendances.filter((a) => a.status === 'ABSENT').length;
        const reserveCount = race.attendances.filter((a) => a.status === 'RESERVE').length;
        res.render('seasons/race-detail', {
            pageTitle: `Runde ${race.roundNumber}: ${race.trackName} | the grid.`,
            race,
            userAttendance,
            counts: {
                attending: attendingCount,
                absent: absentCount,
                reserve: reserveCount,
            },
        });
    }
}
exports.SeasonsController = SeasonsController;
