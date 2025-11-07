import { type Client, type Collection, Events, type Interaction, MessageFlags } from 'discord.js';

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
