const express = require("express");
const multer = require("multer");

const {
  createComplaint,
  getComplaintById,
  listComplaints,
  listComplaintsByConversation,
  updateComplaintStatus,
  subscribeToPush,
  testPushNotification,
} = require("../controller/complaint.controller");

const upload = require("../middleware/upload.middleware");

const router = express.Router();



// =========================
// CREATE COMPLAINT (with media)
// =========================
router.post(
  "/",
  upload.fields([
    { name: "problemMedia", maxCount: 1 },
    { name: "paymentImage", maxCount: 1 },
  ]),

  // ✅ MULTER ERROR HANDLER (VERY IMPORTANT)
  (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "File too large. Max 25MB allowed.",
        });
      }

      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    next(err);
  },

  createComplaint
);

// =========================
// LIST ALL COMPLAINTS
// =========================
router.get("/", listComplaints);

// =========================
// GET SINGLE COMPLAINT
// =========================
router.get("/:id", getComplaintById);

// =========================
// LIST BY CONVERSATION
// =========================
router.get("/conversation/:conversationId", listComplaintsByConversation);

// =========================
// UPDATE STATUS
// =========================
router.patch("/:id/status", updateComplaintStatus);

// =========================
// PUSH SUBSCRIBE
// =========================
router.post("/:id/subscribe", subscribeToPush);
router.post("/:id/test-push", testPushNotification);

module.exports = router;
