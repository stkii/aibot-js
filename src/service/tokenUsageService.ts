import TokenUsageDao from '../infrastructure/db/dao/tokenUsageDao';
import {
  rowToTokenUsageDetailDto,
  rowToTokenUsageSummaryDto,
} from '../infrastructure/utils/tokenUsageMapper';
import { toTokenUsageTotals } from '../infrastructure/utils/usageMapper';
import type { TokenUsageDetailDto, TokenUsageSummaryDto } from '../model/dto/TokenUsageDto';
import type { TokenUsageRecordParams } from '../types';

export function createTokenUsageService(dao: TokenUsageDao = new TokenUsageDao()) {
  return {
    async recordUsage(params: TokenUsageRecordParams): Promise<void> {
      const tokens = toTokenUsageTotals(params.usage);
      await dao.recordUsage({
        userId: params.userId,
        interactionId: params.interactionId,
        command: params.command,
        model: params.model,
        tokens,
        ...(params.discordMsgId !== undefined ? { discordMsgId: params.discordMsgId } : {}),
      });
    },

    async getByInteractionId(interactionId: string): Promise<TokenUsageDetailDto | null> {
      const row = await dao.getByInteractionId(interactionId);
      return row ? rowToTokenUsageDetailDto(row) : null;
    },

    async getByDiscordMsgId(userId: string, discordMsgId: string): Promise<TokenUsageDetailDto | null> {
      const row = await dao.getByDiscordMsgId(userId, discordMsgId);
      return row ? rowToTokenUsageDetailDto(row) : null;
    },

    async listRecentByUser(userId: string, limit = 20): Promise<TokenUsageSummaryDto[]> {
      const rows = await dao.listRecentByUser(userId, limit);
      return rows.map(rowToTokenUsageSummaryDto);
    },
  } as const;
}
