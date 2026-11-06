"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscordBot = void 0;
const discord_js_1 = require("discord.js");
const config_1 = require("../core/config");
const db_1 = require("../core/db");
const embeds_1 = require("./embeds");
const results_service_1 = require("../modules/results/results.service");
const checkinHandler_1 = require("./buttons/checkinHandler");
const nextRace_1 = require("./commands/nextRace");
const standings_1 = require("./commands/standings");
const setup_1 = require("./commands/setup");
class DiscordBot {
    static client = null;
    static isInitialized = false;
    static async init() {
        if (!config_1.config.discord.botToken || config_1.config.discord.botToken.startsWith('your_') || config_1.config.discord.botToken.startsWith('placeholder_')) {
            console.log('ℹ️  Discord Bot: Kein gültiger Token angegeben. Bot läuft im Offline-Modus.');
            return;
        }
        try {
            this.client = new discord_js_1.Client({
                intents: [
                    discord_js_1.GatewayIntentBits.Guilds,
                    discord_js_1.GatewayIntentBits.GuildMembers,
                    discord_js_1.GatewayIntentBits.GuildMessages,
                ],
            });
            this.setupEventHandlers();
            await this.client.login(config_1.config.discord.botToken);
            this.isInitialized = true;
        }
        catch (err) {
            console.warn('⚠️  Discord Bot Login fehlgeschlagen (Server läuft weiter):', err.message);
        }
    }
    static setupEventHandlers() {
        if (!this.client)
            return;
        this.client.once('ready', async (c) => {
            console.log(`🤖 Discord-Bot erfolgreich eingeloggt als ${c.user.tag}`);
            // Rich Presence / Status setzen
            c.user.setPresence({
                activities: [
                    {
                        name: 'the grid. | 50% F1 League',
                        type: discord_js_1.ActivityType.Watching,
                    },
                ],
                status: 'online',
            });
            // Slash-Befehle registrieren
            await this.registerSlashCommands();
            // Sofort alle konfigurierten Live-Embeds aktualisieren / bereitstellen
            await this.refreshAllLiveEmbeds();
        });
        this.client.on('interactionCreate', async (interaction) => {
            try {
                if (interaction.isChatInputCommand()) {
                    const commandName = interaction.commandName;
                    if (commandName === 'next-race') {
                        await nextRace_1.nextRaceCommand.execute(interaction);
                    }
                    else if (commandName === 'standings') {
                        await standings_1.standingsCommand.execute(interaction);
                    }
                    else if (commandName === 'standings-setup') {
                        await setup_1.standingsSetupCommand.execute(interaction);
                    }
                    else if (commandName === 'checkin-setup') {
                        await setup_1.checkinSetupCommand.execute(interaction);
                    }
                    else if (commandName === 'roster-setup') {
                        await setup_1.rosterSetupCommand.execute(interaction);
                    }
                    else if (commandName === 'sync-embeds') {
                        await setup_1.syncEmbedsCommand.execute(interaction);
                    }
                }
                else if (interaction.isButton()) {
                    await (0, checkinHandler_1.handleCheckinButton)(interaction);
                }
            }
            catch (err) {
                console.error('Fehler bei Discord Interaction:', err);
            }
        });
    }
    static async registerSlashCommands() {
        if (!this.client?.user)
            return;
        try {
            const rest = new discord_js_1.REST({ version: '10' }).setToken(config_1.config.discord.botToken);
            const commands = [
                nextRace_1.nextRaceCommand.data.toJSON(),
                standings_1.standingsCommand.data.toJSON(),
                setup_1.standingsSetupCommand.data.toJSON(),
                setup_1.checkinSetupCommand.data.toJSON(),
                setup_1.rosterSetupCommand.data.toJSON(),
                setup_1.syncEmbedsCommand.data.toJSON(),
            ];
            console.log('🔄 Registriere Discord Slash-Befehle...');
            if (config_1.config.discord.guildId && !config_1.config.discord.guildId.startsWith('placeholder_')) {
                await rest.put(discord_js_1.Routes.applicationGuildCommands(this.client.user.id, config_1.config.discord.guildId), { body: commands });
                console.log(`✅ Slash-Befehle für Server ${config_1.config.discord.guildId} registriert.`);
            }
            else {
                await rest.put(discord_js_1.Routes.applicationCommands(this.client.user.id), { body: commands });
                console.log('✅ Globale Slash-Befehle registriert.');
            }
        }
        catch (err) {
            console.warn('⚠️  Konnte Slash-Commands nicht automatisch registrieren:', err.message);
        }
    }
    /**
     * Universeller Live-Update-Helper:
     * Sucht nach einer bestehenden Nachricht via Channel & SystemSetting Key.
     * Wenn gefunden: editiert sie mit dem neuesten Inhalt.
     * Wenn nicht gefunden oder Kanal gewechselt: sendet eine neue Nachricht und speichert die Message-ID persistent in der Datenbank!
     */
    static async updateOrCreateMessage(channelId, settingKey, channelSettingKey, payload) {
        if (!this.client || !this.client.isReady() || !channelId) {
            return false;
        }
        try {
            const channel = await this.client.channels.fetch(channelId);
            if (!channel || !(channel instanceof discord_js_1.TextChannel)) {
                console.warn(`[DiscordBot] Kanal ${channelId} wurde nicht gefunden oder ist kein Textkanal.`);
                return false;
            }
            // Prüfen, ob der Kanal sich seit dem letzten Speichern geändert hat
            const dbChannelSetting = await db_1.prisma.systemSetting.findUnique({
                where: { key: channelSettingKey },
            });
            const savedChannelId = dbChannelSetting?.value;
            // Gespeicherte Message-ID aus Datenbank abfragen
            const dbSetting = await db_1.prisma.systemSetting.findUnique({
                where: { key: settingKey },
            });
            let messageId = dbSetting?.value;
            // Wenn sich der Zielkanal geändert hat (z. B. Standings auf separaten Channel korrigiert):
            if (savedChannelId && savedChannelId !== channelId) {
                console.log(`[DiscordBot] Kanal für ${settingKey} hat sich von ${savedChannelId} zu ${channelId} geändert. Setze Message-ID zurück.`);
                if (messageId) {
                    try {
                        const oldChannel = await this.client.channels.fetch(savedChannelId);
                        if (oldChannel && oldChannel instanceof discord_js_1.TextChannel) {
                            const oldMsg = await oldChannel.messages.fetch(messageId);
                            if (oldMsg)
                                await oldMsg.delete();
                        }
                    }
                    catch { }
                }
                messageId = undefined;
                await db_1.prisma.systemSetting.deleteMany({ where: { key: settingKey } });
            }
            if (messageId) {
                try {
                    const message = await channel.messages.fetch(messageId);
                    if (message) {
                        await message.edit(payload);
                        console.log(`✅ [DiscordBot] Live-Embed in #${channel.name} (${channel.id}) erfolgreich aktualisiert (Msg: ${message.id}).`);
                        return true;
                    }
                }
                catch (fetchErr) {
                    console.log(`[DiscordBot] Zuvor gespeicherte Nachricht ${messageId} nicht mehr auffindbar. Erzeuge neue Nachricht...`);
                }
            }
            // Neu senden und IDs in SystemSetting hinterlegen
            const newMsg = await channel.send(payload);
            await db_1.prisma.systemSetting.upsert({
                where: { key: settingKey },
                update: { value: newMsg.id },
                create: { key: settingKey, value: newMsg.id },
            });
            await db_1.prisma.systemSetting.upsert({
                where: { key: channelSettingKey },
                update: { value: channelId },
                create: { key: channelSettingKey, value: channelId },
            });
            console.log(`✅ [DiscordBot] Neues Live-Embed in #${channel.name} (${channel.id}) gepostet und verknüpft (Msg: ${newMsg.id}).`);
            return true;
        }
        catch (err) {
            console.error(`⚠️ [DiscordBot] Fehler beim Live-Update für ${settingKey} in Kanal ${channelId}:`, err.message);
            return false;
        }
    }
    /**
     * Automatische Aktualisierung des Fahrerfelds & der Team-Cockpits im Kanal 1568279489463586979
     * Ersatzfahrer werden darunter übersichtlich gelistet.
     */
    static async updateLiveRosterMessage() {
        if (!this.client || !this.client.isReady())
            return false;
        try {
            const channelId = config_1.config.discord.rosterChannelId || '1568279489463586979';
            // 1. Teams mit ihren verifizierten Fahrern laden
            const teams = await db_1.prisma.team.findMany({
                include: {
                    drivers: {
                        where: { hasDriverRole: true },
                        orderBy: [{ role: 'asc' }, { raceNumber: 'asc' }],
                    },
                },
                orderBy: { name: 'asc' },
            });
            // 2. Freie Stammfahrer (ohne Team-Vertrag)
            const freeDrivers = await db_1.prisma.user.findMany({
                where: {
                    hasDriverRole: true,
                    teamId: null,
                    role: { not: 'RESERVE' },
                },
                orderBy: [{ raceNumber: 'asc' }],
            });
            // 3. Ersatzfahrer (werden darunter angezeigt)
            const reserveDrivers = await db_1.prisma.user.findMany({
                where: {
                    hasDriverRole: true,
                    role: 'RESERVE',
                },
                orderBy: [{ raceNumber: 'asc' }],
            });
            const embed = embeds_1.BotEmbeds.createDriverRosterEmbed(teams, freeDrivers, reserveDrivers);
            return this.updateOrCreateMessage(channelId, 'DISCORD_ROSTER_MESSAGE_ID', 'DISCORD_ROSTER_CHANNEL_ID', { embeds: [embed] });
        }
        catch (err) {
            console.error('⚠️ [DiscordBot] Fehler beim Fahrerfeld-Live-Update:', err.message);
            return false;
        }
    }
    /**
     * Automatische Aktualisierung der Rangliste in #rangliste (1568248876899504289)
     */
    static async updateLiveStandingsMessage(seasonId) {
        if (!this.client || !this.client.isReady())
            return false;
        try {
            const channelId = config_1.config.discord.standingsChannelId || '1568248876899504289';
            // Wenn keine seasonId angegeben, aktive oder neueste Saison verwenden
            let targetSeasonId = seasonId;
            if (!targetSeasonId) {
                const activeSeason = await db_1.prisma.season.findFirst({
                    where: { status: { in: ['ACTIVE', 'UPCOMING'] } },
                    orderBy: { createdAt: 'desc' },
                });
                if (activeSeason)
                    targetSeasonId = activeSeason.id;
            }
            const { season, driverStandings, teamStandings } = await results_service_1.ResultsService.getSeasonStandings(targetSeasonId);
            if (!season)
                return false;
            const updatedEmbed = embeds_1.BotEmbeds.createLiveStandingsEmbed(season.name, driverStandings, teamStandings);
            return this.updateOrCreateMessage(channelId, 'DISCORD_STANDINGS_MESSAGE_ID', 'DISCORD_STANDINGS_CHANNEL_ID', { embeds: [updatedEmbed] });
        }
        catch (err) {
            console.error('⚠️ [DiscordBot] Fehler beim Ranglisten-Live-Update:', err.message);
            return false;
        }
    }
    /**
     * Automatische Aktualisierung des Check-In Embeds für den anstehenden Renntag (1568248857555501066)
     */
    static async updateLiveCheckinMessage(raceId) {
        if (!this.client || !this.client.isReady())
            return false;
        try {
            const channelId = config_1.config.discord.checkinChannelId || '1568248857555501066';
            let targetRaceId = raceId;
            if (!targetRaceId) {
                const upcoming = await db_1.prisma.race.findFirst({
                    where: {
                        status: { in: ['UPCOMING', 'ACTIVE', 'SCHEDULED'] },
                        date: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
                    },
                    orderBy: { date: 'asc' },
                });
                if (upcoming)
                    targetRaceId = upcoming.id;
            }
            if (!targetRaceId)
                return false;
            const race = await db_1.prisma.race.findUnique({
                where: { id: targetRaceId },
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
            if (!race)
                return false;
            const { embed, components } = embeds_1.BotEmbeds.createRaceCheckinEmbed(race);
            return this.updateOrCreateMessage(channelId, 'DISCORD_CHECKIN_MESSAGE_ID', 'DISCORD_CHECKIN_CHANNEL_ID', { embeds: [embed], components });
        }
        catch (err) {
            console.error('⚠️ [DiscordBot] Fehler beim Check-In Live-Update:', err.message);
            return false;
        }
    }
    /**
     * Aktualisiert alle Live-Embeds auf einmal
     */
    static async refreshAllLiveEmbeds() {
        console.log('🔄 [DiscordBot] Starte automatischen Abgleich aller Discord Live-Embeds...');
        await Promise.allSettled([
            this.updateLiveRosterMessage(),
            this.updateLiveStandingsMessage(),
            this.updateLiveCheckinMessage(),
        ]);
    }
}
exports.DiscordBot = DiscordBot;
