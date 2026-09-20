"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const migrate_1 = require("./migrate");
const postgres_1 = __importDefault(require("postgres"));
async function main() {
    console.log("=== Database Migration Runner ===");
    console.log(`Starting at: ${new Date().toISOString()}`);
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.error("DATABASE_URL environment variable is missing");
        process.exit(1);
    }
    // 1. Wait for database
    console.log("Waiting for PostgreSQL to be ready...");
    let retries = 30;
    while (retries > 0) {
        try {
            const sql = (0, postgres_1.default)(dbUrl, { max: 1, connect_timeout: 5 });
            await sql `SELECT 1`; // Simple ping
            await sql.end();
            console.log("PostgreSQL is ready!");
            break;
        }
        catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            console.log(`Waiting... (${errorMessage})`);
            retries--;
            if (retries === 0) {
                console.error("Could not connect to database after multiple retries");
                process.exit(1);
            }
            await new Promise((r) => setTimeout(r, 2000));
        }
    }
    // 2. Create Extensions (using a separate connection to the specific DB)
    try {
        const sql = (0, postgres_1.default)(dbUrl, { max: 1 });
        console.log("Creating extensions...");
        await sql `CREATE EXTENSION IF NOT EXISTS vector;`;
        await sql `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`;
        console.log("Extensions created.");
        await sql.end();
    }
    catch (e) {
        console.warn("Warning: Failed to create extensions (might require superuser)", e);
        // Don't exit, might already exist or not be needed if setup elsewhere
    }
    // 3. Run Drizzle Migrations
    try {
        await (0, migrate_1.migrate)();
    }
    catch (e) {
        console.error("Migration failed:", e);
        process.exit(1);
    }
    console.log("=== Migration script finished ===");
    process.exit(0);
}
main();
//# sourceMappingURL=migrate-entrypoint.js.map