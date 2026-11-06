"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeasonsService = void 0;
const db_1 = require("../../core/db");
class SeasonsService {
    static async getAllSeasons() {
        return db_1.prisma.season.findMany({
            include: {
                races: {
                    orderBy: { roundNumber: 'asc' },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    static async getActiveSeason() {
        return db_1.prisma.season.findFirst({
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
    static async getSeasonById(id) {
        return db_1.prisma.season.findUnique({
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
    static async createSeason(data) {
        return db_1.prisma.season.create({
            data: {
                name: data.name.trim(),
                year: data.year,
                status: 'UPCOMING',
            },
        });
    }
    static async updateSeasonStatus(seasonId, status) {
        return db_1.prisma.season.update({
            where: { id: seasonId },
            data: { status },
        });
    }
    static async deleteSeason(seasonId) {
        return db_1.prisma.season.delete({
            where: { id: seasonId },
        });
    }
    static async addRaceToSeason(data) {
        return db_1.prisma.race.create({
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
    static async updateRace(raceId, data) {
        return db_1.prisma.race.update({
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
    static async deleteRace(raceId) {
        return db_1.prisma.race.delete({
            where: { id: raceId },
        });
    }
    static async getRaceDetails(raceId) {
        return db_1.prisma.race.findUnique({
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
    static async getNextUpcomingRace() {
        const nextRace = await db_1.prisma.race.findFirst({
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
        if (nextRace)
            return nextRace;
        // Fallback falls alle Termine vergangen wären oder neu gestartet wurde: Frühestes anstehendes Rennen
        return db_1.prisma.race.findFirst({
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
exports.SeasonsService = SeasonsService;
