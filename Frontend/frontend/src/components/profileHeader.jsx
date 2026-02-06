import { Volume2, VolumeOff, LogOut, QrCode, Table } from "lucide-react";
import { Link } from "react-router-dom";
import { useChatStore } from "../store";

function ProfileHeader() {
  const { isSoundEnabled, toggleSound } = useChatStore();

  return (
    <div className="p-5 border-b border-slate-700/30">
      <div className="flex items-center justify-between">

        {/* LEFT: LOGO & INFO */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-white border border-slate-700 flex items-center justify-center overflow-hidden shadow-lg p-1">
              <img
                src="/logo.png"
                alt="BFF Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-slate-900 rounded-full shadow-sm"></div>
          </div>

          <div>
            <h3 className="text-slate-100 font-bold text-sm tracking-tight">
              BFF Support
            </h3>
            <p className="text-slate-500 text-[10px] font-medium uppercase tracking-widest">
              Admin Panel
            </p>
          </div>
        </div>

        {/* RIGHT: ACTIONS */}
        <div className="flex items-center gap-4">
          <Link
            to="/qr-manager"
            className="text-slate-500 hover:text-cyan-400 transition-all duration-300"
            title="QR Manager"
          >
            <QrCode className="w-5 h-5" />
          </Link>

          <Link
            to="/complaints"
            className="text-slate-500 hover:text-cyan-400 transition-all duration-300"
            title="Complaints Table"
          >
            <Table className="w-5 h-5" />
          </Link>

          <button
            onClick={toggleSound}
            className="text-slate-500 hover:text-cyan-400 transition-all duration-300"
            title="Toggle sound"
          >
            {isSoundEnabled ? (
              <Volume2 className="w-5 h-5" />
            ) : (
              <VolumeOff className="w-5 h-5" />
            )}
          </button>

          <button
            className="text-slate-500 hover:text-red-400 transition-all duration-300"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProfileHeader;
