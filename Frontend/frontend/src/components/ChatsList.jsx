import { useEffect, useState, memo } from "react";
import { useChatStore } from "../store";

const ChatsList = memo(function ChatsList() {
  const [activeTab, setActiveTab] = useState("chats");
  const complaints = useChatStore(state => state.complaints);
  const setSelectedComplaint = useChatStore(state => state.setSelectedComplaint);
  const selectedComplaint = useChatStore(state => state.selectedComplaint);
  const onlineUsers = useChatStore(state => state.onlineUsers);
  const typingUsers = useChatStore(state => state.typingUsers);



  const sortedComplaints = [...complaints].sort((a, b) => {
    const dateA = new Date(a.last_activity || a.lastActivity || a.created_at || a.createdAt || 0);
    const dateB = new Date(b.last_activity || b.lastActivity || b.created_at || b.createdAt || 0);
    return dateB - dateA;
  });

  // Helper to format last seen time
  const formatLastSeen = (date) => {
    if (!date) return "New";
    const d = new Date(date);
    const now = new Date();
    const diffInSecs = Math.floor((now - d) / 1000);

    if (diffInSecs < 60) return "Just now";
    if (diffInSecs < 3600) return `${Math.floor(diffInSecs / 60)}m ago`;
    if (diffInSecs < 86400 && now.getDate() === d.getDate()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (diffInSecs < 172800) return "Yesterday";
    return d.toLocaleDateString([], { day: '2-digit', month: 'short' });
  };

  return (
    <div className="flex flex-col h-full">
      {/* TABS */}
      <div className="flex items-center gap-2 mb-6 px-1">
        <button
          onClick={() => setActiveTab("chats")}
          className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-xl transition-all duration-300 ${activeTab === "chats"
            ? "bg-cyan-600/20 text-cyan-400 shadow-lg shadow-cyan-900/20"
            : "text-slate-500 hover:text-slate-300"
            }`}
        >
          Chats
        </button>
        <button
          onClick={() => setActiveTab("contacts")}
          className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-xl transition-all duration-300 ${activeTab === "contacts"
            ? "bg-cyan-600/20 text-cyan-400 shadow-lg shadow-cyan-900/20"
            : "text-slate-500 hover:text-slate-300"
            }`}
        >
          Contacts
        </button>
      </div>

      {/* LIST */}
      <div className="space-y-1">
        {activeTab === "chats" ? (
          sortedComplaints.map((c, index) => {
            const cid = c.complaint_id || c.id;
            const selectedId = selectedComplaint?.complaint_id || selectedComplaint?.id;
            const isSelected = selectedId === cid;
            const isOnline = onlineUsers.includes(String(cid));

            return (
              <div
                key={cid}
                onClick={() => setSelectedComplaint(c)}
                className={`group flex items-center gap-4 p-3 rounded-2xl cursor-pointer transition-all duration-300 border ${isSelected
                  ? "bg-slate-800/80 border-slate-700 shadow-xl"
                  : "bg-transparent border-transparent hover:bg-slate-800/40"
                  }`}
              >
                {/* AVATAR */}
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center overflow-hidden shadow-sm">
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${c.customerMobile || c.customer_mobile || c.customerName || index}`}
                      alt="avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {isOnline && (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-slate-900 rounded-full shadow-sm"></div>
                  )}
                </div>

                {/* INFO */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className={`font-bold text-sm truncate ${isSelected ? "text-white" : "text-slate-200"}`}>
                      {c.customerName || c.customer_name || c.customerMobile || c.customer_mobile || "Unknown User"}
                    </p>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                      {formatLastSeen(c.last_activity || c.lastActivity || c.created_at || c.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    {typingUsers.includes(String(cid)) ? (
                      <p className="text-xs truncate font-bold text-cyan-400 italic animate-pulse">
                        typing...
                      </p>
                    ) : (
                      <p className={`text-xs truncate font-medium max-w-[120px] ${c.unread_count > 0 ? "text-cyan-400 font-bold" : "text-slate-500"}`}>
                        {c.last_message || c.customerMobile || c.customer_mobile || "No messages yet"}
                      </p>
                    )}
                    {c.unread_count > 0 ? (
                      <span className="bg-cyan-500 text-cyan-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg shadow-cyan-500/20 animate-bounce">
                        {c.unread_count}
                      </span>
                    ) : isOnline ? (
                      <span className="text-[9px] text-green-500 font-bold uppercase tracking-widest animate-pulse">Online</span>
                    ) : (
                      <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Last seen</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-slate-600">
            <p className="text-sm font-medium">No contacts available</p>
          </div>
        )}
      </div>
    </div>
  );
});

export default ChatsList;
