import { type ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';

import type { SlashCommand } from '../types';

const helpEmbed = new EmbedBuilder()
  .setColor(0xe597b2)
  .setTitle('ヘルプ')
  .setDescription('スラッシュコマンドの一覧です')
  .addFields(
    { name: '**/chat**', value: 'Single-turn chat with the bot', inline: true },
    { name: '**/command2**', value: 'Description', inline: true },
    { name: '**/command3**', value: 'Description', inline: true },
    { name: '\u200B', value: '\u200B' }, // Blank line using a zero-width space
    { name: '**/help**', value: 'Show help for the bot', inline: true },
    { name: '**/help**', value: 'Show help for the bot', inline: true }
  );

const helpCommand: SlashCommand = {
  data: new SlashCommandBuilder().setName('help').setDescription('Show help for the bot'),
  execute: async (interaction: ChatInputCommandInteraction) => {
    await interaction.reply({ embeds: [helpEmbed] });
  },
};

export default helpCommand;
