const axios = require("axios");

exports.getClusterData = async (req, res) => {
    try {
        const response = await axios.get("http://bffvending.com:8080/bff-mgmt-app/getClusterData?userID=50001", { timeout: 1000 });
        res.json(response.data);
    } catch (error) {
        console.warn("⚠️ External API (bffvending.com) is offline. Using Mock Data safely.");
        // Fallback Mock Data
        const mockData = [
            { groupID: 101, groupName: "Main Lobby (Mock)", machineJSON: "VM-101, VM-102" },
            { groupID: 102, groupName: "Cafeteria (Mock)", machineJSON: "VM-201, VM-202" }
        ];
        res.json(mockData);
    }
};
