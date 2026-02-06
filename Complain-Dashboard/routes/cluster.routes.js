const express = require("express");
const router = express.Router();
const clusterController = require("../controller/cluster.controller");

router.get("/", clusterController.getClusterData);

module.exports = router;
