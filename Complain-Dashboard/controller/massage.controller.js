const { getIO, getComplaintRoom, isComplaintUserOnline } = require("../socket");
const { createMessage, getMessagesByComplaintId: getMessagesDB } = require("../models/message.model");

// GET messages
const getMessagesByComplaintId = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const messages = await getMessagesDB(complaintId);
    res.status(200).json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// SEND message
const sendMessageByComplaintId = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { text, image_url, video_url, sender_type } = req.body;

    const imageUrl = image_url || null;
    const videoUrl = video_url || null;
    const senderType = sender_type || "customer";

    if (!text && !imageUrl && !videoUrl) {
      return res.status(400).json({ message: "Text, image or video is required" });
    }

    // Use Model to save (updates JSON column in complaints table)
    const newMessage = await createMessage({
      complaintId,
      senderType,
      text: text || null,
      imageUrl,
      videoUrl
    });

    // 🔥 SOCKET EMIT (Same logic, new message object)
    const io = getIO();
    const room = getComplaintRoom(complaintId);

    // Emit to specific complaint room
    io.to(room).emit("newMessage", newMessage);

    // Emit to global support room (for list sorting)
    io.to("support").emit("newMessage", newMessage);

    // 🔥 PUSH NOTIFICATION (If sent by Support -> Notify User)
    if (senderType === "support") {
      const isOnline = isComplaintUserOnline(complaintId);
      console.log(`User Online Status for Complaint #${complaintId}: ${isOnline}`);

      if (!isOnline) {
        try {
          const { getSubscriptionDB } = require("../models/complaint.model");
          const webpush = require("../config/webpush");

          const subscriptionJson = await getSubscriptionDB(complaintId);

          if (subscriptionJson) {
            const subscription = JSON.parse(subscriptionJson);
            await webpush.sendNotification(subscription, JSON.stringify({
              title: `BFF Vending 🛠️ (Chat #${complaintId})`,
              body: text ? `💬 Support: ${text}` : "✉️ Support sent an attachment...",
              url: `/userchat?complaintId=${complaintId}`,
              tag: `chat-${complaintId}`,
              badge: '/logo.png',
              icon: '/logo.png'
            }));
            console.log("Push notification sent to user.");
          }
        } catch (pushErr) {
          console.error("Push notification to user failed:", pushErr.message);
        }
      } else {
        console.log("User is online, skipping push notification.");
      }
    } else {
      // 🔥 PUSH NOTIFICATION (If sent by Customer -> Notify Support)
      try {
        const { getAllSupportSubscriptions } = require("../models/support.model");
        const webpush = require("../config/webpush");

        const subscriptions = await getAllSupportSubscriptions();
        console.log(`Sending push to ${subscriptions.length} support agents.`);

        const payload = JSON.stringify({
          title: `⚠️ New Customer Msg (#${complaintId})`,
          body: text ? `👤 User: ${text}` : "📁 User sent a file attachment...",
          url: `/support`,
          tag: `chat-${complaintId}`,
          badge: '/logo.png'
        });

        // Send to all subscribers parallelly
        await Promise.all(subscriptions.map(sub =>
          webpush.sendNotification(sub, payload).catch(err => {
            if (err.statusCode === 410 || err.statusCode === 404) {
              console.log("Expired subscription:", sub.endpoint);
            }
          })
        ));

      } catch (pushErr) {
        console.error("Push notification to support failed:", pushErr.message);
      }
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("sendMessageByComplaintId error:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

module.exports = {
  getMessagesByComplaintId,
  sendMessageByComplaintId,
};
