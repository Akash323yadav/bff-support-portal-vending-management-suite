
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require("../config/database");

async function checkTables() {
    try {
        const [rows] = await db.query("SHOW TABLES");
        console.log("Tables in DB:", rows);
        process.exit(0);
    } catch (err) {
        console.error("Error checking tables:", err);
        process.exit(1);
    }
}

checkTables();
