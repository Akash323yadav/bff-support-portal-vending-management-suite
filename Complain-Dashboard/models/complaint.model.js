const db = require("../config/database");

/**
 * =========================
 * CREATE COMPLAINT
 * =========================
 */
async function createComplaintDB(data) {
  const [result] = await db.query(
    `INSERT INTO complaints (
      conversationId,
      customerName,
      customerMobile,
      complaintType,
      locationId,
      machineId,
      description,
      paymentAmount,
      coilNumber,
      problemMediaUrl,
      paymentImageUrl,
      drinkType,
      status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.conversationId,
      data.customerName,
      data.customerMobile,
      data.complaintType,
      data.locationId,
      data.machineId,
      data.description,
      data.paymentAmount || null,
      data.coilNumber || null,
      data.problemMediaUrl || null,
      data.paymentImageUrl || null,
      data.drinkType || null,
      "Pending",
    ]
  );

  return result.insertId;
}

/**
 * =========================
 * LIST ALL COMPLAINTS
 * =========================
 */
async function listAllComplaintsDB() {
  const [rows] = await db.query(
    `SELECT * FROM complaints ORDER BY id DESC`
  );
  return rows;
}

/**
 * =========================
 * GET COMPLAINT BY ID
 * =========================
 */
async function getComplaintByIdDB(id) {
  const [rows] = await db.query(
    `SELECT * FROM complaints WHERE id = ?`,
    [id]
  );
  return rows[0];
}

/**
 * =========================
 * LIST BY CONVERSATION
 * =========================
 */
async function listComplaintsByConversationDB(conversationId) {
  const [rows] = await db.query(
    `SELECT * FROM complaints WHERE conversationId = ? ORDER BY id DESC`,
    [conversationId]
  );
  return rows;
}

/**
 * =========================
 * LIST BY MOBILE
 * =========================
 */
async function listComplaintsByMobileDB(mobile) {
  const [rows] = await db.query(
    `SELECT * FROM complaints WHERE customerMobile = ? ORDER BY id DESC`,
    [mobile]
  );
  return rows;
}

/**
 * =========================
 * UPDATE COMPLAINT STATUS
 * =========================
 */
async function updateComplaintStatusDB(id, status) {
  let query = `UPDATE complaints SET status = ?`;
  const params = [status];

  if (status === "In Progress") {
    query += `, inProgressAt = NOW()`;
  } else if (status === "Resolved") {
    query += `, resolvedAt = NOW()`;
  }

  query += ` WHERE id = ?`;
  params.push(id);

  await db.query(query, params);
  return true;
}

/**
 * =========================
 * PUSH SUBSCRIPTION
 * =========================
 */
async function updateSubscriptionDB(id, subscription) {
  await db.query(
    `UPDATE complaints SET push_subscription = ? WHERE id = ?`,
    [JSON.stringify(subscription), id]
  );
  return true;
}

async function getSubscriptionDB(id) {
  const [rows] = await db.query(
    `SELECT push_subscription FROM complaints WHERE id = ?`,
    [id]
  );
  return rows[0]?.push_subscription;
}

/**
 * =========================
 * EXPORTS
 * =========================
 */
module.exports = {
  createComplaintDB,
  listAllComplaintsDB,
  getComplaintByIdDB,
  listComplaintsByConversationDB,
  listComplaintsByMobileDB,
  updateComplaintStatusDB,
  updateSubscriptionDB,
  getSubscriptionDB
};
