const express = require("express");
const router = express.Router();
const { getAllEmployees, addEmployee, removeEmployee, loginEmployee } = require("../controller/employee.controller");

// /api/employees
router.get("/", getAllEmployees);
router.post("/", addEmployee);
router.delete("/:id", removeEmployee);
router.post("/login", loginEmployee);

module.exports = router;
