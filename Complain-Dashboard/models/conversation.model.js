const db = require("../config/database");

/**
 * =====================================
 * FIND OR CREATE CONVERSATION
 * mobile number = WhatsApp identity
 * =====================================
 */
async function findOrCreateConversation(name, mobile) {
  // 1️⃣ Check existing conversation by mobile
  const [rows] = await db.query(
    "SELECT id FROM conversations WHERE mobile = ?",
    [mobile]
  );

  if (rows.length > 0) {
    // conversation already exists
    return rows[0].id;
  }

  // 2️ Create new conversation
  const [result] = await db.query(
    `INSERT INTO conversations (name, mobile)
     VALUES (?, ?)`,
    [name, mobile]
  );

  return result.insertId;
}

module.exports = {
  findOrCreateConversation
};
