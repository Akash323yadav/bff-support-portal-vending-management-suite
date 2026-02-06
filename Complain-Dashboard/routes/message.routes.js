const express = require("express");
const {
  getMessagesByComplaintId,
  sendMessageByComplaintId
} = require("../controller/massage.controller");

const router = express.Router();

router.get("/complaint/:complaintId", getMessagesByComplaintId);
router.post("/complaint/:complaintId", sendMessageByComplaintId);

module.exports = router;
