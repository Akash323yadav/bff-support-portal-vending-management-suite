const axios = require("axios");

exports.getClusterData = async (req, res) => {
    try {
        console.log(" Fetching Cluster Data from API...");
        const response = await axios.get("http://bffvending.com:8080/bff-mgmt-app/getClusterData?userID=50001", { timeout: 5000 });

        // Validate response structure
        const data = response.data;
        console.log(" API Response Received. Type:", typeof data, "Length:", Array.isArray(data) ? data.length : "N/A");
        let finalData = [];

        if (Array.isArray(data) && data.length > 0) {
            finalData = data;
        } else if (data && Array.isArray(data.clusters) && data.clusters.length > 0) {
            finalData = data.clusters;
        } else if (data && Array.isArray(data.data) && data.data.length > 0) {
            finalData = data.data;
        }

        if (finalData.length > 0) {
            console.log(` Returning ${finalData.length} clusters from API.`);
            return res.json(finalData);
        }

        console.warn(" API returned empty data. Response was:", JSON.stringify(data).substring(0, 200));
        throw new Error("Empty data from API");

    } catch (error) {
        console.error(" External API Failed:", error.message);
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", JSON.stringify(error.response.data).substring(0, 200));
        }

        console.warn(" Switching to Mock Data.");
        // Fallback Mock Data
        const mockData = [
            { groupID: 101, groupName: "Main Lobby (Mock)", machineJSON: "VM-101, VM-102" },
            { groupID: 102, groupName: "Cafeteria (Mock)", machineJSON: "VM-201, VM-202" },
            { groupID: 103, groupName: "Office 2nd Floor", machineJSON: "VM-301, VM-305" }
        ];
        res.json(mockData);
    }
};
