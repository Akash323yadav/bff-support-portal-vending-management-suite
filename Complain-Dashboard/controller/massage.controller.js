const { getIO, getComplaintRoom, isComplaintUserOnline } = require("../socket");
const { createMessage, getMessagesByComplaintId: getMessagesDB } = require("../models/message.model");
const {
  createEmployeeMessage,
  getEmployeeMessages,
  markEmployeeMessagesAsRead,
  markEmployeeMessagesAsDelivered
} = require("../models/employeeChat.model");

// GET messages
const getMessagesByComplaintId = async (req, res) => {
  try {
    const { complaintId } = req.params;

    // Check if this is an employee chat
    if (complaintId.startsWith('EMP_')) {
      const mobile = complaintId.replace('EMP_', '');
      const messages = await getEmployeeMessages(mobile);
      return res.status(200).json(messages);
    }

    // Regular complaint
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
    const { text, image_url, video_url, sender_type, reply_to_message_id } = req.body; // 🆕 Added reply_to_message_id

    const imageUrl = image_url || null;
    const videoUrl = video_url || null;
    const senderType = sender_type || "customer";

    if (!text && !imageUrl && !videoUrl) {
      return res.status(400).json({ message: "Text, image or video is required" });
    }

    const isEmployeeChat = complaintId.startsWith('EMP_');
    let newMessage;

    if (isEmployeeChat) {
      // Employee chat
      const mobile = complaintId.replace('EMP_', '');
      newMessage = await createEmployeeMessage({
        mobile,
        senderType,
        text: text || null,
        imageUrl,
        videoUrl
      });
    } else {
      // Regular complaint
      newMessage = await createMessage({
        complaintId,
        senderType,
        text: text || null,
        imageUrl,
        videoUrl,
        replyToMessageId: reply_to_message_id || null, // 🆕 Pass reply reference
        status: 'sent'
      });
    }

    // 🔥 SOCKET EMIT (Same logic, new message object)
    const io = getIO();
    const room = getComplaintRoom(complaintId);

    // Emit to specific complaint room
    io.to(room).emit("newMessage", newMessage);

    // Emit to global support room (for list sorting)
    io.to("support").emit("newMessage", newMessage);

    // Skip push notifications and auto-replies for employee chats
    if (!isEmployeeChat) {
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

      // 🕰️ AUTOMATIC TIME-BASED REPLY (If sent by Customer)
      if (senderType === "customer") {
        // Check if Support has ever replied in this conversation
        const existingMessages = await getMessagesDB(complaintId);
        const hasSupportReplied = existingMessages.some(m => m.sender_type === 'support' || m.sender_type === 'admin');

        // Only send auto-reply if Support has NEVER replied yet
        if (!hasSupportReplied) {
          const now = new Date();
          const currentHour = now.getHours();
          const currentMinute = now.getMinutes();

          const totalMinutes = currentHour * 60 + currentMinute;
          const startWork = 600; // 10:00 AM
          const endWork = 1110;  // 06:30 PM

          let autoReplyText = null;

          if (totalMinutes >= startWork && totalMinutes <= endWork) {
            autoReplyText = "Thank you for contacting BFF Vending. We will get back to you shortly.";
          } else {
            autoReplyText = "Thanks for your message. Our support team's working hours are 10:00 AM to 06:30 PM. We will get back to you within working hours.";
          }

          if (autoReplyText) {
            setTimeout(async () => {
              try {
                const autoMsg = await createMessage({
                  complaintId,
                  senderType: "support",
                  text: autoReplyText,
                  status: "sent"
                });

                io.to(room).emit("newMessage", autoMsg);
                io.to("support").emit("newMessage", autoMsg);

              } catch (autoErr) {
                console.error("Auto-reply failed:", autoErr);
              }
            }, 2000);
          }
        }
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
