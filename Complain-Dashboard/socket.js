const { Server } = require("socket.io");
const { markMessagesAsRead, markMessagesAsDelivered } = require("./models/message.model");

let io = null;
const onlineUsers = new Map(); // socket.id -> complaintId (String)

/**
 * Initialize socket.io (CALL ONLY ONCE)
 */
function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        callback(null, true);
      },
      methods: ["GET", "POST"],
      credentials: true
    },
    pingTimeout: 10000,
    pingInterval: 5000,
  });

  const broadcastOnlineUsers = () => {
    for (const [socketId] of onlineUsers.entries()) {
      if (!io.sockets.sockets.has(socketId)) {
        onlineUsers.delete(socketId);
      }
    }
    const uniqueIds = Array.from(new Set(onlineUsers.values()));
    console.log("📢 Broadcasting Online Users:", uniqueIds);
    io.to("support").emit("onlineUsers", uniqueIds);
  };

  io.on("connection", (socket) => {
    console.log(" Socket connected:", socket.id);

    socket.on("joinComplaint", (payload) => {
      let complaintId = typeof payload === "object" ? payload.complaintId : payload;
      let role = typeof payload === "object" ? payload.role : "user";

      complaintId = String(complaintId);
      const room = `complaint_${complaintId}`;

      console.log(`🔌 Join Request: ${socket.id} -> Complaint ${complaintId} (Role: ${role})`);

      socket.rooms.forEach(r => {
        if (r.startsWith("complaint_") && r !== room) socket.leave(r);
      });

      socket.join(room);

      if (role !== "support") {
        onlineUsers.set(socket.id, complaintId);
        console.log(`✅ User Online: ${socket.id} -> ${complaintId}`);
        broadcastOnlineUsers();
      }
    });

    socket.on("joinSupport", () => {
      socket.join("support");
      broadcastOnlineUsers();
    });

    socket.on("markRead", ({ complaintId, readerRole }) => {
      const cid = String(complaintId);
      io.to(`complaint_${cid}`).emit("messagesMarkedRead", { complaintId: cid, readerRole });
      markMessagesAsRead(cid, readerRole).catch(e => console.error("DB MarkRead Error:", e));
    });

    socket.on("markDelivered", ({ complaintId, deliverToRole }) => {
      const cid = String(complaintId);
      io.to(`complaint_${cid}`).emit("messagesMarkedDelivered", { complaintId: cid, deliverToRole });
      markMessagesAsDelivered(cid, deliverToRole).catch(e => console.error("DB MarkDelivered Error:", e));
    });

    // 🟢 Typing Indicators (Send to OTHERS in the room)
    socket.on("typing", (payload) => {
      const { complaintId, role } = typeof payload === "object" ? payload : { complaintId: payload, role: "user" };
      socket.to(`complaint_${String(complaintId)}`).emit("typing", { complaintId: String(complaintId), role });
    });

    socket.on("stopTyping", (payload) => {
      const { complaintId, role } = typeof payload === "object" ? payload : { complaintId: payload, role: "user" };
      socket.to(`complaint_${String(complaintId)}`).emit("stopTyping", { complaintId: String(complaintId), role });
    });

    socket.on("disconnect", () => {
      if (onlineUsers.has(socket.id)) {
        onlineUsers.delete(socket.id);
        broadcastOnlineUsers();
      }
    });
  });

  return io;
}

module.exports = {
  initSocket,
  getIO: () => { if (!io) throw new Error("Socket not initialized"); return io; },
  isComplaintUserOnline: (id) => Array.from(onlineUsers.values()).includes(String(id)),
  getComplaintRoom: (id) => `complaint_${String(id)}`
};
