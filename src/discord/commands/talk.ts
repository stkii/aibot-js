import {
  ChannelType,
  type ChatInputCommandInteraction,
  SlashCommandBuilder,
  ThreadAutoArchiveDuration,
} from 'discord.js';

import { generateOpenAIText } from '../../infrastructure/api/generateText';
import { createTokenUsageService } from '../../service/tokenUsageService';
import { registerTalkThread } from '../talkRegistry';
import type { SlashCommand } from '../types';

function createThreadTitleFromMessage(message: string): string {
  const trimmed = message.trim();
  const chars = [...trimmed];
  if (chars.length <= 20) return trimmed;
  return chars.slice(0, 20).join('');
}

const talkCommand: SlashCommand = {
  // @ts-expect-error Discord.js builder typing nuance
  data: new SlashCommandBuilder()
    .setName('talk')
    .setDescription('スレッドでマルチターンの会話をします')
    .addStringOption((option) =>
      option.setName('message').setDescription('最初の質問を入力してください').setRequired(true)
    ),
  budgeted: true,
  execute: async (interaction: ChatInputCommandInteraction) => {
    const message = interaction.options.getString('message', true);

    const channel = interaction.channel;
    if (!channel || channel.isDMBased()) {
      await interaction.reply({
        content: 'このコマンドはサーバー内のテキストチャンネルで使ってね。',
        ephemeral: true,
      });
      return;
    }

    if (channel.type !== ChannelType.GuildText && channel.type !== ChannelType.GuildAnnouncement) {
      await interaction.reply({
        content: 'スレッドを作成できるテキストチャンネルで実行してね。',
        ephemeral: true,
      });
      return;
    }

    const model = 'gpt-4o-mini';

    await interaction.deferReply();

    const title = createThreadTitleFromMessage(message);

    const thread = await (await interaction.fetchReply()).startThread({
      name: title,
      autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
    });

    registerTalkThread(thread.id);

    const systemInstruction = `
      あなたは今後、以下の特徴をもつ人物になりきって話してください。

      話し方:
        - 柔らかい口調で、攻撃的な言葉わ使わない
        - 親友のようにタメ口で話す
        - 語彙が豊富で、文脈に合わせて適切な言葉を使う

      性格:
        - 好奇心旺盛な女の子
        - 感情表現が豊か
    `;

    const { text, token } = await generateOpenAIText(model, message, 1024, systemInstruction);

    const reply = await thread.send(text);

    const tokenUsageService = createTokenUsageService();
    await tokenUsageService.recordUsage({
      userId: interaction.user.id,
      interactionId: interaction.id,
      command: interaction.commandName,
      model,
      usage: token,
      discordMsgId: reply.id,
    });

    await interaction.editReply({
      content: 'このスレッドで会話を続けてね！',
    });
  },
};

export default talkCommand;
