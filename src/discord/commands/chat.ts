import { type ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

import { generateOpenAIText } from '../../infrastructure/api/generateText';
import { createTokenUsageService } from '../../service/tokenUsageService';
import { getLlmModel } from '../llmConfig';
import type { SlashCommand } from '../types';

const chatCommand: SlashCommand = {
  // @ts-expect-error
  data: new SlashCommandBuilder()
    .setName('chat')
    .setDescription('Single-turn chat with the bot')
    .addStringOption((option) =>
      option.setName('message').setDescription('The message to chat with the bot').setRequired(true)
    ),
  budgeted: true,
  execute: async (interaction: ChatInputCommandInteraction) => {
    const message = interaction.options.getString('message');
    if (!message) throw new Error('Empty message');
    const model = getLlmModel('chat');
    // Acknowledge the interaction quickly to avoid timeouts
    await interaction.deferReply();

    const { text, token } = await generateOpenAIText(model, message, 1024);

    // Persist token usage
    const tokenUsageService = createTokenUsageService();
    await tokenUsageService.recordUsage({
      userId: interaction.user.id,
      interactionId: interaction.id,
      command: interaction.commandName,
      model,
      usage: token,
    });

    await interaction.editReply(text);
  },
};

export default chatCommand;
