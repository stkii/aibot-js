export type TokenUsageSummaryDto = {
  interactionId: string;
  command: string;
  model: string;
  totalTokens: number;
  timestamp: string;
};

export type TokenUsageDetailDto = {
  interactionId: string;
  userId: string;
  command: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  timestamp: string;
  discordMsgId?: string | null;
};
