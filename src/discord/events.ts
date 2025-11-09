import { type Client, type Collection, Events, type Interaction, MessageFlags } from 'discord.js';
import { createTokenUsageService } from '../service/tokenUsageService';

import type { SlashCommand } from './types';

type BotClientLike = Client & { commands: Collection<string, SlashCommand> };

/**
 * Register interaction (slash command) event handlers.
 * Keeps ready handler elsewhere; this only wires command interactions.
 */
export function registerInteractionHandlers(client: BotClientLike): void {
  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const name = interaction.commandName;
    const command = client.commands.get(name);
    if (!command) {
      try {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: `あれ？そのコマンドは登録されてないよ。`,
            flags: MessageFlags.Ephemeral,
          });
        }
      } catch (notifyErr) {
        console.error('[ERROR] Failed to notify unknown command:', notifyErr);
      }
      return;
    }

    console.log(`[CMD] ${interaction.user.tag} -> /${name}`);

    // Budget guard: apply only to budgeted commands
    if ((command as SlashCommand).budgeted) {
      try {
        const tokenUsageService = createTokenUsageService();
        const remaining = await tokenUsageService.getRemainingDailyTokensJst(interaction.user.id);
        if (remaining <= 0) {
          await interaction.reply({
            content: `本日のトークン上限（${process.env['TOKEN_DAILY_LIMIT'] ?? 10000} tokens）に達しました。JST 0時にリセットされます。`,
            flags: MessageFlags.Ephemeral,
          });
          return;
        }
      } catch (guardErr) {
        console.error('[ERROR] Budget guard failed:', guardErr);
        try {
          await interaction.reply({
            content: '現在このコマンドは利用できません。しばらくしてからお試しください。',
            flags: MessageFlags.Ephemeral,
          });
        } catch {}
        return;
      }
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`[ERROR] Command /${name} failed:`, error);
      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.followUp({
            content: `コマンド \`/${name}\` の実行に失敗しました。`,
            flags: MessageFlags.Ephemeral,
          });
        } else {
          await interaction.reply({
            content: `コマンド \`/${name}\` の実行に失敗しました。`,
            flags: MessageFlags.Ephemeral,
          });
        }
      } catch (notifyErr) {
        console.error('[ERROR] Failed to send error reply:', notifyErr);
      }
    }
  });
}
