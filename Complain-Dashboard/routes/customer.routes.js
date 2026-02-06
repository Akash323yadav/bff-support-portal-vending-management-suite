const express = require("express");
const {
  getAllCustomers,
  getCustomerById,
  getCustomerComplaints
} = require("../controller/customer.controller");

const router = express.Router();

router.get("/", getAllCustomers);
router.get("/:id/complaints", getCustomerComplaints);
router.get("/:id", getCustomerById);

module.exports = router;
