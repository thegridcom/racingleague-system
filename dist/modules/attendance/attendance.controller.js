"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceController = void 0;
const attendance_service_1 = require("./attendance.service");
const bot_1 = require("../../bot/bot");
class AttendanceController {
    static async postCheckIn(req, res) {
        if (!req.session.user) {
            return res.redirect('/auth/login');
        }
        const { raceId, notes, returnTo } = req.body;
        let rawStatus = (req.body.status || '').toString().trim().toUpperCase();
        // Synonyme normalisieren (UNCERTAIN -> RESERVE, DECLINED -> ABSENT)
        if (rawStatus === 'UNCERTAIN' || rawStatus === 'UNSICHER')
            rawStatus = 'RESERVE';
        if (rawStatus === 'DECLINED' || rawStatus === 'KANN_NICHT')
            rawStatus = 'ABSENT';
        if (rawStatus === 'CONFIRMED' || rawStatus === 'DABEI')
            rawStatus = 'ATTENDING';
        const status = rawStatus;
        if (!raceId || !['ATTENDING', 'ABSENT', 'RESERVE'].includes(status)) {
            req.session.flashMessage = {
                type: 'danger',
                text: 'Ungültiger Anmeldestatus angegeben.',
            };
            return res.redirect(returnTo || '/driver/dashboard');
        }
        try {
            await attendance_service_1.AttendanceService.setAttendance(req.session.user.id, raceId, status, notes);
            const statusLabels = {
                ATTENDING: '🟢 Teilnahme bestätigt: Du bist beim Rennen dabei!',
                ABSENT: '🔴 Abmeldung erfasst: Du bist für dieses Rennen abgemeldet.',
                RESERVE: '🟡 Status aktualisiert: Als Unsicher / Reserve vorgemerkt.',
            };
            req.session.flashMessage = {
                type: 'success',
                text: statusLabels[status] || 'Status erfolgreich aktualisiert.',
            };
            // Discord Check-In Live-Embed aktualisieren
            bot_1.DiscordBot.updateLiveCheckinMessage(raceId).catch((e) => console.warn('Checkin Live Update Error:', e.message));
        }
        catch (err) {
            console.error('Fehler beim Rennen-Check-In:', err);
            req.session.flashMessage = {
                type: 'danger',
                text: 'Fehler beim Speichern deiner Rückmeldung.',
            };
        }
        return res.redirect(returnTo || '/driver/dashboard');
    }
}
exports.AttendanceController = AttendanceController;
