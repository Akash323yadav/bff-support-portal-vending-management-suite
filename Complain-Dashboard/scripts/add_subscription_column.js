const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../config/database');

(async () => {
    try {
        console.log("Adding push_subscription column...");
        await db.query(`
            ALTER TABLE complaints
            ADD COLUMN push_subscription TEXT NULL;
        `);
        console.log("Column added successfully.");
        process.exit(0);
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log("Column already exists.");
            process.exit(0);
        }
        console.error("Error adding column:", err);
        process.exit(1);
    }
})();
