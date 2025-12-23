import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { type Sql } from "postgres";
import * as schema from "./schema";
export declare const getDatabaseUrl: () => string;
type Client = Sql<{}>;
type Db = PostgresJsDatabase<typeof schema> & {
    $client: Client;
};
export declare const getClient: () => Client;
export declare const getDb: () => Db;
export declare const client: Client;
export declare const db: Db;
export declare const closeConnection: () => Promise<void>;
export default db;
//# sourceMappingURL=connection.d.ts.map