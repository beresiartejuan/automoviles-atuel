import { createClient } from "@libsql/client";

export const turso = createClient({
    url: import.meta.env.TURSO_DATABASE_URL as string,
    authToken: import.meta.env.TURSO_AUTH_TOKEN as string,
});

type QueryResult<T> = T[];

// Tipar la función
export const executeQuery = async <T>(sql: string, args: any[] = []): Promise<QueryResult<T>> => {
    const { rows } = await turso.execute({ sql, args });
    return rows as T[];
};