import { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";
import { useChatStore } from "../store";
import ChatContainer from "../components/ChatContainer";
import StatusTimeline from "../components/StatusTimeline";
import api from "../api/axios";

const PUBLIC_VAPID_KEY = "BA65hN5GKUVEzgN1esRaDPj0gIYZCQRWbPFkt2DFjMfJDWgR8JPQ_W3zjTrMLUTWlG3dNpev8cRdmLL915nyEM4";

function urlBase64ToUint8Array(base64String) {
  if (!base64String) return new Uint8Array();
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");

  try {
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  } catch (e) {
    return new Uint8Array();
  }
}

function UserChatPage() {
  const [searchParams] = useSearchParams();
  const complaintId = searchParams.get("complaintId");

  // logic same as support page - use specific selectors
  const _hasHydrated = useChatStore(state => state._hasHydrated);
  const userComplaint = useChatStore(state => state.userComplaint);
  const setUserComplaint = useChatStore(state => state.setUserComplaint);

  const [notificationStatus, setNotificationStatus] = useState("checking");
  const [errorMessage, setErrorMessage] = useState(null);

  // Static styles memoized
  const containerStyle = useMemo(() => ({
    position: "fixed", top: 0, left: 0, width: "100%", height: "100dvh",
    maxHeight: "-webkit-fill-available", backgroundColor: "#020617",
    zIndex: 9999, overflow: "hidden",
  }), []);

  const chatBoxStyle = useMemo(() => ({
    position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
    zIndex: 10, display: "flex", flexDirection: "column", overflow: "hidden",
  }), []);

  useEffect(() => {
    if (!_hasHydrated || !complaintId) return;
    const fetchDetails = async () => {
      try {
        const res = await api.get(`/api/complaints/${complaintId}`);
        if (res.data) setUserComplaint(res.data);
      } catch (error) {
        console.error(error);
        setUserComplaint({ complaint_id: complaintId });
      }
    };
    fetchDetails();
  }, [_hasHydrated, complaintId]);

  useEffect(() => {
    if (!_hasHydrated || !complaintId) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (typeof Notification !== 'undefined') {
      if (Notification.permission === 'granted') registerPush();
      else setNotificationStatus(Notification.permission);
    }
  }, [_hasHydrated, complaintId]);

  const registerPush = async () => {
    try {
      await navigator.serviceWorker.register('/sw.js');
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
      });
      await api.post(`/api/complaints/${complaintId}/subscribe`, sub);
      setNotificationStatus("granted");
    } catch (err) { setNotificationStatus("error"); }
  };

  const handleEnableNotifications = () => {
    if (typeof Notification === 'undefined') {
      toast.error("Notifications are not supported on this device/browser.");
      return;
    }

    if (!window.isSecureContext) {
      toast.error("Notifications require HTTPS! Please use a secure connection.");
      return;
    }

    Notification.requestPermission().then(perm => {
      if (perm === 'granted') {
        registerPush();
        toast.success("Notifications Enabled!");
      } else if (perm === 'denied') {
        setNotificationStatus('denied');
        toast.error(
          "Notifications Blocked! Please go to Phone Settings > Apps > Browser > Notifications to enable them.",
          { duration: 6000 }
        );
      } else {
        setNotificationStatus(perm);
      }
    });
  };

  // Hydration + ID Match check for zero flicker
  const isReady = _hasHydrated && userComplaint && String(userComplaint.complaint_id || userComplaint.id) === String(complaintId);

  if (!isReady) {
    return (
      <div style={{ ...containerStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src="/logo.png" className="w-16 h-16 animate-pulse" alt="loading" />
      </div>
    );
  }

  // Progress logic for the thin bar
  const status = userComplaint?.status || "Pending";
  const progressWidth = status === "Resolved" ? "100%" : status === "In Progress" ? "50%" : "15%";
  const statusColor = status === "Resolved" ? "bg-green-500" : status === "In Progress" ? "bg-cyan-500" : "bg-amber-500";

  return (
    <div style={containerStyle}>
      <div style={chatBoxStyle}>
        <div className="flex flex-col h-full w-full bg-[#020617] overflow-hidden">

          {/* 💎 MINIMALIST INTEGRATED NAV */}
          <nav className="relative bg-slate-900/40 backdrop-blur-xl border-b border-white/5 px-4 md:px-6 py-3.5 shrink-0 z-50">
            <div className="w-full flex items-center justify-between">

              {/* Left: Branding & Status Line */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-[0_0_25px_rgba(255,255,255,0.1)] overflow-hidden">
                    <img src="/logo.png" className="w-8 h-8 object-contain" alt="BFF" />
                  </div>
                  {/* Blinking Online Badge on Logo */}
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#020617] rounded-full flex items-center justify-center border-2 border-[#020617]">
                    <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]"></div>
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-white uppercase tracking-wider">Live Support</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold">
                    <span className="uppercase tracking-tighter">Case #{complaintId}</span>
                    <span className="text-slate-700">•</span>
                    <span className={`uppercase tracking-tighter ${status === "Resolved" ? "text-green-500" : status === "In Progress" ? "text-cyan-500" : "text-amber-500"}`}>
                      {status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Modern Actions */}
              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleEnableNotifications}
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all active:scale-90
                    ${notificationStatus === 'granted' ? "bg-white/5 border-white/10 text-white/70" : "bg-red-500/10 border-red-500/20 text-red-500 animate-pulse"}
                  `}
                >
                  {notificationStatus === 'granted' ? <span className="text-sm">🔔</span> : <span className="text-sm">🔕</span>}
                </button>
                <div className="w-[1px] h-6 bg-white/10 mx-1"></div>
                <button
                  onClick={() => window.location.href = '/'}
                  className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-white/40 flex items-center justify-center hover:bg-white/10 hover:text-white transition-all active:scale-95"
                >
                  <span className="text-base font-light">✕</span>
                </button>
              </div>
            </div>

            {/* 🌊 Ultra-thin Glowing Progress Indicator */}
            <div className="absolute bottom-[-1px] left-0 w-full h-[1px] bg-white/5">
              <div
                className={`h-full ${statusColor} transition-all duration-1000 ease-out shadow-[0_0_15px_${status === "Resolved" ? "rgba(34,197,94,0.5)" : status === "In Progress" ? "rgba(6,182,212,0.5)" : "rgba(245,158,11,0.5)"}]`}
                style={{ width: progressWidth }}
              />
            </div>
          </nav>

          {/* Chat Container */}
          <div className="flex-1 overflow-hidden relative bg-[#020617]">
            <ChatContainer role="user" hideHeader={true} />
          </div>
        </div>
      </div>

      {/* Floating Notifications */}
      {errorMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[10000] bg-slate-900 border border-red-500/50 text-red-400 text-[11px] px-6 py-3 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-3">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="font-bold border-l border-slate-700 pl-3">CLOSE</button>
        </div>
      )}
    </div>
  );
}

export default UserChatPage;
