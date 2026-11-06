import { Request, Response } from 'express';
import { SeasonsService } from './seasons.service';

export class SeasonsController {
  public static async getCalendarPage(req: Request, res: Response) {
    const season = await SeasonsService.getActiveSeason();
    const allSeasons = await SeasonsService.getAllSeasons();

    res.render('seasons/calendar', {
      pageTitle: 'Rennkalender & Strecken | the grid. - racing league',
      activeSeason: season,
      allSeasons,
    });
  }

  public static async getRaceDetailPage(req: Request, res: Response) {
    const id = String(req.params.id);
    const race = await SeasonsService.getRaceDetails(id);

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
      userAttendance = race.attendances.find((a) => a.userId === req.session.user!.id);
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
