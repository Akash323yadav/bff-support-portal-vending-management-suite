const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(), // ✅ Telegram ke liye REQUIRED
  limits: {
    fileSize: 50 * 1024 * 1024, // ✅ 20MB
  },
});

module.exports = upload;
