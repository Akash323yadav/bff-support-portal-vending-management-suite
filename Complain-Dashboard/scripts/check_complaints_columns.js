
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require("../config/database");

async function checkColumns() {
    try {
        console.log("Fetching columns for 'complaints' table...");
        const [rows] = await db.query("SHOW COLUMNS FROM complaints");
        console.log(rows.map(r => r.Field));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkColumns();
