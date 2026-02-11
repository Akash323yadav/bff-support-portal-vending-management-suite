import { useState, useRef, useEffect } from "react";
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

  const [selectedFile, setSelectedFile] = useState(null); // Actual file for upload

  const {
    selectedComplaint, // support
    userComplaint,     // user
    sendMessage,
    socket,
    replyingTo,
    setReplyingTo,
    sendTyping,
    sendStopTyping,
  } = useChatStore();

  const activeComplaint =
    role === "support" ? selectedComplaint : userComplaint;

  // Handle Paste Event
  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        setSelectedFile(file);
        setFileType("image");

        const previewUrl = URL.createObjectURL(file);
        setFilePreview(previewUrl);
        e.preventDefault();
        break;
      }
    }
  };

  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setText(val);

    const complaintId = activeComplaint?.complaint_id || activeComplaint?.id;
    if (complaintId) {
      sendTyping({ complaintId, role });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        sendStopTyping({ complaintId, role });
      }, 2000);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault(); // Handle both form submit and manual calls

    if (!text.trim() && !selectedFile) return;

    const complaintId = activeComplaint?.complaint_id || activeComplaint?.id;

    if (!complaintId) {
      toast.error("No complaint selected");
      return;
    }

    let imageUrl = null;
    let videoUrl = null;

    // 1. Upload File if exists
    if (selectedFile) {
      const formData = new FormData();
      formData.append("file", selectedFile); // Backend expects 'file'

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
    // Determine sender type - if it's an employee chat and role is user, use "employee"
    let senderType;
    if (role === "support") {
      senderType = "support";
    } else if (activeComplaint?.isEmployeeChat) {
      senderType = "employee";
    } else {
      senderType = "customer";
    }

    await sendMessage(complaintId, {
      text: text.trim(),
      image_url: imageUrl,
      video_url: videoUrl,
      sender_type: senderType,
      reply_to_message_id: replyingTo?.messageId || null, // 🆕 Include reply reference
    });

    setText("");
    setFilePreview(null);
    setFileType(null);
    setSelectedFile(null);
    setReplyingTo(null); // 🆕 Clear reply state
    if (fileInputRef.current) fileInputRef.current.value = "";

    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

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

    setSelectedFile(file); // Store file for upload

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

      {/* 🆕 REPLY PREVIEW */}
      {replyingTo && (
        <div className="mb-3 bg-slate-800/60 border-l-4 border-cyan-500 rounded-r-xl p-3 flex items-start gap-3 animate-in slide-in-from-bottom-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-cyan-400 mb-1">
              Replying to {replyingTo.sender}
            </p>
            <p className="text-sm text-slate-300 truncate">
              {replyingTo.text}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setReplyingTo(null)}
            className="text-slate-400 hover:text-red-400 transition-colors"
          >
            <X size={16} />
          </button>
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
              setSelectedFile(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
            <X size={12} />
          </button>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex gap-3 items-end">
        {/* SNIPPET TOGGLE BUTTON (Support Only) */}
        {role === "support" && (
          <button
            type="button"
            onClick={() => setShowSnippets(!showSnippets)}
            className={`p-2.5 rounded-xl transition-all mb-1 ${showSnippets
              ? "bg-amber-500/20 text-amber-500"
              : "text-slate-400 hover:text-amber-400 hover:bg-amber-400/10"
              }`}
            title="Quick Replies"
          >
            <Zap size={20} />
          </button>
        )}

        <div className="flex-1 relative">
          <textarea
            id="messageText"
            name="messageText"
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste} // Listener attached here
            className="w-full bg-slate-800/80 border border-slate-700/50 text-slate-200 px-4 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all placeholder:text-slate-500 text-sm resize-none scrollbar-thin scrollbar-thumb-slate-700 max-h-32"
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
          className="p-2.5 text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-xl transition-all mb-1"
          title="Attach media"
        >
          <Image size={20} />
        </button>

        <button
          type="submit"
          disabled={!text.trim() && !filePreview}
          className={`p-2.5 rounded-xl transition-all mb-1 ${text.trim() || filePreview
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
