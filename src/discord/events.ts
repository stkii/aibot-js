import { type Client, type Collection, Events, type Interaction } from 'discord.js';
import { createTokenUsageService } from '../service/tokenUsageService';
import { handleTexModalSubmit } from './commands/tex';
import type { SlashCommand } from './types';

type BotClientLike = Client & { commands: Collection<string, SlashCommand> };
/**
 * Register interaction (slash command) event handlers.
 * Keeps ready handler elsewhere; this only wires command interactions.
 */
export function registerInteractionHandlers(client: BotClientLike): void {
  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    if (interaction.isModalSubmit()) {
      if (interaction.customId === 'texModal') {
        try {
          await handleTexModalSubmit(interaction);
        } catch (err) {
          console.error('[ERROR] tex modal render failed:', err);
          try {
            if (interaction.deferred || interaction.replied) {
              await interaction.followUp({
                content: 'SVG 生成に失敗しました。式や環境を確認してください。',
              });
            } else {
              await interaction.reply({
                content: 'SVG 生成に失敗しました。式や環境を確認してください。',
              });
            }
          } catch {}
        }
        return;
      }
      return;
    }

    if (interaction.isChatInputCommand()) {
      const name = interaction.commandName;
      const command = client.commands.get(name);
      if (!command) {
        try {
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
              content: `あれ？コマンド${name}は登録されてないよ。`,
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
              content: `トークン上限（${process.env['TOKEN_DAILY_LIMIT'] ?? 10000} tokens）に達しちゃったよ。明日までまってね。`,
            });
            return;
          }
        } catch (guardErr) {
          console.error('[ERROR] Budget guard failed:', guardErr);
          try {
            await interaction.reply({
              content: '現在このコマンドは利用できません。しばらくしてからお試しください。',
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
            });
          } else {
            await interaction.reply({
              content: `コマンド \`/${name}\` の実行に失敗しました。`,
            });
          }
        } catch (notifyErr) {
          console.error('[ERROR] Failed to send error reply:', notifyErr);
        }
      }
    }
  });
}
