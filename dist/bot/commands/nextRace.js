"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nextRaceCommand = void 0;
const discord_js_1 = require("discord.js");
const seasons_service_1 = require("../../modules/seasons/seasons.service");
const embeds_1 = require("../embeds");
exports.nextRaceCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('next-race')
        .setDescription('Zeigt Streckendetails, Startzeit und aktuelle Anmeldeliste des nächsten Rennens'),
    async execute(interaction) {
        await interaction.deferReply();
        const nextRace = await seasons_service_1.SeasonsService.getNextUpcomingRace();
        if (!nextRace) {
            return interaction.editReply('🏁 Derzeit ist kein anstehendes Rennen im Kalender geplant.');
        }
        const fullRace = await seasons_service_1.SeasonsService.getRaceDetails(nextRace.id);
        if (!fullRace) {
            return interaction.editReply('⚠️ Renndetails konnten nicht geladen werden.');
        }
        const { embed, components } = embeds_1.BotEmbeds.createRaceCheckinEmbed(fullRace);
        await interaction.editReply({
            embeds: [embed],
            components: components,
        });
    },
};
