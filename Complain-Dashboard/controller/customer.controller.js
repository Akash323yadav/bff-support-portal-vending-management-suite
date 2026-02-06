const db = require("../config/database");

// GET all customers
const getAllCustomers = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, name, mobile, created_at FROM customers ORDER BY id DESC"
    );
    res.json(rows);
  } catch (error) {
    console.error("getAllCustomers error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET customer by ID
const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      "SELECT id, name, mobile, created_at FROM customers WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("getCustomerById error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET all complaints of a customer
const getCustomerComplaints = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      `SELECT c.*
       FROM complaints c
       JOIN customers cu ON cu.id = c.customer_id
       WHERE cu.id = ?
       ORDER BY c.id DESC`,
      [id]
    );

    res.json(rows);
  } catch (error) {
    console.error("getCustomerComplaints error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAllCustomers,
  getCustomerById,
  getCustomerComplaints,
};
