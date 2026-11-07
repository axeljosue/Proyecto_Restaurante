import dotenv from "dotenv";
import { Pool, type PoolConfig } from "pg";

dotenv.config();

function poolConfig(): PoolConfig {
  const connectionString = process.env.DATABASE_URL?.trim();

  if (connectionString) {
    const url = new URL(connectionString);
    url.searchParams.delete("schema");
    return { connectionString: url.toString() };
  }

  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME;
  const port = Number(process.env.DB_PORT ?? 5432);

  if (!host || !user || password === undefined || !database) {
    throw new Error(
      "Configura DATABASE_URL o DB_HOST, DB_USER, DB_PASSWORD, DB_NAME y DB_PORT"
    );
  }

  return { host, user, password, database, port };
}

export const pool = new Pool(poolConfig());

export async function testConnection(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("SELECT 1");
  } finally {
    client.release();
  }
}
