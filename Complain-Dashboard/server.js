
require("dotenv").config();

const express = require("express");
const path = require("path");
const cors = require("cors");
const http = require("http");
const { initSocket } = require("./socket");

const app = express();

app.use(cors({
  origin: true, // Reflects the request origin, allowing cross-domain with credentials
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// Serving uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API Routes
app.use("/api/complaints", require("./routes/complaint.routes"));
app.use("/api/messages", require("./routes/message.routes"));
app.use("/api/upload", require("./routes/upload.routes"));
app.use("/api/clusters", require("./routes/cluster.routes"));
app.use("/api/support", require("./routes/support.routes"));
app.use("/api/employees", require("./routes/employee.routes"));
const axios = require("axios");

// Proxy endpoint to avoid CORS with external API
app.get("/api/locations", async (req, res) => {
  try {
    const location = req.query.location || 7; // Default to 7 if not provided
    const url = `http://bffvending.com:8080/bff-mgmt-app/getDataSummary?location=${location}&userID=50001&startDate=2025-08-21&endDate=2025-08-25&dataType=transactions`;
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    console.error("Error proxies external locations:", error.message);
    res.status(500).json({ error: "Failed to fetch locations" });
  }
});

// Serving Frontend Static Files
const frontendpath = path.join(__dirname, "../Frontend/frontend/dist");
app.use(express.static(frontendpath));

// Express 5 Safe Catch-all: Using middleware instead of path pattern
// This avoids path-to-regexp v8 errors with wildcard characters.
app.use((req, res, next) => {
  // If it's an API call that wasn't handled, let it go to 404
  if (req.url.startsWith("/api")) {
    return next();
  }
  // For all other routes (frontend routes), send index.html
  res.sendFile(path.join(frontendpath, "index.html"), (err) => {
    if (err) {
      // If index.html is missing, don't crash, just go to next middleware
      next();
    }
  });
});

const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || "0.0.0.0";
const server = http.createServer(app);

initSocket(server);

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`ERROR: Port ${PORT} is already in use.`);
    process.exit(1);
  }
  console.error("Server Error:", err);
});

server.listen(PORT, HOST, () => {
  console.log(`🚀 Server + Socket running on port ${PORT} at ${HOST}`);
});
