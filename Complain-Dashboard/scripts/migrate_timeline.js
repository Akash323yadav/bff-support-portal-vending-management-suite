const mysql = require("mysql2/promise");
require("dotenv").config();

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });

    try {
        console.log("Checking columns...");
        const [columns] = await connection.query("SHOW COLUMNS FROM complaints");
        const columnNames = columns.map(c => c.Field);

        if (!columnNames.includes("inProgressAt")) {
            console.log("Adding inProgressAt column...");
            await connection.query("ALTER TABLE complaints ADD COLUMN inProgressAt DATETIME NULL");
        }

        if (!columnNames.includes("resolvedAt")) {
            console.log("Adding resolvedAt column...");
            await connection.query("ALTER TABLE complaints ADD COLUMN resolvedAt DATETIME NULL");
        }

        console.log("Database migration successful!");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await connection.end();
    }
}

migrate();
