
const path = require('path');
const dotenv = require('dotenv');

// Explicitly load .env from parent dir
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

const db = require("../config/database");

async function run() {
    try {
        console.log("Checking schema for 'chatHistory'...");

        // Use raw query to check columns: Use case-insensitive LIKE or explicit match
        const [rows] = await db.query("SHOW COLUMNS FROM complaints LIKE 'chatHistory'");
        console.log("Existing columns matching 'chatHistory':", rows.length);

        if (rows.length > 0) {
            console.log("Column 'chatHistory' IS PRESENT.");
            console.log("Type:", rows[0].Type);
        } else {
            // Check if maybe snake_case exists?
            const [rows2] = await db.query("SHOW COLUMNS FROM complaints LIKE 'chat_history'");
            if (rows2.length > 0) {
                console.log("WARNING: Column 'chat_history' exists instead of 'chatHistory'.");
            } else {
                console.log("ERROR: Neither 'chatHistory' nor 'chat_history' found.");
            }
        }

        process.exit(0);
    } catch (e) {
        console.error("ERROR:", e);
        process.exit(1);
    }
}

run();
