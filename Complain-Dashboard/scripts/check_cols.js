const db = require('../config/database');

(async () => {
    try {
        const [columns] = await db.query("SHOW COLUMNS FROM complaints");
        console.log("COLUMNS:", columns.map(c => c.Field));
        process.exit(0);
    } catch (err) {
        console.error("ERROR:", err);
        process.exit(1);
    }
})();
