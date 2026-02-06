import { useState } from "react";
import { CheckCircle2, Clock, PackageCheck, ChevronUp, ChevronDown } from "lucide-react";

/**
 * Modern Collapsible Status Tracker
 */
const StatusTimeline = ({ status, timestamps = {} }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const steps = [
        { label: "Submitted", id: "Pending", icon: PackageCheck, time: timestamps.createdAt },
        { label: "In Progress", id: "In Progress", icon: Clock, time: timestamps.inProgressAt },
        { label: "Resolved", id: "Resolved", icon: CheckCircle2, time: timestamps.resolvedAt },
    ];

    const getStatusIndex = (s) => {
        if (s === "Resolved") return 2;
        if (s === "In Progress") return 1;
        return 0; // Pending
    };

    const currentIndex = getStatusIndex(status);

    return (
        <div className="w-full bg-slate-900/60 border-b border-slate-800 backdrop-blur-xl transition-all duration-300 overflow-hidden">
            {/* Small Header for Timeline Toggle */}
            <div
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="flex items-center justify-between px-6 py-2 cursor-pointer hover:bg-slate-800/40 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Complaint Status: <span className="text-cyan-400">{status}</span>
                    </span>
                </div>
                {isCollapsed ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronUp size={14} className="text-slate-500" />}
            </div>

            {/* Actual Timeline (Hidden when collapsed) */}
            <div className={`transition-all duration-300 ease-in-out ${isCollapsed ? "max-h-0 opacity-0" : "max-h-40 opacity-100 pb-5 pt-2"}`}>
                <div className="max-w-2xl mx-auto flex items-start justify-between relative px-6">
                    {/* Connecting Lines */}
                    <div className="absolute top-4 left-[10%] right-[10%] h-0.5 bg-slate-800 -z-0">
                        <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                            style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
                        />
                    </div>

                    {/* Steps */}
                    {steps.map((step, index) => {
                        const isActive = index <= currentIndex;
                        const isCurrent = index === currentIndex;
                        const Icon = step.icon;

                        return (
                            <div key={step.label} className="flex flex-col items-center gap-1.5 relative z-10 flex-1">
                                {/* Icon Circle - Made Smaller (w-8 h-8) */}
                                <div className={`
                  w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-500 border-2
                  ${isActive
                                        ? "bg-slate-900 border-cyan-500 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                                        : "bg-slate-950 border-slate-800 text-slate-600"}
                  ${isCurrent ? "scale-105 border-cyan-400" : ""}
                `}>
                                    <Icon size={16} strokeWidth={2.5} />
                                </div>

                                {/* Label & Time - More Compact */}
                                <div className="flex flex-col items-center">
                                    <span className={`text-[9px] font-black uppercase tracking-tighter ${isActive ? "text-slate-200" : "text-slate-500"}`}>
                                        {step.label}
                                    </span>
                                    {step.time && (
                                        <span className="text-[8px] text-slate-500 font-bold">
                                            {new Date(step.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default StatusTimeline;
