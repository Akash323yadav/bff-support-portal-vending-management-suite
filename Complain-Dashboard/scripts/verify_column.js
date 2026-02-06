
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function verify() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log("Connected.");
        const [rows] = await connection.execute("SHOW COLUMNS FROM Complaint LIKE 'chatHistory'");

        if (rows.length > 0) {
            console.log("SUCCESS: 'chatHistory' column found.");
        } else {
            console.log("FAIL: 'chatHistory' column NOT found.");
            // Check lowercase 'complaints' table too
            const [rows2] = await connection.execute("SHOW COLUMNS FROM complaints LIKE 'chatHistory'");
            if (rows2.length > 0) console.log("SUCCESS (in 'complaints' table): 'chatHistory' column found.");
        }
        await connection.end();
    } catch (e) {
        console.error("Verification Error:", e);
    }
}
verify();
