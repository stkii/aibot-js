import type { SlashCommandBuilder } from 'discord.js';

export interface SlashCommand {
  data: SlashCommandBuilder;
  // biome-ignore lint/suspicious/noExplicitAny: Different commands may require different interaction types.
  execute: (interaction: any) => Promise<void>;
}
