import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { ResultsService } from '../../modules/results/results.service';
import { BotEmbeds } from '../embeds';

export const standingsCommand = {
  data: new SlashCommandBuilder()
    .setName('standings')
    .setDescription('Zeigt die aktuelle Meisterschaftswertung (Fahrer & Konstrukteure)'),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const { season, driverStandings, teamStandings } = await ResultsService.getSeasonStandings();

    if (!season) {
      return interaction.editReply('⚠️ Derzeit ist keine aktive Saison vorhanden.');
    }

    const embed = BotEmbeds.createLiveStandingsEmbed(
      season.name,
      driverStandings,
      teamStandings
    );

    await interaction.editReply({
      embeds: [embed],
    });
  },
};

