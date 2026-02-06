const express = require("express");
const { uploadFile } = require("../controller/upload.controller");
const upload = require("../middleware/localUpload.middleware");

const router = express.Router();

/**
 * =========================
 * FILE UPLOAD
 * =========================
 */
router.post("/", upload.single("file"), uploadFile);

module.exports = router;
