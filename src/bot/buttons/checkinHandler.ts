import { ButtonInteraction } from 'discord.js';
import { prisma } from '../../core/db';
import { AttendanceService } from '../../modules/attendance/attendance.service';
import { SeasonsService } from '../../modules/seasons/seasons.service';
import { BotEmbeds } from '../embeds';
import { AttendanceStatus } from '../../core/types';

export async function handleCheckinButton(interaction: ButtonInteraction) {
  const customId = interaction.customId;

  let status: AttendanceStatus = 'ATTENDING';
  let raceId = '';

  if (customId.startsWith('checkin_attending_')) {
    status = 'ATTENDING';
    raceId = customId.replace('checkin_attending_', '');
  } else if (customId.startsWith('checkin_absent_')) {
    status = 'ABSENT';
    raceId = customId.replace('checkin_absent_', '');
  } else if (customId.startsWith('checkin_reserve_')) {
    status = 'RESERVE';
    raceId = customId.replace('checkin_reserve_', '');
  } else {
    return;
  }

  // User anhand der Discord-ID in der Datenbank suchen
  let user = await prisma.user.findUnique({
    where: { discordId: interaction.user.id },
  });

  // Falls der Nutzer noch nicht in der DB existiert, automatisch als neuer Reserve-Fahrer anlegen
  if (!user) {
    user = await prisma.user.create({
      data: {
        discordId: interaction.user.id,
        discordUsername: interaction.user.globalName || interaction.user.username,
        role: 'RESERVE',
      },
    });
  }

  try {
    // Anwesenheitsstatus in DB aktualisieren
    await AttendanceService.setAttendance(user.id, raceId, status);

    // Rennen und aktualisierte Teilnehmerliste neu abrufen
    const updatedRace = await SeasonsService.getRaceDetails(raceId);
    if (updatedRace) {
      const { embed, components } = BotEmbeds.createRaceCheckinEmbed(updatedRace as any);

      // Ursprüngliche Nachricht im Channel mit aktuellen Zahlen editieren
      await interaction.update({
        embeds: [embed],
        components: components,
      });

      // Bestätigung als Followup (nur für den Klickenden sichtbar)
      const statusTextMap: Record<AttendanceStatus, string> = {
        ATTENDING: '🟢 Deine Teilnahme wurde bestätigt! Wir sehen uns auf der Strecke.',
        ABSENT: '🔴 Du hast dich für das Rennen abgemeldet.',
        RESERVE: '🟡 Dein Status wurde auf "Reserve / Unsicher" gesetzt.',
      };

      await interaction.followUp({
        content: `${statusTextMap[status]} (Fahrer: **${user.gamertag || user.discordUsername}**)`,
        ephemeral: true,
      });
    }
  } catch (err: any) {
    console.error('[Bot Button] Fehler beim Verarbeiten des Check-Ins:', err);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: '⚠️ Es gab einen Fehler beim Speichern deines Anmeldestatus.',
        ephemeral: true,
      });
    }
  }
}

