"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCheckinButton = handleCheckinButton;
const db_1 = require("../../core/db");
const attendance_service_1 = require("../../modules/attendance/attendance.service");
const seasons_service_1 = require("../../modules/seasons/seasons.service");
const embeds_1 = require("../embeds");
async function handleCheckinButton(interaction) {
    const customId = interaction.customId;
    let status = 'ATTENDING';
    let raceId = '';
    if (customId.startsWith('checkin_attending_')) {
        status = 'ATTENDING';
        raceId = customId.replace('checkin_attending_', '');
    }
    else if (customId.startsWith('checkin_absent_')) {
        status = 'ABSENT';
        raceId = customId.replace('checkin_absent_', '');
    }
    else if (customId.startsWith('checkin_reserve_')) {
        status = 'RESERVE';
        raceId = customId.replace('checkin_reserve_', '');
    }
    else {
        return;
    }
    // User anhand der Discord-ID in der Datenbank suchen
    let user = await db_1.prisma.user.findUnique({
        where: { discordId: interaction.user.id },
    });
    // Falls der Nutzer noch nicht in der DB existiert, automatisch als neuer Reserve-Fahrer anlegen
    if (!user) {
        user = await db_1.prisma.user.create({
            data: {
                discordId: interaction.user.id,
                discordUsername: interaction.user.globalName || interaction.user.username,
                role: 'RESERVE',
            },
        });
    }
    try {
        // Anwesenheitsstatus in DB aktualisieren
        await attendance_service_1.AttendanceService.setAttendance(user.id, raceId, status);
        // Rennen und aktualisierte Teilnehmerliste neu abrufen
        const updatedRace = await seasons_service_1.SeasonsService.getRaceDetails(raceId);
        if (updatedRace) {
            const { embed, components } = embeds_1.BotEmbeds.createRaceCheckinEmbed(updatedRace);
            // Ursprüngliche Nachricht im Channel mit aktuellen Zahlen editieren
            await interaction.update({
                embeds: [embed],
                components: components,
            });
            // Bestätigung als Followup (nur für den Klickenden sichtbar)
            const statusTextMap = {
                ATTENDING: '🟢 Deine Teilnahme wurde bestätigt! Wir sehen uns auf der Strecke.',
                ABSENT: '🔴 Du hast dich für das Rennen abgemeldet.',
                RESERVE: '🟡 Dein Status wurde auf "Reserve / Unsicher" gesetzt.',
            };
            await interaction.followUp({
                content: `${statusTextMap[status]} (Fahrer: **${user.gamertag || user.discordUsername}**)`,
                ephemeral: true,
            });
        }
    }
    catch (err) {
        console.error('[Bot Button] Fehler beim Verarbeiten des Check-Ins:', err);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: '⚠️ Es gab einen Fehler beim Speichern deines Anmeldestatus.',
                ephemeral: true,
            });
        }
    }
}
