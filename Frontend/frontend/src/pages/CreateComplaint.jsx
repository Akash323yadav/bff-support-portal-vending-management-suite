import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { X, Search, MessageSquare, Loader2, ChevronDown } from "lucide-react";
import axios from "axios";
import api from "../api/axios";
import toast from "react-hot-toast";

/* =========================
   FILE → PREVIEW
========================= */
const fileToPreview = (file, setter) => {
  if (!file) return;
  const reader = new FileReader();
  reader.onloadend = () => setter(reader.result);
  reader.readAsDataURL(file);
};

function CreateComplaint() {
  const [complaintType, setComplaintType] = useState("Coffee");
  const [complaintDate, setComplaintDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [mobile, setMobile] = useState("");
  const [name, setName] = useState("");
  const [locationId, setLocationId] = useState("");
  const [machineId, setMachineId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [issue, setIssue] = useState("");
  const [description, setDescription] = useState("");

  /* CONDITIONAL */
  const [coilNumber, setCoilNumber] = useState("");
  const [drinkType, setDrinkType] = useState("");

  /* FILES */
  const [problemFile, setProblemFile] = useState(null);
  const [problemPreview, setProblemPreview] = useState(null);
  const [paymentFile, setPaymentFile] = useState(null);
  const [paymentPreview, setPaymentPreview] = useState(null);

  /* DYNAMIC DATA FROM API */
  const [clusters, setClusters] = useState([]);
  const [loadingClusters, setLoadingClusters] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [showFindChatModal, setShowFindChatModal] = useState(false);
  const [findMobile, setFindMobile] = useState("");
  const [chatLink, setChatLink] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  /* CUSTOM DROPDOWN STATE */
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const locationDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target)) {
        setShowLocationDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 🔥 Fetch Cluster Data on Mount
  useEffect(() => {
    const fetchClusters = async () => {
      try {
        const res = await api.get("/api/clusters");
        console.log("Clusters API Response:", res.data); // Helpful for debugging

        let data = [];
        if (Array.isArray(res.data)) {
          data = res.data;
        } else if (res.data && Array.isArray(res.data.clusters)) {
          data = res.data.clusters;
        } else if (res.data && Array.isArray(res.data.data)) {
          data = res.data.data;
        }

        setClusters(data);
      } catch (err) {
        console.error("Fetch clusters error:", err);
      } finally {
        setLoadingClusters(false);
      }
    };
    fetchClusters();
  }, []);

  // 🔥 Pre-fill from URL (for QR Scanner)
  useEffect(() => {
    const mId = searchParams.get("machineId");
    if (mId && clusters.length > 0) {
      const cluster = clusters.find(c => c.machineJSON?.split(',').includes(mId));
      if (cluster) {
        setLocationId(cluster.groupID.toString());
        setMachineId(mId);
      }
    }
  }, [searchParams, clusters]);

  const selectedCluster = useMemo(() => {
    return clusters.find(c => c.groupID.toString() === locationId);
  }, [clusters, locationId]);

  const machines = useMemo(() => {
    if (!selectedCluster?.machineJSON) return [];
    return selectedCluster.machineJSON.split(',').map(m => m.trim());
  }, [selectedCluster]);

  const [submitting, setSubmitting] = useState(false);

  const handleFindChat = async () => {
    if (!findMobile) {
      toast.error("Please enter your mobile number");
      return;
    }
    try {
      const res = await api.get(`/api/complaints?mobile=${findMobile}`);
      const userComplaints = res.data;
      if (userComplaints && userComplaints.length > 0) {
        const latest = userComplaints.sort((a, b) => b.id - a.id)[0];
        localStorage.setItem("userComplaintId", latest.id);
        navigate(`/userchat?complaintId=${latest.id}`);
      } else {
        toast.error("No complaints found for this mobile number.");
      }
    } catch (error) {
      console.error("Find chat error:", error);
      toast.error("Error searching for complaints.");
    }
  };

  const handleSubmit = async () => {
    if (submitting) return; // Prevent double clicks

    if (!mobile || !locationId || !machineId || !description) {
      toast.error("Please fill required fields (Mobile, Location, Machine, Description)");
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading("Submitting your complaint...");

    const formData = new FormData();
    formData.append("name", name);
    formData.append("mobile", mobile);
    formData.append("complaintType", complaintType);
    formData.append("complaintDate", complaintDate);
    // Send the ID, not the Name
    formData.append("locationId", locationId);
    formData.append("machineId", machineId);
    formData.append("paymentAmount", paymentAmount);
    formData.append("issue", issue);
    formData.append("description", description);

    if (complaintType === "Snacks") {
      formData.append("coilNumber", coilNumber);
      formData.append("drinkType", drinkType); // Sending Item Name as drinkType
    }
    if (complaintType === "Coffee") {
      formData.append("drinkType", drinkType);
      formData.append("coilNumber", ""); // Ensure coilNumber is empty for coffee
    }

    if (problemFile) formData.append("problemMedia", problemFile);
    if (paymentFile) formData.append("paymentImage", paymentFile);

    try {
      const res = await api.post("/api/complaints", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const data = res.data;
      const complaintId = data.complaintId;
      localStorage.setItem("userComplaintId", complaintId);

      const link = `${window.location.origin}/userchat?complaintId=${complaintId}`;
      setChatLink(link);

      toast.success("Complaint submitted successfully!", { id: toastId });
      setShowModal(true);
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Submit failed. Please try again.", { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex justify-center p-4 sm:p-6 overflow-x-hidden">
      <div className="w-full max-w-5xl bg-slate-900/50 border border-slate-800 rounded-3xl p-5 sm:p-8 text-slate-200 backdrop-blur-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl p-1.5 shadow-xl shrink-0">
              <img src="/logo.png" alt="BFF Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Raise a Complaint</h2>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">Beverages for friends</p>
            </div>
          </div>

          <button
            onClick={() => {
              const complaintId = localStorage.getItem("userComplaintId");
              if (complaintId) {
                navigate(`/userchat?complaintId=${complaintId}`);
              } else {
                setShowFindChatModal(true);
              }
            }}
            className="w-full sm:w-auto relative px-6 py-3 rounded-2xl flex items-center justify-center gap-3 text-sm font-bold transition-all duration-300 shadow-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white hover:scale-[1.02] active:scale-95"
          >
            <MessageSquare size={18} />
            <span>Help / Live Chat</span>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8">
          {/* COMPLAINT TYPE */}
          <div className="space-y-3">
            <label className="text-slate-400 text-xs font-black uppercase tracking-widest ml-1">Complaint Type</label>
            <div className="flex gap-3">
              {["Coffee", "Snacks"].map((t) => (
                <button
                  key={t}
                  onClick={() => setComplaintType(t)}
                  className={`flex-1 py-3.5 rounded-2xl border-2 transition-all font-bold text-sm ${complaintType === t
                    ? "border-cyan-500 bg-cyan-500/10 text-cyan-400 shadow-lg shadow-cyan-500/10"
                    : "border-slate-800 bg-slate-950/50 text-slate-500 hover:border-slate-700"
                    }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* DATE */}
          <div className="space-y-3">
            <label className="text-slate-400 text-xs font-black uppercase tracking-widest ml-1">Complaint Date</label>
            <input
              type="date"
              value={complaintDate}
              onChange={(e) => setComplaintDate(e.target.value)}
              className="input-dark w-full"
            />
          </div>

          <div className="space-y-3">
            <label className="text-slate-400 text-xs font-black uppercase tracking-widest ml-1">Mobile Number</label>
            <input className="input-dark w-full" placeholder="Enter your mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} />
          </div>

          <div className="space-y-3">
            <label className="text-slate-400 text-xs font-black uppercase tracking-widest ml-1">Your Name</label>
            <input className="input-dark w-full" placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-3 relative" ref={locationDropdownRef}>
            <label className="text-slate-400 text-xs font-black uppercase tracking-widest ml-1">Location</label>
            <button
              type="button"
              onClick={() => !loadingClusters && setShowLocationDropdown(!showLocationDropdown)}
              className="w-full bg-[#0f172a] border border-[#1e293b] text-left p-3 rounded-xl flex items-center justify-between transition-all outline-none focus:border-cyan-500 focus:shadow-[0_0_0_2px_rgba(6,182,212,0.1)]"
            >
              <span className={`text-sm ${locationId ? "text-slate-200" : "text-slate-500"}`}>
                {locationId
                  ? clusters.find((c) => c.groupID.toString() === locationId)?.groupName || "Unknown Location"
                  : loadingClusters
                    ? "Loading..."
                    : "Select Location"}
              </span>
              {loadingClusters ? (
                <Loader2 className="animate-spin text-cyan-500" size={16} />
              ) : (
                <ChevronDown size={16} className={`text-slate-500 transition-transform duration-200 ${showLocationDropdown ? "rotate-180" : ""}`} />
              )}
            </button>

            {showLocationDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#0f172a] border border-[#1e293b] rounded-xl z-50 max-h-64 overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200">
                {clusters.length > 0 ? (
                  clusters.map((c) => (
                    <button
                      key={c.groupID}
                      type="button"
                      onClick={() => {
                        setLocationId(c.groupID.toString());
                        setMachineId("");
                        setShowLocationDropdown(false);
                      }}
                      className="w-full text-left p-3 hover:bg-slate-800 text-sm text-slate-200 border-b border-slate-800/50 last:border-0 transition-colors flex items-center justify-between group"
                    >
                      <span className="truncate pr-4">{c.groupName}</span>
                      {locationId === c.groupID.toString() && <div className="w-2 h-2 rounded-full bg-cyan-500"></div>}
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-slate-500 text-xs font-bold uppercase tracking-wider">No locations found</div>
                )}
              </div>
            )}
          </div>

          {/* MACHINE ID */}
          <div className="space-y-3">
            <label className="text-slate-400 text-xs font-black uppercase tracking-widest ml-1">Machine ID</label>
            <select
              className="select-dark w-full"
              value={machineId}
              onChange={(e) => setMachineId(e.target.value)}
              disabled={!locationId}
            >
              <option value="">Select Machine ID</option>
              {machines.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <label className="text-slate-400 text-xs font-black uppercase tracking-widest ml-1">Payment Amount</label>
            <input className="input-dark w-full" placeholder="e.g. 20" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
          </div>

          <div className="space-y-3">
            <label className="text-slate-400 text-xs font-black uppercase tracking-widest ml-1">Issue Type</label>
            <select className="select-dark w-full" value={issue} onChange={(e) => setIssue(e.target.value)}>
              <option value="">Select Issue</option>
              <option>Payment deducted but no item</option>
              <option>Machine not working</option>
              <option>Product stuck</option>
            </select>
          </div>

          {/* CONDITIONAL FIELDS */}
          {complaintType === "Coffee" && (
            <div className="space-y-3">
              <label className="text-slate-400 text-xs font-black uppercase tracking-widest ml-1">Drink Name</label>
              <input
                className="input-dark w-full"
                placeholder="e.g. Tea, Espresso, Cappuccino"
                value={drinkType}
                onChange={(e) => setDrinkType(e.target.value)}
              />
            </div>
          )}

          {complaintType === "Snacks" && (
            <>
              <div className="space-y-3">
                <label className="text-slate-400 text-xs font-black uppercase tracking-widest ml-1">Item Name</label>
                <input
                  className="input-dark w-full"
                  placeholder="e.g. Lays, Dairy Milk, Kurkure"
                  value={drinkType}
                  onChange={(e) => setDrinkType(e.target.value)}
                />
              </div>
              <div className="space-y-3">
                <label className="text-slate-400 text-xs font-black uppercase tracking-widest ml-1">Coil Number</label>
                <input
                  className="input-dark w-full"
                  placeholder="e.g. 10, 22"
                  value={coilNumber}
                  onChange={(e) => setCoilNumber(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="md:col-span-2 space-y-3">
            <label className="text-slate-400 text-xs font-black uppercase tracking-widest ml-1">Description</label>
            <textarea className="input-dark w-full" rows={4} placeholder="Tell us more about the problem..." value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          {/* PHOTOS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:col-span-2 gap-6">
            <div className="space-y-3">
              <label className="text-slate-400 text-xs font-black uppercase tracking-widest ml-1">Problem Photo/Video</label>
              <div className="relative group">
                {problemPreview ? (
                  <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-slate-800">
                    <img src={problemPreview} className="w-full h-full object-cover" />
                    <button onClick={() => { setProblemFile(null); setProblemPreview(null); }} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-xl shadow-lg hover:bg-red-600 transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 bg-slate-950/50 border-2 border-dashed border-slate-800 rounded-2xl cursor-pointer hover:border-cyan-500/50 hover:bg-slate-900/50 transition-all">
                    <Search className="text-slate-600 mb-2" size={24} />
                    <span className="text-xs text-slate-500 font-bold">Click to upload</span>
                    <input type="file" className="hidden" accept="image/*,video/*" onChange={(e) => { setProblemFile(e.target.files[0]); fileToPreview(e.target.files[0], setProblemPreview); }} />
                  </label>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-slate-400 text-xs font-black uppercase tracking-widest ml-1">Payment Proof</label>
              <div className="relative group">
                {paymentPreview ? (
                  <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-slate-800">
                    <img src={paymentPreview} className="w-full h-full object-cover" />
                    <button onClick={() => { setPaymentFile(null); setPaymentPreview(null); }} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-xl shadow-lg hover:bg-red-600 transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 bg-slate-950/50 border-2 border-dashed border-slate-800 rounded-2xl cursor-pointer hover:border-cyan-500/50 hover:bg-slate-900/50 transition-all">
                    <Search className="text-slate-600 mb-2" size={24} />
                    <span className="text-xs text-slate-500 font-bold">Click to upload</span>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => { setPaymentFile(e.target.files[0]); fileToPreview(e.target.files[0], setPaymentPreview); }} />
                  </label>
                )}
              </div>
            </div>
          </div>

          <div className="md:col-span-2 pt-6">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={`w-full flex items-center justify-center gap-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-cyan-500/20 transition-all active:scale-95 ${submitting ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Complaint</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-10 max-w-sm w-full text-center shadow-2xl relative overflow-hidden group">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-green-500/10 rounded-full blur-3xl group-hover:bg-green-500/20 transition-all duration-700"></div>

            <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-green-500/20 shadow-lg shadow-green-500/10">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <h3 className="text-3xl font-black text-white mb-3 tracking-tight">Submitted!</h3>
            <p className="text-slate-400 text-sm mb-10 font-medium leading-relaxed">
              Your complaint has been registered successfully. You can now chat with our support team.
            </p>

            <div className="flex flex-col gap-4">
              <button
                onClick={() => navigate(`/userchat?complaintId=${localStorage.getItem("userComplaintId")}`)}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 py-4.5 rounded-2xl text-white font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-green-500/20 active:scale-95 flex items-center justify-center gap-3"
              >
                <MessageSquare size={20} />
                Start Live Chat
              </button>
              <button
                onClick={() => { setShowModal(false); window.location.reload(); }}
                className="w-full bg-slate-800/50 hover:bg-slate-800 py-4.5 rounded-2xl text-slate-400 hover:text-white font-black text-sm uppercase tracking-widest transition-all border border-slate-700/50 active:scale-95"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Find My Chat Modal */}
      {showFindChatModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-white flex items-center gap-3">
                <Search className="text-cyan-500" size={24} />
                Find Chat
              </h3>
              <button onClick={() => setShowFindChatModal(false)} className="text-slate-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-slate-400 text-xs font-black uppercase tracking-widest ml-1">Mobile Number</label>
                <input
                  type="tel"
                  placeholder="Enter your number"
                  value={findMobile}
                  onChange={(e) => setFindMobile(e.target.value)}
                  className="input-dark w-full"
                />
              </div>
              <button
                onClick={handleFindChat}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 text-sm uppercase tracking-widest shadow-xl shadow-cyan-500/20 transition-all"
              >
                <MessageSquare size={18} />
                Continue to Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreateComplaint;
