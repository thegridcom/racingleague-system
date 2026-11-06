"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DriversService = void 0;
const db_1 = require("../../core/db");
class DriversService {
    static async checkRaceNumberAvailable(raceNumber, excludeUserId) {
        const existing = await db_1.prisma.user.findFirst({
            where: {
                raceNumber,
                ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
            },
        });
        return !existing;
    }
    static async updateDriverProfile(userId, data) {
        const effectiveGamertag = data.gamertag?.trim() || data.platformUsername.trim() || data.eaId.trim();
        return db_1.prisma.user.update({
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
    static async getDriverDashboardData(userId) {
        const user = await db_1.prisma.user.findUnique({
            where: { id: userId },
            include: {
                team: true,
                penalties: {
                    include: { race: true, season: true },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!user)
            return null;
        // Nächstes anstehendes Rennen
        const nextRaces = await db_1.prisma.race.findMany({
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
        const results = await db_1.prisma.raceResult.findMany({
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
    static async deleteDriverAccountGdpr(userId) {
        return db_1.prisma.$transaction(async (tx) => {
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
    static async getAllDrivers() {
        return db_1.prisma.user.findMany({
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
exports.DriversService = DriversService;
