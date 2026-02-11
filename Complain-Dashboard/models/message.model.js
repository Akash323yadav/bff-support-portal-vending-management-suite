const db = require("../config/database");

/**
 * Create a new chat message (Stored in JSON column)
 */
const createMessage = async ({
  complaintId,
  senderType,
  text,
  imageUrl,
  videoUrl,
  replyToMessageId // 🆕 Reply reference
}) => {
  // 1. Get current history
  const [rows] = await db.query(
    `SELECT chatHistory FROM complaints WHERE id = ?`,
    [complaintId]
  );

  let history = [];
  if (rows.length > 0 && rows[0].chatHistory) {
    history = rows[0].chatHistory;
    // Handle if driver returns string
    if (typeof history === 'string') {
      try { history = JSON.parse(history); } catch (e) { }
    }
  }
  // Ensure array
  if (!Array.isArray(history)) history = [];

  // 🆕 Get replied message if replying
  let repliedMessage = null;
  if (replyToMessageId) {
    repliedMessage = history.find(m => m.id === parseInt(replyToMessageId));
  }

  // 2. Prepare new message
  const newMessage = {
    id: Date.now(), // Generate ID
    complaint_id: complaintId,
    sender_type: senderType,
    text: text || null,
    image_url: imageUrl || null,
    video_url: videoUrl || null,
    reply_to_message_id: replyToMessageId || null, // 🆕 Reply reference
    replied_message: repliedMessage ? { // 🆕 Quoted message preview
      id: repliedMessage.id,
      text: repliedMessage.text || "Media",
      sender_type: repliedMessage.sender_type
    } : null,
    created_at: new Date(),
    status: 'sent' // WhatsApp: Single Grey Tick (Sent to server)
  };

  // 3. Append
  history.push(newMessage);

  // 4. Save back
  await db.query(
    `UPDATE complaints SET chatHistory = ? WHERE id = ?`,
    [JSON.stringify(history), complaintId]
  );

  return newMessage;
};

/**
 * Get all messages of a complaint (chat history from JSON)
 */
const getMessagesByComplaintId = async (complaintId) => {
  const [rows] = await db.query(
    `SELECT chatHistory FROM complaints WHERE id = ?`,
    [complaintId]
  );

  if (rows.length === 0 || !rows[0].chatHistory) return [];

  let history = rows[0].chatHistory;
  if (typeof history === 'string') {
    try { history = JSON.parse(history); } catch (e) { return []; }
  }

  return Array.isArray(history) ? history : [];
};

/**
 * Mark messages as read in JSON history
 */
const markMessagesAsRead = async (complaintId, readerRole) => {
  // 1. Get history
  const [rows] = await db.query(
    `SELECT chatHistory FROM complaints WHERE id = ?`,
    [complaintId]
  );

  if (rows.length === 0 || !rows[0].chatHistory) return;

  let history = rows[0].chatHistory;
  if (typeof history === 'string') {
    try { history = JSON.parse(history); } catch (e) { return; }
  }
  if (!Array.isArray(history)) return;

  // 2. Update statuses
  let changed = false;
  const updatedHistory = history.map(msg => {
    const isExternalSender = msg.sender_type !== 'support' && msg.sender_type !== 'admin';
    const isSupportSender = msg.sender_type === 'support' || msg.sender_type === 'admin';

    // Verify if message is aimed at the current reader and is not already 'read'
    const shouldUpdate =
      (readerRole === 'support' && isExternalSender) ||
      (readerRole === 'user' && isSupportSender);

    if (shouldUpdate && msg.status !== 'read') {
      changed = true;
      return { ...msg, status: 'read' };
    }
    return msg;
  });

  // 3. Save if changed
  if (changed) {
    await db.query(
      `UPDATE complaints SET chatHistory = ? WHERE id = ?`,
      [JSON.stringify(updatedHistory), complaintId]
    );
  }
};

/**
 * Mark messages as delivered in JSON history
 */
const markMessagesAsDelivered = async (complaintId, deliverToRole) => {
  const [rows] = await db.query(
    `SELECT chatHistory FROM complaints WHERE id = ?`,
    [complaintId]
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

    // If I'm 'support', I'm confirming delivery of messages I sent? No.
    // If messages were sent BY 'support', and we are marking them delivered to 'user'...
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
      `UPDATE complaints SET chatHistory = ? WHERE id = ?`,
      [JSON.stringify(updatedHistory), complaintId]
    );
  }
};

module.exports = {
  createMessage,
  getMessagesByComplaintId,
  markMessagesAsRead,
  markMessagesAsDelivered
};
