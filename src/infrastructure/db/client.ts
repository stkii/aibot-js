import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';

const url = process.env['DB_FILE_NAME'] ?? 'file:./aibot_default.db';
export const client = createClient({ url });
export const db = drizzle(client);
