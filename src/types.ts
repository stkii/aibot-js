import type { LanguageModelUsage } from 'ai';

export type TokenUsageRecordParams = {
  userId: string;
  interactionId: string;
  command: string;
  model: string;
  usage: LanguageModelUsage;
  discordMsgId?: string;
};
