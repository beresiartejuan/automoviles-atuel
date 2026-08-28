import { createClient } from "@libsql/client";
import { TURSO_DATABASE_URL, TURSO_AUTH_TOKEN } from "astro:env/server";

export const turso = createClient({
    url: TURSO_DATABASE_URL,
    authToken: TURSO_AUTH_TOKEN,
});

type QueryResult<T> = T[];

// Tipar la función
export const executeQuery = async <T>(sql: string, args: any[] = []): Promise<QueryResult<T>> => {
    const { rows } = await turso.execute({ sql, args });
    return rows as T[];
};