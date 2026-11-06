"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultsService = exports.F1_POINTS_MAP = void 0;
const db_1 = require("../../core/db");
exports.F1_POINTS_MAP = {
    1: 25,
    2: 18,
    3: 15,
    4: 12,
    5: 10,
    6: 8,
    7: 6,
    8: 4,
    9: 2,
    10: 1,
};
class ResultsService {
    /**
     * Berechnet die Punkte für eine Platzierung gemäß Formel 1 Reglement
     * Inklusive +1 Punkt für die schnellste Rennrunde (sofern Top 10 und FINISHED)
     */
    static calculateF1Points(position, fastestLap, status) {
        if (status !== 'FINISHED') {
            return 0;
        }
        let points = exports.F1_POINTS_MAP[position] || 0;
        if (fastestLap && position <= 10) {
            points += 1;
        }
        return points;
    }
    /**
     * Ermittelt die aktuelle Fahrer- und Konstrukteurswertung für eine Saison
     */
    static async getSeasonStandings(seasonId) {
        let targetSeasonId = seasonId;
        if (!targetSeasonId) {
            const active = await db_1.prisma.season.findFirst({
                where: { status: 'ACTIVE' },
            });
            targetSeasonId = active?.id;
        }
        if (!targetSeasonId) {
            const latest = await db_1.prisma.season.findFirst({
                orderBy: { createdAt: 'desc' },
            });
            targetSeasonId = latest?.id;
        }
        if (!targetSeasonId) {
            return { season: null, driverStandings: [], teamStandings: [] };
        }
        const season = await db_1.prisma.season.findUnique({
            where: { id: targetSeasonId },
            include: {
                races: {
                    include: {
                        results: {
                            include: {
                                user: {
                                    include: { team: true },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!season) {
            return { season: null, driverStandings: [], teamStandings: [] };
        }
        // 1. Fahrerwertung berechnen
        const driverMap = new Map();
        // 2. Teamwertung berechnen
        const teamMap = new Map();
        // Alle Teams vorinitialisieren
        const allTeams = await db_1.prisma.team.findMany();
        for (const t of allTeams) {
            teamMap.set(t.name, {
                teamName: t.name,
                shortCode: t.shortCode,
                colorHex: t.colorHex,
                logoUrl: t.logoUrl,
                points: 0,
                wins: 0,
                podiums: 0,
            });
        }
        for (const race of season.races) {
            for (const res of race.results) {
                // Driver aggregation key: userId if present, otherwise driverName
                const dKey = res.userId || res.driverName;
                const currentDriver = driverMap.get(dKey) || {
                    driverName: res.driverName,
                    userId: res.userId,
                    raceNumber: res.user?.raceNumber || null,
                    teamName: res.teamName || (res.user?.team?.name ?? 'Privatier'),
                    teamColorHex: res.user?.team?.colorHex || '#94A3B8',
                    points: 0,
                    wins: 0,
                    podiums: 0,
                    fastestLaps: 0,
                    racesCount: 0,
                    bestFinish: 99,
                };
                currentDriver.points += res.points;
                currentDriver.racesCount += 1;
                if (res.position === 1 && res.status === 'FINISHED')
                    currentDriver.wins += 1;
                if (res.position <= 3 && res.status === 'FINISHED')
                    currentDriver.podiums += 1;
                if (res.fastestLap)
                    currentDriver.fastestLaps += 1;
                if (res.position < currentDriver.bestFinish)
                    currentDriver.bestFinish = res.position;
                driverMap.set(dKey, currentDriver);
                // Team aggregation
                if (res.teamName) {
                    let teamEntry = teamMap.get(res.teamName);
                    if (!teamEntry) {
                        teamEntry = {
                            teamName: res.teamName,
                            shortCode: res.teamName.slice(0, 3).toUpperCase(),
                            colorHex: '#94A3B8',
                            logoUrl: null,
                            points: 0,
                            wins: 0,
                            podiums: 0,
                        };
                        teamMap.set(res.teamName, teamEntry);
                    }
                    teamEntry.points += res.points;
                    if (res.position === 1 && res.status === 'FINISHED')
                        teamEntry.wins += 1;
                    if (res.position <= 3 && res.status === 'FINISHED')
                        teamEntry.podiums += 1;
                }
            }
        }
        // 3. Stewarding-Strafen, Verwarnungen & Punkte-Anpassungen anrechnen
        const seasonPenalties = await db_1.prisma.driverPenalty.findMany({
            where: { seasonId: targetSeasonId },
            include: { user: { include: { team: true } } },
        });
        for (const pen of seasonPenalties) {
            const dKey = pen.userId;
            let driver = driverMap.get(dKey);
            if (!driver) {
                driver = {
                    driverName: pen.user.gamertag || pen.user.discordUsername,
                    userId: pen.userId,
                    raceNumber: pen.user.raceNumber,
                    teamName: pen.user.team?.name || 'Privatier',
                    teamColorHex: pen.user.team?.colorHex || '#94A3B8',
                    points: 0,
                    wins: 0,
                    podiums: 0,
                    fastestLaps: 0,
                    racesCount: 0,
                    bestFinish: 99,
                };
                driverMap.set(dKey, driver);
            }
            driver.points = Math.max(0, driver.points + pen.points);
            driver.pointAdjustments = (driver.pointAdjustments || 0) + pen.points;
            driver.penaltyPoints = (driver.penaltyPoints || 0) + pen.penaltyPoints;
            if (pen.type === 'WARNING') {
                driver.warningsCount = (driver.warningsCount || 0) + 1;
            }
            // Teamwertung ebenfalls anpassen, falls Punkte abgezogen/gutgeschrieben wurden
            if (pen.points !== 0 && driver.teamName) {
                const teamEntry = teamMap.get(driver.teamName);
                if (teamEntry) {
                    teamEntry.points = Math.max(0, teamEntry.points + pen.points);
                }
            }
        }
        // Sort Driver Standings: Punkte (desc), Siege (desc), Podien (desc), bestes Finish (asc)
        const driverStandings = Array.from(driverMap.values())
            .sort((a, b) => {
            if (b.points !== a.points)
                return b.points - a.points;
            if (b.wins !== a.wins)
                return b.wins - a.wins;
            if (b.podiums !== a.podiums)
                return b.podiums - a.podiums;
            return a.bestFinish - b.bestFinish;
        })
            .map((d, index) => ({
            position: index + 1,
            ...d,
        }));
        // Sort Team Standings: Punkte (desc), Siege (desc), Podien (desc)
        const teamStandings = Array.from(teamMap.values())
            .sort((a, b) => {
            if (b.points !== a.points)
                return b.points - a.points;
            if (b.wins !== a.wins)
                return b.wins - a.wins;
            return b.podiums - a.podiums;
        })
            .map((t, index) => ({
            position: index + 1,
            ...t,
        }));
        return {
            season,
            driverStandings,
            teamStandings,
        };
    }
    /**
     * Speichert die Ergebnisse eines Rennens und berechnet Punkte automatisch
     */
    static async saveRaceResults(raceId, resultsData) {
        return db_1.prisma.$transaction(async (tx) => {
            // Vorhandene Ergebnisse des Rennens löschen
            await tx.raceResult.deleteMany({
                where: { raceId },
            });
            for (const item of resultsData) {
                const points = this.calculateF1Points(item.position, item.fastestLap, item.status);
                await tx.raceResult.create({
                    data: {
                        raceId,
                        userId: item.userId || null,
                        driverName: item.driverName.trim(),
                        teamName: item.teamName.trim(),
                        position: item.position,
                        gridPosition: item.gridPosition || item.position,
                        points,
                        fastestLap: item.fastestLap,
                        fastestLapTime: item.fastestLapTime || null,
                        status: item.status,
                        penaltySeconds: item.penaltySeconds || 0,
                        penaltyPoints: item.penaltyPoints || 0,
                    },
                });
            }
            // Rennen auf COMPLETED setzen
            await tx.race.update({
                where: { id: raceId },
                data: { status: 'COMPLETED' },
            });
            return true;
        });
    }
}
exports.ResultsService = ResultsService;
