import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';

// Create a single DB client/connection per process.
const url = process.env['DB_FILE_NAME'] ?? 'file:./aibot_default.db';
const client = createClient({ url });
const db = drizzle(client);

export abstract class BaseDao {
  protected readonly db = db;
}
