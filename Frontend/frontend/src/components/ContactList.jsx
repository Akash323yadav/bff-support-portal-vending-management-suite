import { useEffect, useState } from "react";
import api from "../api/axios";
import { useChatStore } from "../store";
import toast from "react-hot-toast";
import ChatContainer from "./ChatContainer";

function ContactList() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    const setSelectedComplaint = useChatStore(state => state.setSelectedComplaint);
    const onlineUsers = useChatStore(state => state.onlineUsers);

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const res = await api.get("/api/employees");
            setEmployees(res.data);
        } catch (err) {
            console.error("Failed to fetch employees", err);
            toast.error("Failed to load contacts");
        } finally {
            setLoading(false);
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

        // Set as selected complaint for the chat
        setSelectedComplaint(virtualComplaint);

        // Set selected employee for local state
        setSelectedEmployee(emp);

        toast.success(`Opened chat with ${emp.name}`);
    };

    const isEmployeeOnline = (mobile) => {
        const empId = `EMP_${mobile}`;
        return onlineUsers.includes(empId);
    };

    const filteredEmployees = employees.filter(e => {
        const term = searchTerm.toLowerCase();
        return e.name.toLowerCase().includes(term) || e.mobile.includes(term);
    });

    if (loading) {
        return (
            <div className="flex h-full bg-slate-950">
                <div className="flex items-center justify-center flex-1">
                    <div className="text-slate-500">Loading contacts...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full bg-slate-950">
            {/* Employee List - Left Side */}
            <div className="flex flex-col w-80 border-r border-slate-800 shrink-0">
                {/* Header */}
                <div className="p-6 border-b border-slate-800">
                    <h2 className="text-xl font-bold text-white mb-4">Employee Contacts</h2>

                    {/* Search Bar */}
                    <div className="relative">
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
                </div>

                {/* Contact List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-slate-700">
                    {filteredEmployees.length > 0 ? (
                        filteredEmployees.map((emp) => {
                            const isOnline = isEmployeeOnline(emp.mobile);
                            const isSelected = selectedEmployee?.id === emp.id;

                            return (
                                <div
                                    key={emp.id}
                                    onClick={() => handleContactClick(emp)}
                                    className={`group flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-200 ${isSelected
                                            ? 'bg-slate-800/80 shadow-lg shadow-cyan-500/10'
                                            : 'bg-slate-900/40 hover:bg-slate-800/60'
                                        }`}
                                >
                                    {/* Avatar with Online Indicator */}
                                    <div className="relative shrink-0">
                                        <div className="w-14 h-14 rounded-full flex items-center justify-center overflow-hidden shadow-lg border-2 border-slate-700/50 bg-gradient-to-br from-slate-700 to-slate-800">
                                            <span className="text-slate-300 font-bold text-xl">
                                                {emp.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        {/* Online/Offline Indicator */}
                                        {isOnline && (
                                            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-slate-950 bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)] animate-pulse"></div>
                                        )}
                                    </div>

                                    {/* Info Section */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-base text-white mb-0.5 truncate">
                                            {emp.name}
                                        </h3>
                                        <p className="text-sm text-slate-400 truncate font-medium">
                                            {emp.mobile}
                                        </p>
                                    </div>

                                    {/* Employee Badge */}
                                    <div className="shrink-0">
                                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                                            Employee
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-600">
                            <svg className="w-16 h-16 mb-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <p className="text-sm font-bold uppercase tracking-widest">
                                {searchTerm ? "No matching contacts" : "No contacts available"}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer Stats */}
                <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="font-medium">{filteredEmployees.length} contact{filteredEmployees.length !== 1 ? 's' : ''}</span>
                        <span className="font-medium">
                            {filteredEmployees.filter(e => isEmployeeOnline(e.mobile)).length} online
                        </span>
                    </div>
                </div>
            </div>

            {/* Chat Area - Right Side */}
            <div className="flex-1 flex flex-col">
                {selectedEmployee ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-slate-800 bg-slate-900/50">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden shadow-sm border border-slate-700 bg-gradient-to-br from-cyan-900 to-slate-800">
                                        <div className="w-full h-full flex items-center justify-center text-cyan-400 font-bold">
                                            {selectedEmployee.name.charAt(0).toUpperCase()}
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-950 flex items-center justify-center">
                                        <div className={`w-2 h-2 rounded-full ${isEmployeeOnline(selectedEmployee.mobile)
                                            ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]'
                                            : 'bg-slate-600'
                                            }`}></div>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">{selectedEmployee.name}</h3>
                                    <p className="text-xs text-slate-500">{selectedEmployee.mobile}</p>
                                </div>
                                {isEmployeeOnline(selectedEmployee.mobile) && (
                                    <span className="ml-auto text-[10px] text-green-500 font-bold uppercase tracking-wide">
                                        Online
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Chat Container */}
                        <div className="flex-1 overflow-hidden">
                            <ChatContainer role="support" hideHeader={true} />
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center text-slate-600">
                            <svg className="w-20 h-20 mx-auto mb-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <p className="text-sm font-bold uppercase tracking-widest">Select an employee to start chatting</p>
                            <p className="text-xs mt-2 text-slate-700">Choose a contact from the list</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ContactList;
