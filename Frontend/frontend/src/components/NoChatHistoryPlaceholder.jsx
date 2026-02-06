import { MessageCircle } from "lucide-react";

const NoChatHistoryPlaceholder = ({ role = "support" }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6 animate-in fade-in duration-1000">
      <div className="w-20 h-20 bg-gradient-to-br from-cyan-500/20 to-blue-500/10 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-cyan-500/10 animate-bounce-slow">
        <MessageCircle className="w-10 h-10 text-cyan-400" />
      </div>

      <h3 className="text-2xl font-bold text-slate-100 mb-3 tracking-tight">
        No messages yet
      </h3>

      <p className="text-slate-400 text-sm max-w-sm mb-8 leading-relaxed">
        {role === "support"
          ? "This complaint does not have any messages yet. Start the conversation to assist the user."
          : "Your complaint has been received. Our support team will assist you shortly. Please stay tuned!"}
      </p>

      <div className="h-px w-40 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>

      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default NoChatHistoryPlaceholder;
