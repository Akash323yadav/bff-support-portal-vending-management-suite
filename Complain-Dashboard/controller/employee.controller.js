const Employee = require("../models/employee.model");

const getAllEmployees = async (req, res) => {
    try {
        const employees = await Employee.getAll();
        res.json(employees);
    } catch (error) {
        console.error("Error fetching employees:", error);
        res.status(500).json({ error: "Failed to fetch employees" });
    }
};

const addEmployee = async (req, res) => {
    const { name, mobile } = req.body;
    if (!name || !mobile) {
        return res.status(400).json({ error: "Name and Mobile are required" });
    }

    try {
        const existing = await Employee.findByMobile(mobile);
        if (existing) {
            return res.status(409).json({ error: "Employee with this mobile already exists" }); // 409 Conflict
        }

        const newEmployee = await Employee.add(name, mobile);
        res.status(201).json(newEmployee);
    } catch (error) {
        const fs = require('fs');
        fs.appendFileSync('server_error.log', `${new Date().toISOString()} - Error adding employee: ${error.message}\n`);
        console.error("Error adding employee:", error);
        res.status(500).json({ error: `Failed to add employee: ${error.message}` });
    }
};

const removeEmployee = async (req, res) => {
    const { id } = req.params;
    try {
        const success = await Employee.remove(id);
        if (success) {
            res.json({ message: "Employee removed successfully" });
        } else {
            res.status(404).json({ error: "Employee not found" });
        }
    } catch (error) {
        console.error("Error removing employee:", error);
        res.status(500).json({ error: "Failed to remove employee" });
    }
};

const loginEmployee = async (req, res) => {
    const { mobile } = req.body;
    console.log(`[LOGIN ATTEMPT] Mobile: ${mobile}`);
    if (!mobile) return res.status(400).json({ error: "Mobile number required" });

    try {
        const employee = await Employee.findByMobile(mobile);
        console.log(`[LOGIN RESULT] Found:`, employee);

        if (employee) {
            res.json({ success: true, employee });
        } else {
            console.warn(`[LOGIN FAILED] Invalid mobile number: ${mobile}`);
            res.status(401).json({ error: "Invalid mobile number" });
        }
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: "Login failed" });
    }
};

module.exports = {
    getAllEmployees,
    addEmployee,
    removeEmployee,
    loginEmployee
};
