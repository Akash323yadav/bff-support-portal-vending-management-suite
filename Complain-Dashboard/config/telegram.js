const axios = require("axios");
const FormData = require("form-data");

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;

const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const TELEGRAM_FILE_API = `https://api.telegram.org/file/bot${BOT_TOKEN}`;

/**
 * =========================
 * SEND TEXT NOTIFICATION
 * =========================
 */
async function sendNotification(message) {
  if (!BOT_TOKEN || !ADMIN_CHAT_ID) {
    console.warn("Telegram config missing");
    return;
  }

  await axios.post(`${TELEGRAM_API}/sendMessage`, {
    chat_id: ADMIN_CHAT_ID,
    text: message,
  });
}

/**
 * =========================
 * UPLOAD ANY FILE (PHOTO / VIDEO)
 * RETURNS PUBLIC FILE URL
 * =========================
 */
async function uploadMediaToTelegram(file) {
  if (!BOT_TOKEN || !ADMIN_CHAT_ID) {
    console.warn("Telegram config missing");
    return null;
  }

  const form = new FormData();

  // 🔥 ALWAYS USE DOCUMENT (NO SIZE LIMIT ISSUES)
  form.append("document", file.buffer, file.originalname);
  form.append("chat_id", ADMIN_CHAT_ID);

  // 1️⃣ Upload file to Telegram
  const res = await axios.post(
    `${TELEGRAM_API}/sendDocument`,
    form,
    { headers: form.getHeaders() }
  );

  // 2️⃣ Extract file_id
  const fileId = res.data.result.document.file_id;

  // 3️⃣ Get public file path
  const fileRes = await axios.get(
    `${TELEGRAM_API}/getFile?file_id=${fileId}`
  );

  // 4️⃣ Public URL
  return `${TELEGRAM_FILE_API}/${fileRes.data.result.file_path}`;
}

module.exports = {
  sendNotification,
  uploadMediaToTelegram,
};
