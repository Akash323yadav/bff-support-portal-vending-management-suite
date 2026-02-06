const db = require("./config/database");

async function check() {
    try {
        const [rows] = await db.query("DESCRIBE complaints");
        console.log("COLUMNS:");
        rows.forEach(r => console.log(`- ${r.Field} (${r.Type})`));
    } catch (e) {
        console.error("ERROR CHECKING SCHEMA:", e.message);
    } finally {
        process.exit(0);
    }
}

check();
