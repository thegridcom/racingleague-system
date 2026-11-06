"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const db_1 = require("../../core/db");
const results_service_1 = require("../results/results.service");
const bot_1 = require("../../bot/bot");
const motorsport_assets_1 = require("../../core/motorsport-assets");
class AdminService {
    static async getAdminStats() {
        const totalDrivers = await db_1.prisma.user.count();
        const mainDrivers = await db_1.prisma.user.count({ where: { role: 'DRIVER' } });
        const reserveDrivers = await db_1.prisma.user.count({ where: { role: 'RESERVE' } });
        const totalTeams = await db_1.prisma.team.count();
        const totalPenalties = await db_1.prisma.driverPenalty.count();
        const activeSeason = await db_1.prisma.season.findFirst({
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
    static async getAllTeamsWithDrivers() {
        return db_1.prisma.team.findMany({
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
    static async createTeam(data) {
        return db_1.prisma.team.create({
            data: {
                name: data.name.trim(),
                shortCode: data.shortCode.trim().toUpperCase(),
                colorHex: data.colorHex.trim(),
                logoUrl: data.logoUrl?.trim() || null,
            },
        });
    }
    static async deleteTeam(teamId) {
        // Fahrer unassignen
        await db_1.prisma.user.updateMany({
            where: { teamId },
            data: { teamId: null, role: 'RESERVE' },
        });
        return db_1.prisma.team.delete({
            where: { id: teamId },
        });
    }
    static async assignDriverToTeam(userId, teamId, role) {
        const existing = await db_1.prisma.user.findUnique({ where: { id: userId } });
        if (!existing)
            throw new Error('Fahrer nicht gefunden.');
        if (teamId && role === 'DRIVER') {
            // Prüfen: Maximal 2 Stammfahrer pro Team!
            const existingDrivers = await db_1.prisma.user.count({
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
        return db_1.prisma.user.update({
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
    static async removeDriverFromTeam(userId) {
        const existing = await db_1.prisma.user.findUnique({ where: { id: userId } });
        return db_1.prisma.user.update({
            where: { id: userId },
            data: {
                teamId: null,
                role: 'RESERVE',
                // Administrator-Rechte bleiben garantiert erhalten!
                isAdmin: Boolean(existing?.isAdmin || existing?.role === 'ADMIN'),
            },
        });
    }
    static async submitRaceResultsAndNotifyBot(raceId, resultsData) {
        // 1. Ergebnisse in Datenbank speichern und Punkte berechnen
        await results_service_1.ResultsService.saveRaceResults(raceId, resultsData);
        // 2. Rennen und Saison laden
        const race = await db_1.prisma.race.findUnique({
            where: { id: raceId },
            include: { season: true },
        });
        // 3. Discord-Bot Benachrichtigung / Live-Rangliste triggern
        if (race && race.seasonId) {
            try {
                await bot_1.DiscordBot.updateLiveStandingsMessage(race.seasonId);
            }
            catch (err) {
                console.warn('[AdminService] Live-Rangliste konnte im Discord-Bot nicht automatisch aktualisiert werden:', err.message);
            }
        }
        return true;
    }
    /**
     * Administrativ eine Meisterschaftssaison mit ausgewählten Strecken anlegen und optional direkt starten
     */
    static async startSeasonWithTracks(data) {
        if (data.status === 'ACTIVE') {
            await db_1.prisma.season.updateMany({
                where: { status: 'ACTIVE' },
                data: { status: 'PAUSED' },
            });
        }
        const season = await db_1.prisma.season.create({
            data: {
                name: data.name.trim(),
                year: data.year,
                status: data.status,
            },
        });
        const chosenTracks = motorsport_assets_1.TRACKS_2026.filter((t) => data.selectedTrackIndices.includes(t.roundNumber));
        for (let i = 0; i < chosenTracks.length; i++) {
            const track = chosenTracks[i];
            const raceDate = new Date(data.firstRaceDate.getTime() + (i * data.intervalDays * 24 * 60 * 60 * 1000));
            await db_1.prisma.race.create({
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
    static async editRace(raceId, data) {
        return db_1.prisma.race.update({
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
    static async moveRaceUp(raceId) {
        const currentRace = await db_1.prisma.race.findUnique({ where: { id: raceId } });
        if (!currentRace || currentRace.roundNumber <= 1)
            return null;
        const prevRace = await db_1.prisma.race.findFirst({
            where: {
                seasonId: currentRace.seasonId,
                roundNumber: { lt: currentRace.roundNumber },
            },
            orderBy: { roundNumber: 'desc' },
        });
        if (!prevRace)
            return null;
        return this.swapRaces(currentRace, prevRace);
    }
    /**
     * Rennen nach unten verschieben (Reorder)
     * Tauscht Rundennummer und Datum mit dem nachfolgenden Rennen
     */
    static async moveRaceDown(raceId) {
        const currentRace = await db_1.prisma.race.findUnique({ where: { id: raceId } });
        if (!currentRace)
            return null;
        const nextRace = await db_1.prisma.race.findFirst({
            where: {
                seasonId: currentRace.seasonId,
                roundNumber: { gt: currentRace.roundNumber },
            },
            orderBy: { roundNumber: 'asc' },
        });
        if (!nextRace)
            return null;
        return this.swapRaces(currentRace, nextRace);
    }
    static async swapRaces(raceA, raceB) {
        return db_1.prisma.$transaction([
            db_1.prisma.race.update({
                where: { id: raceA.id },
                data: {
                    roundNumber: raceB.roundNumber,
                    date: raceB.date,
                },
            }),
            db_1.prisma.race.update({
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
    static async getAnnouncement() {
        const activeSetting = await db_1.prisma.systemSetting.findUnique({ where: { key: 'ANNOUNCEMENT_ACTIVE' } });
        const textSetting = await db_1.prisma.systemSetting.findUnique({ where: { key: 'ANNOUNCEMENT_TEXT' } });
        const typeSetting = await db_1.prisma.systemSetting.findUnique({ where: { key: 'ANNOUNCEMENT_TYPE' } });
        const active = activeSetting?.value === 'true';
        const text = textSetting?.value || '';
        const type = typeSetting?.value || 'info';
        return { active, text, type };
    }
    static async setAnnouncement(text, active, type = 'info') {
        await db_1.prisma.systemSetting.upsert({
            where: { key: 'ANNOUNCEMENT_TEXT' },
            update: { value: text.trim() },
            create: { key: 'ANNOUNCEMENT_TEXT', value: text.trim() },
        });
        await db_1.prisma.systemSetting.upsert({
            where: { key: 'ANNOUNCEMENT_ACTIVE' },
            update: { value: active ? 'true' : 'false' },
            create: { key: 'ANNOUNCEMENT_ACTIVE', value: active ? 'true' : 'false' },
        });
        await db_1.prisma.systemSetting.upsert({
            where: { key: 'ANNOUNCEMENT_TYPE' },
            update: { value: type },
            create: { key: 'ANNOUNCEMENT_TYPE', value: type },
        });
        return { active, text, type };
    }
    /**
     * Stewarding & Strafenkatalog: Punkte abziehen/adden, Lizenzpunkte und Verwarnungen aussprechen
     */
    static async issuePenalty(data) {
        let points = 0;
        let penaltyPoints = 0;
        const num = Math.abs(data.amount || 0);
        if (data.type === 'POINT_DEDUCTION') {
            points = -num;
        }
        else if (data.type === 'POINT_ADDITION') {
            points = num;
        }
        else if (data.type === 'PENALTY_POINTS') {
            penaltyPoints = Math.round(num);
        }
        const penalty = await db_1.prisma.driverPenalty.create({
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
                await bot_1.DiscordBot.updateLiveStandingsMessage(data.seasonId);
            }
            catch (e) { }
        }
        return penalty;
    }
    static async deletePenalty(penaltyId) {
        const penalty = await db_1.prisma.driverPenalty.delete({
            where: { id: penaltyId },
        });
        if (penalty.seasonId) {
            try {
                await bot_1.DiscordBot.updateLiveStandingsMessage(penalty.seasonId);
            }
            catch (e) { }
        }
        return penalty;
    }
    static async getAllPenalties(seasonId) {
        return db_1.prisma.driverPenalty.findMany({
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
exports.AdminService = AdminService;
