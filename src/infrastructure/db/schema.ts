// Column types: https://orm.drizzle.team/docs/column-types/sqlite

import { sql } from 'drizzle-orm';
import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const tokenUsageTable = sqliteTable('token_usage', {
  id: int('id').notNull().primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull(),
  interactionId: text('interaction_id').notNull().unique(),
  command: text('command').notNull(),
  model: text('model').notNull(),
  inputTokens: int('input_tokens').notNull().default(0),
  outputTokens: int('output_tokens').notNull().default(0),
  totalTokens: int('total_tokens').notNull().default(0),
  timestamp: text('timestamp').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  discordMsgId: text('discord_msg_id').unique(),
});
