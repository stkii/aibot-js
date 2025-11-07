import type { InferSelectModel } from 'drizzle-orm';
import { and, desc, eq } from 'drizzle-orm';
import type { TokenUsageTotals } from '../../../model/value/TokenUsageTotals';
import { tokenUsageTable } from '../schema';
import { BaseDao } from './baseDao';

export type TokenUsageRow = InferSelectModel<typeof tokenUsageTable>;

/**
 * DAO for persisting and querying token usage.
 */
class TokenUsageDao extends BaseDao {
  /**
   * Insert a token usage record; ignores duplicates on same interactionId.
   */
  async recordUsage({
    userId,
    interactionId,
    command,
    model,
    tokens,
    discordMsgId,
  }: {
    userId: string;
    interactionId: string;
    command: string;
    model: string;
    tokens: TokenUsageTotals;
    discordMsgId?: string;
  }): Promise<void> {
    const { inputTokens, outputTokens, totalTokens } = tokens;

    // Unique constraint on interactionId
    await this.db
      .insert(tokenUsageTable)
      .values({
        userId,
        interactionId,
        discordMsgId,
        command,
        model,
        inputTokens,
        outputTokens,
        totalTokens,
      })
      .onConflictDoNothing();
  }

  /** Get a single record by interaction id. */
  async getByInteractionId(interactionId: string): Promise<TokenUsageRow | null> {
    const rows = await this.db
      .select()
      .from(tokenUsageTable)
      .where(eq(tokenUsageTable.interactionId, interactionId))
      .limit(1);
    return rows[0] ?? null;
  }

  /** List recent usage for a user, newest first. */
  async listRecentByUser(userId: string, limit = 20): Promise<TokenUsageRow[]> {
    return this.db
      .select()
      .from(tokenUsageTable)
      .where(eq(tokenUsageTable.userId, userId))
      .orderBy(desc(tokenUsageTable.id))
      .limit(limit);
  }

  /**
   * Get a specific record by Discord message id (handy for edits/updates).
   */
  async getByDiscordMsgId(userId: string, discordMsgId: string): Promise<TokenUsageRow | null> {
    const rows = await this.db
      .select()
      .from(tokenUsageTable)
      .where(and(eq(tokenUsageTable.userId, userId), eq(tokenUsageTable.discordMsgId, discordMsgId)))
      .limit(1);
    return rows[0] ?? null;
  }
}

export default TokenUsageDao;
