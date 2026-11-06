import { prisma } from '../../core/db';

export class DriversService {
  public static async checkRaceNumberAvailable(raceNumber: number, excludeUserId?: string): Promise<boolean> {
    const existing = await prisma.user.findFirst({
      where: {
        raceNumber,
        ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
      },
    });
    return !existing;
  }

  public static async updateDriverProfile(
    userId: string,
    data: {
      eaId: string;
      platform: string;
      platformUsername: string;
      gamertag?: string;
      raceNumber: number;
      assists?: string;
      experience?: string;
    }
  ) {
    const effectiveGamertag = data.gamertag?.trim() || data.platformUsername.trim() || data.eaId.trim();

    return prisma.user.update({
      where: { id: userId },
      data: {
        eaId: data.eaId.trim(),
        platform: data.platform,
        platformUsername: data.platformUsername.trim(),
        gamertag: effectiveGamertag,
        raceNumber: data.raceNumber,
        assists: data.assists?.trim() || null,
        experience: data.experience?.trim() || null,
      },
      include: { team: true },
    });
  }

  public static async getDriverDashboardData(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        team: true,
        penalties: {
          include: { race: true, season: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) return null;

    // Nächstes anstehendes Rennen
    const nextRaces = await prisma.race.findMany({
      where: {
        status: { in: ['UPCOMING', 'ACTIVE', 'SCHEDULED'] },
        date: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      orderBy: { date: 'asc' },
      take: 5,
      include: {
        season: true,
        attendances: {
          where: { userId },
        },
      },
    });

    // Bisherige Rennergebnisse des Fahrers
    const results = await prisma.raceResult.findMany({
      where: { userId },
      include: {
        race: {
          include: { season: true },
        },
      },
      orderBy: { race: { date: 'desc' } },
    });

    // Berechnungen inkl. Strafen, Verwarnungen und Punkte-Anpassungen
    const penaltyPointsFromPenalties = user.penalties.reduce((sum, p) => sum + p.penaltyPoints, 0);
    const penaltyPointsFromResults = results.reduce((sum, r) => sum + r.penaltyPoints, 0);
    const totalPenaltyPoints = penaltyPointsFromPenalties + penaltyPointsFromResults;

    const pointAdjustments = user.penalties.reduce((sum, p) => sum + p.points, 0);
    const warningsCount = user.penalties.filter((p) => p.type === 'WARNING').length;

    const baseRacePoints = results.reduce((sum, r) => sum + r.points, 0);
    const totalPoints = Math.max(0, baseRacePoints + pointAdjustments);

    const podiums = results.filter((r) => r.position <= 3).length;
    const wins = results.filter((r) => r.position === 1).length;
    const fastestLaps = results.filter((r) => r.fastestLap).length;

    return {
      user,
      nextRaces,
      results,
      penalties: user.penalties,
      stats: {
        totalPoints,
        pointAdjustments,
        warningsCount,
        penaltyPoints: totalPenaltyPoints,
        podiums,
        wins,
        fastestLaps,
        racesParticipated: results.length,
      },
    };
  }

  /**
   * DSGVO Art. 17: Recht auf Löschung / Self-Service Account-Löschung
   * 
   * Löscht das Nutzerprofil, Gamertag, Plattform, Startnummer und Anwesenheiten.
   * Historische Rennergebnisse bleiben zur Wahrung der Meisterschaftsintegrität
   * erhalten, werden jedoch vollständig anonymisiert (driverName = "Gelöschter Fahrer", userId = null).
   */
  public static async deleteDriverAccountGdpr(userId: string): Promise<boolean> {
    return prisma.$transaction(async (tx) => {
      // 1. Rennergebnisse anonymisieren (Personenbezug vollständig entfernen)
      await tx.raceResult.updateMany({
        where: { userId },
        data: {
          userId: null,
          driverName: 'Gelöschter Fahrer (anonymisiert)',
        },
      });

      // 2. Anwesenheiten löschen
      await tx.attendance.deleteMany({
        where: { userId },
      });

      // 3. User-Account löschen
      await tx.user.delete({
        where: { id: userId },
      });

      return true;
    });
  }

  public static async getAllDrivers() {
    return prisma.user.findMany({
      where: {
        hasDriverRole: true,
      },
      include: { team: true },
      orderBy: [
        { role: 'asc' },
        { raceNumber: 'asc' },
      ],
    });
  }
}

