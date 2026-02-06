import { useEffect, useRef, useState } from "react";
import { Check, CheckCheck, X } from "lucide-react";
import { useChatStore } from "../store";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";
import NoChatHistoryPlaceholder from "./NoChatHistoryPlaceholder";

function ChatContainer({ role = "support", hideHeader = false }) {
  const selectedComplaint = useChatStore(state => state.selectedComplaint);
  const userComplaint = useChatStore(state => state.userComplaint);
  const allMessages = useChatStore(state => state.messages);
  const fetchMessages = useChatStore(state => state.fetchMessages);
  const loading = useChatStore(state => state.loading);
  const typingUsers = useChatStore(state => state.typingUsers);
  const connectSocket = useChatStore(state => state.connectSocket);
  const disconnectSocket = useChatStore(state => state.disconnectSocket);
  const joinComplaintRoom = useChatStore(state => state.joinComplaintRoom);
  const subscribeToGlobalEvents = useChatStore(state => state.subscribeToGlobalEvents);
  const socket = useChatStore(state => state.socket);

  const scrollRef = useRef(null);

  //  Decide active complaint
  const activeComplaint =
    role === "support" ? selectedComplaint : userComplaint;

  const cid = activeComplaint ? String(activeComplaint.complaint_id || activeComplaint.id) : null;
  const messages = allMessages[cid] || [];

  //  Fetch messages
  useEffect(() => {
    if (cid) {
      fetchMessages(cid);
    }
  }, [cid, fetchMessages]);

  // Socket Connection & Room Join
  useEffect(() => {
    connectSocket();

    // 🔥 Force disconnect on tab close/minimize for faster offline status
    const handleUnload = () => {
      if (role === "user") {
        disconnectSocket();
      }
    };
    window.addEventListener("beforeunload", handleUnload);

    // Request notification permission - Optional check for Safari compatibility
    if (typeof Notification !== 'undefined' && Notification.permission === "default") {
      try {
        Notification.requestPermission();
      } catch (e) {
        console.warn("Notification request failed:", e);
      }
    }

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      // Only disconnect if user, support layout manages its own connection
      if (role === "user") {
        disconnectSocket();
      }
    };
  }, [connectSocket, disconnectSocket, role]);

  useEffect(() => {
    const cid = activeComplaint?.complaint_id || activeComplaint?.id;
    if (socket && cid) {
      const joinRoom = () => {
        joinComplaintRoom({ complaintId: cid, role });

        // 1. Mark as Delivered (I joined the room, I am receiving)
        socket.emit("markDelivered", { complaintId: cid, deliverToRole: role });

        // 2. Mark as Read ONLY if I am actually looking at the chat (focused)
        if (document.hasFocus()) {
          socket.emit("markRead", { complaintId: cid, readerRole: role });
        }
      };

      if (socket.connected) {
        joinRoom();
      }

      socket.on("connect", joinRoom);
      subscribeToGlobalEvents(role);

      // 🔥 Handle switching back to tab
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible' && socket.connected) {
          socket.emit("markDelivered", { complaintId: cid, deliverToRole: role });
          socket.emit("markRead", { complaintId: cid, readerRole: role });
        }
      };
      document.addEventListener("visibilitychange", handleVisibilityChange);

      return () => {
        socket.off("connect", joinRoom);
        document.removeEventListener("visibilitychange", handleVisibilityChange);

        // 🔥 Clean up room on unmount
        if (cid) {
          socket.emit("leaveComplaint", cid);
        }
      };
    }
  }, [socket, activeComplaint, joinComplaintRoom, subscribeToGlobalEvents, role]);

  const [previewImage, setPreviewImage] = useState(null);

  // Auto scroll - Using requestAnimationFrame to ensure DOM is ready
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current;
      // Use requestAnimationFrame to scroll after the next render cycle 
      // (ensures offsets are calculated correctly)
      requestAnimationFrame(() => {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      });
    }
  }, [messages]);

  //  Support needs selection, user does not
  if (!activeComplaint && role === "support") {
    return <NoChatHistoryPlaceholder role={role} />;
  }

  return (
    <div className="flex flex-col h-full bg-[#020617] overflow-hidden">
      {/* Header - Fixed height, won't shrink */}
      {!hideHeader && (
        <div className="shrink-0">
          <ChatHeader role={role} />
        </div>
      )}

      {/* MESSAGES AREA - This is the only scrollable part */}
      <div
        ref={scrollRef}
        className="flex-1 px-4 sm:px-8 overflow-y-auto py-6 sm:py-10 scrollbar-thin scrollbar-thumb-slate-700"
      >
        {loading && messages.length === 0 ? (
          <MessagesLoadingSkeleton />
        ) : messages.length > 0 ? (
          <div className="w-full space-y-1">
            {messages.map((msg, idx) => {
              // msg.sender_type is 'support' or 'customer'/'user'
              // role is 'support' or 'user'

              // Determine alignment relative to the Viewer
              const isSupportSender = msg.sender_type === "support" || msg.sender_type === "admin";
              let isMe = false;

              if (role === "support") {
                // I am Support. My messages are 'support' or 'admin'.
                isMe = isSupportSender;
              } else {
                // I am User. My messages are 'customer' or 'user'.
                isMe = !isSupportSender;
              }

              return (
                <div
                  key={msg.id}
                  className={`chat ${isMe ? "chat-end" : "chat-start"} mb-2`}
                >
                  <div
                    className={`chat-bubble max-w-[85%] sm:max-w-[70%] p-2 shadow-sm
                      ${isMe
                        ? "bg-[#005c4b] text-[#e9edef] rounded-tr-none" // WhatsApp Green (Me)
                        : "bg-[#202c33] text-[#e9edef] rounded-tl-none" // WhatsApp Dark Grey (Them)
                      }
                    `}
                  >
                    {(msg.image_url || msg.video_url) && (
                      <div
                        className="mb-1 overflow-hidden rounded-lg cursor-pointer hover:opacity-90 transition-opacity bg-slate-800/50 min-h-[150px] flex items-center justify-center"
                        style={{ aspectRatio: '16/9' }}
                        onClick={() => msg.image_url ? setPreviewImage(msg.image_url) : window.open(msg.video_url, '_blank')}
                      >
                        {msg.image_url && (
                          <img src={msg.image_url} alt="attachment" className="w-full h-full object-cover" loading="lazy" />
                        )}
                        {msg.video_url && (
                          <video src={msg.video_url} controls className="w-full h-auto object-cover" />
                        )}
                      </div>
                    )}

                    {/* Text Message */}
                    {msg.text && (
                      <p className="text-[14.2px] leading-[19px] whitespace-pre-wrap px-1 pt-1 font-normal">
                        {msg.text}
                      </p>
                    )}

                    {/* Timestamp & Ticks */}
                    <div className="text-[10px] text-[#8696a0] flex justify-end items-center gap-1 mt-1 select-none leading-3 h-3 min-w-[50px]">
                      <span>
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true
                        })}
                      </span>
                      {isMe && (
                        /* Ticks Logic */
                        msg.status === 'read' ? (
                          <CheckCheck size={16} className="text-[#53bdeb]" /> // Blue Double Tick
                        ) : (msg.status === 'delivered') ? (
                          <CheckCheck size={16} className="text-[#8696a0]" /> // Grey Double Tick
                        ) : (
                          // Fallback to Single Tick if status is missing or 'sent'
                          <Check size={16} className="text-[#8696a0]" /> // Single Grey Tick
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* TYPING INDICATOR */}
            {typingUsers.includes(String(cid)) && (
              <div className="chat chat-start mb-4">
                <div className="chat-bubble bg-[#202c33] text-[#e9edef] rounded-tl-none flex items-center gap-1 py-1.5 px-3">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <NoChatHistoryPlaceholder role={role} />
        )}
      </div>

      {/* INPUT AREA - Fixed at the bottom, won't shrink */}
      <div className="shrink-0">
        <MessageInput role={role} />
      </div>

      {/* LIGHTBOX PREVIEW */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 p-2 rounded-full transition-all"
          >
            <X size={24} />
          </button>
          <img
            src={previewImage}
            alt="Preview"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl cursor-zoom-out"
          />
        </div>
      )}
    </div>
  );
}

export default ChatContainer;
