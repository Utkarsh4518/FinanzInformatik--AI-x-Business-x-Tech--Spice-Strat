import { Pool, type PoolClient, type QueryResultRow } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __bridgeFlowPgPool: Pool | undefined;
}

function getSslConfig() {
  if (process.env.POSTGRES_SSL_MODE === "disable") {
    return false;
  }

  if (process.env.POSTGRES_SSL_MODE === "require") {
    return { rejectUnauthorized: false };
  }

  return undefined;
}

export function hasPostgresConfig() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function getPostgresPool() {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (!global.__bridgeFlowPgPool) {
    global.__bridgeFlowPgPool = new Pool({
      connectionString: databaseUrl,
      ssl: getSslConfig()
    });
  }

  return global.__bridgeFlowPgPool;
}

export async function queryPostgres<T extends QueryResultRow>(
  text: string,
  values?: unknown[]
) {
  return getPostgresPool().query<T>(text, values);
}

export async function withPostgresClient<T>(
  callback: (client: PoolClient) => Promise<T>
) {
  const client = await getPostgresPool().connect();

  try {
    return await callback(client);
  } finally {
    client.release();
  }
}
