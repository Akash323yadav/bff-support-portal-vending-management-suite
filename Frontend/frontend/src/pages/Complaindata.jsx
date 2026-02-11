import { useState, useEffect, useRef, useMemo } from "react";
import { useChatStore } from "../store";
import DataTable from "react-data-table-component";
import { DateRangePicker } from "react-date-range";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useOutletContext } from "react-router-dom";
import {
  FaSearch,
  FaCalendarAlt,
  FaFilter,
  FaCheckCircle,
  FaClock,
  FaExclamationCircle,
  FaListUl
} from "react-icons/fa";
import api from "../api/axios";
import {
  startOfToday,
  endOfToday,
  startOfYesterday,
  endOfYesterday,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfWeek,
  endOfWeek,
  subWeeks,
} from "date-fns";

/* ================= DATE FILTER COMPONENT ================= */

function DateFilter({ onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const [range, setRange] = useState({
    startDate: subMonths(new Date(), 1),
    endDate: endOfToday(),
    key: "selection",
  });

  useEffect(() => {
    onChange(range);
  }, [range, onChange]);

  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const applyRange = (r, e) => {
    e.stopPropagation();
    setRange(r);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-200 hover:border-cyan-500/50 transition-all shadow-lg"
      >
        <div className="flex items-center gap-2">
          <FaCalendarAlt className="text-cyan-500" />
          <span className="text-sm font-medium">
            {range.startDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} – {range.endDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
          </span>
        </div>
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute left-0 sm:left-auto sm:right-0 lg:left-0 z-[100] mt-3 bg-slate-900 border border-slate-700 rounded-3xl p-4 sm:p-6 shadow-2xl shadow-black/50 min-w-[300px] sm:min-w-max animate-in fade-in zoom-in duration-200"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6 pb-6 border-b border-slate-800">
            {[
              { label: "Today", start: startOfToday(), end: endOfToday() },
              { label: "Yesterday", start: startOfYesterday(), end: endOfYesterday() },
              { label: "This Week", start: startOfWeek(new Date(), { weekStartsOn: 1 }), end: endOfToday() },
              { label: "Last Week", start: startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }), end: endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }) },
              { label: "This Month", start: startOfMonth(new Date()), end: endOfMonth(new Date()) },
              { label: "Last Month", start: startOfMonth(subMonths(new Date(), 1)), end: endOfMonth(subMonths(new Date(), 1)) },
            ].map((opt) => (
              <button
                key={opt.label}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 text-[10px] sm:text-xs font-bold hover:bg-cyan-500 hover:text-cyan-950 hover:border-cyan-400 transition-all"
                onClick={(e) => applyRange({ startDate: opt.start, endDate: opt.end, key: "selection" }, e)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="custom-date-range-picker overflow-x-auto">
            <DateRangePicker
              ranges={[range]}
              onChange={(item) => setRange(item.selection)}
              months={window.innerWidth < 640 ? 1 : 2}
              direction={window.innerWidth < 640 ? "vertical" : "horizontal"}
              inputRanges={[]}
              rangeColors={["#06b6d4"]}
            />
          </div>
        </div>
      )}
      <style>{`
        .custom-date-range-picker .rdrCalendarWrapper { background: transparent !important; color: #e2e8f0 !important; }
        .custom-date-range-picker .rdrMonthAndYearPickers select { color: #06b6d4 !important; background: #1e293b !important; border-radius: 6px !important; }
        .custom-date-range-picker .rdrDayToday .rdrDayNumber span:after { background: #06b6d4 !important; }
        .custom-date-range-picker .rdrDayPassive .rdrDayNumber span { color: #334155 !important; }
        .custom-date-range-picker .rdrDay:hover .rdrDayNumber { background: #1e293b !important; border-radius: 8px !important; }
      `}</style>
    </div>
  );
}

/* ================= MAIN TABLE ================= */

function ComplaintTable() {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState(null);
  const [loading, setLoading] = useState(true);
  const { setExportActions } = useOutletContext();

  useEffect(() => {
    // 1. Initial Fetch
    api.get("/api/complaints")
      .then((res) => {
        setRows(Array.isArray(res.data) ? res.data : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    // 2. 🆕 Socket Listener: Table Auto-update
    const socket = useChatStore.getState().socket;

    if (socket) {
      const handleStatusChangeSocket = ({ complaintId, status }) => {
        setRows((prev) =>
          prev.map((row) => (String(row.id) === String(complaintId)) ? { ...row, status } : row)
        );
      };

      socket.on("statusUpdated", handleStatusChangeSocket);
      socket.on("complaintStatusChanged", handleStatusChangeSocket); // Support dashboard wide event

      return () => {
        socket.off("statusUpdated", handleStatusChangeSocket);
        socket.off("complaintStatusChanged", handleStatusChangeSocket);
      };
    }
  }, []);

  const dateFilteredData = useMemo(() => {
    return rows.filter((r) => {
      const dateVal = r.created_at || r.createdAt;
      if (!dateRange || !dateRange.startDate || !dateVal) return true;
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return true;
      const start = new Date(dateRange.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(dateRange.endDate);
      end.setHours(23, 59, 59, 999);
      return d >= start && d <= end;
    });
  }, [rows, dateRange]);

  const stats = useMemo(() => {
    const total = dateFilteredData.length;
    const pending = dateFilteredData.filter(r => r.status === "Pending").length;
    const inProgress = dateFilteredData.filter(r => r.status === "In Progress").length;
    const resolved = dateFilteredData.filter(r => r.status === "Resolved").length;
    return { total, pending, inProgress, resolved };
  }, [dateFilteredData]);

  const filteredData = useMemo(() => {
    return dateFilteredData.filter((r) => {
      const searchLower = search.toLowerCase();
      // Robust accessors
      const cName = r.customerName || r.customer_name || "";
      const cMobile = r.customerMobile || r.customer_mobile || "";
      const mId = r.machineId || r.machine_id || "";
      const lId = r.locationId || r.location_id || "";
      const cType = r.complaintType || r.complaint_type || "";
      const dType = r.drinkType || r.drink_type || "";
      const desc = r.description || "";
      const stat = r.status || "";

      return (
        String(cName).toLowerCase().includes(searchLower) ||
        String(cMobile).includes(search) ||
        String(mId).toLowerCase().includes(searchLower) ||
        String(lId).toLowerCase().includes(searchLower) ||
        String(cType).toLowerCase().includes(searchLower) ||
        String(dType).toLowerCase().includes(searchLower) ||
        String(r.coilNumber || r.coil_number || "").toLowerCase().includes(searchLower) || // Added coil search
        String(desc).toLowerCase().includes(searchLower) ||
        String(stat).toLowerCase().includes(searchLower) ||
        String(r.id || "").includes(search)
      );
    });
  }, [dateFilteredData, search]);

  useEffect(() => {
    setExportActions({
      excel: () => exportExcel(filteredData),
      pdf: () => exportPDF(filteredData)
    });
    return () => setExportActions(null);
  }, [filteredData, setExportActions]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.patch(`/api/complaints/${id}/status`, { status: newStatus });
      setRows((prev) =>
        prev.map((row) => (row.id === id ? { ...row, status: newStatus } : row))
      );
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const columns = [
    {
      name: "ID",
      selector: (r) => r.id,
      width: "70px",
      cell: (r) => <span className="font-mono text-cyan-500 font-bold text-xs">#{r.id}</span>
    },
    {
      name: "Customer",
      selector: (r) => r.customerName || r.customer_name,
      width: "140px",
      cell: (r) => <span className="font-bold text-slate-100 text-xs">{r.customerName || r.customer_name || "Unknown"}</span>
    },
    {
      name: "Mobile",
      selector: (r) => r.customerMobile || r.customer_mobile,
      width: "120px",
      cell: (r) => <span className="text-[11px] text-slate-400 font-bold tracking-wider">{r.customerMobile || r.customer_mobile}</span>
    },
    {
      name: "Machine",
      width: "130px",
      cell: (r) => (
        <div className="flex flex-col">
          <span className="font-bold text-cyan-400 text-[10px] tracking-tight">{r.machineId || r.machine_id}</span>
          <span className="text-[9px] text-slate-500 font-medium">{r.locationId || r.location_id}</span>
        </div>
      )
    },
    {
      name: "Coil",
      selector: (r) => r.coilNumber || r.coil_number,
      width: "70px",
      cell: (r) => <span className="text-[10px] font-black text-amber-500">{r.coilNumber || r.coil_number || "—"}</span>
    },
    {
      name: "Type",
      selector: (r) => r.complaintType || r.complaint_type,
      width: "90px",
      cell: (r) => <span className="font-bold text-slate-200 text-[10px] uppercase tracking-widest">{r.complaintType || r.complaint_type}</span>
    },
    {
      name: "Product/Item",
      selector: (r) => r.drinkType || r.drink_type,
      width: "130px",
      cell: (r) => (
        <span className="text-[10px] text-slate-300 font-bold tracking-tight">
          {r.complaintType === "Coffee" ? "☕ " : "🍿 "}
          {r.drinkType || r.drink_type || "—"}
        </span>
      )
    },
    {
      name: "Description",
      selector: (r) => r.description,
      wrap: true,
      grow: 3,
      cell: (r) => <p className="text-[11px] text-slate-300 leading-relaxed py-3 pr-4">{r.description || "—"}</p>
    },
    {
      name: "Media",
      width: "100px",
      cell: (r) => (
        <div className="flex gap-2">
          {(r.problemMediaUrl || r.problem_media_url) && (
            <a href={r.problemMediaUrl || r.problem_media_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-cyan-400 hover:bg-cyan-500 hover:text-cyan-950 transition-all" title="Problem Media">
              <FaExclamationCircle size={12} />
            </a>
          )}
          {(r.paymentImageUrl || r.payment_image_url) && (
            <a href={r.paymentImageUrl || r.payment_image_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-green-400 hover:bg-green-500 hover:text-green-950 transition-all" title="Payment Proof">
              <FaClock size={12} />
            </a>
          )}
        </div>
      ),
    },
    {
      name: "Status",
      width: "150px",
      cell: (r) => (
        <div className="relative w-full flex items-center justify-center group">
          <div className={`absolute inset-0 rounded-full blur-[10px] transition-all opacity-40 group-hover:opacity-70 ${r.status === "Resolved" ? "bg-emerald-500" :
            r.status === "Pending" ? "bg-rose-500" :
              "bg-amber-500"
            }`}></div>
          <select
            value={r.status}
            onChange={(e) => handleStatusChange(r.id, e.target.value)}
            className={`
              relative z-10
              appearance-none 
              px-4 py-2 
              rounded-full 
              text-[10px] 
              font-extrabold 
              uppercase 
              tracking-widest 
              cursor-pointer 
              transition-all 
              duration-300 
              text-center 
              w-[130px] 
              outline-none 
              border 
              shadow-lg
              backdrop-blur-xl
              ${r.status === "Resolved"
                ? "bg-slate-950/80 text-emerald-400 border-emerald-500/50 shadow-emerald-500/20 hover:border-emerald-400"
                : r.status === "Pending"
                  ? "bg-slate-950/80 text-rose-400 border-rose-500/50 shadow-rose-500/20 hover:border-rose-400"
                  : "bg-slate-950/80 text-amber-400 border-amber-500/50 shadow-amber-500/20 hover:border-amber-400"
              }
            `}
          >
            <option value="Pending" className="bg-slate-950 text-rose-400 font-bold py-2">Pending</option>
            <option value="In Progress" className="bg-slate-950 text-amber-400 font-bold py-2">In Progress</option>
            <option value="Resolved" className="bg-slate-950 text-emerald-400 font-bold py-2">Resolved</option>
          </select>
        </div>
      ),
    },
    {
      name: "Date",
      width: "130px",
      cell: (r) => {
        const d = new Date(r.created_at || r.createdAt);
        return (
          <div className="flex flex-col items-end w-full pr-4">
            <span className="text-slate-200 font-bold text-[10px]">{d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
            <span className="text-[9px] text-slate-500 font-bold">{d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        );
      }
    },
  ];

  const customStyles = {
    table: { style: { backgroundColor: "transparent" } },
    header: { style: { display: "none" } },
    headRow: {
      style: {
        backgroundColor: "#0f172a",
        borderTopLeftRadius: "20px",
        borderTopRightRadius: "20px",
        borderBottom: "1px solid #1e293b",
        minHeight: "50px"
      }
    },
    headCells: {
      style: { color: "#94a3b8", fontWeight: "900", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em" },
    },
    rows: {
      style: {
        backgroundColor: "rgba(15, 23, 42, 0.4)",
        color: "#f1f5f9",
        borderBottom: "1px solid #1e293b",
        minHeight: "48px",
        '&:hover': {
          backgroundColor: "rgba(30, 41, 59, 0.6)",
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        },
      },
    },
    pagination: {
      style: {
        backgroundColor: "#0f172a",
        color: "#94a3b8",
        borderBottomLeftRadius: "20px",
        borderBottomRightRadius: "20px",
        borderTop: "1px solid #1e293b",
        fontSize: "11px",
        fontWeight: "700",
        padding: "8px 0"
      },
      pageButtonsStyle: {
        color: "#06b6d4",
        fill: "#06b6d4",
        '&:disabled': { color: "#334155", fill: "#334155" },
        '&:hover:not(:disabled)': { backgroundColor: "#1e293b" }
      }
    },
    select: {
      style: {
        color: "#f1f5f9",
        backgroundColor: "#1e293b",
        border: "1px solid #334155",
        borderRadius: "8px",
        padding: "4px",
        cursor: "pointer",
        outline: "none",
        marginRight: "10px"
      }
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-10 text-slate-200 font-sans h-[calc(100vh-80px)] flex flex-col overflow-hidden">
      <div className="max-w-[1600px] mx-auto w-full flex-1 flex flex-col min-h-0">

        {/* STATS CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-10 shrink-0">
          {[
            { label: "Total", value: stats.total, icon: <FaListUl />, color: "cyan" },
            { label: "Pending", value: stats.pending, icon: <FaExclamationCircle />, color: "red" },
            { label: "In Progress", value: stats.inProgress, icon: <FaClock />, color: "amber" },
            { label: "Resolved", value: stats.resolved, icon: <FaCheckCircle />, color: "green" },
          ].map((s) => (
            <div key={s.label} className="bg-slate-900/50 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl relative overflow-hidden group">
              <div className={`absolute -right-4 -top-4 w-16 sm:w-24 h-16 sm:h-24 bg-${s.color}-500/5 rounded-full blur-2xl group-hover:bg-${s.color}-500/10 transition-all`}></div>
              <div className="relative z-10 flex items-center gap-3 sm:gap-4">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-${s.color}-500/10 flex items-center justify-center text-${s.color}-400 text-lg sm:text-xl border border-${s.color}-500/20`}>
                  {s.icon}
                </div>
                <div>
                  <p className="text-slate-500 text-[9px] sm:text-[11px] font-black uppercase tracking-widest">{s.label}</p>
                  <h3 className="text-lg sm:text-2xl font-black text-white">{s.value}</h3>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FILTERS & TABLE */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-md flex-1 flex flex-col min-h-0">
          <div className="p-4 sm:p-6 border-b border-slate-800 flex flex-col lg:flex-row justify-between gap-4 sm:gap-6 shrink-0">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <DateFilter onChange={setDateRange} />
              <div className="relative group">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                <input
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full sm:w-64 bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-sm text-slate-200 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 outline-none transition-all shadow-inner"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
              <FaFilter className="text-cyan-500" />
              {filteredData.length} Results
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 sm:p-4 bg-slate-900/20 scrollbar-thin scrollbar-thumb-slate-800">
            <DataTable
              columns={columns}
              data={filteredData}
              pagination
              paginationPerPage={10}
              paginationRowsPerPageOptions={[10, 20, 50, 100]}
              paginationComponentOptions={{
                rowsPerPageText: 'Rows:',
                rangeSeparatorText: 'of',
                noRowsPerPage: false,
                selectAllRowsItem: false,
              }}
              progressPending={loading}
              customStyles={customStyles}
              highlightOnHover
              pointerOnHover
              responsive
            />
          </div>
        </div>
      </div>

      {/* Tailwind Colors Helper */}
      <div className="hidden bg-cyan-500/10 text-cyan-400 border-cyan-500/20 bg-red-500/10 text-red-400 border-red-500/20 bg-amber-500/10 text-amber-400 border-amber-500/20 bg-green-500/10 text-green-400 border-green-500/20"></div>
    </div>
  );
}

/* ================= HELPERS ================= */

const exportExcel = (data) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Complaints");
  XLSX.writeFile(wb, `BFF-Complaints-${new Date().toLocaleDateString()}.xlsx`);
};

const exportPDF = (data) => {
  const doc = new jsPDF();
  autoTable(doc, {
    head: [["ID", "Customer", "Mobile", "Machine", "Coil", "Type", "Product/Item", "Status", "Date"]],
    body: data.map((r) => [
      r.id,
      r.customerName || r.customer_name,
      r.customerMobile || r.customer_mobile,
      r.machineId || r.machine_id,
      r.coilNumber || r.coil_number || "—",
      r.complaintType || r.complaint_type,
      r.drinkType || r.drink_type || "—",
      r.status,
      new Date(r.created_at || r.createdAt).toLocaleDateString()
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [15, 23, 42] }
  });
  doc.save(`BFF-Complaints-${new Date().toLocaleDateString()}.pdf`);
};

export default ComplaintTable;
