import fs from 'node:fs/promises';
import path from 'node:path';

import type { ResultSet } from '@libsql/client';

import { client } from '../infrastructure/db/client';

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const ATTACH_ALIAS = 'daily_archive';
const OUTPUT_DIR = process.env['TOKEN_USAGE_DAILY_ARCHIVE_DIR'] ?? path.resolve('storage');

type AggregationWindow = {
  usageDate: string;
  filePath: string;
};

export async function runDailyTokenAggregation(referenceDate = new Date()): Promise<void> {
  const { usageDate, filePath } = await prepareAggregationWindow(referenceDate);
  let attached = false;

  try {
    await attachArchiveDb(filePath);
    attached = true;
    await ensureArchiveTable();
    await overwriteExistingDay(usageDate);
    const result = await insertAggregatedRows(usageDate);
    const affected = result.rowsAffected ?? 0;
    console.log(
      `[dailyTokenAggregation] Stored ${affected} aggregated rows into ${path.relative(
        process.cwd(),
        filePath
      )} for usage date ${usageDate}`
    );
  } finally {
    if (attached) {
      await detachArchiveDb();
    }
  }
}

export function scheduleDailyTokenAggregation(): void {
  const scheduleNext = (): void => {
    const delay = getMsUntilNextJstMidnight();
    setTimeout(async () => {
      try {
        await runDailyTokenAggregation();
      } catch (error) {
        console.error('[dailyTokenAggregation] Failed to write daily totals:', error);
      } finally {
        scheduleNext();
      }
    }, delay).unref?.();
  };

  console.log('[dailyTokenAggregation] Scheduler armed; next run in', getMsUntilNextJstMidnight(), 'ms');
  scheduleNext();
}

async function prepareAggregationWindow(referenceDate: Date): Promise<AggregationWindow> {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const usageDay = getPreviousJstDate(referenceDate);
  const usageDate = formatDate(usageDay);
  const filePath = path.join(OUTPUT_DIR, `${usageDate.replaceAll('-', '')}.db`);

  return { usageDate, filePath };
}

function getPreviousJstDate(referenceDate: Date): Date {
  const jstDate = new Date(referenceDate.getTime() + JST_OFFSET_MS);
  jstDate.setUTCHours(0, 0, 0, 0);
  jstDate.setUTCDate(jstDate.getUTCDate() - 1);
  return jstDate;
}

function formatDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getMsUntilNextJstMidnight(referenceDate = new Date()): number {
  const jstNow = new Date(referenceDate.getTime() + JST_OFFSET_MS);
  const nextMidnight = new Date(jstNow);
  nextMidnight.setUTCHours(0, 0, 0, 0);
  nextMidnight.setUTCDate(nextMidnight.getUTCDate() + 1);
  const nextMidnightUtc = new Date(nextMidnight.getTime() - JST_OFFSET_MS);
  return Math.max(0, nextMidnightUtc.getTime() - referenceDate.getTime());
}

async function ensureArchiveTable(): Promise<void> {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS ${ATTACH_ALIAS}.daily_totals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usage_date TEXT NOT NULL,
      user_id TEXT NOT NULL,
      input_tokens INTEGER NOT NULL DEFAULT 0,
      output_tokens INTEGER NOT NULL DEFAULT 0,
      total_tokens INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(usage_date, user_id)
    )
  `);
}

async function overwriteExistingDay(usageDate: string): Promise<void> {
  await client.execute({
    sql: `DELETE FROM ${ATTACH_ALIAS}.daily_totals WHERE usage_date = ?`,
    args: [usageDate],
  });
}

async function insertAggregatedRows(usageDate: string): Promise<ResultSet> {
  return client.execute({
    sql: `
      INSERT INTO ${ATTACH_ALIAS}.daily_totals (
        usage_date,
        user_id,
        input_tokens,
        output_tokens,
        total_tokens
      )
      SELECT
        ? as usage_date,
        user_id,
        COALESCE(SUM(input_tokens), 0) as input_tokens,
        COALESCE(SUM(output_tokens), 0) as output_tokens,
        COALESCE(SUM(total_tokens), 0) as total_tokens
      FROM token_usage
      WHERE
        timestamp >= datetime(?, '-9 hours')
        AND timestamp < datetime(?, '-9 hours', '+1 day')
      GROUP BY user_id
    `,
    args: [usageDate, usageDate, usageDate],
  });
}

async function attachArchiveDb(filePath: string): Promise<void> {
  await client.execute(`ATTACH DATABASE '${escapeSqlLiteral(filePath)}' AS ${ATTACH_ALIAS}`);
}

async function detachArchiveDb(): Promise<void> {
  await client.execute(`DETACH DATABASE ${ATTACH_ALIAS}`);
}

function escapeSqlLiteral(value: string): string {
  return value.replaceAll("'", "''");
}
