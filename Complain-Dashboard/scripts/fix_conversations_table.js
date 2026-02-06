
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require("../config/database");

async function fixTables() {
    try {
        console.log("Checking if 'conversations' table exists...");

        try {
            await db.query("SELECT 1 FROM conversations LIMIT 1");
            console.log("'conversations' table exists.");
        } catch (e) {
            console.log("'conversations' table MISSING. Checking 'Conversation'...");
            try {
                await db.query("SELECT 1 FROM Conversation LIMIT 1");
                console.log("'Conversation' table exists. Renaming to 'conversations'...");
                await db.query("RENAME TABLE Conversation TO conversations");
                console.log("Renamed.");
            } catch (e2) {
                console.log("Creating 'conversations' table...");
                await db.query(`
                CREATE TABLE IF NOT EXISTS conversations (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    mobile VARCHAR(255) UNIQUE NOT NULL,
                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
                console.log("Created 'conversations' table.");
            }
        }

        process.exit(0);
    } catch (err) {
        console.error("Fix failed:", err);
        process.exit(1);
    }
}

fixTables();
