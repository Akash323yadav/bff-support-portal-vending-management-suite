const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../config/database');

(async () => {
    try {
        console.log("Creating support_subscriptions table...");
        await db.query(`
            CREATE TABLE IF NOT EXISTS support_subscriptions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                endpoint TEXT NOT NULL,
                p256dh TEXT NOT NULL,
                auth TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("Table created successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Error creating table:", err);
        process.exit(1);
    }
})();
