const { findOrCreateConversation } = require("../models/conversation.model");

const {
  createComplaintDB,
  getComplaintByIdDB,
  listAllComplaintsDB,
  listComplaintsByConversationDB,
  listComplaintsByMobileDB,
  updateComplaintStatusDB
} = require("../models/complaint.model");

const {
  sendNotification,
  uploadMediaToTelegram
} = require("../config/telegram");

/**
 * =========================
 * CREATE COMPLAINT
 * =========================
 */
async function createComplaint(req, res) {
  try {
    const {
      name,
      mobile,
      complaintType,
      locationId,
      machineId,
      description,
      paymentAmount,
      drinkType
    } = req.body;

    // ✅ Validation
    if (!name || !mobile || !complaintType || !locationId || !machineId) {
      return res.status(400).json({
        message: "Required fields missing"
      });
    }

    // 1️⃣ Find / create conversation
    const conversationId = await findOrCreateConversation(name, mobile);

    // 2️⃣ Media upload (OPTIONAL)
    let problemMediaUrl = null;
    let paymentImageUrl = null;

    if (req.files?.problemMedia?.[0]) {
      problemMediaUrl = await uploadMediaToTelegram(
        req.files.problemMedia[0]
      );
    }

    if (req.files?.paymentImage?.[0]) {
      paymentImageUrl = await uploadMediaToTelegram(
        req.files.paymentImage[0]
      );
    }

    // 3️⃣ SAVE COMPLAINT (🔥 MODEL MATCH)
    const complaintId = await createComplaintDB({
      conversationId,
      customerName: name,          // ✅ IMPORTANT
      customerMobile: mobile,      // ✅ IMPORTANT
      complaintType,
      locationId,
      machineId,
      description,
      coilNumber: req.body.coilNumber || null,
      drinkType: req.body.drinkType || null,
      paymentAmount: paymentAmount || null,
      problemMediaUrl,
      paymentImageUrl
    });

    // 🆕 AUTOMATIC CHAT MESSAGES (To show details in chat)
    const { createMessage } = require("../models/message.model"); // Dynamic require to avoid circular dep issues if any, or just convenience

    // A. Text Details
    const detailsText = `📝 COMPLAINT DETAILS:
Type: ${complaintType}
Location: ${locationId}
Machine: ${machineId}
Issue: ${description || "None"}
Amount: ${paymentAmount || "N/A"}
${req.body.coilNumber ? `Coil: ${req.body.coilNumber}` : ""}
${req.body.drinkType ? `Drink: ${req.body.drinkType}` : ""}`.trim();

    await createMessage({
      complaintId,
      senderType: "customer",
      text: detailsText
    });

    // B. Problem Media
    if (problemMediaUrl) {
      const isVideo = problemMediaUrl.match(/\.(mp4|webm|ogg)$/i);
      await createMessage({
        complaintId,
        senderType: "customer",
        text: "Attached Problem Proof:",
        imageUrl: isVideo ? null : problemMediaUrl,
        videoUrl: isVideo ? problemMediaUrl : null
      });
    }

    // C. Payment Proof
    if (paymentImageUrl) {
      await createMessage({
        complaintId,
        senderType: "customer",
        text: "Attached Payment Proof:",
        imageUrl: paymentImageUrl
      });
    }


    // 4️⃣ Telegram text notification
    await sendNotification(
      `🆕 New Complaint
ID: ${complaintId}
Name: ${name}
Mobile: ${mobile}
Type: ${complaintType}
Machine: ${machineId}
Location: ${locationId}
Description: ${description || "N/A"}
Coil Number: ${req.body.coilNumber || "N/A"}
Drink Type: ${req.body.drinkType || "N/A"}
Payment: ${paymentAmount || "N/A"}`
    );

    // 5️⃣ Socket Notification
    try {
      const { getIO } = require("../socket");
      const io = getIO();
      io.to("support").emit("newComplaint", {
        id: complaintId,
        customerName: name,
        customerMobile: mobile,
        complaintType,
        machineId,
        locationId,
        description,
        status: "Pending",
        created_at: new Date(),
        problem_media_url: problemMediaUrl,
        payment_image_url: paymentImageUrl,
        drinkType: req.body.drinkType || null,
        coilNumber: req.body.coilNumber || null
      });
    } catch (socketError) {
      console.error("Socket emit error:", socketError);
    }

    res.status(201).json({
      success: true,
      complaintId,
      problemMediaUrl,
      paymentImageUrl
    });

  } catch (err) {
    console.error("Create complaint error:", err);
    res.status(500).json({
      message: "Internal Server Error"
    });
  }
}

/**
 * =========================
 * GET COMPLAINT BY ID
 * =========================
 */
async function getComplaintById(req, res) {
  try {
    const complaint = await getComplaintByIdDB(req.params.id);
    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
}

/**
 * =========================
 * LIST ALL COMPLAINTS
 * =========================
 */
async function listComplaints(req, res) {
  try {
    const { mobile } = req.query;
    let complaints;

    if (mobile) {
      complaints = await listComplaintsByMobileDB(mobile);
    } else {
      complaints = await listAllComplaintsDB();
    }

    res.json(complaints);
  } catch (err) {
    console.error("LIST COMPLAINT ERROR 👉", err);
    res.status(500).json({
      message: "Server error",
      error: err.message
    });
  }
}

/**
 * =========================
 * LIST BY CONVERSATION
 * =========================
 */
async function listComplaintsByConversation(req, res) {
  try {
    const { conversationId } = req.params;
    const complaints = await listComplaintsByConversationDB(conversationId);
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
}

/**
 * =========================
 * UPDATE STATUS
 * =========================
 */
async function updateComplaintStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await updateComplaintStatusDB(id, status);

    // 🆕 Socket Notification for the User
    try {
      const { getIO } = require("../socket");
      const io = getIO();
      // Emitting to a room specific to this complaint
      io.to(`complaint_${id}`).emit("statusUpdated", {
        complaintId: id,
        status: status,
        updatedAt: new Date()
      });

      // Also notify support room to update dashboard stats
      io.to("support").emit("complaintStatusChanged", { id, status });
    } catch (socketError) {
      console.error("Socket emit error in status update:", socketError);
    }

    res.json({ success: true, message: "Status updated" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
}

/**
 * =========================
 * PUSH SUBSCRIPTION HANDLER
 * =========================
 */
async function subscribeToPush(req, res) {
  try {
    const { id } = req.params;
    const subscription = req.body;

    const { updateSubscriptionDB } = require("../models/complaint.model");
    await updateSubscriptionDB(id, subscription);

    res.status(200).json({ success: true, message: "Subscribed to push notifications" });
  } catch (err) {
    console.error("Subscription error:", err);
    res.status(500).json({ message: "Failed to save subscription" });
  }
}

/**
 * =========================
 * TEST PUSH NOTIFICATION
 * =========================
 */
async function testPushNotification(req, res) {
  try {
    const { id } = req.params;
    const { getSubscriptionDB } = require("../models/complaint.model");
    const webpush = require("../config/webpush"); // Ensure this file exists and exports configured webpush

    const subscriptionJson = await getSubscriptionDB(id);
    if (!subscriptionJson) {
      return res.status(404).json({ message: "No subscription found for this complaint" });
    }

    const subscription = JSON.parse(subscriptionJson);

    await webpush.sendNotification(subscription, JSON.stringify({
      title: "🚀 BFF Vending System",
      body: "Notification system is now AUTHENTICATED & ACTIVE! 🔔✨",
      url: `/userchat?complaintId=${id}`,
      tag: "system-status",
      badge: "/logo.png"
    }));

    res.json({ success: true, message: "Test notification sent" });
  } catch (err) {
    console.error("Test push error:", err);
    res.status(500).json({ message: "Failed to send test notification", error: err.message });
  }
}

module.exports = {
  createComplaint,
  getComplaintById,
  listComplaints,
  listComplaintsByConversation,
  updateComplaintStatus,
  subscribeToPush,
  testPushNotification
};
