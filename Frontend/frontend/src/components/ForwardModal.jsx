import { useState, useEffect } from "react";
import { X, Send, Search, User, Users } from "lucide-react";
import api from "../api/axios";
import { useChatStore } from "../store";
import toast from "react-hot-toast";

function ForwardModal({ isOpen, onClose, messageToForward, role = "support" }) {
    const [searchQuery, setSearchQuery] = useState("");
    const [recipients, setRecipients] = useState([]);
    const [selectedRecipients, setSelectedRecipients] = useState([]); // 🆕 Changed to array
    const [recipientFilter, setRecipientFilter] = useState("all"); // 🆕 "all", "employee", "customer"
    const [loading, setLoading] = useState(false);
    const [forwarding, setForwarding] = useState(false);

    const sendMessage = useChatStore(state => state.sendMessage);
    const selectedComplaint = useChatStore(state => state.selectedComplaint);
    const userComplaint = useChatStore(state => state.userComplaint);

    // Get current active complaint based on role
    const activeComplaint = role === "support" ? selectedComplaint : userComplaint;
    const currentComplaintId = activeComplaint ? String(activeComplaint.complaint_id || activeComplaint.id) : null;

    useEffect(() => {
        if (isOpen) {
            fetchRecipients();
        }
    }, [isOpen]);

    const fetchRecipients = async () => {
        setLoading(true);
        try {
            // Get all complaints (customers)
            const complaintsRes = await api.get("/api/complaints");
            const complaints = complaintsRes.data || [];

            // Get all employees
            const employeesRes = await api.get("/api/employees");
            const employees = employeesRes.data || [];

            // Format recipients - 🆕 Employees first, then customers
            const allRecipients = [
                ...employees.map(e => ({
                    id: `EMP_${e.mobile}`,
                    name: e.name || "Unknown Employee",
                    mobile: e.mobile || "",
                    type: "employee",
                    label: `${e.name} (Team)`
                })),
                ...complaints.map(c => ({
                    id: c.id || c.complaint_id,
                    name: c.customerName || c.customer_name || "Unknown",
                    mobile: c.customerMobile || c.customer_mobile || "",
                    type: "customer",
                    label: `${c.customerName || c.customer_name} - #${c.id || c.complaint_id}`
                }))
            ];

            // 🔥 Filter out current complaint (don't show yourself in the list)
            const filteredRecipients = allRecipients.filter(r => {
                return String(r.id) !== String(currentComplaintId);
            });

            setRecipients(filteredRecipients);
        } catch (error) {
            console.error("Failed to fetch recipients:", error);
            toast.error("Failed to load contacts");
        } finally {
            setLoading(false);
        }
    };

    // 🆕 Toggle recipient selection
    const toggleRecipient = (recipient) => {
        setSelectedRecipients(prev => {
            const isSelected = prev.some(r => r.id === recipient.id);
            if (isSelected) {
                return prev.filter(r => r.id !== recipient.id);
            } else {
                return [...prev, recipient];
            }
        });
    };

    // 🆕 Select/Deselect All
    const selectAll = () => {
        setSelectedRecipients(filteredRecipients);
    };

    const deselectAll = () => {
        setSelectedRecipients([]);
    };

    const handleForward = async () => {
        if (selectedRecipients.length === 0 || !messageToForward) return;

        setForwarding(true);
        try {
            // Prepare forward message text
            let forwardText = "📩 Forwarded message:\n\n";
            if (messageToForward.text) {
                forwardText += messageToForward.text;
            } else {
                forwardText += "[Media attachment]";
            }

            // 🆕 Send to all selected recipients in parallel
            await Promise.all(
                selectedRecipients.map(recipient => {
                    // 🔥 Determine sender_type based on role and recipient
                    let senderType;
                    if (role === "support") {
                        senderType = "support";
                    } else if (recipient.type === "employee") {
                        senderType = "employee";
                    } else {
                        senderType = "customer";
                    }

                    return sendMessage(recipient.id, {
                        text: forwardText,
                        image_url: messageToForward.imageUrl || null,
                        video_url: messageToForward.videoUrl || null,
                        sender_type: senderType
                    });
                })
            );

            toast.success(`Message forwarded to ${selectedRecipients.length} recipient(s)!`);
            setSelectedRecipients([]); // Reset selection
            onClose();
        } catch (error) {
            console.error("Forward failed:", error);
            toast.error("Failed to forward message");
        } finally {
            setForwarding(false);
        }
    };

    // 🆕 Filter recipients by type and search query
    const filteredRecipients = recipients.filter(r => {
        // Filter by search query
        const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.mobile.includes(searchQuery);

        // Filter by recipient type
        const matchesType = recipientFilter === "all" || r.type === recipientFilter;

        return matchesSearch && matchesType;
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-700 rounded-3xl max-w-md w-full shadow-2xl relative overflow-hidden max-h-[80vh] flex flex-col">
                {/* Animated Background */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl"></div>

                {/* Header */}
                <div className="relative z-10 p-6 border-b border-slate-700/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
                                <Send size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-white">Forward Message</h2>
                                <p className="text-xs text-slate-400 font-medium">Choose a recipient</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all flex items-center justify-center border border-slate-700"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="mt-4 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                            type="text"
                            placeholder="Search by name or mobile..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all text-sm"
                        />
                    </div>

                    {/* 🆕 Filter Buttons */}
                    <div className="mt-3 flex gap-2">
                        <button
                            onClick={() => setRecipientFilter("all")}
                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${recipientFilter === "all"
                                    ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/30"
                                    : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50"
                                }`}
                        >
                            All ({recipients.length})
                        </button>
                        <button
                            onClick={() => setRecipientFilter("employee")}
                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${recipientFilter === "employee"
                                    ? "bg-purple-500 text-white shadow-lg shadow-purple-500/30"
                                    : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50"
                                }`}
                        >
                            👥 Employees ({recipients.filter(r => r.type === "employee").length})
                        </button>
                        <button
                            onClick={() => setRecipientFilter("customer")}
                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${recipientFilter === "customer"
                                    ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/30"
                                    : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50"
                                }`}
                        >
                            👤 Customers ({recipients.filter(r => r.type === "customer").length})
                        </button>
                    </div>

                    {/* 🆕 Selection Controls */}
                    <div className="mt-3 flex items-center justify-between">
                        <div className="text-xs text-slate-400">
                            {selectedRecipients.length > 0 ? (
                                <span className="text-cyan-400 font-bold">
                                    {selectedRecipients.length} selected
                                </span>
                            ) : (
                                <span>Select recipients</span>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={selectAll}
                                disabled={filteredRecipients.length === 0}
                                className="text-xs px-3 py-1.5 bg-cyan-500/10 text-cyan-400 rounded-lg hover:bg-cyan-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                            >
                                Select All
                            </button>
                            <button
                                onClick={deselectAll}
                                disabled={selectedRecipients.length === 0}
                                className="text-xs px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                </div>

                {/* Recipients List */}
                <div className="relative z-10 flex-1 overflow-y-auto p-4 space-y-2">
                    {loading ? (
                        <div className="text-center py-8 text-slate-500">Loading contacts...</div>
                    ) : filteredRecipients.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">No contacts found</div>
                    ) : (
                        filteredRecipients.map((recipient) => {
                            const isSelected = selectedRecipients.some(r => r.id === recipient.id);
                            return (
                                <button
                                    key={recipient.id}
                                    onClick={() => toggleRecipient(recipient)}
                                    className={`w-full p-3 rounded-xl transition-all flex items-center gap-3 ${isSelected
                                        ? "bg-cyan-500/20 border-2 border-cyan-500"
                                        : "bg-slate-800/50 border border-slate-700 hover:bg-slate-700/50"
                                        }`}
                                >
                                    {/* 🆕 Checkbox */}
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isSelected
                                        ? "bg-cyan-500 border-cyan-500"
                                        : "border-slate-600"
                                        }`}>
                                        {isSelected && (
                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>

                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${recipient.type === "employee" ? "bg-purple-500/20 text-purple-400" : "bg-cyan-500/20 text-cyan-400"
                                        }`}>
                                        {recipient.type === "employee" ? <Users size={18} /> : <User size={18} />}
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="font-bold text-sm text-slate-200">{recipient.name}</p>
                                        <p className="text-xs text-slate-500">{recipient.mobile}</p>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="relative z-10 p-6 border-t border-slate-700/50">
                    <button
                        onClick={handleForward}
                        disabled={selectedRecipients.length === 0 || forwarding}
                        className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${selectedRecipients.length > 0 && !forwarding
                            ? "bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white shadow-lg"
                            : "bg-slate-800 text-slate-500 cursor-not-allowed"
                            }`}
                    >
                        {forwarding ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Forwarding...
                            </>
                        ) : (
                            <>
                                <Send size={16} />
                                {selectedRecipients.length > 0
                                    ? `Forward to ${selectedRecipients.length} Recipient${selectedRecipients.length > 1 ? 's' : ''}`
                                    : 'Select Recipients'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ForwardModal;
