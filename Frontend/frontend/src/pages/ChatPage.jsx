import { useEffect } from "react";
import { useChatStore } from "../store";
import BorderAnimatedContainer from "../components/BorderAnimatedContainer";
import ChatsList from "../components/ChatsList";
import ChatContainer from "../components/ChatContainer";
import NoChatHistoryPlaceholder from "../components/NoChatHistoryPlaceholder";

import { ChevronLeft } from "lucide-react";

function ChatPage() {
  const _hasHydrated = useChatStore(state => state._hasHydrated);

  // Hook based selectors for reactivity
  const selectedComplaint = useChatStore(state => state.selectedComplaint);
  const setSelectedComplaint = useChatStore(state => state.setSelectedComplaint);
  const connectSocket = useChatStore(state => state.connectSocket);
  const disconnectSocket = useChatStore(state => state.disconnectSocket);
  const joinSupportRoom = useChatStore(state => state.joinSupportRoom);
  const subscribeToGlobalEvents = useChatStore(state => state.subscribeToGlobalEvents);
  const socket = useChatStore(state => state.socket);

  useEffect(() => {
    if (!_hasHydrated) return;

    connectSocket();
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
    return () => {
      // We don't disconnect here because SupportLayout manages it globally
    };
  }, [_hasHydrated, connectSocket]);

  useEffect(() => {
    if (socket && _hasHydrated) {
      if (socket.connected) {
        joinSupportRoom();
      }
      const handleReconnect = () => {
        joinSupportRoom();
      };
      socket.on("connect", handleReconnect);
      subscribeToGlobalEvents("support");
      return () => {
        socket.off("connect", handleReconnect);
      };
    }
  }, [socket, _hasHydrated, joinSupportRoom, subscribeToGlobalEvents]);

  if (!_hasHydrated) {
    return <div className="h-screen w-screen bg-[#020617] flex items-center justify-center">
      <img src="/logo.png" className="w-16 h-16 animate-pulse" alt="loading" />
    </div>;
  }

  return (
    <div className="h-[calc(100vh-80px)] p-2 sm:p-6 overflow-hidden">
      <BorderAnimatedContainer>
        {/* LEFT PANEL (Complaint List) */}
        <div
          className={`
            bg-[#0f172a]/80 backdrop-blur-md flex flex-col
            w-full lg:w-80 shrink-0
            ${selectedComplaint ? "hidden lg:flex" : "flex"}
            overflow-hidden border-r border-slate-700/30
          `}
        >
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-700">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Active Conversations</h3>
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${socket?.connected ? "bg-green-500 animate-pulse" : "bg-red-500"}`}></div>
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                  {socket?.connected ? "Live" : (
                    <button onClick={() => connectSocket()} className="text-cyan-500 hover:underline">Reconnect</button>
                  )}
                </span>
              </div>
            </div>
            <ChatsList />
          </div>
        </div>

        {/* RIGHT PANEL (Chat) */}
        <div
          className={`
            flex-1 flex flex-col bg-[#020617] relative
            ${selectedComplaint ? "flex" : "hidden lg:flex"}
            overflow-hidden relative
          `}
        >
          {selectedComplaint ? (
            <>
              {/* Mobile Back Button */}
              <button
                onClick={() => setSelectedComplaint(null)}
                className="lg:hidden absolute top-4 left-4 z-50 p-2 bg-slate-800/80 rounded-xl text-slate-300 hover:text-white transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              <ChatContainer />
            </>
          ) : (
            <NoChatHistoryPlaceholder />
          )}
        </div>
      </BorderAnimatedContainer>
    </div>
  );
}

export default ChatPage;
