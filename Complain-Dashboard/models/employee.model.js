const db = require("../config/database");

const Employee = {
    getAll: async () => {
        const [rows] = await db.query("SELECT * FROM employees ORDER BY created_at DESC");
        return rows;
    },

    add: async (name, mobile) => {
        const [result] = await db.query(
            "INSERT INTO employees (name, mobile) VALUES (?, ?)",
            [name, mobile]
        );
        return { id: result.insertId, name, mobile };
    },

    remove: async (id) => {
        const [result] = await db.query("DELETE FROM employees WHERE id = ?", [id]);
        return result.affectedRows > 0;
    },

    findByMobile: async (mobile) => {
        const [rows] = await db.query("SELECT * FROM employees WHERE mobile = ?", [mobile]);
        return rows[0]; // Returns undefined if not found
    }
};

module.exports = Employee;
