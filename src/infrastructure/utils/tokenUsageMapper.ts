import type { TokenUsageDetailDto, TokenUsageSummaryDto } from '../../model/dto/TokenUsageDto';
import type { TokenUsageRow } from '../db/dao/tokenUsageDao';

export const rowToTokenUsageDetailDto = (row: TokenUsageRow): TokenUsageDetailDto => ({
  interactionId: row.interactionId,
  userId: row.userId,
  command: row.command,
  model: row.model,
  inputTokens: row.inputTokens,
  outputTokens: row.outputTokens,
  totalTokens: row.totalTokens,
  timestamp: row.timestamp,
  discordMsgId: row.discordMsgId ?? null,
});

export const rowToTokenUsageSummaryDto = (row: TokenUsageRow): TokenUsageSummaryDto => ({
  interactionId: row.interactionId,
  command: row.command,
  model: row.model,
  totalTokens: row.totalTokens,
  timestamp: row.timestamp,
});
