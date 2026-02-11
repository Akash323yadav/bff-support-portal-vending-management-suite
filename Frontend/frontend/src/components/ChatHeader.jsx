import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useChatStore } from "../store";
import api from "../api/axios";
import toast from "react-hot-toast";

function ChatHeader({ role = "support" }) {
  const { selectedComplaint, setSelectedComplaint, userComplaint, onlineUsers, typingUsers, clusters } = useChatStore();

  // 🔥 Decide which info to show based on role and selection
  const activeComplaint = role === "support" ? selectedComplaint : userComplaint;

  const getLocationName = (id) => {
    if (!id) return "N/A";
    const found = clusters.find(c => String(c.groupID) === String(id));
    return found ? found.groupName : `Loc #${id}`;
  };

  const displayName = role === "support" && activeComplaint
    ? (activeComplaint.customerName || activeComplaint.customer_name || activeComplaint.customerMobile || activeComplaint.customer_mobile || "Unknown User")
    : "Customer Support";

  const cid = activeComplaint?.complaint_id || activeComplaint?.id;
  const isOnline = role === "support"
    ? (onlineUsers.includes(String(cid)) || onlineUsers.includes(Number(cid)))
    : true; // Support is always "online" for the user in this mock-up, or you could track support too

  // 🔥 Fetch Machine Name if missing (for legacy complaints)
  const [dynamicMachineName, setDynamicMachineName] = useState(null);

  useEffect(() => {
    // Reset when complaint changes
    setDynamicMachineName(null);

    const mId = activeComplaint?.machineId;
    const lId = activeComplaint?.locationId;
    // If we already have a machine name, don't fetch
    if (activeComplaint?.machineName) return;

    if (mId && lId && role === "support") {
      const fetchBlockName = async () => {
        try {
          const res = await api.get(`/api/locations?location=${lId}`);
          if (Array.isArray(res.data)) {
            const found = res.data.find(b => String(b.locationID) === String(mId));
            if (found) {
              setDynamicMachineName(found.locationName);
            }
          }
        } catch (err) {
          console.error("Failed to fetch block name", err);
        }
      };
      fetchBlockName();
    }
  }, [activeComplaint?.complaint_id, activeComplaint?.machineId, activeComplaint?.locationId, activeComplaint?.machineName, role]);

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
          <p className="text-slate-500 text-[10px] font-black uppercase max-w-[120px] truncate">{activeComplaint?.machineName || dynamicMachineName || activeComplaint?.machineId || "N/A"}</p>
          <span className="text-slate-700">|</span>
          <p className="text-slate-500 text-[10px] font-black uppercase max-w-[120px] truncate">{getLocationName(activeComplaint?.locationId)}</p>
        </div>
      </div>

      {/* QUICK STATUS ACTIONS (Support Only) */}
      {role === "support" && activeComplaint && (
        <div className="flex items-center gap-2">
          <div className="relative group">
            <div className={`absolute inset-0 rounded-full blur-[10px] transition-all opacity-40 group-hover:opacity-70 ${activeComplaint.status === "Resolved" ? "bg-emerald-500" :
              activeComplaint.status === "Pending" ? "bg-rose-500" :
                "bg-amber-500"
              }`}></div>
            <select
              value={activeComplaint.status || "Pending"}
              onChange={async (e) => {
                const newStatus = e.target.value;
                try {
                  await api.patch(`/api/complaints/${cid}/status`, { status: newStatus });

                  useChatStore.setState((state) => ({
                    selectedComplaint: { ...activeComplaint, status: newStatus },
                    complaints: state.complaints.map(c =>
                      (String(c.id || c.complaint_id) === String(cid)) ? { ...c, status: newStatus } : c
                    )
                  }));
                } catch (err) {
                  console.error("Failed to update status:", err);
                }
              }}
              className={`
              relative z-10
              appearance-none 
              px-4 py-2 
              rounded-full 
              text-[10px] 
              font-extrabold 
              uppercase 
              tracking-widest 
              cursor-pointer 
              transition-all 
              duration-300 
              text-center 
              w-[130px] 
              outline-none 
              border 
              shadow-lg
              backdrop-blur-xl
              ${activeComplaint.status === "Resolved"
                  ? "bg-slate-950/80 text-emerald-400 border-emerald-500/50 shadow-emerald-500/20 hover:border-emerald-400"
                  : activeComplaint.status === "Pending"
                    ? "bg-slate-950/80 text-rose-400 border-rose-500/50 shadow-rose-500/20 hover:border-rose-400"
                    : "bg-slate-950/80 text-amber-400 border-amber-500/50 shadow-amber-500/20 hover:border-amber-400"
                }
            `}
            >
              <option value="Pending" className="bg-slate-950 text-rose-400 font-bold py-2">Pending</option>
              <option value="In Progress" className="bg-slate-950 text-amber-400 font-bold py-2">In Progress</option>
              <option value="Resolved" className="bg-slate-950 text-emerald-400 font-bold py-2">Resolved</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatHeader;
