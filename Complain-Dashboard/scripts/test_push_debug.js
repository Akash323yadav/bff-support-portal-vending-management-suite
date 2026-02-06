const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../config/database');
const webpush = require('../config/webpush');

const logFile = path.join(__dirname, 'debug.log');
function log(msg) {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
}

(async () => {
    try {
        fs.writeFileSync(logFile, '=== START DEBUG ' + new Date().toISOString() + ' ===\n');
        log("VAPID Public Key: " + process.env.VAPID_PUBLIC_KEY);

        log("Checking DB...");
        const [complaints] = await db.query("SELECT id, push_subscription FROM complaints WHERE push_subscription IS NOT NULL");
        log(`Found ${complaints.length} complaint subscriptions`);

        const [support] = await db.query("SELECT * FROM support_subscriptions");
        log(`Found ${support.length} support subscriptions`);

        // Test Complaint
        if (complaints.length > 0) {
            const last = complaints[complaints.length - 1];
            log(`Testing last complaint #${last.id}`);
            try {
                const sub = JSON.parse(last.push_subscription);
                await webpush.sendNotification(sub, JSON.stringify({
                    title: "💎 BFF Vending (Official)",
                    body: "Welcome! Your premium notifications are now configured. ✨",
                    url: "/"
                }));
                log(" User Push SUCCESS");
            } catch (e) {
                log(" User Push FAILED: " + e.message + " (Status: " + (e.statusCode || 'N/A') + ")");
            }
        }

        // Test Support
        if (support.length > 0) {
            const s = support[support.length - 1];
            log(`Testing last support sub (ID: ${s.id})`);
            try {
                const sub = {
                    endpoint: s.endpoint,
                    keys: { p256dh: s.p256dh, auth: s.auth }
                };
                await webpush.sendNotification(sub, JSON.stringify({ title: "Debug", body: "Manual Test Support" }));
                log(" Support Push SUCCESS");
            } catch (e) {
                log(" Support Push FAILED: " + e.message + " (Status: " + (e.statusCode || 'N/A') + ")");
            }
        }
    } catch (err) {
        log("ERROR: " + err.stack);
    } finally {
        process.exit();
    }
})();
