import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { SeasonsService } from '../../modules/seasons/seasons.service';
import { BotEmbeds } from '../embeds';

export const nextRaceCommand = {
  data: new SlashCommandBuilder()
    .setName('next-race')
    .setDescription('Zeigt Streckendetails, Startzeit und aktuelle Anmeldeliste des nächsten Rennens'),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const nextRace = await SeasonsService.getNextUpcomingRace();
    if (!nextRace) {
      return interaction.editReply('🏁 Derzeit ist kein anstehendes Rennen im Kalender geplant.');
    }

    const fullRace = await SeasonsService.getRaceDetails(nextRace.id);
    if (!fullRace) {
      return interaction.editReply('⚠️ Renndetails konnten nicht geladen werden.');
    }

    const { embed, components } = BotEmbeds.createRaceCheckinEmbed(fullRace as any);

    await interaction.editReply({
      embeds: [embed],
      components: components,
    });
  },
};

