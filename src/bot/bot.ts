import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  ActivityType,
  TextChannel,
  EmbedBuilder,
} from 'discord.js';
import { config } from '../core/config';
import { prisma } from '../core/db';
import { BotEmbeds } from './embeds';
import { ResultsService } from '../modules/results/results.service';
import { handleCheckinButton } from './buttons/checkinHandler';
import { nextRaceCommand } from './commands/nextRace';
import { standingsCommand } from './commands/standings';
import { standingsSetupCommand, checkinSetupCommand, rosterSetupCommand, syncEmbedsCommand } from './commands/setup';

export class DiscordBot {
  public static client: Client | null = null;
  private static isInitialized = false;

  public static async init() {
    if (!config.discord.botToken || config.discord.botToken.startsWith('your_') || config.discord.botToken.startsWith('placeholder_')) {
      console.log('ℹ️  Discord Bot: Kein gültiger Token angegeben. Bot läuft im Offline-Modus.');
      return;
    }

    try {
      this.client = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMembers,
          GatewayIntentBits.GuildMessages,
        ],
      });

      this.setupEventHandlers();
      await this.client.login(config.discord.botToken);
      this.isInitialized = true;
    } catch (err: any) {
      console.warn('⚠️  Discord Bot Login fehlgeschlagen (Server läuft weiter):', err.message);
    }
  }

  private static setupEventHandlers() {
    if (!this.client) return;

    this.client.once('ready', async (c) => {
      console.log(`🤖 Discord-Bot erfolgreich eingeloggt als ${c.user.tag}`);

      // Rich Presence / Status setzen
      c.user.setPresence({
        activities: [
          {
            name: 'the grid. | 50% F1 League',
            type: ActivityType.Watching,
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
            await nextRaceCommand.execute(interaction);
          } else if (commandName === 'standings') {
            await standingsCommand.execute(interaction);
          } else if (commandName === 'standings-setup') {
            await standingsSetupCommand.execute(interaction);
          } else if (commandName === 'checkin-setup') {
            await checkinSetupCommand.execute(interaction);
          } else if (commandName === 'roster-setup') {
            await rosterSetupCommand.execute(interaction);
          } else if (commandName === 'sync-embeds') {
            await syncEmbedsCommand.execute(interaction);
          }
        } else if (interaction.isButton()) {
          await handleCheckinButton(interaction);
        }
      } catch (err: any) {
        console.error('Fehler bei Discord Interaction:', err);
      }
    });
  }

  private static async registerSlashCommands() {
    if (!this.client?.user) return;

    try {
      const rest = new REST({ version: '10' }).setToken(config.discord.botToken);
      const commands = [
        nextRaceCommand.data.toJSON(),
        standingsCommand.data.toJSON(),
        standingsSetupCommand.data.toJSON(),
        checkinSetupCommand.data.toJSON(),
        rosterSetupCommand.data.toJSON(),
        syncEmbedsCommand.data.toJSON(),
      ];

      console.log('🔄 Registriere Discord Slash-Befehle...');

      if (config.discord.guildId && !config.discord.guildId.startsWith('placeholder_')) {
        await rest.put(
          Routes.applicationGuildCommands(this.client.user.id, config.discord.guildId),
          { body: commands }
        );
        console.log(`✅ Slash-Befehle für Server ${config.discord.guildId} registriert.`);
      } else {
        await rest.put(
          Routes.applicationCommands(this.client.user.id),
          { body: commands }
        );
        console.log('✅ Globale Slash-Befehle registriert.');
      }
    } catch (err: any) {
      console.warn('⚠️  Konnte Slash-Commands nicht automatisch registrieren:', err.message);
    }
  }

  /**
   * Universeller Live-Update-Helper:
   * Sucht nach einer bestehenden Nachricht via Channel & SystemSetting Key.
   * Wenn gefunden: editiert sie mit dem neuesten Inhalt.
   * Wenn nicht gefunden oder Kanal gewechselt: sendet eine neue Nachricht und speichert die Message-ID persistent in der Datenbank!
   */
  public static async updateOrCreateMessage(
    channelId: string,
    settingKey: string,
    channelSettingKey: string,
    payload: { embeds: EmbedBuilder[]; components?: any[] }
  ): Promise<boolean> {
    if (!this.client || !this.client.isReady() || !channelId) {
      return false;
    }

    try {
      const channel = await this.client.channels.fetch(channelId);
      if (!channel || !(channel instanceof TextChannel)) {
        console.warn(`[DiscordBot] Kanal ${channelId} wurde nicht gefunden oder ist kein Textkanal.`);
        return false;
      }

      // Prüfen, ob der Kanal sich seit dem letzten Speichern geändert hat
      const dbChannelSetting = await prisma.systemSetting.findUnique({
        where: { key: channelSettingKey },
      });
      const savedChannelId = dbChannelSetting?.value;

      // Gespeicherte Message-ID aus Datenbank abfragen
      const dbSetting = await prisma.systemSetting.findUnique({
        where: { key: settingKey },
      });
      let messageId = dbSetting?.value;

      // Wenn sich der Zielkanal geändert hat (z. B. Standings auf separaten Channel korrigiert):
      if (savedChannelId && savedChannelId !== channelId) {
        console.log(`[DiscordBot] Kanal für ${settingKey} hat sich von ${savedChannelId} zu ${channelId} geändert. Setze Message-ID zurück.`);
        if (messageId) {
          try {
            const oldChannel = await this.client.channels.fetch(savedChannelId);
            if (oldChannel && oldChannel instanceof TextChannel) {
              const oldMsg = await oldChannel.messages.fetch(messageId);
              if (oldMsg) await oldMsg.delete();
            }
          } catch {}
        }
        messageId = undefined;
        await prisma.systemSetting.deleteMany({ where: { key: settingKey } });
      }

      if (messageId) {
        try {
          const message = await channel.messages.fetch(messageId);
          if (message) {
            await message.edit(payload);
            console.log(`✅ [DiscordBot] Live-Embed in #${channel.name} (${channel.id}) erfolgreich aktualisiert (Msg: ${message.id}).`);
            return true;
          }
        } catch (fetchErr: any) {
          console.log(`[DiscordBot] Zuvor gespeicherte Nachricht ${messageId} nicht mehr auffindbar. Erzeuge neue Nachricht...`);
        }
      }

      // Neu senden und IDs in SystemSetting hinterlegen
      const newMsg = await channel.send(payload);
      await prisma.systemSetting.upsert({
        where: { key: settingKey },
        update: { value: newMsg.id },
        create: { key: settingKey, value: newMsg.id },
      });
      await prisma.systemSetting.upsert({
        where: { key: channelSettingKey },
        update: { value: channelId },
        create: { key: channelSettingKey, value: channelId },
      });

      console.log(`✅ [DiscordBot] Neues Live-Embed in #${channel.name} (${channel.id}) gepostet und verknüpft (Msg: ${newMsg.id}).`);
      return true;
    } catch (err: any) {
      console.error(`⚠️ [DiscordBot] Fehler beim Live-Update für ${settingKey} in Kanal ${channelId}:`, err.message);
      return false;
    }
  }

  /**
   * Automatische Aktualisierung des Fahrerfelds & der Team-Cockpits im Kanal 1568279489463586979
   * Ersatzfahrer werden darunter übersichtlich gelistet.
   */
  public static async updateLiveRosterMessage(): Promise<boolean> {
    if (!this.client || !this.client.isReady()) return false;

    try {
      const channelId = config.discord.rosterChannelId || '1568279489463586979';

      // 1. Teams mit ihren verifizierten Fahrern laden
      const teams = await prisma.team.findMany({
        include: {
          drivers: {
            where: { hasDriverRole: true },
            orderBy: [{ role: 'asc' }, { raceNumber: 'asc' }],
          },
        },
        orderBy: { name: 'asc' },
      });

      // 2. Freie Stammfahrer (ohne Team-Vertrag)
      const freeDrivers = await prisma.user.findMany({
        where: {
          hasDriverRole: true,
          teamId: null,
          role: { not: 'RESERVE' },
        },
        orderBy: [{ raceNumber: 'asc' }],
      });

      // 3. Ersatzfahrer (werden darunter angezeigt)
      const reserveDrivers = await prisma.user.findMany({
        where: {
          hasDriverRole: true,
          role: 'RESERVE',
        },
        orderBy: [{ raceNumber: 'asc' }],
      });

      const embed = BotEmbeds.createDriverRosterEmbed(teams, freeDrivers, reserveDrivers);

      return this.updateOrCreateMessage(
        channelId,
        'DISCORD_ROSTER_MESSAGE_ID',
        'DISCORD_ROSTER_CHANNEL_ID',
        { embeds: [embed] }
      );
    } catch (err: any) {
      console.error('⚠️ [DiscordBot] Fehler beim Fahrerfeld-Live-Update:', err.message);
      return false;
    }
  }

  /**
   * Automatische Aktualisierung der Rangliste in #rangliste (1568248876899504289)
   */
  public static async updateLiveStandingsMessage(seasonId?: string): Promise<boolean> {
    if (!this.client || !this.client.isReady()) return false;

    try {
      const channelId = config.discord.standingsChannelId || '1568248876899504289';

      // Wenn keine seasonId angegeben, aktive oder neueste Saison verwenden
      let targetSeasonId = seasonId;
      if (!targetSeasonId) {
        const activeSeason = await prisma.season.findFirst({
          where: { status: { in: ['ACTIVE', 'UPCOMING'] } },
          orderBy: { createdAt: 'desc' },
        });
        if (activeSeason) targetSeasonId = activeSeason.id;
      }

      const { season, driverStandings, teamStandings } = await ResultsService.getSeasonStandings(targetSeasonId);
      if (!season) return false;

      const updatedEmbed = BotEmbeds.createLiveStandingsEmbed(
        season.name,
        driverStandings,
        teamStandings
      );

      return this.updateOrCreateMessage(
        channelId,
        'DISCORD_STANDINGS_MESSAGE_ID',
        'DISCORD_STANDINGS_CHANNEL_ID',
        { embeds: [updatedEmbed] }
      );
    } catch (err: any) {
      console.error('⚠️ [DiscordBot] Fehler beim Ranglisten-Live-Update:', err.message);
      return false;
    }
  }

  /**
   * Automatische Aktualisierung des Check-In Embeds für den anstehenden Renntag (1568248857555501066)
   */
  public static async updateLiveCheckinMessage(raceId?: string): Promise<boolean> {
    if (!this.client || !this.client.isReady()) return false;

    try {
      const channelId = config.discord.checkinChannelId || '1568248857555501066';

      let targetRaceId = raceId;
      if (!targetRaceId) {
        const upcoming = await prisma.race.findFirst({
          where: {
            status: { in: ['UPCOMING', 'ACTIVE', 'SCHEDULED'] },
            date: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
          orderBy: { date: 'asc' },
        });
        if (upcoming) targetRaceId = upcoming.id;
      }

      if (!targetRaceId) return false;

      const race = await prisma.race.findUnique({
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

      if (!race) return false;

      const { embed, components } = BotEmbeds.createRaceCheckinEmbed(race as any);

      return this.updateOrCreateMessage(
        channelId,
        'DISCORD_CHECKIN_MESSAGE_ID',
        'DISCORD_CHECKIN_CHANNEL_ID',
        { embeds: [embed], components }
      );
    } catch (err: any) {
      console.error('⚠️ [DiscordBot] Fehler beim Check-In Live-Update:', err.message);
      return false;
    }
  }

  /**
   * Aktualisiert alle Live-Embeds auf einmal
   */
  public static async refreshAllLiveEmbeds(): Promise<void> {
    console.log('🔄 [DiscordBot] Starte automatischen Abgleich aller Discord Live-Embeds...');
    await Promise.allSettled([
      this.updateLiveRosterMessage(),
      this.updateLiveStandingsMessage(),
      this.updateLiveCheckinMessage(),
    ]);
  }
}

