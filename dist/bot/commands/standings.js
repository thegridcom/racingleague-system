"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.standingsCommand = void 0;
const discord_js_1 = require("discord.js");
const results_service_1 = require("../../modules/results/results.service");
const embeds_1 = require("../embeds");
exports.standingsCommand = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('standings')
        .setDescription('Zeigt die aktuelle Meisterschaftswertung (Fahrer & Konstrukteure)'),
    async execute(interaction) {
        await interaction.deferReply();
        const { season, driverStandings, teamStandings } = await results_service_1.ResultsService.getSeasonStandings();
        if (!season) {
            return interaction.editReply('⚠️ Derzeit ist keine aktive Saison vorhanden.');
        }
        const embed = embeds_1.BotEmbeds.createLiveStandingsEmbed(season.name, driverStandings, teamStandings);
        await interaction.editReply({
            embeds: [embed],
        });
    },
};
