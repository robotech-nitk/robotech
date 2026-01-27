import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";

export default function AdminAttendanceDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [session, setSession] = useState(null);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // For batch updates
    const [pendingChanges, setPendingChanges] = useState({}); // { 101: 'PRESENT', 102: 'ABSENT' }

    useEffect(() => {
        loadSession();
    }, [id]);

    const loadSession = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/attendance/sessions/${id}/`);
            setSession(res.data);

            // Fetch records
            try {
                const recRes = await api.get(`/attendance/sessions/${id}/records/`);
                setRecords(recRes.data);
            } catch (err) {
                // Ignore 404/empty
            }

        } catch (err) {
            console.error("Failed to load session", err);
            navigate("/portal/attendance");
        } finally {
            setLoading(false);
        }
    };

    const handlePopulate = async () => {
        if (!window.confirm("This will generate/regenerate the list based on session settings. Continue?")) return;
        try {
            setLoading(true);
            const res = await api.post(`/attendance/sessions/${id}/populate/`);
            alert(`Added ${res.data.added} new records.`);
            loadSession();
        } catch (err) {
            alert("Failed to populate list");
            setLoading(false);
        }
    };

    const handleStatusChange = (recordId, newStatus) => {
        // Optimistic UI update for pending
        setPendingChanges(prev => ({
            ...prev,
            [recordId]: newStatus
        }));

        // Also update local records display immediately
        setRecords(prev => prev.map(r =>
            r.id === recordId ? { ...r, status: newStatus } : r
        ));
    };

    const saveChanges = async () => {
        if (Object.keys(pendingChanges).length === 0) return;

        setIsSaving(true);
        try {
            // Transform pendingChanges to payload
            // We need user_id, but the key is record.id?
            // Actually batch_update expects user_id... wait backend serializer uses user_id
            // My state is keyed by record ID or USER ID?
            // Records list has { id, user: <id>, ... }

            // Let's refactor: keyed by USER ID is smarter for batch endpoint
            const updates = records
                .filter(r => pendingChanges[r.id]) // Filter modified records
                .map(r => ({
                    user_id: r.user, // The serializer uses user FK ID, endpoint uses user_id
                    status: pendingChanges[r.id]
                }));

            await api.post(`/attendance/sessions/${id}/batch_update/`, { updates });
            setPendingChanges({});
            // loadSession(); // No need to reload if optimistic was correct
        } catch (err) {
            alert("Failed to save changes");
            loadSession(); // Revert
        } finally {
            setIsSaving(false);
        }
    };

    const visibleRecords = records.filter(r => {
        if (!filter) return true;
        const name = r.user_details.full_name || r.user_details.username || "";
        return name.toLowerCase().includes(filter.toLowerCase());
    });

    if (loading && !session) return <div className="text-cyan-500 font-bold p-10 animate-pulse">LOADING SESSION...</div>;

    return (
        <div className="min-h-screen text-white p-6 sm:p-10 max-w-7xl mx-auto pb-32">
            <button onClick={() => navigate("/portal/attendance")} className="text-cyan-500 hover:text-cyan-400 mb-4 text-sm font-bold">← BACK TO LIST</button>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-white/5 pb-8">
                <div>
                    <h1 className="text-3xl font-bold font-[Orbitron] text-white">{session?.title}</h1>
                    <p className="text-gray-400 mt-1">
                        {new Date(session?.date).toLocaleDateString()} • {session?.scope_type} • {records.length} Records
                    </p>
                </div>

                <div className="flex gap-3">
                    {records.length === 0 && (
                        <button
                            onClick={handlePopulate}
                            className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-2 rounded-xl"
                        >
                            Generate List
                        </button>
                    )}
                    {Object.keys(pendingChanges).length > 0 && (
                        <button
                            onClick={saveChanges}
                            disabled={isSaving}
                            className="bg-green-600 hover:bg-green-500 text-white font-bold px-6 py-2 rounded-xl animate-bounce"
                        >
                            {isSaving ? "Saving..." : `Save ${Object.keys(pendingChanges).length} Changes`}
                        </button>
                    )}
                </div>
            </div>

            {/* Controls */}
            <div className="flex gap-4 mb-6">
                <input
                    placeholder="Search member..."
                    className="bg-[#0f111a] border border-white/10 rounded-lg px-4 py-2 text-white w-full max-w-md focus:border-cyan-500 outline-none"
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                />
            </div>

            {/* List */}
            <div className="grid gap-2">
                {visibleRecords.map(rec => (
                    <div
                        key={rec.id}
                        className={`
                            flex items-center justify-between p-4 rounded-xl border transition-colors
                            ${rec.status === 'PRESENT' ? 'bg-green-900/10 border-green-500/30' :
                                rec.status === 'ABSENT' ? 'bg-red-900/5 border-red-500/10' :
                                    'bg-[#0f111a] border-white/5'}
                        `}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${rec.status === 'PRESENT' ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' :
                                    'bg-gray-800 text-gray-500'
                                }`}>
                                {rec.user_details.full_name ? rec.user_details.full_name[0] : '?'}
                            </div>
                            <div>
                                <p className="font-bold text-white">
                                    {rec.user_details.full_name || rec.user_details.username}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {rec.user_details.roll_number} • {rec.user_details.sig || "No SIG"}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <ActionBtn
                                label="P"
                                active={rec.status === 'PRESENT'}
                                color="bg-green-500"
                                onClick={() => handleStatusChange(rec.id, 'PRESENT')}
                            />
                            <ActionBtn
                                label="A"
                                active={rec.status === 'ABSENT'}
                                color="bg-red-500"
                                onClick={() => handleStatusChange(rec.id, 'ABSENT')}
                            />
                            <ActionBtn
                                label="E"
                                active={rec.status === 'EXCUSED'}
                                color="bg-yellow-500"
                                onClick={() => handleStatusChange(rec.id, 'EXCUSED')}
                            />
                        </div>
                    </div>
                ))}

                {visibleRecords.length === 0 && records.length > 0 && (
                    <div className="text-center text-gray-500 py-10">No matching members found.</div>
                )}
            </div>
        </div>
    );
}

function ActionBtn({ label, active, color, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`
                w-10 h-10 rounded-lg font-black transition-all transform hover:scale-105
                ${active ? `${color} text-black shadow-lg` : 'bg-white/5 text-gray-500 hover:bg-white/10'}
            `}
        >
            {label}
        </button>
    );
}
