import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { formatDateIST, formatDateOnlyIST } from "../../utils/dateUtils";

export default function AdminFormsPage() {
    const navigate = useNavigate();
    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [newForm, setNewForm] = useState({ title: "", description: "" });

    useEffect(() => {
        fetchForms();
    }, []);

    const fetchForms = async () => {
        try {
            setLoading(true);
            const res = await api.get("/forms/");
            setForms(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateForm = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post("/forms/", newForm);
            setIsAdding(false);
            setNewForm({ title: "", description: "" });
            // Navigate to form builder for the new form
            navigate(`/portal/forms/${res.data.id}`);
        } catch (err) {
            alert("Failed to create form");
        }
    };

    const handleDeleteForm = async (id) => {
        if (!window.confirm("Are you sure you want to delete this form? This action cannot be undone.")) return;
        try {
            await api.delete(`/forms/${id}/`);
            setForms(forms.filter(f => f.id !== id));
        } catch (err) {
            alert("Failed to delete form");
        }
    };

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 9; // 3x3 grid

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentForms = forms.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(forms.length / itemsPerPage);

    // Reset to page 1 if forms change drastically (optional)
    useEffect(() => { if (currentPage > totalPages && totalPages > 0) setCurrentPage(1); }, [forms.length, totalPages, currentPage]);

    const downloadCSV = () => {
        if (forms.length === 0) return alert("No forms to export");
        const headers = ["Title", "Description", "Theme", "Created At", "Closes At", "Active", "Response Count"];
        const rows = forms.map(f => [
            f.title,
            f.description || "",
            f.theme,
            formatDateIST(f.created_at),
            f.closes_at ? formatDateIST(f.closes_at) : "Never",
            f.is_active ? "Yes" : "No",
            f.response_count
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + [headers.join(","), ...rows.map(e => e.map(s => `"${String(s).replace(/"/g, '""')}"`).join(","))].join("\n");

        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", "robotech_forms.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div>
                    <button onClick={() => navigate("/portal/dashboard")} className="text-sm text-cyan-400 hover:underline mb-2">← Dashboard</button>
                    <h1 className="text-4xl font-bold font-[Orbitron] text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
                        Dynamic Forms
                    </h1>
                    <p className="text-gray-400 mt-2">Create and manage recruitment, surveys, or feedback forms.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={downloadCSV} className="bg-green-500/20 text-green-400 border border-green-500/50 px-4 py-3 rounded-xl font-bold hover:bg-green-500/30 transition">⬇ CSV</button>
                    <button
                        onClick={() => setIsAdding(true)}
                        className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-3 rounded-xl font-bold transition shadow-lg shadow-orange-600/20"
                    >
                        + Create New Form
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <div key={i} className="h-48 rounded-2xl bg-white/5 animate-pulse" />)}
                </div>
            ) : forms.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-2xl border border-dashed border-white/10">
                    <p className="text-gray-500 italic">No forms created yet. Start by deploying a new form.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {currentForms.map(form => (
                            <div key={form.id} className="bg-[#111] border border-white/10 rounded-2xl p-6 hover:border-orange-500/50 transition-all flex flex-col group">
                                <div className="flex justify-between items-start mb-4">
                                    {(() => {
                                        const isExpired = form.closes_at && new Date(form.closes_at) < new Date();
                                        const isActive = form.is_active && !isExpired;
                                        return (
                                            <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                                {isActive ? 'Accepting Responses' : isExpired ? 'Deadline Passed' : 'Manually Closed'}
                                            </span>
                                        );
                                    })()}
                                    <span className="text-[10px] text-gray-500 font-bold uppercase">{formatDateOnlyIST(form.created_at)}</span>
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[8px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-gray-400 font-bold uppercase tracking-widest">
                                        Theme: {form.theme}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold mb-2 group-hover:text-orange-400 transition-colors uppercase font-[Orbitron]">{form.title}</h3>
                                <p className="text-sm text-gray-500 line-clamp-2 mb-6 h-10">{form.description}</p>

                                <div className="grid grid-cols-2 gap-3 mt-auto">
                                    <button
                                        onClick={() => navigate(`/portal/forms/${form.id}`)}
                                        className="py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold transition uppercase"
                                    >
                                        Build & Edit
                                    </button>
                                    <button
                                        onClick={() => navigate(`/portal/forms/${form.id}/responses`)}
                                        className="py-2 bg-orange-600/10 hover:bg-orange-600/20 text-orange-400 rounded-lg text-xs font-bold transition uppercase"
                                    >
                                        Results ({form.response_count})
                                    </button>
                                </div>
                                <div className="flex gap-2 mt-3">
                                    <button
                                        onClick={() => window.open(`/forms/${form.id}`, '_blank')}
                                        className="flex-1 py-2 border border-white/5 hover:border-white/20 rounded-lg text-[10px] text-gray-500 hover:text-white transition font-black uppercase tracking-widest"
                                    >
                                        Test ↗
                                    </button>
                                    <button
                                        onClick={() => handleDeleteForm(form.id)}
                                        className="px-3 py-2 border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-500 hover:text-red-400 transition"
                                        title="Delete Form"
                                    >
                                        🗑️
                                    </button>
                                    <button
                                        onClick={() => {
                                            const url = `${window.location.origin}/forms/${form.id}`;
                                            navigator.clipboard.writeText(url);
                                            alert("Link copied to clipboard!");
                                        }}
                                        className="flex-1 py-2 bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-500 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                                    >
                                        🔗 Share
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* PAGINATION */}
                    <div className="flex justify-between items-center mt-8 p-4 bg-white/5 rounded-xl border border-white/5">
                        <div className="text-sm text-gray-400">Showing {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, forms.length)} of {forms.length} forms</div>
                        <div className="flex items-center gap-3">
                            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-4 py-2 bg-black/50 rounded-lg hover:bg-white/10 disabled:opacity-30 text-xs font-bold uppercase transition">Prev</button>
                            <span className="text-xs font-bold text-orange-400">Page {currentPage} / {totalPages || 1}</span>
                            <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)} className="px-4 py-2 bg-black/50 rounded-lg hover:bg-white/10 disabled:opacity-30 text-xs font-bold uppercase transition">Next</button>
                        </div>
                    </div>
                </>
            )}

            {isAdding && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-[#0f0f14] border border-white/10 p-8 rounded-3xl max-w-md w-full animate-scale-in">
                        <h2 className="text-2xl font-bold font-[Orbitron] text-orange-400 mb-6">Deploy New Form</h2>
                        <form onSubmit={handleCreateForm} className="space-y-6">
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-2">Form Title</label>
                                <input
                                    required
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder-gray-700 focus:border-orange-500 outline-none transition"
                                    placeholder="e.g. SIG Recruitment 2026"
                                    value={newForm.title}
                                    onChange={e => setNewForm({ ...newForm, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-2">Purpose / Description</label>
                                <textarea
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder-gray-700 h-32 focus:border-orange-500 outline-none transition"
                                    placeholder="Provide context for the responders..."
                                    value={newForm.description}
                                    onChange={e => setNewForm({ ...newForm, description: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-4">
                                <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-3 text-gray-400 font-bold hover:bg-white/5 rounded-xl transition">Aborted</button>
                                <button type="submit" className="flex-1 py-3 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-500 transition shadow-lg shadow-orange-600/20">Initialize</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
