import { useState, useEffect } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { UserPlus, Trash2, ShieldCheck, User } from "lucide-react";

function ManageTeam() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newName, setNewName] = useState("");
    const [newMobile, setNewMobile] = useState("");
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const res = await api.get("/api/employees");
            setEmployees(res.data);
        } catch (err) {
            console.error("Failed to fetch employees", err);
            toast.error("Failed to load team data");
        } finally {
            setLoading(false);
        }
    };

    const handleAddEmployee = async (e) => {
        e.preventDefault();
        if (!newName || !newMobile) return;

        setAdding(true);
        try {
            const res = await api.post("/api/employees", { name: newName, mobile: newMobile });
            setEmployees([res.data, ...employees]);
            setNewName("");
            setNewMobile("");
            toast.success("Employee added successfully");
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.error || "Failed to add employee");
        } finally {
            setAdding(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to remove this employee?")) return;

        try {
            await api.delete(`/api/employees/${id}`);
            setEmployees(employees.filter(e => e.id !== id));
            toast.success("Employee removed");
        } catch (err) {
            console.error(err);
            toast.error("Failed to remove employee");
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Manage Team</h1>
                    <p className="text-slate-400 mt-1">Control access to the support dashboard</p>
                </div>
            </div>

            {/* ADD EMPLOYEE SECTION */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <UserPlus className="text-blue-500" size={24} />
                    Add New Employee
                </h2>

                <form onSubmit={handleAddEmployee} className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <label className="block text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Full Name</label>
                        <input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="e.g. John Doe"
                            className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                            required
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Mobile Number</label>
                        <input
                            value={newMobile}
                            onChange={(e) => setNewMobile(e.target.value)}
                            placeholder="e.g. 9876543210"
                            className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                            required
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            type="submit"
                            disabled={adding}
                            className="h-[50px] px-8 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {adding ? "Adding..." : "Add Access"}
                        </button>
                    </div>
                </form>
            </div>

            {/* EMPLOYEE LIST */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="text-emerald-500" size={24} />
                    Authorized Personnel
                    <span className="text-sm font-normal text-slate-500 ml-2">({employees.length} Active)</span>
                </h2>

                {loading ? (
                    <div className="text-slate-500 animate-pulse">Loading team data...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {employees.map(emp => (
                            <div key={emp.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between group hover:border-slate-700 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 font-bold text-xl">
                                        {emp.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white">{emp.name}</h3>
                                        <p className="text-slate-400 text-sm font-mono">{emp.mobile}</p>
                                        <span className="text-[10px] uppercase font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded mt-1 inline-block">
                                            {emp.role || "Employee"}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(emp.id)}
                                    className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                    title="Remove Access"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        ))}

                        {employees.length === 0 && (
                            <div className="col-span-full p-8 text-center border-2 border-dashed border-slate-800 rounded-2xl text-slate-500">
                                No employees added yet. Add someone above to get started. 🚀
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ManageTeam;
