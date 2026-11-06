import { prisma } from '../../core/db';

export class SeasonsService {
  public static async getAllSeasons() {
    return prisma.season.findMany({
      include: {
        races: {
          orderBy: { roundNumber: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  public static async getActiveSeason() {
    return prisma.season.findFirst({
      where: { status: 'ACTIVE' },
      include: {
        races: {
          orderBy: { roundNumber: 'asc' },
          include: {
            attendances: {
              include: { user: true },
            },
            results: {
              orderBy: { position: 'asc' },
            },
          },
        },
      },
    });
  }

  public static async getSeasonById(id: string) {
    return prisma.season.findUnique({
      where: { id },
      include: {
        races: {
          orderBy: { roundNumber: 'asc' },
          include: {
            attendances: {
              include: { user: true },
            },
            results: {
              orderBy: { position: 'asc' },
            },
          },
        },
      },
    });
  }

  public static async createSeason(data: { name: string; year: number }) {
    return prisma.season.create({
      data: {
        name: data.name.trim(),
        year: data.year,
        status: 'UPCOMING',
      },
    });
  }

  public static async updateSeasonStatus(seasonId: string, status: string) {
    return prisma.season.update({
      where: { id: seasonId },
      data: { status },
    });
  }

  public static async deleteSeason(seasonId: string) {
    return prisma.season.delete({
      where: { id: seasonId },
    });
  }

  public static async addRaceToSeason(data: {
    seasonId: string;
    roundNumber: number;
    trackName: string;
    country: string;
    flagEmoji: string;
    date: Date;
    trackLayoutSvg?: string;
    lengthKm?: number;
    laps?: number;
  }) {
    return prisma.race.create({
      data: {
        seasonId: data.seasonId,
        roundNumber: data.roundNumber,
        trackName: data.trackName.trim(),
        country: data.country.trim(),
        flagEmoji: data.flagEmoji.trim() || '🏁',
        trackLayoutSvg: data.trackLayoutSvg?.trim() || null,
        lengthKm: data.lengthKm || null,
        laps: data.laps || null,
        date: data.date,
        status: 'UPCOMING',
      },
    });
  }

  public static async updateRace(raceId: string, data: {
    trackName: string;
    country: string;
    flagEmoji: string;
    date: Date;
    status: string;
  }) {
    return prisma.race.update({
      where: { id: raceId },
      data: {
        trackName: data.trackName.trim(),
        country: data.country.trim(),
        flagEmoji: data.flagEmoji.trim() || '🏁',
        date: data.date,
        status: data.status,
      },
    });
  }

  public static async deleteRace(raceId: string) {
    return prisma.race.delete({
      where: { id: raceId },
    });
  }

  public static async getRaceDetails(raceId: string) {
    return prisma.race.findUnique({
      where: { id: raceId },
      include: {
        season: true,
        attendances: {
          include: {
            user: {
              include: { team: true },
            },
          },
          orderBy: { updatedAt: 'desc' },
        },
        results: {
          orderBy: { position: 'asc' },
        },
      },
    });
  }

  public static async getNextUpcomingRace() {
    const nextRace = await prisma.race.findFirst({
      where: {
        status: { in: ['UPCOMING', 'ACTIVE', 'SCHEDULED'] },
        date: { gte: new Date(Date.now() - 12 * 60 * 60 * 1000) },
      },
      orderBy: { date: 'asc' },
      include: {
        season: true,
        attendances: {
          include: {
            user: {
              include: { team: true },
            },
          },
        },
      },
    });

    if (nextRace) return nextRace;

    // Fallback falls alle Termine vergangen wären oder neu gestartet wurde: Frühestes anstehendes Rennen
    return prisma.race.findFirst({
      where: {
        status: { in: ['UPCOMING', 'ACTIVE', 'SCHEDULED'] },
      },
      orderBy: { roundNumber: 'asc' },
      include: {
        season: true,
        attendances: {
          include: {
            user: {
              include: { team: true },
            },
          },
        },
      },
    });
  }
}

