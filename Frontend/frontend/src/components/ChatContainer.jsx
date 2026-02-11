import { useEffect, useRef, useState } from "react";
import { X, Reply, Forward, Copy } from "lucide-react";
import { useChatStore } from "../store";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MsgBubble from "./MessageBubble";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";
import NoChatHistoryPlaceholder from "./NoChatHistoryPlaceholder";
import ForwardModal from "./ForwardModal";

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
  const setReplyingTo = useChatStore(state => state.setReplyingTo);
  const forwardingMessage = useChatStore(state => state.forwardingMessage);
  const setForwardingMessage = useChatStore(state => state.setForwardingMessage);

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
      if (role === "user" || role === "employee") {
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
      if (role === "user" || role === "employee") {
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
          if (document.hasFocus()) {
            socket.emit("markRead", { complaintId: cid, readerRole: role });
          }
        }
      };

      const handleFocus = () => {
        if (socket.connected) {
          socket.emit("markRead", { complaintId: cid, readerRole: role });
        }
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);
      window.addEventListener("focus", handleFocus);

      return () => {
        socket.off("connect", joinRoom);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        window.removeEventListener("focus", handleFocus);

        // 🔥 Clean up room on unmount
        if (cid) {
          socket.emit("leaveComplaint", cid);
        }
      };
    }
  }, [socket, activeComplaint, joinComplaintRoom, subscribeToGlobalEvents, role]);

  const [previewImage, setPreviewImage] = useState(null);
  const [messageMenu, setMessageMenu] = useState(null); // { messageId, message, x, y }

  // 🆕 Message Actions Handlers
  const handleReply = (msg) => {
    setReplyingTo({
      messageId: msg.id,
      text: msg.text || "Media",
      sender: msg.sender_type === "support" ? "Support" : "Customer"
    });
    setMessageMenu(null);
  };

  const handleForward = (msg) => {
    setForwardingMessage({
      messageId: msg.id,
      text: msg.text || "Media",
      imageUrl: msg.image_url,
      videoUrl: msg.video_url
    });
    setMessageMenu(null);
  };

  const handleCopy = (text) => {
    if (text) {
      navigator.clipboard.writeText(text);
      setMessageMenu(null);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setMessageMenu(null);
    if (messageMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [messageMenu]);

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

  // Scroll to referenced message
  const scrollToMessage = (messageId) => {
    const element = document.getElementById(`msg-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add highlight flash effect
      element.classList.add('ring-2', 'ring-cyan-400', 'ring-offset-2', 'ring-offset-[#0b141a]');
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-cyan-400', 'ring-offset-2', 'ring-offset-[#0b141a]');
      }, 1000);
    }
  };

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
        className="flex-1 px-4 sm:px-8 overflow-y-auto overflow-x-hidden py-6 sm:py-10 scrollbar-thin scrollbar-thumb-slate-700"
      >
        {loading && (!messages || messages.length === 0) ? (
          <MessagesLoadingSkeleton />
        ) : (Array.isArray(messages) && messages.length > 0) ? (
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

              // --- DATE SEPARATOR LOGIC ---
              const getDayLabel = (d1) => {
                const date = new Date(d1);
                const now = new Date();
                const yesterday = new Date();
                yesterday.setDate(now.getDate() - 1);

                if (date.toDateString() === now.toDateString()) return "Today";
                if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
                return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
              };

              const currentLabel = getDayLabel(msg.created_at);
              const prevLabel = idx > 0 ? getDayLabel(messages[idx - 1].created_at) : null;
              const showDateSeparator = currentLabel !== prevLabel;

              return (
                <div key={msg.id} className="w-full flex flex-col">
                  {showDateSeparator && (
                    <div className="flex justify-center my-4 sticky top-0 z-10">
                      <span className="bg-[#1f2c34]/90 backdrop-blur-sm text-[#8696a0] text-[11px] font-bold px-3 py-1 rounded-lg shadow-sm uppercase tracking-widest border border-slate-800/50">
                        {currentLabel}
                      </span>
                    </div>
                  )}

                  <MsgBubble
                    msg={msg}
                    role={role}
                    onReply={handleReply}
                    onForward={handleForward}
                    onContextMenu={setMessageMenu}
                    onPreviewImage={setPreviewImage}
                    onScrollToMessage={scrollToMessage}
                  />
                </div>
              );
            })}

            {/* TYPING INDICATOR */}
            {typingUsers && typingUsers.includes(String(cid)) && (
              <div className="flex w-full justify-start mb-4">
                <div className="bg-[#202c33] text-[#e9edef] rounded-lg rounded-tl-none flex items-center gap-1 py-2 px-3 shadow-sm border border-slate-700/30">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <NoChatHistoryPlaceholder role={role} />
        )}
      </div>

      {/* 🆕 MESSAGE CONTEXT MENU */}
      {messageMenu && (
        <div
          className="fixed z-[100] bg-slate-800/95 backdrop-blur-sm border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150"
          style={{
            top: `${messageMenu.y}px`,
            left: `${messageMenu.x}px`,
            transform: 'translate(-50%, -110%)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleReply(messageMenu.message)}
            className="w-full px-6 py-3 text-left text-sm font-semibold text-slate-200 hover:bg-slate-700 transition-colors flex items-center gap-3 min-w-[160px]"
          >
            <Reply size={18} className="text-cyan-400" />
            <span>Reply</span>
          </button>
          {role !== "user" && (
            <button
              onClick={() => handleForward(messageMenu.message)}
              className="w-full px-6 py-3 text-left text-sm font-semibold text-slate-200 hover:bg-slate-700 transition-colors flex items-center gap-3"
            >
              <Forward size={18} className="text-purple-400" />
              <span>Forward</span>
            </button>
          )}
          {messageMenu.message.text && (
            <button
              onClick={() => handleCopy(messageMenu.message.text)}
              className="w-full px-6 py-3 text-left text-sm font-semibold text-slate-200 hover:bg-slate-700 transition-colors flex items-center gap-3"
            >
              <Copy size={18} className="text-green-400" />
              <span>Copy</span>
            </button>
          )}
        </div>
      )}

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

      {/* 🆕 FORWARD MODAL */}
      <ForwardModal
        isOpen={!!forwardingMessage}
        onClose={() => setForwardingMessage(null)}
        messageToForward={forwardingMessage}
        role={role}
      />
    </div>
  );
}

export default ChatContainer;
