/**
 * PostgreSQL connection pool — Sol Widget
 * Sử dụng connection pooling cho performance
 */

import { Pool, PoolConfig } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

const config: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: 10,                    // max 10 connections (Sol low traffic ban đầu)
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  // SSL config nếu production + remote DB
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined
};

// Singleton pattern — tránh nhiều pool khi hot reload trong dev
export const pool = global.__pgPool || new Pool(config);

if (process.env.NODE_ENV !== 'production') {
  global.__pgPool = pool;
}

// Test connection on startup
pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle client:', err);
});

/**
 * Helper: chạy query với type safety
 */
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<T[]> {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (duration > 200) {
      console.warn(`[DB] Slow query (${duration}ms):`, text.substring(0, 100));
    }
    return res.rows as T[];
  } catch (err) {
    console.error('[DB] Query error:', err);
    console.error('[DB] Query text:', text);
    console.error('[DB] Query params:', params);
    throw err;
  }
}

/**
 * Helper: query 1 row hoặc null
 */
export async function queryOne<T = any>(
  text: string,
  params?: any[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

/**
 * Helper: transaction
 */
export async function transaction<T>(
  fn: (client: any) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Healthcheck
 */
export async function dbHealthcheck(): Promise<{ ok: boolean; error?: string }> {
  try {
    await query('SELECT 1');
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}
