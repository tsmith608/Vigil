import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { parse } from 'pg-connection-string';

const connectionString = process.env.DATABASE_URL;
const config = (connectionString ? parse(connectionString) : {}) as any;

export const pool = new Pool({
  ...config,
  host: config.host || process.env.DB_HOST || 'aws-1-us-east-1.pooler.supabase.com',
  user: config.user || process.env.DB_USER || 'postgres.cdwjkcvnpezahgxmgylr',
  database: config.database || process.env.DB_NAME || 'postgres',
  password: config.password || process.env.DB_PASSWORD,
  port: Number(config.port) || Number(process.env.DB_PORT) || 6543,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10,
});

export const db = drizzle(pool);
