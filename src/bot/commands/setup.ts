import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { ResultsService } from '../../modules/results/results.service';
import { SeasonsService } from '../../modules/seasons/seasons.service';
import { BotEmbeds } from '../embeds';
import { prisma } from '../../core/db';

export const standingsSetupCommand = {
  data: new SlashCommandBuilder()
    .setName('standings-setup')
    .setDescription('Postet die offizielle Live-Rangliste in diesen Kanal und registriert sie für Auto-Updates')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const { season, driverStandings, teamStandings } = await ResultsService.getSeasonStandings();
    if (!season) {
      return interaction.editReply('⚠️ Keine aktive Saison gefunden. Bitte lege zuerst eine Saison im Web-Admin-Panel an.');
    }

    const embed = BotEmbeds.createLiveStandingsEmbed(season.name, driverStandings, teamStandings);

    // Nachricht in den aktuellen Kanal senden
    const channel = interaction.channel;
    if (!channel || !('send' in channel)) {
      return interaction.editReply('⚠️ Kanal ungültig oder Bot hat keine Schreibrechte.');
    }

    const message = await channel.send({ embeds: [embed] });

    // ID der Nachricht in den Systemeinstellungen speichern, damit spätere Ergebnis-Updates diese editieren können
    await prisma.systemSetting.upsert({
      where: { key: 'DISCORD_STANDINGS_CHANNEL_ID' },
      update: { value: message.channelId },
      create: { key: 'DISCORD_STANDINGS_CHANNEL_ID', value: message.channelId },
    });

    await prisma.systemSetting.upsert({
      where: { key: 'DISCORD_STANDINGS_MESSAGE_ID' },
      update: { value: message.id },
      create: { key: 'DISCORD_STANDINGS_MESSAGE_ID', value: message.id },
    });

    await interaction.editReply(`✅ Live-Rangliste erfolgreich erstellt! Nachricht-ID: \`${message.id}\` in Kanal <#${message.channelId}>. Zukünftige Rennergebnisse aktualisieren diese Nachricht automatisch.`);
  },
};

export const checkinSetupCommand = {
  data: new SlashCommandBuilder()
    .setName('checkin-setup')
    .setDescription('Postet ein interaktives Renntag-Check-In Embed für das anstehende Rennen')
    .addIntegerOption(opt =>
      opt.setName('runde')
        .setDescription('Optionale Rundennummer (Standard: Nächstes anstehendes Rennen)')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const roundNumber = interaction.options.getInteger('runde');
    let race;

    if (roundNumber) {
      race = await prisma.race.findFirst({
        where: { roundNumber },
        include: {
          season: true,
          attendances: {
            include: { user: { include: { team: true } } },
          },
        },
      });
    } else {
      const next = await SeasonsService.getNextUpcomingRace();
      if (next) {
        race = await SeasonsService.getRaceDetails(next.id);
      }
    }

    if (!race) {
      return interaction.editReply('⚠️ Kein passendes Rennen im Rennkalender gefunden.');
    }

    const channel = interaction.channel;
    if (!channel || !('send' in channel)) {
      return interaction.editReply('⚠️ Ungültiger Kanal.');
    }

    const { embed, components } = BotEmbeds.createRaceCheckinEmbed(race as any);
    const sentMsg = await channel.send({ embeds: [embed], components });

    await interaction.editReply(`✅ Check-In Embed für **Runde ${race.roundNumber}: ${race.trackName}** erfolgreich in <#${channel.id}> gepostet!`);
  },
};

export const rosterSetupCommand = {
  data: new SlashCommandBuilder()
    .setName('roster-setup')
    .setDescription('Postet die offizielle Fahrer- und Teamübersicht in diesen Kanal')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const channel = interaction.channel;
    if (!channel || !('send' in channel)) {
      return interaction.editReply('⚠️ Ungültiger Kanal oder keine Schreibrechte.');
    }

    const teams = await prisma.team.findMany({
      include: {
        drivers: {
          where: { hasDriverRole: true },
          orderBy: [{ role: 'asc' }, { raceNumber: 'asc' }],
        },
      },
      orderBy: { name: 'asc' },
    });

    const freeDrivers = await prisma.user.findMany({
      where: {
        hasDriverRole: true,
        teamId: null,
        role: { not: 'RESERVE' },
      },
      orderBy: [{ raceNumber: 'asc' }],
    });

    const reserveDrivers = await prisma.user.findMany({
      where: {
        hasDriverRole: true,
        role: 'RESERVE',
      },
      orderBy: [{ raceNumber: 'asc' }],
    });

    const embed = BotEmbeds.createDriverRosterEmbed(teams, freeDrivers, reserveDrivers);
    const message = await channel.send({ embeds: [embed] });

    await prisma.systemSetting.upsert({
      where: { key: 'DISCORD_ROSTER_CHANNEL_ID' },
      update: { value: message.channelId },
      create: { key: 'DISCORD_ROSTER_CHANNEL_ID', value: message.channelId },
    });

    await prisma.systemSetting.upsert({
      where: { key: 'DISCORD_ROSTER_MESSAGE_ID' },
      update: { value: message.id },
      create: { key: 'DISCORD_ROSTER_MESSAGE_ID', value: message.id },
    });

    await interaction.editReply(`✅ Offizielles Fahrerfeld & Teams erfolgreich in <#${channel.id}> bereitgestellt (Nachricht: \`${message.id}\`)! Zukünftige Änderungen werden live synchronisiert.`);
  },
};

export const syncEmbedsCommand = {
  data: new SlashCommandBuilder()
    .setName('sync-embeds')
    .setDescription('Aktualisiert alle konfigurierten Live-Embeds (Rangliste, Check-In, Fahrerfeld) sofort')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    // Dynamic import to avoid circular dependency
    const { DiscordBot } = await import('../bot');
    await DiscordBot.refreshAllLiveEmbeds();

    await interaction.editReply('✅ Alle Discord Live-Embeds (Fahrerfeld, Rangliste, Renntag Check-In) wurden erfolgreich synchronisiert!');
  },
};

