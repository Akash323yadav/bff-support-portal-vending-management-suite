import { useState, useRef } from "react";
import { Send, Image, X, Zap } from "lucide-react";
import { useChatStore } from "../store";
import api from "../api/axios";
import toast from "react-hot-toast";

const SNIPPETS = [
  "Hello! Thank you for contacting BFF Support. How can I assist you today?",
  "I understand your concern. Let me check the details for you using your Complaint ID.",
  "We are currently reviewing your request. Please allow us a moment to investigate.",
  "Could you please elaborate on the issue? Sharing a photo or video would be very helpful.",
  "We have initiated the refund process for your failed transaction. It should reflect shortly.",
  "The issue has been resolved. Please check and confirm if everything is working fine now.",
  "Is there anything else regarding this issue that I can help you with?",
  "Thank you for your patience. Our technical team is looking into this on priority."
];

function MessageInput({ role = "support" }) {
  const [text, setText] = useState("");
  const [filePreview, setFilePreview] = useState(null); // URL for preview
  const [fileType, setFileType] = useState(null); // 'image' or 'video'
  const [showSnippets, setShowSnippets] = useState(false);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const {
    selectedComplaint, // support
    userComplaint,     // user
    sendMessage,
    socket,
  } = useChatStore();

  const activeComplaint =
    role === "support" ? selectedComplaint : userComplaint;

  const handleInputChange = (e) => {
    const val = e.target.value;
    setText(val);

    const complaintId = activeComplaint?.complaint_id || activeComplaint?.id;
    if (socket && complaintId) {
      socket.emit("typing", { complaintId, role });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stopTyping", { complaintId, role });
      }, 2000);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!text.trim() && !filePreview) return;

    const complaintId = activeComplaint?.complaint_id || activeComplaint?.id;

    if (!complaintId) {
      toast.error("No complaint selected");
      return;
    }

    let imageUrl = null;
    let videoUrl = null;

    // 1. Upload File if exists
    if (fileInputRef.current?.files[0]) {
      const file = fileInputRef.current.files[0];
      const formData = new FormData();
      formData.append("file", file); // Backend expects 'file'

      try {
        const uploadRes = await api.post("/api/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const { fileUrl, fileType: uploadedMimeType } = uploadRes.data;

        if (uploadedMimeType.startsWith("image/")) {
          imageUrl = fileUrl;
        } else if (uploadedMimeType.startsWith("video/")) {
          videoUrl = fileUrl;
        }

      } catch (err) {
        console.error("File upload failed:", err);
        toast.error("File upload failed");
        return;
      }
    }

    // 2. Send Message
    await sendMessage(complaintId, {
      text: text.trim(),
      image_url: imageUrl,
      video_url: videoUrl,
      sender_type: role === "user" ? "customer" : role,
    });

    setText("");
    setFilePreview(null);
    setFileType(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    // Stop typing indicator on send
    if (socket && (activeComplaint?.complaint_id || activeComplaint?.id)) {
      socket.emit("stopTyping", { complaintId: (activeComplaint.complaint_id || activeComplaint.id), role });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type.startsWith("image/")) {
      setFileType("image");
    } else if (file.type.startsWith("video/")) {
      setFileType("video");
    } else {
      toast.error("Only image or video files allowed");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setFilePreview(reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="p-4 bg-[#020617]/80 backdrop-blur-xl border-t border-white/5 relative z-20 shadow-[0_-5px_30px_rgba(0,0,0,0.5)]">
      {/* SNIPPETS POPUP */}
      {showSnippets && (
        <div className="absolute bottom-full left-4 mb-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2">
          <div className="p-2 space-y-1">
            {SNIPPETS.map((snippet, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setText(snippet);
                  setShowSnippets(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg transition-colors truncate"
                title={snippet}
              >
                {snippet}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* FILE PREVIEW */}
      {filePreview && (
        <div className="mb-3 relative w-24 group">
          {fileType === "image" ? (
            <img
              src={filePreview}
              alt="preview"
              className="rounded-xl border border-slate-600 shadow-lg w-full aspect-square object-cover"
            />
          ) : (
            <video
              src={filePreview}
              className="rounded-xl border border-slate-600 shadow-lg w-full aspect-square object-cover"
            />
          )}

          <button
            type="button"
            onClick={() => {
              setFilePreview(null);
              setFileType(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
            <X size={12} />
          </button>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex gap-3 items-center">
        {/* SNIPPET TOGGLE BUTTON (Support Only) */}
        {role === "support" && (
          <button
            type="button"
            onClick={() => setShowSnippets(!showSnippets)}
            className={`p-2.5 rounded-xl transition-all ${showSnippets
              ? "bg-amber-500/20 text-amber-500"
              : "text-slate-400 hover:text-amber-400 hover:bg-amber-400/10"
              }`}
            title="Quick Replies"
          >
            <Zap size={20} />
          </button>
        )}

        <div className="flex-1 relative">
          <input
            id="messageText"
            name="messageText"
            value={text}
            onChange={handleInputChange}
            className="w-full bg-slate-800/80 border border-slate-700/50 text-slate-200 px-4 py-2.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all placeholder:text-slate-500 text-sm"
            placeholder="Type your message here..."
          />
        </div>

        <input
          id="messageFile"
          name="messageFile"
          type="file"
          accept="image/*,video/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current.click()}
          className="p-2.5 text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-xl transition-all"
          title="Attach media"
        >
          <Image size={20} />
        </button>

        <button
          type="submit"
          disabled={!text.trim() && !filePreview}
          className={`p-2.5 rounded-xl transition-all ${text.trim() || filePreview
            ? "bg-cyan-600 text-white shadow-lg shadow-cyan-500/20 hover:bg-cyan-500"
            : "bg-slate-800 text-slate-500 cursor-not-allowed"
            }`}
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}

export default MessageInput;
