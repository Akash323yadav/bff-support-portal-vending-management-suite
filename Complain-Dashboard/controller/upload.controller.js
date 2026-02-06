const path = require("path");

/**
 * =========================
 * UPLOAD FILE (IMAGE / VIDEO)
 * =========================
 */
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Use relative path so it works with proxies/ngrok
    const fileUrl = `/uploads/${req.file.filename}`;

    res.status(200).json({
      success: true,
      fileUrl,
      fileType: req.file.mimetype,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Upload failed" });
  }
};

module.exports = {
  uploadFile,
};
