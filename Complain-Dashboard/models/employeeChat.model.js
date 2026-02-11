const db = require("../config/database");

/**
 * Create a new employee chat message (Stored in JSON column in employees table)
 */
const createEmployeeMessage = async ({
    mobile,
    senderType,
    text,
    imageUrl,
    videoUrl
}) => {
    // 1. Get current history from employees table
    const [rows] = await db.query(
        `SELECT chatHistory FROM employees WHERE mobile = ?`,
        [mobile]
    );

    let history = [];
    if (rows.length > 0 && rows[0].chatHistory) {
        history = rows[0].chatHistory;
        if (typeof history === 'string') {
            try { history = JSON.parse(history); } catch (e) { }
        }
    }
    if (!Array.isArray(history)) history = [];

    // 2. Prepare new message
    const newMessage = {
        id: Date.now(),
        complaint_id: `EMP_${mobile}`,
        sender_type: senderType,
        text: text || null,
        image_url: imageUrl || null,
        video_url: videoUrl || null,
        created_at: new Date(),
        status: 'sent'
    };

    // 3. Append
    history.push(newMessage);

    // 4. Save back
    await db.query(
        `UPDATE employees SET chatHistory = ? WHERE mobile = ?`,
        [JSON.stringify(history), mobile]
    );

    return newMessage;
};

/**
 * Get all messages for an employee
 */
const getEmployeeMessages = async (mobile) => {
    const [rows] = await db.query(
        `SELECT chatHistory FROM employees WHERE mobile = ?`,
        [mobile]
    );

    if (rows.length === 0 || !rows[0].chatHistory) return [];

    let history = rows[0].chatHistory;
    if (typeof history === 'string') {
        try { history = JSON.parse(history); } catch (e) { return []; }
    }

    return Array.isArray(history) ? history : [];
};

/**
 * Mark employee messages as read
 */
const markEmployeeMessagesAsRead = async (mobile, readerRole) => {
    const [rows] = await db.query(
        `SELECT chatHistory FROM employees WHERE mobile = ?`,
        [mobile]
    );

    if (rows.length === 0 || !rows[0].chatHistory) return;

    let history = rows[0].chatHistory;
    if (typeof history === 'string') {
        try { history = JSON.parse(history); } catch (e) { return; }
    }
    if (!Array.isArray(history)) return;

    let changed = false;
    const updatedHistory = history.map(msg => {
        const isExternalSender = msg.sender_type !== 'support' && msg.sender_type !== 'admin';
        const isSupportSender = msg.sender_type === 'support' || msg.sender_type === 'admin';

        const shouldUpdate =
            (readerRole === 'support' && isExternalSender) ||
            (readerRole === 'user' && isSupportSender);

        if (shouldUpdate && msg.status !== 'read') {
            changed = true;
            return { ...msg, status: 'read' };
        }
        return msg;
    });

    if (changed) {
        await db.query(
            `UPDATE employees SET chatHistory = ? WHERE mobile = ?`,
            [JSON.stringify(updatedHistory), mobile]
        );
    }
};

/**
 * Mark employee messages as delivered
 */
const markEmployeeMessagesAsDelivered = async (mobile, deliverToRole) => {
    const [rows] = await db.query(
        `SELECT chatHistory FROM employees WHERE mobile = ?`,
        [mobile]
    );

    if (rows.length === 0 || !rows[0].chatHistory) return;
    let history = rows[0].chatHistory;
    if (typeof history === 'string') {
        try { history = JSON.parse(history); } catch (e) { return; }
    }
    if (!Array.isArray(history)) return;

    let changed = false;
    const updatedHistory = history.map(msg => {
        const isExternalSender = msg.sender_type !== 'support' && msg.sender_type !== 'admin';
        const isSupportSender = msg.sender_type === 'support' || msg.sender_type === 'admin';

        const isTargetMessage =
            (deliverToRole === 'user' && isSupportSender) ||
            (deliverToRole === 'support' && isExternalSender);

        if (isTargetMessage && msg.status === 'sent') {
            changed = true;
            return { ...msg, status: 'delivered' };
        }
        return msg;
    });

    if (changed) {
        await db.query(
            `UPDATE employees SET chatHistory = ? WHERE mobile = ?`,
            [JSON.stringify(updatedHistory), mobile]
        );
    }
};

module.exports = {
    createEmployeeMessage,
    getEmployeeMessages,
    markEmployeeMessagesAsRead,
    markEmployeeMessagesAsDelivered
};
