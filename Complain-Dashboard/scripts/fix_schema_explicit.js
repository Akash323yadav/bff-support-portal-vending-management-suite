
require("dotenv").config({ path: "../.env" }); // Go up one level to find .env as script is in /scripts
// If running from root, path should be just .env, let's try reading it directly
if (!process.env.DB_HOST) {
    require("dotenv").config(); // try current dir as fallback
}

const db = require("../config/database");

async function fixSchema() {
    try {
        console.log("Connecting to DB:", process.env.DB_HOST, process.env.DB_NAME);

        // Check if column exists
        const [columns] = await db.query(`SHOW COLUMNS FROM complaints LIKE 'chat_history'`);

        if (columns.length > 0) {
            console.log("Column 'chat_history' ALREADY EXISTS.");
            process.exit(0);
        }

        console.log("Adding column 'chat_history'...");
        await db.query(`ALTER TABLE complaints ADD COLUMN chat_history JSON DEFAULT NULL`);
        console.log("Column 'chat_history' ADDED SUCCESSFULLY.");

        process.exit(0);
    } catch (err) {
        console.error("Schema fix FAILED:", err);
        process.exit(1);
    }
}

fixSchema();
