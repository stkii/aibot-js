import { type ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';

import type { SlashCommand } from '../types';

const helpEmbed = new EmbedBuilder()
  .setColor(0xe597b2)
  .setTitle('ヘルプ')
  .setDescription('スラッシュコマンド一覧')
  .addFields(
    { name: '**/chat**', value: 'シングルターンのチャットを行います', inline: true },
    { name: '**/talk**', value: 'スレッドを作成し会話を行います', inline: true },
    { name: '\u200B', value: '\u200B' }, // Blank line using a zero-width space
    { name: '**/tex**', value: 'TeXで書いた数式をPNGで出力します', inline: true },
    { name: '**/help**', value: 'ヘルプを表示します', inline: true }
  );

const helpCommand: SlashCommand = {
  data: new SlashCommandBuilder().setName('help').setDescription('Show help for the bot'),
  execute: async (interaction: ChatInputCommandInteraction) => {
    await interaction.reply({ embeds: [helpEmbed] });
  },
};

export default helpCommand;
