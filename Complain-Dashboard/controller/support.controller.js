const { addSupportSubscription } = require("../models/support.model");

async function subscribeSupport(req, res) {
    try {
        const subscription = req.body;
        if (!subscription || !subscription.endpoint) {
            return res.status(400).json({ message: "Invalid subscription" });
        }

        await addSupportSubscription(subscription);
        res.json({ success: true, message: "Support subscribed to notifications" });
    } catch (err) {
        console.error("Support subscribe error:", err);
        res.status(500).json({ message: "Server error" });
    }
}

module.exports = {
    subscribeSupport
};
