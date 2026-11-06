import { prisma } from '../../core/db';
import { ResultsService } from '../results/results.service';
import { DiscordBot } from '../../bot/bot';
import { TRACKS_2026 } from '../../core/motorsport-assets';

export class AdminService {
  public static async getAdminStats() {
    const totalDrivers = await prisma.user.count();
    const mainDrivers = await prisma.user.count({ where: { role: 'DRIVER' } });
    const reserveDrivers = await prisma.user.count({ where: { role: 'RESERVE' } });
    const totalTeams = await prisma.team.count();
    const totalPenalties = await prisma.driverPenalty.count();
    const activeSeason = await prisma.season.findFirst({
      where: { status: 'ACTIVE' },
      include: { races: true },
    });

    return {
      totalDrivers,
      mainDrivers,
      reserveDrivers,
      totalTeams,
      totalPenalties,
      activeSeason,
    };
  }

  public static async getAllTeamsWithDrivers() {
    return prisma.team.findMany({
      include: {
        drivers: {
          orderBy: [
            { role: 'asc' },
            { raceNumber: 'asc' },
          ],
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  public static async createTeam(data: { name: string; shortCode: string; colorHex: string; logoUrl?: string }) {
    return prisma.team.create({
      data: {
        name: data.name.trim(),
        shortCode: data.shortCode.trim().toUpperCase(),
        colorHex: data.colorHex.trim(),
        logoUrl: data.logoUrl?.trim() || null,
      },
    });
  }

  public static async deleteTeam(teamId: string) {
    // Fahrer unassignen
    await prisma.user.updateMany({
      where: { teamId },
      data: { teamId: null, role: 'RESERVE' },
    });

    return prisma.team.delete({
      where: { id: teamId },
    });
  }

  public static async assignDriverToTeam(userId: string, teamId: string | null, role: 'DRIVER' | 'RESERVE') {
    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) throw new Error('Fahrer nicht gefunden.');

    if (teamId && role === 'DRIVER') {
      // Prüfen: Maximal 2 Stammfahrer pro Team!
      const existingDrivers = await prisma.user.count({
        where: {
          teamId,
          role: 'DRIVER',
          id: { not: userId },
        },
      });

      if (existingDrivers >= 2) {
        throw new Error('Dieses Team hat bereits 2 Stammfahrer zugewiesen! Bitte weise den Fahrer als Ersatzfahrer zu oder tausche einen Stammfahrer aus.');
      }
    }

    return prisma.user.update({
      where: { id: userId },
      data: {
        teamId: teamId || null,
        role: role,
        // Administrator-Rechte bleiben bei Team-Zuweisung garantiert erhalten!
        isAdmin: Boolean(existing.isAdmin || existing.role === 'ADMIN'),
      },
      include: { team: true },
    });
  }

  public static async removeDriverFromTeam(userId: string) {
    const existing = await prisma.user.findUnique({ where: { id: userId } });
    return prisma.user.update({
      where: { id: userId },
      data: {
        teamId: null,
        role: 'RESERVE',
        // Administrator-Rechte bleiben garantiert erhalten!
        isAdmin: Boolean(existing?.isAdmin || existing?.role === 'ADMIN'),
      },
    });
  }

  public static async submitRaceResultsAndNotifyBot(
    raceId: string,
    resultsData: any[]
  ) {
    // 1. Ergebnisse in Datenbank speichern und Punkte berechnen
    await ResultsService.saveRaceResults(raceId, resultsData);

    // 2. Rennen und Saison laden
    const race = await prisma.race.findUnique({
      where: { id: raceId },
      include: { season: true },
    });

    // 3. Discord-Bot Benachrichtigung / Live-Rangliste triggern
    if (race && race.seasonId) {
      try {
        await DiscordBot.updateLiveStandingsMessage(race.seasonId);
      } catch (err: any) {
        console.warn('[AdminService] Live-Rangliste konnte im Discord-Bot nicht automatisch aktualisiert werden:', err.message);
      }
    }

    return true;
  }

  /**
   * Administrativ eine Meisterschaftssaison mit ausgewählten Strecken anlegen und optional direkt starten
   */
  public static async startSeasonWithTracks(data: {
    name: string;
    year: number;
    status: string;
    firstRaceDate: Date;
    intervalDays: number;
    selectedTrackIndices: number[];
  }) {
    if (data.status === 'ACTIVE') {
      await prisma.season.updateMany({
        where: { status: 'ACTIVE' },
        data: { status: 'PAUSED' },
      });
    }

    const season = await prisma.season.create({
      data: {
        name: data.name.trim(),
        year: data.year,
        status: data.status,
      },
    });

    const chosenTracks = TRACKS_2026.filter((t) =>
      data.selectedTrackIndices.includes(t.roundNumber)
    );

    for (let i = 0; i < chosenTracks.length; i++) {
      const track = chosenTracks[i];
      const raceDate = new Date(data.firstRaceDate.getTime() + (i * data.intervalDays * 24 * 60 * 60 * 1000));

      await prisma.race.create({
        data: {
          seasonId: season.id,
          roundNumber: i + 1,
          trackName: track.trackName,
          country: track.country,
          flagEmoji: track.flagEmoji,
          trackLayoutSvg: track.svgPath,
          lengthKm: track.lengthKm,
          laps: track.laps, // 50% Renndistanz
          date: raceDate,
          status: 'UPCOMING',
        },
      });
    }

    return season;
  }

  /**
   * Rennen bearbeiten (Name, Land, Flagge, Datum, Runden, Distanz, Status)
   */
  public static async editRace(
    raceId: string,
    data: {
      trackName: string;
      country: string;
      flagEmoji: string;
      date: Date;
      laps?: number;
      lengthKm?: number;
      status: string;
    }
  ) {
    return prisma.race.update({
      where: { id: raceId },
      data: {
        trackName: data.trackName.trim(),
        country: data.country.trim(),
        flagEmoji: data.flagEmoji.trim() || '🏁',
        date: data.date,
        laps: data.laps || null,
        lengthKm: data.lengthKm || null,
        status: data.status,
      },
    });
  }

  /**
   * Rennen nach oben verschieben (Reorder)
   * Tauscht Rundennummer und Datum mit dem vorherigen Rennen
   */
  public static async moveRaceUp(raceId: string) {
    const currentRace = await prisma.race.findUnique({ where: { id: raceId } });
    if (!currentRace || currentRace.roundNumber <= 1) return null;

    const prevRace = await prisma.race.findFirst({
      where: {
        seasonId: currentRace.seasonId,
        roundNumber: { lt: currentRace.roundNumber },
      },
      orderBy: { roundNumber: 'desc' },
    });

    if (!prevRace) return null;
    return this.swapRaces(currentRace, prevRace);
  }

  /**
   * Rennen nach unten verschieben (Reorder)
   * Tauscht Rundennummer und Datum mit dem nachfolgenden Rennen
   */
  public static async moveRaceDown(raceId: string) {
    const currentRace = await prisma.race.findUnique({ where: { id: raceId } });
    if (!currentRace) return null;

    const nextRace = await prisma.race.findFirst({
      where: {
        seasonId: currentRace.seasonId,
        roundNumber: { gt: currentRace.roundNumber },
      },
      orderBy: { roundNumber: 'asc' },
    });

    if (!nextRace) return null;
    return this.swapRaces(currentRace, nextRace);
  }

  private static async swapRaces(raceA: any, raceB: any) {
    return prisma.$transaction([
      prisma.race.update({
        where: { id: raceA.id },
        data: {
          roundNumber: raceB.roundNumber,
          date: raceB.date,
        },
      }),
      prisma.race.update({
        where: { id: raceB.id },
        data: {
          roundNumber: raceA.roundNumber,
          date: raceA.date,
        },
      }),
    ]);
  }

  /**
   * System-Ankündigung / Globales Banner
   */
  public static async getAnnouncement() {
    const activeSetting = await prisma.systemSetting.findUnique({ where: { key: 'ANNOUNCEMENT_ACTIVE' } });
    const textSetting = await prisma.systemSetting.findUnique({ where: { key: 'ANNOUNCEMENT_TEXT' } });
    const typeSetting = await prisma.systemSetting.findUnique({ where: { key: 'ANNOUNCEMENT_TYPE' } });

    const active = activeSetting?.value === 'true';
    const text = textSetting?.value || '';
    const type = typeSetting?.value || 'info';

    return { active, text, type };
  }

  public static async setAnnouncement(text: string, active: boolean, type = 'info') {
    await prisma.systemSetting.upsert({
      where: { key: 'ANNOUNCEMENT_TEXT' },
      update: { value: text.trim() },
      create: { key: 'ANNOUNCEMENT_TEXT', value: text.trim() },
    });

    await prisma.systemSetting.upsert({
      where: { key: 'ANNOUNCEMENT_ACTIVE' },
      update: { value: active ? 'true' : 'false' },
      create: { key: 'ANNOUNCEMENT_ACTIVE', value: active ? 'true' : 'false' },
    });

    await prisma.systemSetting.upsert({
      where: { key: 'ANNOUNCEMENT_TYPE' },
      update: { value: type },
      create: { key: 'ANNOUNCEMENT_TYPE', value: type },
    });

    return { active, text, type };
  }

  /**
   * Stewarding & Strafenkatalog: Punkte abziehen/adden, Lizenzpunkte und Verwarnungen aussprechen
   */
  public static async issuePenalty(data: {
    userId: string;
    seasonId?: string;
    raceId?: string;
    type: 'WARNING' | 'PENALTY_POINTS' | 'POINT_DEDUCTION' | 'POINT_ADDITION';
    amount?: number;
    reason: string;
    stewardName?: string;
  }) {
    let points = 0;
    let penaltyPoints = 0;
    const num = Math.abs(data.amount || 0);

    if (data.type === 'POINT_DEDUCTION') {
      points = -num;
    } else if (data.type === 'POINT_ADDITION') {
      points = num;
    } else if (data.type === 'PENALTY_POINTS') {
      penaltyPoints = Math.round(num);
    }

    const penalty = await prisma.driverPenalty.create({
      data: {
        userId: data.userId,
        seasonId: data.seasonId || null,
        raceId: data.raceId || null,
        type: data.type,
        points,
        penaltyPoints,
        reason: data.reason.trim(),
        stewardName: data.stewardName?.trim() || 'Rennleitung',
      },
      include: { user: true, race: true, season: true },
    });

    if (data.seasonId) {
      try {
        await DiscordBot.updateLiveStandingsMessage(data.seasonId);
      } catch (e) {}
    }

    return penalty;
  }

  public static async deletePenalty(penaltyId: string) {
    const penalty = await prisma.driverPenalty.delete({
      where: { id: penaltyId },
    });

    if (penalty.seasonId) {
      try {
        await DiscordBot.updateLiveStandingsMessage(penalty.seasonId);
      } catch (e) {}
    }

    return penalty;
  }

  public static async getAllPenalties(seasonId?: string) {
    return prisma.driverPenalty.findMany({
      where: seasonId ? { seasonId } : undefined,
      include: {
        user: { include: { team: true } },
        race: true,
        season: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

