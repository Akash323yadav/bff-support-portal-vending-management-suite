import { useEffect, useState, memo } from "react";
import { useChatStore } from "../store";
import api from "../api/axios";
import toast from "react-hot-toast";

const ChatsList = memo(function ChatsList() {
  const [activeTab, setActiveTab] = useState("chats");
  const complaints = useChatStore(state => state.complaints);
  const setSelectedComplaint = useChatStore(state => state.setSelectedComplaint);
  const selectedComplaint = useChatStore(state => state.selectedComplaint);
  const onlineUsers = useChatStore(state => state.onlineUsers);
  const typingUsers = useChatStore(state => state.typingUsers);
  const clusters = useChatStore(state => state.clusters);
  const fetchClusters = useChatStore(state => state.fetchClusters);

  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    fetchClusters();
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await api.get("/api/employees");
      setEmployees(res.data);
    } catch (err) {
      console.error("Failed to fetch employees", err);
    }
  };

  const handleContactClick = (emp) => {
    // Create a virtual complaint object for the employee
    const virtualComplaint = {
      complaint_id: `EMP_${emp.mobile}`,
      id: `EMP_${emp.mobile}`,
      customerName: emp.name,
      customer_name: emp.name,
      customerMobile: emp.mobile,
      customer_mobile: emp.mobile,
      status: 'Active',
      isEmployeeChat: true,
      complaintType: 'Employee Support',
      created_at: new Date().toISOString(),
      last_activity: new Date().toISOString()
    };

    // Set as selected complaint
    setSelectedComplaint(virtualComplaint);

    // Switch to chats tab
    setActiveTab("chats");

    toast.success(`Opened chat with ${emp.name}`);
  };

  const getLocationName = (id) => {
    if (!id) return null;
    const found = clusters.find(c => String(c.groupID) === String(id));
    return found ? found.groupName : `#${id}`;
  };



  // 1. Sort by Date (Desc)
  const sortedByDate = [...complaints].sort((a, b) => {
    const dateA = new Date(a.last_activity || a.lastActivity || a.created_at || a.createdAt || 0);
    const dateB = new Date(b.last_activity || b.lastActivity || b.created_at || b.createdAt || 0);
    return dateB - dateA;
  });

  // 2. Group by Unique Mobile (Show only latest conversation per user)
  const uniqueUsersMap = new Map();
  sortedByDate.forEach(c => {
    const key = c.customerMobile || c.customer_mobile || `unknown_${c.id}`;
    if (!uniqueUsersMap.has(key)) {
      uniqueUsersMap.set(key, c);
    }
  });

  const sortedComplaints = Array.from(uniqueUsersMap.values());

  const [searchTerm, setSearchTerm] = useState("");

  const filteredComplaints = sortedComplaints.filter(c => {
    const name = c.customerName || c.customer_name || "";
    const mobile = c.customerMobile || c.customer_mobile || "";
    const term = searchTerm.toLowerCase();
    return name.toLowerCase().includes(term) || mobile.includes(term);
  });

  const filteredEmployees = employees.filter(e => {
    const term = searchTerm.toLowerCase();
    return e.name.toLowerCase().includes(term) || e.mobile.includes(term);
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
      {/* SEARCH BAR */}
      <div className="mb-4 px-1 relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search name or mobile..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-900/50 border border-slate-700 text-slate-200 text-sm rounded-xl py-2.5 pl-10 pr-4 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all placeholder:text-slate-600 font-medium"
        />
      </div>

      {/* TABS */}
      <div className="flex items-center gap-2 mb-4 px-1">
        <button
          onClick={() => setActiveTab("chats")}
          className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${activeTab === "chats"
            ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-lg shadow-cyan-500/10"
            : "text-slate-500 border border-transparent hover:bg-slate-800/50 hover:text-slate-300"
            }`}
        >
          Chats
        </button>
        <button
          onClick={() => setActiveTab("contacts")}
          className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${activeTab === "contacts"
            ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-lg shadow-cyan-500/10"
            : "text-slate-500 border border-transparent hover:bg-slate-800/50 hover:text-slate-300"
            }`}
        >
          Contacts
        </button>
      </div>

      {/* LIST */}
      <div className="space-y-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
        {activeTab === "chats" ? (
          filteredComplaints.length > 0 ? (
            filteredComplaints.map((c, index) => {
              const cid = c.complaint_id || c.id;
              const selectedId = selectedComplaint?.complaint_id || selectedComplaint?.id;
              const isSelected = String(selectedId) === String(cid);
              const isOnline = onlineUsers.includes(String(cid));

              const displayName = c.customerName || c.customer_name || "Unknown";
              const displayMobile = c.customerMobile || c.customer_mobile || "No Mobile";

              return (
                <div
                  key={cid || index}
                  onClick={() => setSelectedComplaint(c)}
                  className={`group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 border ${isSelected
                    ? "bg-cyan-950/30 border-cyan-500/30 shadow-lg shadow-cyan-900/20"
                    : "bg-transparent border-transparent hover:bg-slate-800/40 hover:border-slate-700/50"
                    }`}
                >
                  {/* AVATAR */}
                  <div className="relative shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden shadow-sm transition-all ${isSelected ? "ring-2 ring-cyan-500/40" : "border border-slate-700 bg-slate-800"}`}>
                      <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${displayMobile}`}
                        alt="avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#020617] rounded-full shadow-sm animate-pulse"></span>
                    )}
                  </div>

                  {/* INFO */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className={`font-bold text-xs truncate transition-colors ${isSelected ? "text-cyan-100" : "text-slate-300 group-hover:text-slate-100"}`}>
                        {displayName}
                      </p>
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wide shrink-0">
                        {formatLastSeen(c.last_activity || c.lastActivity || c.created_at || c.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex flex-col min-w-0 pr-2">
                        {typingUsers.includes(String(cid)) ? (
                          <p className="text-[10px] truncate font-bold text-cyan-400 italic animate-pulse">
                            typing...
                          </p>
                        ) : c.unread_count > 0 ? (
                          <p className="text-[10px] truncate font-bold text-white">
                            {c.last_message || "New Message"}
                          </p>
                        ) : (
                          <p className="text-[10px] truncate font-medium text-slate-500 group-hover:text-slate-400 transition-colors">
                            {displayMobile}
                          </p>
                        )}
                      </div>

                      {c.unread_count > 0 && (
                        <span className="bg-cyan-500 text-cyan-950 text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-lg shadow-cyan-500/20">
                          {c.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-600 opacity-60">
              <svg className="w-8 h-8 mb-2 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <p className="text-xs font-bold uppercase tracking-widest">No matching results</p>
            </div>
          )
        ) : (
          /* CONTACTS TAB */
          filteredEmployees.length > 0 ? (
            filteredEmployees.map((emp) => (
              <div
                key={emp.id}
                onClick={() => handleContactClick(emp)}
                className="group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 border bg-transparent border-transparent hover:bg-slate-800/40 hover:border-slate-700/50"
              >
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden shadow-sm border border-slate-700 bg-slate-800">
                    <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-sm">
                      {emp.name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="font-bold text-xs truncate text-slate-300 group-hover:text-slate-100">
                      {emp.name}
                    </p>
                    <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-wide shrink-0">
                      {emp.role || "Employee"}
                    </span>
                  </div>
                  <p className="text-[10px] truncate font-medium text-slate-500 group-hover:text-slate-400 transition-colors">
                    {emp.mobile}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-slate-600">
              <p className="text-xs font-bold uppercase tracking-widest">No contacts available</p>
            </div>
          )
        )}
      </div>
    </div>
  );
});

export default ChatsList;
