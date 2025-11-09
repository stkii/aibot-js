import type { InferSelectModel } from 'drizzle-orm';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import type { TokenUsageTotals } from '../../../model/vo/TokenUsageTotals';
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

  /**
   * Sum total tokens for a user since JST midnight (00:00 Asia/Tokyo) of the current day.
   * Uses SQLite datetime arithmetic to anchor the window in UTC.
   */
  async sumTotalTokensToday(userId: string): Promise<number> {
    const rows = await this.db
      .select({
        sum: sql<number>`COALESCE(SUM(${tokenUsageTable.totalTokens}), 0)`,
      })
      .from(tokenUsageTable)
      .where(
        and(
          eq(tokenUsageTable.userId, userId),
          // JST midnight in UTC: add +9h, start of day, then subtract 9h
          gte(tokenUsageTable.timestamp, sql`datetime('now', '+9 hours', 'start of day', '-9 hours')`)
        )
      );

    return rows[0]?.sum ?? 0;
  }
}

export default TokenUsageDao;
