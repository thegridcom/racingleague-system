import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { ResultsService, DriverStanding, TeamStanding } from '../modules/results/results.service';
import { config } from '../core/config';
import { getPlatformBadge } from '../core/types';
import { Race, Attendance, User, Team } from '@prisma/client';

export class BotEmbeds {
  /**
   * Erzeugt das persistente Live-Embed für das Fahrerfeld & Teams (#fahrerfeld)
   */
  public static createDriverRosterEmbed(
    teams: Array<Team & { drivers: User[] }>,
    freeDrivers: User[],
    reserveDrivers: User[]
  ): EmbedBuilder {
    const embed = new EmbedBuilder()
      .setColor(0xDE382B) // the grid. Racing Rot
      .setTitle('🏎️ the grid. RACING LEAGUE | STARTAUFSTELLUNG & TEAMS 2026')
      .setDescription(
        `*Offizielle Teamaufstellung und Cockpit-Belegung der Saison 2026*\n\n` +
        `> **Modus:** 50% Renndistanz · Crossplay-Lobbies · F1 2026 Regulations\n` +
        `> **Plattform:** [racing.thegridcom.org](https://thegridcom.org)\n`
      )
      .setTimestamp(new Date());

    // Helper zur Formatierung einer Fahrer-Zeile (Ausschließlich Name, Startnummer und Discord-Erwähnung - keine EA-ID oder Plattform)
    const formatDriver = (d: User) => {
      const num = d.raceNumber ? `**#${d.raceNumber}** ` : '';
      const name = `**${d.platformUsername || d.gamertag || d.discordUsername}**`;
      const mention = `<@${d.discordId}>`;
      return `• ${num}${name} (${mention})`;
    };

    // 1. Teams mit Cockpits
    const teamEmojiMap: Record<string, string> = {
      AUD: '⬛',
      CAD: '🟡',
      FER: '🔴',
      RBR: '🔵',
      MCL: '🟠',
      MER: '🟢',
      AST: '🌲',
      ALP: '🔷',
      WIL: '🔷',
      HAA: '⚪',
      VCARB: '🔵',
    };

    for (const team of teams) {
      const emoji = teamEmojiMap[team.shortCode] || '🏎️';
      const teamTitle = `${emoji} ${team.name} (${team.shortCode})`;

      const mainDrivers = team.drivers.filter((d) => d.role !== 'RESERVE');

      let lines: string[] = [];
      if (mainDrivers.length === 0) {
        lines.push('• *Cockpit 1 & 2 unbesetzt*');
      } else {
        mainDrivers.slice(0, 2).forEach((d) => lines.push(formatDriver(d)));
        if (mainDrivers.length === 1) {
          lines.push('• *Cockpit 2 unbesetzt*');
        }
      }

      embed.addFields({
        name: teamTitle,
        value: lines.join('\n').slice(0, 1024),
        inline: false,
      });
    }

    // 2. Freie Stammfahrer (ohne Team-Zuordnung)
    if (freeDrivers.length > 0) {
      const freeLines = freeDrivers.map((d) => formatDriver(d)).join('\n');
      embed.addFields({
        name: '🏁 Freie Fahrer (ohne Team-Vertrag)',
        value: freeLines.slice(0, 1024),
        inline: false,
      });
    }

    // 3. Ersatzfahrer (werden darunter angezeigt - Anforderung!)
    let reserveContent = '*Derzeit keine Ersatzfahrer eingetragen.*';
    if (reserveDrivers.length > 0) {
      reserveContent = reserveDrivers.map((d) => formatDriver(d)).join('\n');
    }

    embed.addFields({
      name: '🔄 Ersatzfahrer (Reserve)',
      value: reserveContent.slice(0, 1024),
      inline: false,
    });

    embed.setFooter({
      text: 'the grid. - racing league | Live synchronisiert • Automatische Updates bei Änderungen',
    });

    return embed;
  }

  /**
   * Erzeugt das persistente Live-Ranglisten-Embed für #rangliste
   */
  public static createLiveStandingsEmbed(
    seasonName: string,
    driverStandings: DriverStanding[],
    teamStandings: TeamStanding[]
  ): EmbedBuilder {
    const embed = new EmbedBuilder()
      .setColor(0xDE382B) // the grid. Racing Rot
      .setTitle(`🏁 LIVE-RANGLISTE: ${seasonName.toUpperCase()}`)
      .setDescription(
        `*Offizielle Meisterschaftswertung von "the grid. - racing league"*\n\n` +
        `> **Disclaimer:** ${config.disclaimer.slice(0, 200)}...`
      )
      .setTimestamp(new Date());

    // 1. Fahrerwertung Formatierung (Saubere Textblock-Tabelle)
    let driverText = '```text\n';
    driverText += 'POS  #   FAHRER              TEAM         PTS  W  P\n';
    driverText += '--------------------------------------------------\n';

    if (driverStandings.length === 0) {
      driverText += 'Noch keine Rennergebnisse eingetragen.\n';
    } else {
      const topDrivers = driverStandings.slice(0, 15);
      for (const d of topDrivers) {
        const posStr = String(d.position).padStart(2, ' ');
        const numStr = (d.raceNumber ? '#' + d.raceNumber : ' -').padEnd(3, ' ');
        const nameStr = (d.driverName.length > 18 ? d.driverName.slice(0, 17) + '…' : d.driverName).padEnd(18, ' ');
        const teamStr = (d.teamName.length > 12 ? d.teamName.slice(0, 11) + '…' : d.teamName).padEnd(12, ' ');
        const ptsStr = String(d.points).padStart(4, ' ');
        const winsStr = String(d.wins).padStart(2, ' ');
        const podStr = String(d.podiums).padStart(2, ' ');

        driverText += `${posStr}  ${numStr} ${nameStr} ${teamStr} ${ptsStr} ${winsStr} ${podStr}\n`;
      }
    }
    driverText += '```';
    embed.addFields({ name: '🏆 Fahrer-Weltmeisterschaft', value: driverText, inline: false });

    // 2. Teamwertung Formatierung
    let teamText = '```text\n';
    teamText += 'POS  TEAM                         PTS   SIEGE  PODIEN\n';
    teamText += '-----------------------------------------------------\n';

    if (teamStandings.length === 0) {
      teamText += 'Noch keine Team-Punkte.\n';
    } else {
      for (const t of teamStandings.slice(0, 10)) {
        const posStr = String(t.position).padStart(2, ' ');
        const nameStr = (t.teamName.length > 25 ? t.teamName.slice(0, 24) + '…' : t.teamName).padEnd(26, ' ');
        const ptsStr = String(t.points).padStart(4, ' ');
        const winsStr = String(t.wins).padStart(6, ' ');
        const podStr = String(t.podiums).padStart(7, ' ');

        teamText += `${posStr}   ${nameStr} ${ptsStr}  ${winsStr} ${podStr}\n`;
      }
    }
    teamText += '```';
    embed.addFields({ name: '🏎️ Konstrukteurs-Weltmeisterschaft', value: teamText, inline: false });

    embed.setFooter({
      text: 'the grid. - racing league | Automatisch synchronisiert mit Web-Dashboard',
    });

    return embed;
  }

  /**
   * Erzeugt das Check-In Embed für einen bevorstehenden Renntag
   */
  public static createRaceCheckinEmbed(
    race: Race & {
      season: any;
      attendances: Array<Attendance & { user: User & { team: Team | null } }>;
    }
  ): { embed: EmbedBuilder; components: ActionRowBuilder<ButtonBuilder>[] } {
    const attending = race.attendances.filter((a) => a.status === 'ATTENDING');
    const absent = race.attendances.filter((a) => a.status === 'ABSENT');
    const reserve = race.attendances.filter((a) => a.status === 'RESERVE');

    const formattedDate = new Date(race.date).toLocaleString('de-DE', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Berlin',
    });

    const specs = (race.lengthKm && race.laps)
      ? `**Format:** 50% Renndistanz (${race.laps} Runden · ${race.lengthKm} km Streckenlänge)\n`
      : `**Format:** 50% Renndistanz\n`;

    const embed = new EmbedBuilder()
      .setColor(0xDE382B)
      .setTitle(`${race.flagEmoji} RENNDRUCK CHECK-IN: Runde ${race.roundNumber} - ${race.trackName}`)
      .setDescription(
        `**Saison:** ${race.season.name}\n` +
        `**Land:** ${race.country} ${race.flagEmoji}\n` +
        specs +
        `**Startzeit:** ${formattedDate} Uhr\n\n` +
        `Bitte melde dich bis spätestens 2 Stunden vor Rennbeginn über die Buttons unten verbindlich an oder ab.`
      )
      .addFields(
        {
          name: `🟢 Zugesagt (${attending.length}/20)`,
          value: attending.length > 0
            ? attending.map((a) => `• #${a.user.raceNumber ?? '-'} **${a.user.gamertag || a.user.discordUsername}** (${a.user.team?.shortCode || 'Privat'})`).join('\n').slice(0, 1024)
            : '*Noch keine Zusagen*',
          inline: true,
        },
        {
          name: `🔴 Abgemeldet (${absent.length})`,
          value: absent.length > 0
            ? absent.map((a) => `• **${a.user.gamertag || a.user.discordUsername}**`).join('\n').slice(0, 1024)
            : '*Keine Abmeldungen*',
          inline: true,
        },
        {
          name: `🟡 Reserve / Unsicher (${reserve.length})`,
          value: reserve.length > 0
            ? reserve.map((a) => `• **${a.user.gamertag || a.user.discordUsername}**`).join('\n').slice(0, 1024)
            : '*Keine Reserves*',
          inline: true,
        }
      )
      .setFooter({
        text: 'the grid. - racing league | Klicke auf einen Button, um deinen Status zu setzen',
      })
      .setTimestamp(new Date());

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`checkin_attending_${race.id}`)
        .setLabel(`🟢 Bin dabei (${attending.length})`)
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`checkin_absent_${race.id}`)
        .setLabel(`🔴 Kann nicht (${absent.length})`)
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`checkin_reserve_${race.id}`)
        .setLabel(`🟡 Reserve / Unsicher (${reserve.length})`)
        .setStyle(ButtonStyle.Secondary)
    );

    return { embed, components: [row] };
  }
}

