const db = require("../config/database");

async function addSupportSubscription(subscription) {
    // Avoid duplicate subscriptions (check by endpoint)
    const existing = await db.query(
        "SELECT id FROM support_subscriptions WHERE endpoint = ?",
        [subscription.endpoint]
    );

    if (existing[0].length > 0) {
        return existing[0][0].id;
    }

    // Helper to extract keys safely
    const p256dh = subscription.keys ? subscription.keys.p256dh : "";
    const auth = subscription.keys ? subscription.keys.auth : "";

    const [result] = await db.query(
        "INSERT INTO support_subscriptions (endpoint, p256dh, auth) VALUES (?, ?, ?)",
        [subscription.endpoint, p256dh, auth]
    );
    return result.insertId;
}

async function getAllSupportSubscriptions() {
    const [rows] = await db.query("SELECT * FROM support_subscriptions");
    return rows.map(row => ({
        endpoint: row.endpoint,
        keys: {
            p256dh: row.p256dh,
            auth: row.auth
        }
    }));
}

module.exports = {
    addSupportSubscription,
    getAllSupportSubscriptions
};
