import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';

function EmployeeLogin() {
    const [mobile, setMobile] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            console.log("Sending login request for:", mobile);
            const res = await api.post('/api/employees/login', { mobile });

            console.log("Login Response:", res.data);

            if (res.data.success) {
                const employee = res.data.employee;
                localStorage.setItem('role', 'employee');
                localStorage.setItem('employeeName', employee.name);
                localStorage.setItem('employeeId', employee.id);
                localStorage.setItem('employeeMobile', employee.mobile);

                toast.success(`Welcome, ${employee.name}!`);

                // Redirect to user chat page with mobile param for employee chat
                navigate(`/userchat?mobile=${employee.mobile}&isEmployee=true`);
            } else {
                toast.error(res.data.error || 'Login failed');
            }
        } catch (err) {
            console.error("Login Critical Error:", err);
            toast.error(err.response?.data?.error || 'Access Denied: Server Error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl max-w-sm w-full">
                <div className="text-center mb-8">
                    <img src="/logo.png" alt="Logo" className="w-16 h-16 mx-auto mb-4 bg-white rounded-xl p-2" />
                    <h1 className="text-2xl font-bold text-white">Employee Access</h1>
                    <p className="text-slate-400 text-sm mt-1">Enter your registered mobile number</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-slate-400 text-sm font-bold mb-2">Mobile Number</label>
                        <input
                            type="tel"
                            placeholder="e.g. 9876543210"
                            value={mobile}
                            onChange={(e) => setMobile(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Verifying...' : 'Access Dashboard'}
                    </button>
                </form>

                <p className="text-center text-slate-600 text-xs mt-6">
                    Restricted Area. Authorized Personnel Only.
                </p>
            </div>
        </div>
    );
}

export default EmployeeLogin;
