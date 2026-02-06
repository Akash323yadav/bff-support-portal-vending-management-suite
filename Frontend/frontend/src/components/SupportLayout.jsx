import { Link, useLocation, Outlet } from "react-router-dom";
import {
    MessageSquare,
    LayoutDashboard,
    QrCode,
    Settings,
    LogOut,
    Sun,
    Moon,
    Volume2,
    VolumeOff,
    Menu,
    X,
    FileSpreadsheet,
    FileText
} from "lucide-react";
import { useState, useEffect } from "react";
import { useChatStore } from "../store";
import api from "../api/axios";

const PUBLIC_VAPID_KEY = "BA65hN5GKUVEzgN1esRaDPj0gIYZCQRWbPFkt2DFjMfJDWgR8JPQ_W3zjTrMLUTWlG3dNpev8cRdmLL915nyEM4";

function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, "+")
        .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

function SupportLayout() {
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const isSoundEnabled = useChatStore(state => state.isSoundEnabled);
    const toggleSound = useChatStore(state => state.toggleSound);
    const [pushStatus, setPushStatus] = useState("checking");

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
    };

    // State to hold export functions from child routes
    const [exportActions, setExportActions] = useState(null);

    const menuItems = [
        { path: "/support", icon: <MessageSquare size={20} />, label: "Live Chat" },
        { path: "/complaints", icon: <LayoutDashboard size={20} />, label: "Complaints" },
        { path: "/qr-manager", icon: <QrCode size={20} />, label: "QR Manager" },
    ];

    // Connect to socket for global notifications
    const connectSocket = useChatStore(state => state.connectSocket);
    const joinSupportRoom = useChatStore(state => state.joinSupportRoom);
    const subscribeToGlobalEvents = useChatStore(state => state.subscribeToGlobalEvents);
    const fetchComplaints = useChatStore(state => state.fetchComplaints);

    useEffect(() => {
        fetchComplaints(); // Initial global fetch
        const socket = connectSocket();
        if (socket) {
            joinSupportRoom();
            subscribeToGlobalEvents("support");
        }
    }, [connectSocket, joinSupportRoom, subscribeToGlobalEvents, fetchComplaints]);

    // PUSH NOTIFICATION REGISTRATION
    useEffect(() => {
        if (!('serviceWorker' in navigator)) return;

        if (Notification.permission === 'granted') {
            registerSupportPush();
        } else if (Notification.permission === 'denied') {
            setPushStatus('denied');
        } else {
            setPushStatus('default');
        }
    }, []);

    const registerSupportPush = async () => {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            const readyRegistration = await navigator.serviceWorker.ready;

            const subscription = await readyRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
            });

            await api.post("/api/support/subscribe", subscription);
            console.log("Support Push Subscribed!");
            setPushStatus('granted');
        } catch (err) {
            console.error("Support Push Error:", err);
            setPushStatus('error');
        }
    };

    const requestPermission = () => {
        if (!("Notification" in window)) {
            alert("Notification not supported in this browser");
            return;
        }
        if (window.location.protocol != "https:") {
            alert("Notification only supported in https");
            return;
        }
        Notification.requestPermission().then(perm => {
            if (perm === 'granted') registerSupportPush();
            else setPushStatus('denied');
        }).catch(err => {
            console.error("Notification Permission Error:", err);
            setPushStatus('error');
        });
    };

    // Close sidebar on mobile when route changes
    useEffect(() => {
        if (window.innerWidth < 1024) {
            setIsSidebarOpen(false);
        }
    }, [location.pathname]);

    return (
        <div className={`h-screen w-screen ${isDarkMode ? "bg-[#020617] text-slate-200" : "bg-slate-50 text-slate-900"} flex overflow-hidden fixed inset-0 transition-colors duration-500`}>

            {/* MOBILE OVERLAY */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* SIDEBAR */}
            <aside
                className={`
          fixed lg:relative h-full z-[70] transition-all duration-500 ease-in-out flex flex-col shrink-0 overflow-x-hidden
          ${isSidebarOpen ? "w-72 translate-x-0" : "w-72 -translate-x-full lg:w-20 lg:translate-x-0"} 
          ${isDarkMode ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200"} border-r backdrop-blur-2xl
        `}
            >
                {/* Logo Section */}
                <div className="p-6 flex items-center gap-4 border-b border-slate-800/50 shrink-0">
                    <div className="w-10 h-10 bg-white rounded-xl p-1.5 shadow-lg shrink-0">
                        <img src="/logo.png" alt="BFF Logo" className="w-full h-full object-contain" />
                    </div>
                    {isSidebarOpen && (
                        <div className="overflow-hidden whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300">
                            <h1 className={`font-black ${isDarkMode ? "text-white" : "text-slate-900"} tracking-tight`}>BFF ADMIN</h1>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Support Panel</p>
                        </div>
                    )}
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 p-4 space-y-2 mt-4 overflow-y-auto scrollbar-none">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`
                  flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group
                  ${isActive
                                        ? "bg-cyan-500 text-cyan-950 shadow-lg shadow-cyan-500/20 font-bold"
                                        : `${isDarkMode ? "text-slate-400 hover:bg-slate-800 hover:text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`
                                    }
                `}
                            >
                                <div className={`${isActive ? "text-cyan-950" : "text-cyan-500 group-hover:scale-110 transition-transform"}`}>
                                    {item.icon}
                                </div>
                                {isSidebarOpen && <span className="text-sm tracking-wide overflow-hidden whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300">{item.label}</span>}
                            </Link>
                        );
                    })}

                    {/* Dynamic Export Actions (Only for Complaints Page) */}
                    {isSidebarOpen && exportActions && location.pathname === "/complaints" && (
                        <div className="mt-8 pt-6 border-t border-slate-800/50 space-y-3">
                            <p className="px-4 text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-2">Export Data</p>
                            <button
                                onClick={exportActions.excel}
                                className="w-full flex items-center gap-4 px-4 py-3 rounded-xl bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500 hover:text-white transition-all text-xs font-bold"
                            >
                                <FileSpreadsheet size={18} />
                                Download Excel
                            </button>
                            <button
                                onClick={exportActions.pdf}
                                className="w-full flex items-center gap-4 px-4 py-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all text-xs font-bold"
                            >
                                <FileText size={18} />
                                Download PDF
                            </button>
                        </div>
                    )}
                </nav>

                {/* Bottom Actions */}
                <div className="p-4 border-t border-slate-800/50 space-y-2 shrink-0">
                    <button
                        onClick={toggleSound}
                        className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group ${isDarkMode ? "text-slate-400 hover:bg-slate-800 hover:text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}
                    >
                        <div className="text-blue-500 group-hover:scale-110 transition-transform">
                            {isSoundEnabled ? <Volume2 size={20} /> : <VolumeOff size={20} />}
                        </div>
                        {isSidebarOpen && <span className="text-sm font-medium overflow-hidden whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300">Sound: {isSoundEnabled ? "On" : "Off"}</span>}
                    </button>

                    <button className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group ${isDarkMode ? "text-slate-400 hover:bg-red-500/10 hover:text-red-400" : "text-slate-500 hover:bg-red-50 hover:text-red-600"}`}>
                        <LogOut size={20} className="text-red-500 group-hover:rotate-12 transition-transform" />
                        {isSidebarOpen && <span className="text-sm font-medium overflow-hidden whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300">Logout</span>}
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 flex flex-col relative overflow-hidden h-full">
                {/* NAVBAR */}
                <header className={`h-20 border-b backdrop-blur-md flex items-center justify-between px-4 sm:px-8 shrink-0 z-40 transition-colors duration-500 ${isDarkMode ? "bg-slate-900/30 border-slate-800/50" : "bg-white border-slate-200"}`}>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className={`p-2 rounded-xl transition-colors ${isDarkMode ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"}`}
                        >
                            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                        <h2 className={`text-lg sm:text-xl font-bold capitalize tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                            {menuItems.find(i => i.path === location.pathname)?.label || "Dashboard"}
                        </h2>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-6">
                        {/* PUSH NOTIFY STATUS */}
                        <div className="flex items-center gap-2">
                            {pushStatus === 'default' && (
                                <button onClick={requestPermission} className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg animate-pulse">
                                    Enable Notify
                                </button>
                            )}
                            {pushStatus === 'denied' && (
                                <span className="text-red-500 text-xs font-bold">Blocked</span>
                            )}
                        </div>

                        <button
                            onClick={toggleTheme}
                            className={`p-2.5 rounded-xl transition-all duration-300 shadow-sm ${isDarkMode ? "bg-slate-800/50 text-amber-400 hover:bg-slate-800" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                        >
                            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                        </button>

                        <div className={`flex items-center gap-3 pl-3 sm:pl-6 border-l ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>
                            <div className="text-right hidden sm:block">
                                <p className={`text-sm font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>Admin User</p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Super Admin</p>
                            </div>
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 p-0.5 shadow-lg">
                                <div className={`w-full h-full rounded-[10px] flex items-center justify-center overflow-hidden ${isDarkMode ? "bg-slate-900" : "bg-white"}`}>
                                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="avatar" />
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* PAGE CONTENT */}
                <div className="flex-1 relative overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                    {/* Background Glows */}
                    {isDarkMode && (
                        <>
                            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none"></div>
                            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none"></div>
                        </>
                    )}

                    <div className="relative z-10 h-full">
                        <Outlet context={{ setExportActions }} />
                    </div>
                </div>
            </main>
        </div>
    );
}

export default SupportLayout;
