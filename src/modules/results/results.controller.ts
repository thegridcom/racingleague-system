import { Request, Response } from 'express';
import { ResultsService } from './results.service';
import { SeasonsService } from '../seasons/seasons.service';
import { prisma } from '../../core/db';

export class ResultsController {
  public static async getStandingsPage(req: Request, res: Response) {
    const seasonId = req.query.seasonId as string | undefined;
    const { season, driverStandings, teamStandings } = await ResultsService.getSeasonStandings(seasonId);
    const allSeasons = await SeasonsService.getAllSeasons();

    res.render('results/standings', {
      pageTitle: 'WM-Standings: Fahrer & Konstrukteure | the grid. - racing league',
      season,
      driverStandings,
      teamStandings,
      allSeasons,
      selectedSeasonId: season?.id,
    });
  }

  public static async exportStandingsCsv(req: Request, res: Response) {
    const seasonId = req.query.seasonId as string | undefined;
    const { season, driverStandings, teamStandings } = await ResultsService.getSeasonStandings(seasonId);

    let csv = `sep=,\n`;
    csv += `FAHRERWERTUNG - ${season?.name || 'Aktuelle Saison'}\n`;
    csv += `Position,Startnummer,Fahrer,Team,Punkte,Siege,Podien,Schnellste Runden,Gefahrene Rennen\n`;

    for (const d of driverStandings) {
      csv += `${d.position},"${d.raceNumber ?? '-' }","${d.driverName.replace(/"/g, '""')}","${d.teamName.replace(/"/g, '""')}",${d.points},${d.wins},${d.podiums},${d.fastestLaps},${d.racesCount}\n`;
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

  public static async exportStandingsJson(req: Request, res: Response) {
    const seasonId = req.query.seasonId as string | undefined;
    const standings = await ResultsService.getSeasonStandings(seasonId);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="thegrid-standings-${seasonId || 'export'}.json"`);
    res.json(standings);
  }

  public static async exportAttendanceCsv(req: Request, res: Response) {
    const raceId = String(req.params.raceId);
    const race = await prisma.race.findUnique({
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
