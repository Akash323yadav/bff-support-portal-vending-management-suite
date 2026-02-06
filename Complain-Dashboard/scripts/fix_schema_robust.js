
const path = require('path');
const dotenv = require('dotenv');

// Explicitly load .env from parent dir
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

console.log("ENV LOADED FROM:", envPath);
console.log("DB_HOST:", process.env.DB_HOST);

const db = require("../config/database");

async function run() {
    try {
        console.log("Checking schema...");

        // Use raw query to check columns
        const [rows] = await db.query("SHOW COLUMNS FROM complaints LIKE 'chat_history'");
        console.log("Existing columns matching 'chat_history':", rows.length);

        if (rows.length === 0) {
            console.log("Adding column...");
            await db.query("ALTER TABLE complaints ADD COLUMN chat_history JSON DEFAULT NULL");
            console.log("Column added.");
        } else {
            console.log("Column already present.");
        }

        process.exit(0);
    } catch (e) {
        console.error("ERROR:", e);
        process.exit(1);
    }
}

run();
