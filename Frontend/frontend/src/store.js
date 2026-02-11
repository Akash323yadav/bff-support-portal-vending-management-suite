// store.js
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import api from "./api/axios";
import { io } from "socket.io-client";
import toast from "react-hot-toast";

const processedMessageIds = new Set();

const getAudioContext = () => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;

  // Singleton pattern for AudioContext to handle mobile restrictions better
  if (!window._audioCtx) {
    window._audioCtx = new AudioContext();
  }
  return window._audioCtx;
};

const playNotificationSound = async () => {
  try {
    const audioCtx = getAudioContext();
    if (!audioCtx) return;

    // Mobile browsers often suspend AudioContext until user interaction
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    // 'triangle' is louder/sharper than 'sine'
    oscillator.type = "triangle";

    // Play a "ding" sound (Smoother)
    const now = audioCtx.currentTime;
    oscillator.frequency.setValueAtTime(600, now);
    oscillator.frequency.exponentialRampToValueAtTime(300, now + 0.2);

    gainNode.gain.setValueAtTime(0.5, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    oscillator.start(now);
    oscillator.stop(now + 0.25);
  } catch (e) {
    console.error("Audio play error:", e);
  }
};

export const useChatStore = create(
  persist(
    (set, get) => ({
      // =====================
      // SUPPORT ONLY
      // =====================
      complaints: [],
      selectedComplaint: null,
      clusters: [], // Store location data
      onlineUsers: [],
      typingUsers: [], // 🆕 Store multiple complaint IDs where typing is happening

      fetchClusters: async () => {
        try {
          const res = await api.get("/api/clusters");
          let data = [];
          // Handle various API response structures
          if (Array.isArray(res.data)) {
            data = res.data;
          } else if (res.data && Array.isArray(res.data.clusters)) {
            data = res.data.clusters;
          } else if (res.data && Array.isArray(res.data.data)) {
            data = res.data.data;
          }
          set({ clusters: data });
        } catch (err) {
          console.error("Fetch clusters failed:", err);
        }
      },
      isSoundEnabled: true,
      _hasHydrated: false,
      setHasHydrated: (val) => set({ _hasHydrated: val }),

      toggleSound: () => set((state) => ({ isSoundEnabled: !state.isSoundEnabled })),

      fetchComplaints: async () => {
        const { complaints } = get();
        try {
          const res = await api.get("/api/complaints");
          const newData = res.data || [];
          if (JSON.stringify(complaints) !== JSON.stringify(newData)) {
            set({ complaints: newData });
          }
        } catch (err) {
          console.error("Fetch complaints failed:", err);
        }
      },

      setSelectedComplaint: (complaint) => {
        const { selectedComplaint, complaints, socket, messages } = get();

        if (!complaint) {
          if (selectedComplaint) {
            const oldId = selectedComplaint.complaint_id || selectedComplaint.id;
            if (socket) socket.emit("leaveComplaint", oldId);
          }
          set({ selectedComplaint: null });
          return;
        }

        const newId = String(complaint.complaint_id || complaint.id);
        const oldId = selectedComplaint ? String(selectedComplaint.complaint_id || selectedComplaint.id) : null;

        if (newId === oldId && messages[newId]) return;

        if (oldId && newId !== oldId) {
          if (socket) socket.emit("leaveComplaint", oldId);
        }

        const updated = complaints.map(c =>
          (String(c.complaint_id || c.id) === newId)
            ? { ...c, unread_count: 0 }
            : c
        );

        set({ selectedComplaint: { ...complaint, complaint_id: newId, id: newId }, complaints: updated });
      },

      // =====================
      // USER ONLY
      // =====================
      userComplaint: null,
      setUserComplaint: (complaint) => {
        const { userComplaint, socket, messages } = get();
        if (!complaint) {
          set({ userComplaint: null });
          return;
        }

        const newId = String(complaint.complaint_id || complaint.id);
        const oldId = userComplaint ? String(userComplaint.complaint_id || userComplaint.id) : null;

        if (newId === oldId && messages[newId]) return;

        if (oldId && socket && newId !== oldId) {
          socket.emit("leaveComplaint", oldId);
        }

        set({ userComplaint: { ...complaint, complaint_id: newId, id: newId } });
      },

      // =====================
      // COMMON
      // =====================
      messages: {}, // Format: { [complaintId]: [] }
      loading: false,
      typingUsers: [], // Array of complaint IDs currently typing
      replyingTo: null, // { messageId, text, sender } - For inline replies
      forwardingMessage: null, // { messageId, text, sender } - For forwarding messages

      // 🆕 Reply & Forward Actions
      setReplyingTo: (message) => set({ replyingTo: message }),
      setForwardingMessage: (message) => set({ forwardingMessage: message }),
      fetchMessages: async (complaintId) => {
        if (!complaintId) return;
        const normalizedId = String(complaintId);
        const { messages } = get();

        // Show loading ONLY if we have NEVER fetched this chat before
        if (!messages[normalizedId] || messages[normalizedId].length === 0) {
          set({ loading: true });
        }

        try {
          const res = await api.get(`/api/messages/complaint/${normalizedId}`);
          // Ensure data is array
          const newData = Array.isArray(res.data) ? res.data : [];

          set((state) => {
            const currentMessages = state.messages[normalizedId] || [];
            // Smart update: Only set state if data changed to avoid re-render
            if (JSON.stringify(currentMessages) === JSON.stringify(newData)) {
              return { loading: false };
            }
            return {
              messages: { ...state.messages, [normalizedId]: newData },
              loading: false
            };
          });
        } catch (err) {
          console.error("Fetch messages failed:", err);
          set({ loading: false });
        }
      },

      sendMessage: async (complaintId, payload) => {
        if (!complaintId) return;
        const normalizedId = String(complaintId);
        try {
          const res = await api.post(`/api/messages/complaint/${normalizedId}`, payload);
          set((state) => {
            const newMessage = res.data;
            const currentMsgs = state.messages[normalizedId] || [];

            if (currentMsgs.some(m => m.id === newMessage.id)) return state;

            const targetId = normalizedId;
            const target = state.complaints.find(c => String(c.complaint_id || c.id) === targetId);
            let updatedComplaints = state.complaints;
            if (target) {
              updatedComplaints = [
                { ...target, last_activity: new Date().toISOString() },
                ...state.complaints.filter(c => (c.complaint_id || c.id) != targetId)
              ];
            }

            return {
              messages: { ...state.messages, [normalizedId]: [...currentMsgs, newMessage] },
              complaints: updatedComplaints
            };
          });
        } catch (err) {
          console.error(err);
        }
      },

      // =====================
      // SOCKET.IO
      // =====================
      socket: null,

      connectSocket: () => {
        const { socket } = get();
        if (socket?.connected) return socket;

        // Use VITE_API_URL if available, otherwise fallback to root
        // This ensures mobile/remote devices connect directly to the backend if needed
        // Use VITE_API_URL if available, otherwise fallback to relative path (proxy)
        let backendUrl = import.meta.env.VITE_API_URL || "";

        // Remove trailing slash if exists
        backendUrl = backendUrl.replace(/\/$/, "");

        const newSocket = io(backendUrl, {
          transports: ["websocket"], // Faster for local network
          reconnection: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 2000,
          path: "/socket.io/",
        });

        newSocket.on("connect", () => {
          console.log("Socket Connected:", newSocket.id);
        });

        newSocket.on("connect_error", (err) => {
          console.error("Socket Connection Error:", err.message);
        });

        set({ socket: newSocket });
        return newSocket;
      },

      disconnectSocket: () => {
        const { socket } = get();
        if (socket) {
          socket.disconnect();
          set({ socket: null });
        }
      },

      // =====================
      // CENTRAL LISTENER HUB
      // =====================
      subscribeToGlobalEvents: (role = "support") => {
        const { socket } = get();
        if (!socket) return;

        // cleanup
        socket.off("newComplaint");
        socket.off("newMessage");
        socket.off("onlineUsers");
        socket.off("messagesMarkedRead");
        socket.off("messagesMarkedDelivered");
        socket.off("typing");
        socket.off("stopTyping");
        socket.off("statusUpdated");

        // 1. Online Users
        socket.on("onlineUsers", (ids) => {
          console.log("Store: Received onlineUsers update:", ids);
          set({ onlineUsers: ids });
        });

        // 2. New Complaint (Support Only)
        if (role === "support") {
          socket.on("newComplaint", (complaint) => {
            const { complaints, isSoundEnabled } = get();
            // Add to top list
            set({ complaints: [complaint, ...complaints] });

            // Notification
            if (isSoundEnabled) playNotificationSound();

            toast.success(
              `New Complaint!\n${complaint.customerName || "Customer"} raised a ${complaint.complaintType} issue.`,
              {
                duration: 5000,
                position: "top-right",
                style: {
                  background: "#1e293b",
                  color: "#fff",
                  border: "1px solid #334155",
                },
                icon: "🔔",
              }
            );
          });
        }

        // 3. New Message
        socket.on("newMessage", (newMessage) => {
          if (processedMessageIds.has(newMessage.id)) return;
          processedMessageIds.add(newMessage.id);

          if (processedMessageIds.size > 50) {
            const it = processedMessageIds.values();
            processedMessageIds.delete(it.next().value);
          }

          const { selectedComplaint, userComplaint, complaints, isSoundEnabled } = get();
          const targetId = String(newMessage.complaint_id);

          const activeId = role === "support"
            ? String(selectedComplaint?.complaint_id || selectedComplaint?.id || "")
            : String(userComplaint?.complaint_id || userComplaint?.id || "");

          // A. Sidebar Update
          if (role === 'support') {
            const existing = complaints.find(c => (c.complaint_id || c.id) == targetId);
            if (existing) {
              // 🔥 Check if message is from support (me) or customer (them)
              const isMyMessage = (newMessage.sender_type === 'support' || newMessage.sender_type === 'admin');

              const updatedComplaint = {
                ...existing,
                last_message: newMessage.text || "Media Attachment",
                last_activity: newMessage.created_at,
                // 🆕 Only increment unread if: not active chat AND not my own message
                unread_count: (activeId != targetId && !isMyMessage) ? (existing.unread_count || 0) + 1 : 0
              };
              const others = complaints.filter(c => (c.complaint_id || c.id) != targetId);
              set({ complaints: [updatedComplaint, ...others] });
            }
          }

          // B. Sound
          const isMyMessage = (role === 'support' && (newMessage.sender_type === 'support' || newMessage.sender_type === 'admin')) ||
            (role === 'user' && (newMessage.sender_type === 'customer' || newMessage.sender_type === 'user'));

          if (!isMyMessage) {
            if (isSoundEnabled) playNotificationSound();
            if (role === 'support' && activeId != targetId) {
              toast(`Message in #${targetId}`, { icon: '💬' });
            }
          }

          // C. Update Cache
          set(state => {
            const currentMsgs = state.messages[targetId] || [];
            if (currentMsgs.some(m => m.id === newMessage.id)) return state;

            const updated = { ...state.messages, [targetId]: [...currentMsgs, newMessage] };

            if (activeId == targetId && !isMyMessage) {
              socket.emit("markDelivered", { complaintId: targetId, deliverToRole: role });

              // Only mark read if user is actually looking at the page
              if (document.hasFocus()) {
                socket.emit("markRead", { complaintId: targetId, readerRole: role });
              }
            }
            return { messages: updated };
          });
        });

        socket.on("messagesMarkedRead", ({ complaintId, readerRole }) => {
          set(state => {
            const msgs = state.messages[complaintId];
            if (!msgs) return state;
            const updated = msgs.map(m => {
              const isExternal = m.sender_type !== 'support' && m.sender_type !== 'admin';
              const isSupport = m.sender_type === 'support' || m.sender_type === 'admin';
              const affected = (readerRole === 'support' && isExternal) || (readerRole === 'user' && isSupport);
              return affected ? { ...m, status: "read" } : m;
            });
            return { messages: { ...state.messages, [complaintId]: updated } };
          });
        });

        socket.on("messagesMarkedDelivered", ({ complaintId, deliverToRole }) => {
          set(state => {
            const msgs = state.messages[complaintId];
            if (!msgs) return state;
            const updated = msgs.map(m => {
              const isExternal = m.sender_type !== 'support' && m.sender_type !== 'admin';
              const isSupport = m.sender_type === 'support' || m.sender_type === 'admin';
              const affected = (deliverToRole === 'support' && isExternal) || (deliverToRole === 'user' && isSupport);
              return (affected && m.status === 'sent') ? { ...m, status: "delivered" } : m;
            });
            return { messages: { ...state.messages, [complaintId]: updated } };
          });
        });

        // 🟢 4. Status Update (Timothy Logic)
        socket.on("statusUpdated", ({ complaintId, status, updatedAt }) => {
          console.log(`📡 Status update received for #${complaintId}: ${status}`);
          set(state => {
            // Update User view
            let newUserComplaint = state.userComplaint;
            if (newUserComplaint && String(newUserComplaint.id || newUserComplaint.complaint_id) === String(complaintId)) {
              newUserComplaint = {
                ...newUserComplaint,
                status,
                [status === "In Progress" ? "inProgressAt" : "resolvedAt"]: updatedAt
              };
            }

            // Update Support view (list)
            const newComplaints = state.complaints.map(c => {
              if (String(c.id || c.complaint_id) === String(complaintId)) {
                return {
                  ...c,
                  status,
                  [status === "In Progress" ? "inProgressAt" : "resolvedAt"]: updatedAt
                };
              }
              return c;
            });

            return { userComplaint: newUserComplaint, complaints: newComplaints };
          });

          toast(`Status updated: ${status}`, { icon: '🚀' });
        });

        // 🟡 5. Typing Indicator
        socket.on("typing", ({ complaintId, role: typingRole }) => {
          const { typingUsers } = get();
          const cid = String(complaintId);
          // Only show typing if it's NOT the current person typing
          // (socket.to usually handles this, but extra check for robustness)
          if (!typingUsers.includes(cid)) {
            set({ typingUsers: [...typingUsers, cid] });
          }
        });

        socket.on("stopTyping", ({ complaintId }) => {
          const { typingUsers } = get();
          const cid = String(complaintId);
          set({ typingUsers: typingUsers.filter(id => id !== cid) });
        });

      },

      joinComplaintRoom: ({ complaintId, role = "user" }) => {
        const { socket } = get();
        if (socket && complaintId) {
          socket.emit("joinComplaint", { complaintId, role });
        }
      },

      leaveComplaintRoom: (complaintId) => {
        const { socket } = get();
        if (socket && complaintId) {
          socket.emit("leaveComplaint", complaintId);
        }
      },

      sendTyping: ({ complaintId, role }) => {
        const { socket } = get();
        if (socket && complaintId) {
          socket.emit("typing", { complaintId, role });
        }
      },

      sendStopTyping: ({ complaintId, role }) => {
        const { socket } = get();
        if (socket && complaintId) {
          socket.emit("stopTyping", { complaintId, role });
        }
      },

      joinSupportRoom: () => {
        const { socket } = get();
        if (socket) {
          socket.emit("joinSupport");
        }
      },

      // Legacy alias for compatibility if needed, but safe to remove if subToGlobalEvents replaces it
      subscribeToMessages: () => get().subscribeToGlobalEvents("user")
    }),
    {
      name: "chat-storage",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        // Fix for old structure: if messages is an array, reset it to an object
        if (state && Array.isArray(state.messages)) {
          state.messages = {};
        }
        state.setHasHydrated(true);
      },
      partialize: (state) => ({
        complaints: state.complaints,
        selectedComplaint: state.selectedComplaint,
        userComplaint: state.userComplaint,
        messages: state.messages,
        isSoundEnabled: state.isSoundEnabled
      }),
    }
  )
);
