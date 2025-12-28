import { type Client, type Collection, Events, type Interaction, type Message } from 'discord.js';
import { generateOpenAIText } from '../infrastructure/api/generateText';
import { getConfig } from '../infrastructure/config';
import { createTokenUsageService } from '../service/tokenUsageService';
import { handleTexModalSubmit } from './commands/tex';
import { getLlmModel } from './llmConfig';
import { isTalkThread } from './talkRegistry';
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
          const { tokenDailyLimit } = await getConfig();
          const remaining = await tokenUsageService.getRemainingDailyTokensJst(
            interaction.user.id,
            tokenDailyLimit
          );
          if (remaining <= 0) {
            await interaction.reply({
              content: `トークン上限（${tokenDailyLimit} tokens）に達しちゃったよ。明日までまってね。`,
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

  client.on(Events.MessageCreate, async (message: Message) => {
    try {
      if (message.author.bot) return;
      const channel = message.channel;
      if (!channel.isThread()) return;
      if (!isTalkThread(channel.id)) return;

      const tokenUsageService = createTokenUsageService();
      const { tokenDailyLimit } = await getConfig();
      const remaining = await tokenUsageService.getRemainingDailyTokensJst(
        message.author.id,
        tokenDailyLimit
      );
      if (remaining <= 0) {
        await channel.send({
          content: `<@${message.author.id}> トークン上限（${tokenDailyLimit} tokens）に達しちゃったよ。明日までまってね。`,
        });
        return;
      }

      await channel.sendTyping();

      const fetched = await channel.messages.fetch({ limit: 20 });
      const history = Array.from(fetched.values()).sort((a, b) => a.createdTimestamp - b.createdTimestamp);

      const lines: string[] = [];
      for (const msg of history) {
        const content = msg.content.trim();
        if (!content) continue;
        if (msg.author.bot) {
          lines.push(`Assistant: ${content}`);
        } else {
          lines.push(`User(${msg.author.username}): ${content}`);
        }
      }

      const prompt = lines.join('\n');
      const model = getLlmModel('talk');
      const systemInstruction = `
        あなたは今後、以下の特徴をもつ人物になりきって話してください。

        話し方:
          - 柔らかい口調で、攻撃的な言葉わ使わない
          - 親友のようにタメ口で話す
          - 語彙が豊富で、文脈に合わせて適切な言葉を使う
          - 絵文字は使わない

        性格:
          - 好奇心旺盛な女の子
          - 感情表現が豊か
      `;

      const { text, token } = await generateOpenAIText(model, prompt, 1024, systemInstruction);

      const reply = await channel.send(text);

      await tokenUsageService.recordUsage({
        userId: message.author.id,
        interactionId: message.id,
        command: 'talk',
        model,
        usage: token,
        discordMsgId: reply.id,
      });
    } catch (error) {
      console.error('[ERROR] talk thread message handler failed:', error);
      try {
        const errorChannel = message.channel;
        if (errorChannel && 'send' in errorChannel) {
          await errorChannel.send(
            'ごめんね、このメッセージにはうまく返事ができなかったみたい。しばらくしてからもう一度試してみてね。'
          );
        }
      } catch {}
    }
  });
}
