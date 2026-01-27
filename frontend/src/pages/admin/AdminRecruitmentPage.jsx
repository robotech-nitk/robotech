import { useEffect, useState } from "react";
import { Copy, Plus, Trash, ExternalLink } from "lucide-react";
import api from "../../api/axios";

export default function AdminRecruitmentPage() {
    const [drives, setDrives] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDrive, setSelectedDrive] = useState(null);

    // Form states
    const [showDriveForm, setShowDriveForm] = useState(false);
    const [driveForm, setDriveForm] = useState({ title: "", registration_link: "", description: "" });

    // Timeline Form
    const [timelineForm, setTimelineForm] = useState({ title: "", date: "", is_completed: false });

    useEffect(() => {
        loadDrives();
    }, []);

    const loadDrives = async () => {
        try {
            setLoading(true);
            const res = await api.get("/recruitment/drives/");
            setDrives(res.data);
            if (res.data.length > 0 && !selectedDrive) {
                // Select active one or first
                const active = res.data.find(d => d.is_active) || res.data[0];
                setSelectedDrive(active);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateDrive = async (e) => {
        e.preventDefault();
        try {
            await api.post("/recruitment/drives/", driveForm);
            setDriveForm({ title: "", registration_link: "", description: "" });
            setShowDriveForm(false);
            loadDrives();
        } catch (err) { alert("Failed to create drive"); }
    };

    const handleSetActive = async (drive) => {
        try {
            await api.patch(`/recruitment/drives/${drive.id}/`, { is_active: !drive.is_active });
            loadDrives();
        } catch (err) { alert("Failed to update status"); }
    };

    const handleDeleteDrive = async (id) => {
        if (!confirm("Delete this recruitment drive?")) return;
        try {
            await api.delete(`/recruitment/drives/${id}/`);
            loadDrives();
            setSelectedDrive(null);
        } catch (err) { alert("Failed to delete"); }
    };

    // Timeline Actions
    const handleAddTimeline = async (e) => {
        e.preventDefault();
        if (!selectedDrive) return;
        try {
            await api.post("/recruitment/timeline/", {
                ...timelineForm,
                drive: selectedDrive.id
            });
            setTimelineForm({ title: "", date: "", is_completed: false });
            // Refresh just the selected drive or reload all
            loadDrives(); // simple reload to refresh nested data
        } catch (err) { alert("Failed to add event"); }
    };

    const handleToggleComplete = async (item) => {
        try {
            await api.patch(`/recruitment/timeline/${item.id}/`, { is_completed: !item.is_completed });
            loadDrives();
        } catch (err) { alert("Failed"); }
    };

    const handleDeleteEvent = async (id) => {
        try {
            await api.delete(`/recruitment/timeline/${id}/`);
            loadDrives();
        } catch (err) { alert("Failed"); }
    };

    // Update link
    const updateLink = async (val) => {
        try {
            const updated = { ...selectedDrive, registration_link: val };
            setSelectedDrive(updated); // Optimistic
            await api.patch(`/recruitment/drives/${selectedDrive.id}/`, { registration_link: val });
        } catch (err) { console.error(err); }
    };

    if (loading && drives.length === 0) return <div className="p-8 text-white">Loading...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto text-white min-h-screen pb-20">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold font-[Orbitron] text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-500">Recruitment Command</h1>
                    <p className="text-gray-400 mt-1">Manage recruitment cycles and timelines.</p>
                </div>
                <button
                    onClick={() => setShowDriveForm(true)}
                    className="bg-orange-500 hover:bg-orange-400 text-black font-bold px-4 py-2 rounded-lg transition shadow-lg shadow-orange-500/20"
                >
                    + New Cycle
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* List Column */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Cycles</h3>
                    {drives.map(drive => (
                        <div
                            key={drive.id}
                            onClick={() => setSelectedDrive(drives.find(d => d.id === drive.id))}
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedDrive?.id === drive.id
                                    ? "bg-orange-500/10 border-orange-500/50"
                                    : "bg-white/5 border-white/10 hover:bg-white/10"
                                }`}
                        >
                            <div className="flex justify-between items-start">
                                <h4 className={`font-bold ${selectedDrive?.id === drive.id ? "text-orange-400" : "text-white"}`}>{drive.title}</h4>
                                {drive.is_active && <span className="text-[10px] bg-green-500 text-black font-black px-1.5 py-0.5 rounded">ACTIVE</span>}
                            </div>
                            <p className="text-xs text-gray-400 mt-1 truncate">{drive.registration_link || "No link set"}</p>
                        </div>
                    ))}
                    {drives.length === 0 && <p className="text-gray-500 text-sm">No recruitment cycles found.</p>}
                </div>

                {/* Detail Column */}
                {selectedDrive ? (
                    <div className="lg:col-span-2 space-y-6 animate-fade-in">
                        {/* Header Card */}
                        <div className="glass p-6 rounded-2xl border border-orange-500/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 flex gap-2">
                                <button
                                    onClick={() => handleSetActive(selectedDrive)}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold transition border ${selectedDrive.is_active ? 'bg-green-500 text-black border-green-500' : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'}`}
                                >
                                    {selectedDrive.is_active ? "Live & Visible" : "Set Active"}
                                </button>
                                <button onClick={() => handleDeleteDrive(selectedDrive.id)} className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20"><Trash size={14} /></button>
                            </div>

                            <h2 className="text-2xl font-bold mb-4 font-[Orbitron]">{selectedDrive.title}</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Registration Link</label>
                                    <div className="flex gap-2 mt-1">
                                        <input
                                            className="flex-1 bg-black/40 border border-white/10 rounded-lg p-3 text-sm focus:border-orange-500 outline-none transition text-blue-400 font-mono"
                                            value={selectedDrive.registration_link}
                                            onChange={(e) => updateLink(e.target.value)}
                                            placeholder="https://forms.google.com/..."
                                        />
                                        <a href={selectedDrive.registration_link} target="_blank" rel="noreferrer" className="p-3 bg-white/5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition">
                                            <ExternalLink size={18} />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Timeline Section */}
                        <div className="bg-[#0b0c15] p-6 rounded-2xl border border-white/5">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <span className="w-1.5 h-6 bg-orange-500 rounded-lg"></span> Timeline Roadmap
                            </h3>

                            <div className="space-y-6 relative ml-2 border-l border-white/10 pl-6 pb-4">
                                {selectedDrive.timeline && selectedDrive.timeline.length > 0 ? selectedDrive.timeline.map((item, index) => (
                                    <div key={item.id} className="relative group">
                                        {/* Dot */}
                                        <div className={`absolute -left-[31px] top-1.5 w-3 h-3 rounded-full border-2 ${item.is_completed ? 'bg-green-500 border-green-500' : 'bg-black border-gray-600'}`} />

                                        <div className="flex justify-between items-start bg-white/5 p-4 rounded-xl border border-white/5 hover:border-white/10 transition">
                                            <div>
                                                <h4 className={`font-bold ${item.is_completed ? 'text-gray-500 line-through' : 'text-white'}`}>{item.title}</h4>
                                                <div className="text-sm mt-1 flex items-center gap-2">
                                                    {item.original_date && (
                                                        <span className="text-red-400/60 line-through text-xs">
                                                            {new Date(item.original_date).toLocaleString()}
                                                        </span>
                                                    )}
                                                    <span className={`${item.original_date ? 'text-orange-400 font-bold' : 'text-gray-400'}`}>
                                                        {new Date(item.date).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={item.is_completed}
                                                    onChange={() => handleToggleComplete(item)}
                                                    className="w-5 h-5 accent-green-500 rounded cursor-pointer"
                                                />
                                                <button onClick={() => handleDeleteEvent(item.id)} className="text-gray-600 hover:text-red-400 p-1"><Trash size={14} /></button>
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-gray-500 italic">No timeline events yet.</p>
                                )}
                            </div>

                            {/* Add Event Form */}
                            <form onSubmit={handleAddTimeline} className="mt-6 pt-6 border-t border-white/5 flex flex-col sm:flex-row gap-3">
                                <input
                                    placeholder="Event Title (e.g. Interview)"
                                    className="flex-[2] bg-white/5 rounded-lg px-4 py-2 border border-white/10 focus:border-orange-500 outline-none"
                                    required
                                    value={timelineForm.title}
                                    onChange={e => setTimelineForm({ ...timelineForm, title: e.target.value })}
                                />
                                <input
                                    type="datetime-local"
                                    className="flex-1 bg-white/5 rounded-lg px-4 py-2 border border-white/10 focus:border-orange-500 outline-none text-white/70"
                                    required
                                    value={timelineForm.date}
                                    onChange={e => setTimelineForm({ ...timelineForm, date: e.target.value })}
                                />
                                <button type="submit" className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg font-bold text-sm transition">Add Event</button>
                            </form>
                        </div>
                    </div>
                ) : (
                    <div className="lg:col-span-2 flex items-center justify-center p-12 text-gray-500 border border-white/5 rounded-2xl bg-white/5">
                        Select a cycle to manage
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showDriveForm && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="glass p-8 rounded-2xl w-full max-w-md border border-orange-500/30 shadow-2xl">
                        <h2 className="text-2xl font-bold mb-6 font-[Orbitron] text-orange-400">Initialize Cycle</h2>
                        <form onSubmit={handleCreateDrive} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Title</label>
                                <input
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-orange-500 outline-none"
                                    placeholder="e.g. Summer 2026 Core"
                                    required
                                    value={driveForm.title}
                                    onChange={e => setDriveForm({ ...driveForm, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Registration Form Link</label>
                                <input
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-orange-500 outline-none"
                                    placeholder="https://..."
                                    value={driveForm.registration_link}
                                    onChange={e => setDriveForm({ ...driveForm, registration_link: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowDriveForm(false)} className="px-4 py-2 rounded-lg text-gray-400 hover:text-white">Cancel</button>
                                <button type="submit" className="px-6 py-2 bg-gradient-to-r from-orange-500 to-pink-500 rounded-lg font-bold text-black shadow-lg shadow-orange-500/20">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
