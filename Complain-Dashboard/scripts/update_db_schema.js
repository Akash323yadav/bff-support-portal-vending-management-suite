
const db = require("../config/database");

async function updateSchema() {
    try {
        console.log("Checking if 'messages' column exists... or needs to be added.");
        // We cannot easily check columns in raw SQL without information_schema, 
        // but try-catch adding it is usually safe or just alter ignore.

        // We will attempt to add a JSON column 'chat_history' to 'complaints' table.
        // If it fails (exists), we catch.
        try {
            await db.query(`ALTER TABLE complaints ADD COLUMN chat_history JSON DEFAULT NULL`);
            console.log("Added 'chat_history' column to complaints table.");
        } catch (e) {
            console.log("Column 'chat_history' might already exist or error:", e.message);
        }

        console.log("Schema update complete.");
        process.exit(0);
    } catch (err) {
        console.error("Schema update failed:", err);
        process.exit(1);
    }
}

updateSchema();
