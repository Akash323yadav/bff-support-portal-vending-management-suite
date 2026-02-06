const express = require("express");
const { subscribeSupport } = require("../controller/support.controller");

const router = express.Router();

router.post("/subscribe", subscribeSupport);

module.exports = router;
