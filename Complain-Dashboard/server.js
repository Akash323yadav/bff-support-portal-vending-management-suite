console.log("DEBUG: server.js execution started...");
require("dotenv").config();

const express = require("express");
const path = require("path");
const cors = require("cors");
const http = require("http");
const { initSocket } = require("./socket");

const app = express();

app.use(cors());
app.use(express.json());

// Serving uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API Routes
app.use("/api/complaints", require("./routes/complaint.routes"));
app.use("/api/messages", require("./routes/message.routes"));
app.use("/api/upload", require("./routes/upload.routes"));
app.use("/api/clusters", require("./routes/cluster.routes"));
app.use("/api/support", require("./routes/support.routes"));

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
