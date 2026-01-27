import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

export default function AdminAttendancePage() {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isCreating, setIsCreating] = useState(false);
    const [newSession, setNewSession] = useState({
        title: "General Meeting",
        date: new Date().toISOString().slice(0, 16),
        scope_type: "GLOBAL",
        target_years: "", // Comma sep
        target_sigs_ids: [],
    });

    const [sigs, setSigOptions] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [sRes, sigRes] = await Promise.all([
                api.get("/attendance/sessions/"),
                api.get("/custom-sigs/") // Assuming SIGs endpoint
            ]);
            setSessions(sRes.data);
            setSigOptions(sigRes.data);
        } catch (err) {
            console.error("Failed to load attendance", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            // Parse years
            const years = newSession.target_years.split(',').map(y => y.trim()).filter(y => y);

            const payload = {
                ...newSession,
                target_years: years, // Backend anticipates array or JSON
            };

            await api.post("/attendance/sessions/", payload);
            setIsCreating(false);
            loadData();
        } catch (err) {
            alert("Failed to create session");
        }
    };

    const toggleSig = (id) => {
        const current = newSession.target_sigs_ids;
        if (current.includes(id)) {
            setNewSession({ ...newSession, target_sigs_ids: current.filter(x => x !== id) });
        } else {
            setNewSession({ ...newSession, target_sigs_ids: [...current, id] });
        }
    };

    return (
        <div className="min-h-screen text-white p-6 sm:p-10 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-10">
                <h1 className="text-3xl font-bold font-[Orbitron] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 uppercase">
                    Attendance Protocol
                </h1>
                <button
                    onClick={() => setIsCreating(true)}
                    className="bg-cyan-600 hover:bg-cyan-500 text-black font-bold px-6 py-2 rounded-xl transition shadow-lg shadow-cyan-500/20"
                >
                    + New Session
                </button>
            </div>

            {loading ? (
                <div className="animate-pulse text-cyan-500 font-bold">SCANNING RECORDS...</div>
            ) : (
                <div className="grid gap-4">
                    {sessions.map(sess => (
                        <Link
                            to={`/portal/attendance/${sess.id}`}
                            key={sess.id}
                            className="bg-[#0f111a] border border-white/5 rounded-xl p-6 hover:border-cyan-500/30 transition flex justify-between items-center group"
                        >
                            <div>
                                <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition">{sess.title}</h3>
                                <p className="text-sm text-gray-400 mt-1">
                                    {new Date(sess.date).toLocaleDateString()} • {sess.scope_type}
                                    {sess.status === 'FINALIZED' && <span className="ml-2 text-green-400 font-bold text-xs border border-green-500/30 px-2 rounded">FINALIZED</span>}
                                </p>
                            </div>

                            {/* Stats */}
                            <div className="flex gap-4 text-center">
                                <div>
                                    <div className="text-2xl font-bold text-white">{sess.stats.present}</div>
                                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">Present</div>
                                </div>
                                <div className="hidden sm:block">
                                    <div className="text-2xl font-bold text-gray-500">{sess.stats.absent}</div>
                                    <div className="text-[10px] text-gray-600 uppercase tracking-wider">Absent</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-yellow-500">{sess.stats.total}</div>
                                    <div className="text-[10px] text-yellow-500/50 uppercase tracking-wider">Total</div>
                                </div>
                            </div>
                        </Link>
                    ))}

                    {sessions.length === 0 && (
                        <div className="text-gray-500 text-center py-20 bg-white/5 rounded-xl border border-dashed border-white/10">
                            No attendance sessions initialized.
                        </div>
                    )}
                </div>
            )}

            {/* Create Modal */}
            {isCreating && (
                <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-[#0f111a] border border-white/10 rounded-2xl p-8 w-full max-w-lg shadow-2xl relative">
                        <button onClick={() => setIsCreating(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">&times;</button>
                        <h2 className="text-2xl font-bold mb-6 text-white font-[Orbitron]">Initialize Session</h2>

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Title</label>
                                <input
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-cyan-500 outline-none"
                                    value={newSession.title}
                                    onChange={e => setNewSession({ ...newSession, title: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date & Time</label>
                                <input
                                    type="datetime-local"
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-cyan-500 outline-none"
                                    value={newSession.date}
                                    onChange={e => setNewSession({ ...newSession, date: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Scope</label>
                                    <select
                                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-cyan-500 outline-none"
                                        value={newSession.scope_type}
                                        onChange={e => setNewSession({ ...newSession, scope_type: e.target.value })}
                                    >
                                        <option value="GLOBAL">Global (All)</option>
                                        <option value="SIG">SIG Specific</option>
                                        <option value="CUSTOM">Custom</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Years (CSV)</label>
                                    <input
                                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-cyan-500 outline-none"
                                        placeholder="e.g. 2, 3"
                                        value={newSession.target_years}
                                        onChange={e => setNewSession({ ...newSession, target_years: e.target.value })}
                                    />
                                    <p className="text-[10px] text-gray-600 mt-1">Leave empty for all years</p>
                                </div>
                            </div>

                            {newSession.scope_type === 'SIG' && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Select SIGs</label>
                                    <div className="flex flex-wrap gap-2">
                                        {sigs.map(sig => (
                                            <button
                                                key={sig.id}
                                                type="button"
                                                onClick={() => toggleSig(sig.id)}
                                                className={`px-3 py-1 rounded-full text-xs font-bold border transition ${newSession.target_sigs_ids.includes(sig.id)
                                                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                                                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                                                    }`}
                                            >
                                                {sig.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button className="w-full bg-cyan-600 hover:bg-cyan-500 text-black font-bold py-3 rounded-lg mt-4 uppercase tracking-widest transition">
                                Create Session
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
