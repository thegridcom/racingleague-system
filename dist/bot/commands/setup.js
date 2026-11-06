"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncEmbedsCommand = exports.rosterSetupCommand = exports.checkinSetupCommand = exports.standingsSetupCommand = void 0;
const discord_js_1 = require("discord.js");
const results_service_1 = require("../../modules/results/results.service");
const seasons_service_1 = require("../../modules/seasons/seasons.service");
const embeds_1 = require("../embeds");
const db_1 = require("../../core/db");
exports.standingsSetupCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('standings-setup')
        .setDescription('Postet die offizielle Live-Rangliste in diesen Kanal und registriert sie für Auto-Updates')
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const { season, driverStandings, teamStandings } = await results_service_1.ResultsService.getSeasonStandings();
        if (!season) {
            return interaction.editReply('⚠️ Keine aktive Saison gefunden. Bitte lege zuerst eine Saison im Web-Admin-Panel an.');
        }
        const embed = embeds_1.BotEmbeds.createLiveStandingsEmbed(season.name, driverStandings, teamStandings);
        // Nachricht in den aktuellen Kanal senden
        const channel = interaction.channel;
        if (!channel || !('send' in channel)) {
            return interaction.editReply('⚠️ Kanal ungültig oder Bot hat keine Schreibrechte.');
        }
        const message = await channel.send({ embeds: [embed] });
        // ID der Nachricht in den Systemeinstellungen speichern, damit spätere Ergebnis-Updates diese editieren können
        await db_1.prisma.systemSetting.upsert({
            where: { key: 'DISCORD_STANDINGS_CHANNEL_ID' },
            update: { value: message.channelId },
            create: { key: 'DISCORD_STANDINGS_CHANNEL_ID', value: message.channelId },
        });
        await db_1.prisma.systemSetting.upsert({
            where: { key: 'DISCORD_STANDINGS_MESSAGE_ID' },
            update: { value: message.id },
            create: { key: 'DISCORD_STANDINGS_MESSAGE_ID', value: message.id },
        });
        await interaction.editReply(`✅ Live-Rangliste erfolgreich erstellt! Nachricht-ID: \`${message.id}\` in Kanal <#${message.channelId}>. Zukünftige Rennergebnisse aktualisieren diese Nachricht automatisch.`);
    },
};
exports.checkinSetupCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('checkin-setup')
        .setDescription('Postet ein interaktives Renntag-Check-In Embed für das anstehende Rennen')
        .addIntegerOption(opt => opt.setName('runde')
        .setDescription('Optionale Rundennummer (Standard: Nächstes anstehendes Rennen)')
        .setRequired(false))
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const roundNumber = interaction.options.getInteger('runde');
        let race;
        if (roundNumber) {
            race = await db_1.prisma.race.findFirst({
                where: { roundNumber },
                include: {
                    season: true,
                    attendances: {
                        include: { user: { include: { team: true } } },
                    },
                },
            });
        }
        else {
            const next = await seasons_service_1.SeasonsService.getNextUpcomingRace();
            if (next) {
                race = await seasons_service_1.SeasonsService.getRaceDetails(next.id);
            }
        }
        if (!race) {
            return interaction.editReply('⚠️ Kein passendes Rennen im Rennkalender gefunden.');
        }
        const channel = interaction.channel;
        if (!channel || !('send' in channel)) {
            return interaction.editReply('⚠️ Ungültiger Kanal.');
        }
        const { embed, components } = embeds_1.BotEmbeds.createRaceCheckinEmbed(race);
        const sentMsg = await channel.send({ embeds: [embed], components });
        await interaction.editReply(`✅ Check-In Embed für **Runde ${race.roundNumber}: ${race.trackName}** erfolgreich in <#${channel.id}> gepostet!`);
    },
};
exports.rosterSetupCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('roster-setup')
        .setDescription('Postet die offizielle Fahrer- und Teamübersicht in diesen Kanal')
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const channel = interaction.channel;
        if (!channel || !('send' in channel)) {
            return interaction.editReply('⚠️ Ungültiger Kanal oder keine Schreibrechte.');
        }
        const teams = await db_1.prisma.team.findMany({
            include: {
                drivers: {
                    where: { hasDriverRole: true },
                    orderBy: [{ role: 'asc' }, { raceNumber: 'asc' }],
                },
            },
            orderBy: { name: 'asc' },
        });
        const freeDrivers = await db_1.prisma.user.findMany({
            where: {
                hasDriverRole: true,
                teamId: null,
                role: { not: 'RESERVE' },
            },
            orderBy: [{ raceNumber: 'asc' }],
        });
        const reserveDrivers = await db_1.prisma.user.findMany({
            where: {
                hasDriverRole: true,
                role: 'RESERVE',
            },
            orderBy: [{ raceNumber: 'asc' }],
        });
        const embed = embeds_1.BotEmbeds.createDriverRosterEmbed(teams, freeDrivers, reserveDrivers);
        const message = await channel.send({ embeds: [embed] });
        await db_1.prisma.systemSetting.upsert({
            where: { key: 'DISCORD_ROSTER_CHANNEL_ID' },
            update: { value: message.channelId },
            create: { key: 'DISCORD_ROSTER_CHANNEL_ID', value: message.channelId },
        });
        await db_1.prisma.systemSetting.upsert({
            where: { key: 'DISCORD_ROSTER_MESSAGE_ID' },
            update: { value: message.id },
            create: { key: 'DISCORD_ROSTER_MESSAGE_ID', value: message.id },
        });
        await interaction.editReply(`✅ Offizielles Fahrerfeld & Teams erfolgreich in <#${channel.id}> bereitgestellt (Nachricht: \`${message.id}\`)! Zukünftige Änderungen werden live synchronisiert.`);
    },
};
exports.syncEmbedsCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('sync-embeds')
        .setDescription('Aktualisiert alle konfigurierten Live-Embeds (Rangliste, Check-In, Fahrerfeld) sofort')
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        // Dynamic import to avoid circular dependency
        const { DiscordBot } = await Promise.resolve().then(() => __importStar(require('../bot')));
        await DiscordBot.refreshAllLiveEmbeds();
        await interaction.editReply('✅ Alle Discord Live-Embeds (Fahrerfeld, Rangliste, Renntag Check-In) wurden erfolgreich synchronisiert!');
    },
};
