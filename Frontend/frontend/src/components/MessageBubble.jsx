import { useState, useRef } from "react";
import { Check, CheckCheck, Reply, Forward, ChevronDown } from "lucide-react";

function MessageBubble({
    msg,
    role,
    onReply,
    onContextMenu,
    onPreviewImage,
    onScrollToMessage,
    onForward
}) {
    const [touchStart, setTouchStart] = useState(null);
    const [touchX, setTouchX] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);
    const threshold = 50; // Distance to trigger reply

    const isMe =
        (role === "support" && msg.sender_type === "support") ||
        (role === "employee" && msg.sender_type === "employee") ||
        (role === "user" && msg.sender_type !== "support" && msg.sender_type !== "employee");

    const handleTouchStart = (e) => {
        setTouchStart({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
        setIsSwiping(false);
    };

    const handleTouchMove = (e) => {
        if (!touchStart) return;
        const currentX = e.targetTouches[0].clientX;
        const currentY = e.targetTouches[0].clientY;
        const diffX = currentX - touchStart.x;
        const diffY = currentY - touchStart.y;

        // If movement is primarily vertical, ignore horizontal swipe
        if (Math.abs(diffY) > Math.abs(diffX)) return;

        // Only allow swiping right (diffX > 0)
        if (diffX > 0) {
            // Prevent default only if we are clearly swiping horizontally to avoid browser navigation gestures
            if (diffX > 10 && e.cancelable) {
                // e.preventDefault(); // Optional based on preference
            }
            setTouchX(Math.min(diffX, 100)); // Cap at 100px
            setIsSwiping(true);
        } else {
            setTouchX(0);
        }
    };

    const handleTouchEnd = () => {
        if (touchX > threshold) {
            onReply(msg);
        }
        setTouchStart(null);
        setTouchX(0);
        setIsSwiping(false);
    };

    // Reply Icon style calculation
    const replyIconOpacity = Math.min(touchX / threshold, 1);
    const replyIconScale = Math.min(touchX / threshold, 1);
    const replyIconTransform = `translateX(${Math.min(touchX, 50) - 40}px) scale(${replyIconScale})`;

    return (
        <div
            className="w-full relative overflow-hidden select-none touch-pan-y"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Swipe Reply Indicator Icon */}
            <div
                className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center text-slate-400 z-0 h-full w-12"
                style={{
                    opacity: replyIconOpacity,
                    transform: replyIconTransform,
                    transition: isSwiping ? 'none' : 'all 0.2s ease-out'
                }}
            >
                <div className="bg-slate-800/80 p-2 rounded-full backdrop-blur-sm border border-slate-700/50">
                    <Reply size={20} className="text-cyan-400" />
                </div>
            </div>

            {/* Message Content Container - Moves when swiped */}
            <div
                className={`flex w-full mb-2 ${isMe ? "justify-end" : "justify-start"} group relative transition-transform duration-200 ease-out`}
                style={{
                    transform: `translateX(${touchX}px)`,
                    transition: isSwiping ? 'none' : 'transform 0.2s ease-out'
                }}
            >
                <div
                    id={`msg-${msg.id}`}
                    onDoubleClick={() => onReply(msg)}
                    className={`max-w-[85%] sm:max-w-[70%] p-2 shadow-sm relative rounded-lg
            ${isMe
                            ? "bg-[#005c4b] text-[#e9edef] rounded-tr-none"
                            : "bg-[#202c33] text-[#e9edef] rounded-tl-none"
                        }
          `}
                >
                    {/* WhatsApp Style Dropdown Arrow (Hover) */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            onContextMenu({
                                message: msg,
                                x: rect.left,
                                y: rect.bottom + 5
                            });
                        }}
                        className={`
                            hidden sm:flex absolute top-0 right-0 z-20 p-1 opacity-0 group-hover:opacity-100 transition-opacity
                            bg-gradient-to-l from-black/40 via-black/20 to-transparent rounded-tr-lg rounded-bl-lg
                            hover:from-black/60 hover:via-black/40 text-slate-300 hover:text-white
                        `}
                    >
                        <ChevronDown size={14} />
                    </button>

                    {(msg.image_url || msg.video_url) && (
                        <div
                            className="mb-1 overflow-hidden rounded-lg cursor-pointer hover:opacity-90 transition-opacity bg-slate-800/50 min-h-[150px] flex items-center justify-center"
                            style={{ aspectRatio: '16/9' }}
                            onClick={() => msg.image_url ? onPreviewImage(msg.image_url) : window.open(msg.video_url, '_blank')}
                        >
                            {msg.image_url && (
                                <img src={msg.image_url} alt="attachment" className="w-full h-full object-cover" loading="lazy" />
                            )}
                            {msg.video_url && (
                                <video src={msg.video_url} controls className="w-full h-auto object-cover" />
                            )}
                        </div>
                    )}

                    {msg.text && msg.text.startsWith("📩 Forwarded message:") && (
                        <div className="flex items-center gap-1 mb-1 -ml-1">
                            <Forward size={12} className="text-slate-400 italic" />
                            <span className="text-[11px] italic text-slate-400 font-medium select-none">
                                Forwarded
                            </span>
                        </div>
                    )}

                    {msg.replied_message && (
                        <div
                            onClick={() => onScrollToMessage(msg.replied_message.id || msg.replyToMessageId)}
                            className="mb-1 border-l-4 border-cyan-500/50 bg-slate-800/30 rounded-r-lg p-2 px-3 cursor-pointer hover:bg-slate-700/50 transition-colors"
                        >
                            <p className="text-[11px] font-bold text-cyan-400 mb-0.5">
                                {msg.replied_message.sender_type === "support" ? "Support" : "Customer"}
                            </p>
                            <p className="text-[12px] text-slate-400 truncate">
                                {msg.replied_message.text}
                            </p>
                        </div>
                    )}

                    {msg.text && (() => {
                        let cleanText = msg.text.replace("📩 Forwarded message:\n\n", "").replace("📩 Forwarded message:", "");
                        if ((msg.image_url || msg.video_url) && cleanText.trim() === "[Media attachment]") {
                            return null;
                        }
                        return (
                            <p className="text-[14.2px] leading-[19px] whitespace-pre-wrap px-1 pt-0.5 font-normal">
                                {cleanText}
                            </p>
                        );
                    })()}

                    <div className="text-[10px] text-[#8696a0] flex justify-end items-center gap-1 mt-1 select-none leading-3 h-3 min-w-[50px]">
                        <span>
                            {new Date(msg.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true
                            })}
                        </span>
                        {isMe && (
                            msg.status === 'read' ? (
                                <CheckCheck size={16} className="text-[#53bdeb]" />
                            ) : (msg.status === 'delivered') ? (
                                <CheckCheck size={16} className="text-[#8696a0]" />
                            ) : (
                                <Check size={16} className="text-[#8696a0]" />
                            )
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MessageBubble;
