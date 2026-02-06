import { ArrowLeft } from "lucide-react";
import { useChatStore } from "../store";
import api from "../api/axios";
import toast from "react-hot-toast";

function ChatHeader({ role = "support" }) {
  const { selectedComplaint, setSelectedComplaint, userComplaint, onlineUsers, typingUsers } = useChatStore();

  // 🔥 Decide which info to show based on role and selection
  const activeComplaint = role === "support" ? selectedComplaint : userComplaint;

  const displayName = role === "support" && activeComplaint
    ? (activeComplaint.customerName || activeComplaint.customer_name || activeComplaint.customerMobile || activeComplaint.customer_mobile || "Unknown User")
    : "Customer Support";

  const cid = activeComplaint?.complaint_id || activeComplaint?.id;
  const isOnline = role === "support"
    ? (onlineUsers.includes(String(cid)) || onlineUsers.includes(Number(cid)))
    : true; // Support is always "online" for the user in this mock-up, or you could track support too

  return (
    <div className="flex items-center gap-4 p-4 border-b border-white/5 bg-[#020617]/80 backdrop-blur-xl shadow-sm z-10">

      {/* MOBILE BACK BUTTON – SUPPORT ONLY */}
      {role === "support" && (
        <button
          onClick={() => setSelectedComplaint(null)}
          className="sm:hidden text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
      )}

      {/* AVATAR (Dynamic for Support) */}
      <div className="relative">
        <div className={`w-10 h-10 rounded-full border border-slate-600 flex items-center justify-center overflow-hidden ${role === "user" ? "bg-white p-1" : "bg-slate-700"}`}>
          <img
            src={role === "user" ? "/logo.png" : `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName}`}
            alt="avatar"
            className="w-full h-full object-contain"
          />
        </div>
        {isOnline && (
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-slate-900 rounded-full"></div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-slate-100 font-bold text-base truncate tracking-tight">
          {displayName}
        </h3>

        <div className="flex items-center gap-2">
          {typingUsers.includes(String(cid)) ? (
            <p className="text-cyan-400 text-[11px] font-bold italic animate-pulse">typing...</p>
          ) : isOnline ? (
            <p className="text-green-400 text-[11px] font-bold animate-pulse">Online</p>
          ) : (
            <p className="text-slate-500 text-[10px] font-bold truncate">
              {activeComplaint?.last_activity || activeComplaint?.lastActivity
                ? `Last seen ${new Date(activeComplaint.last_activity || activeComplaint.lastActivity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : "Offline"}
            </p>
          )}
          <span className="text-slate-700">|</span>
          <p className="text-slate-500 text-[10px] font-black uppercase">Case #{cid}</p>
        </div>
      </div>

      {/* QUICK STATUS ACTIONS (Support Only) */}
      {role === "support" && activeComplaint && (
        <div className="flex items-center gap-2">
          <select
            value={activeComplaint.status || "Pending"}
            onChange={async (e) => {
              const newStatus = e.target.value;
              try {
                // 1. Update DB & Trigger Sockets (Backend will emit 'statusUpdated')
                await api.patch(`/api/complaints/${cid}/status`, { status: newStatus });

                // 2. Local UI Update immediately (Zustand)
                useChatStore.setState((state) => ({
                  selectedComplaint: { ...activeComplaint, status: newStatus },
                  complaints: state.complaints.map(c =>
                    (String(c.id || c.complaint_id) === String(cid)) ? { ...c, status: newStatus } : c
                  )
                }));

                // toast.success removed to prevent double popup (Socket listener handles it)
              } catch (err) {
                console.error("Failed to update status:", err);
                // toast.error("Failed to update status"); // Optional: keep error toast or rely on something else
              }
            }}
            className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border-none outline-none cursor-pointer transition-all appearance-none text-center
                ${activeComplaint.status === "Resolved" ? "bg-green-500/20 text-green-400 border border-green-500/30" :
                activeComplaint.status === "Pending" ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                  "bg-amber-500/20 text-amber-400 border border-amber-500/30"
              }`}
          >
            <option value="Pending" className="bg-slate-900 text-red-400">Pending</option>
            <option value="In Progress" className="bg-slate-900 text-amber-400">In Progress</option>
            <option value="Resolved" className="bg-slate-900 text-green-400">Resolved</option>
          </select>
        </div>
      )}
    </div>
  );
}

export default ChatHeader;
