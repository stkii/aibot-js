import { type ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

import { generateOpenAIText } from '../../infrastructure/api/generateText';
import type { SlashCommand } from '../types';

const chatCommand: SlashCommand = {
  // @ts-expect-error
  data: new SlashCommandBuilder()
    .setName('chat')
    .setDescription('Single-turn chat with the bot')
    .addStringOption((option) =>
      option.setName('message').setDescription('The message to chat with the bot').setRequired(true)
    ),
  execute: async (interaction: ChatInputCommandInteraction) => {
    const message = interaction.options.getString('message');
    if (!message) throw new Error('Empty message');
    const { text } = await generateOpenAIText('gpt-4o', message, 1024);
    await interaction.reply(text);
  },
};

export default chatCommand;
