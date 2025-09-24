// src/db.ts

import 'dotenv/config';
import sql from 'mssql';

let pool: sql.ConnectionPool | null = null;

export async function getPool() {
  if (pool && pool.connected) return pool;

  const config: sql.config = {
    server: (process.env.SQL_SERVER || '').trim(),
    database: process.env.SQL_DATABASE as string,
    user: process.env.SQL_USER as string,
    password: process.env.SQL_PASSWORD as string,
    port: Number(process.env.SQL_PORT || 1433),
    options: {
      encrypt: (process.env.SQL_ENCRYPT ?? 'true') === 'true',
      trustServerCertificate: (process.env.SQL_TRUST_SERVER_CERT ?? 'false') === 'true',
      enableArithAbort: true,
    },
    pool: {
      max: 10,
      min: 1,
      idleTimeoutMillis: 30000,
    },
  };

  pool = await new sql.ConnectionPool(config).connect();
  return pool;
}

export async function query<T = any>(sqlText: string, params?: Record<string, any>) {
  const p = await getPool();
  const request = p.request();
  if (params) {
    for (const [key, val] of Object.entries(params)) {
      request.input(key, val as any);
    }
  }
  const result = await request.query<T>(sqlText);
  return result;
}
