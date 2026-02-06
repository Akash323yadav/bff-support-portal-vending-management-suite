require('dotenv').config();
const mysql = require('mysql2/promise');

async function test() {
    console.log("Starting test...");
    try {
        const config = {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        };
        console.log("Config:", JSON.stringify({ ...config, password: '***' }));

        const conn = await mysql.createConnection(config);
        console.log("Connection success!");

        const [rows] = await conn.query("SHOW TABLES");
        console.log("Tables:", rows.map(r => Object.values(r)[0]).join(', '));

        const [cols] = await conn.query("DESCRIBE complaints");
        console.log("Complaints Columns:", cols.map(c => c.Field).join(', '));

        await conn.end();
    } catch (e) {
        console.error("ERROR:", e.message);
        console.error(e.stack);
    } finally {
        console.log("Test finished.");
        process.exit(0);
    }
}

test();
