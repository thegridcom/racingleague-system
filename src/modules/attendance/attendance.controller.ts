import { Request, Response } from 'express';
import { AttendanceService } from './attendance.service';
import { AttendanceStatus } from '../../core/types';
import { DiscordBot } from '../../bot/bot';

export class AttendanceController {
  public static async postCheckIn(req: Request, res: Response) {
    if (!req.session.user) {
      return res.redirect('/auth/login');
    }

    const { raceId, notes, returnTo } = req.body;
    let rawStatus = (req.body.status || '').toString().trim().toUpperCase();

    // Synonyme normalisieren (UNCERTAIN -> RESERVE, DECLINED -> ABSENT)
    if (rawStatus === 'UNCERTAIN' || rawStatus === 'UNSICHER') rawStatus = 'RESERVE';
    if (rawStatus === 'DECLINED' || rawStatus === 'KANN_NICHT') rawStatus = 'ABSENT';
    if (rawStatus === 'CONFIRMED' || rawStatus === 'DABEI') rawStatus = 'ATTENDING';

    const status = rawStatus as AttendanceStatus;

    if (!raceId || !['ATTENDING', 'ABSENT', 'RESERVE'].includes(status)) {
      req.session.flashMessage = {
        type: 'danger',
        text: 'Ungültiger Anmeldestatus angegeben.',
      };
      return res.redirect(returnTo || '/driver/dashboard');
    }

    try {
      await AttendanceService.setAttendance(
        req.session.user.id,
        raceId,
        status,
        notes
      );

      const statusLabels: Record<string, string> = {
        ATTENDING: '🟢 Teilnahme bestätigt: Du bist beim Rennen dabei!',
        ABSENT: '🔴 Abmeldung erfasst: Du bist für dieses Rennen abgemeldet.',
        RESERVE: '🟡 Status aktualisiert: Als Unsicher / Reserve vorgemerkt.',
      };

      req.session.flashMessage = {
        type: 'success',
        text: statusLabels[status] || 'Status erfolgreich aktualisiert.',
      };

      // Discord Check-In Live-Embed aktualisieren
      DiscordBot.updateLiveCheckinMessage(raceId).catch((e) => console.warn('Checkin Live Update Error:', e.message));
    } catch (err) {
      console.error('Fehler beim Rennen-Check-In:', err);
      req.session.flashMessage = {
        type: 'danger',
        text: 'Fehler beim Speichern deiner Rückmeldung.',
      };
    }

    return res.redirect(returnTo || '/driver/dashboard');
  }
}

