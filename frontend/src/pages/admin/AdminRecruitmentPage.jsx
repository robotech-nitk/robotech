import { useEffect, useState } from "react";
import { Copy, Plus, Trash, ExternalLink, FileText, Upload, Users, GraduationCap, Award, MessageSquare, Calendar, Download, ChevronRight, Search, Filter } from "lucide-react";
import api from "../../api/axios";
import { formatDateIST } from "../../utils/dateUtils";

export default function AdminRecruitmentPage() {
    const [drives, setDrives] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDrive, setSelectedDrive] = useState(null);

    // Form states
    const [showDriveForm, setShowDriveForm] = useState(false);
    const [driveForm, setDriveForm] = useState({ title: "", registration_link: "", description: "" });

    // Timeline Form
    const [timelineForm, setTimelineForm] = useState({ id: null, title: "", date: "", is_completed: false });

    // Assignment Form
    const [sigs, setSigs] = useState([]);
    const [assignmentForm, setAssignmentForm] = useState({ id: null, title: "", description: "", sig: "", external_link: "", submission_type: "FILE" });
    const [assignmentFile, setAssignmentFile] = useState(null);

    // Candidate / Application State
    const [applications, setApplications] = useState([]);
    const [activeTab, setActiveTab] = useState("overview"); // 'overview' or 'applications'

    // Filters & Sorting
    const [searchQuery, setSearchQuery] = useState("");
    const [filterSig, setFilterSig] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: "total", direction: "desc" });

    // Scheduling Modal
    const [schedulingApp, setSchedulingApp] = useState(null);

    // Interview Evaluation
    const [evaluatingApp, setEvaluatingApp] = useState(null);
    const [evaluationForm, setEvaluationForm] = useState({ max_score: 10, raw_score: 0, notes: "" });

    useEffect(() => {
        loadDrives();
        loadSigs();
    }, []);

    const loadSigs = async () => {
        const res = await api.get("/sigs/");
        setSigs(res.data);
    };

    const loadDrives = async () => {
        try {
            setLoading(true);
            const res = await api.get("/recruitment/drives/");
            setDrives(res.data);
            if (res.data.length > 0) {
                const active = selectedDrive ? res.data.find(d => d.id === selectedDrive.id) : (res.data.find(d => d.is_active) || res.data[0]);
                if (active) {
                    setSelectedDrive(active);
                    loadApplications(active.id);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadApplications = async (driveId) => {
        if (!driveId) return;
        try {
            const res = await api.get(`/recruitment/applications/?drive_id=${driveId}`);
            setApplications(res.data);
        } catch (err) { console.error(err); }
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
            if (timelineForm.id) {
                await api.patch(`/recruitment/timeline/${timelineForm.id}/`, timelineForm);
            } else {
                await api.post("/recruitment/timeline/", {
                    ...timelineForm,
                    drive: selectedDrive.id
                });
            }
            setTimelineForm({ id: null, title: "", date: "", is_completed: false });
            loadDrives();
        } catch (err) { alert("Failed to save event"); }
    };

    const handleEditTimeline = (item) => {
        setTimelineForm({
            id: item.id,
            title: item.title,
            date: item.date ? item.date.slice(0, 16) : "",
            is_completed: item.is_completed
        });
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

    // Assignment Actions
    const handleAddAssignment = async (e) => {
        e.preventDefault();
        if (!selectedDrive) return;

        try {
            const fd = new FormData();
            fd.append("drive", selectedDrive.id);
            fd.append("sig", assignmentForm.sig);
            fd.append("title", assignmentForm.title);
            fd.append("description", assignmentForm.description);
            fd.append("submission_type", assignmentForm.submission_type || "FILE");
            if (assignmentFile) fd.append("file", assignmentFile);
            if (assignmentForm.external_link) fd.append("external_link", assignmentForm.external_link);

            if (assignmentForm.id) {
                await api.patch(`/recruitment/assignments/${assignmentForm.id}/`, fd);
            } else {
                await api.post("/recruitment/assignments/", fd);
            }

            setAssignmentForm({ id: null, title: "", description: "", sig: "", external_link: "", submission_type: "FILE" });
            setAssignmentFile(null);
            loadDrives();
        } catch (err) { alert("Failed to save assignment"); }
    };

    const handleEditAssignment = (asn) => {
        setAssignmentForm({
            id: asn.id,
            title: asn.title,
            description: asn.description,
            sig: asn.sig,
            external_link: asn.external_link || "",
            submission_type: asn.submission_type || "FILE"
        });
        const form = document.getElementById('assignment-form');
        form?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleDeleteAssignment = async (id) => {
        if (!confirm("Delete assignment?")) return;
        try {
            await api.delete(`/recruitment/assignments/${id}/`);
            loadDrives();
        } catch (err) { alert("Failed"); }
    };

    // Application Actions
    const handleUpdateApplication = async (appId, updates) => {
        try {
            // Optimistic update
            const updated = applications.map(app => app.id === appId ? { ...app, ...updates } : app);
            setApplications(updated);

            await api.patch(`/recruitment/applications/${appId}/`, updates);
        } catch (err) {
            console.error(err);
            // Revert on failure (could improve by fetching)
            loadApplications(selectedDrive.id);
        }
    };

    const handleScheduleInterview = async (e) => {
        e.preventDefault();
        const time = e.target.interview_time.value;
        if (!schedulingApp || !time) return;

        try {
            await api.patch(`/recruitment/applications/${schedulingApp.id}/`, {
                interview_time: time,
                status: 'INTERVIEW_SCHEDULED'
            });
            setSchedulingApp(null);
            loadApplications(selectedDrive.id);
        } catch (err) { alert("Failed to schedule"); }
    };

    // Update link
    const updateLink = async (val) => {
        try {
            const updated = { ...selectedDrive, registration_link: val };
            setSelectedDrive(updated); // Optimistic
            await api.patch(`/recruitment/drives/${selectedDrive.id}/`, { registration_link: val });
        } catch (err) { console.error(err); }
    };

    const handleCompleteInterview = async (e) => {
        e.preventDefault();
        if (!evaluatingApp) return;

        // Normalize logic if needed, or just save raw score. 
        // User asked for "scored and normalized". Let's assume we store the normalized/final score.
        // Or we store the raw score if max_score is mostly for reference. 
        // Let's store the Calculated Score (raw / max * 10 or 100?). 
        // For simplicity and flexibility, let's just save the 'raw_score' the user finally approves in the box.
        // Actually, let's auto-calculate a normalized score if they want, but default to simple input.

        // Let's Assume the user Inputs the "Final Score" to be saved.
        // But the requirement says "assign the max score".
        // Let's save `raw_score` directly to `interview_score`. normalize logic can be UI side helper.

        try {
            await handleUpdateApplication(evaluatingApp.id, {
                interview_score: evaluationForm.raw_score,
                notes: evaluationForm.notes,
                status: 'INTERVIEW_COMPLETED'
            });
            setEvaluatingApp(null);
        } catch (err) { alert("Failed to save evaluation"); }
    };

    // CSV Download
    const downloadCSV = () => {
        const headers = ["Candidate Name", "ID/Email", "SIG", "OA Score", "Assessment Score", "Interview Score", "Total Score", "Status"];
        const rows = sortedApplications.map(app => [
            app.candidate_name || "New Applicant",
            app.identifier,
            app.sig_name || "N/A",
            app.oa_score || 0,
            app.assessment_score || 0,
            app.interview_score || 0,
            (parseFloat(app.oa_score) || 0) + (parseFloat(app.assessment_score) || 0) + (parseFloat(app.interview_score) || 0),
            app.status
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `recruitment_data_${selectedDrive.title}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Filter & Sort Logic
    const filteredApplications = applications.filter(app => {
        const matchesSearch = (app.candidate_name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (app.identifier?.toLowerCase() || "").includes(searchQuery.toLowerCase());
        const matchesSig = filterSig ? app.sig_name === filterSig : true;
        return matchesSearch && matchesSig;
    });

    const sortedApplications = filteredApplications.sort((a, b) => {
        const scoreA = (parseFloat(a.oa_score) || 0) + (parseFloat(a.assessment_score) || 0) + (parseFloat(a.interview_score) || 0);
        const scoreB = (parseFloat(b.oa_score) || 0) + (parseFloat(b.assessment_score) || 0) + (parseFloat(b.interview_score) || 0);

        if (sortConfig.key === 'total') return sortConfig.direction === 'asc' ? scoreA - scoreB : scoreB - scoreA;

        const valA = parseFloat(a[sortConfig.key]) || 0;
        const valB = parseFloat(b[sortConfig.key]) || 0;
        return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
    });

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
                            onClick={() => { setSelectedDrive(drive); loadApplications(drive.id); }}
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

                        {/* Navigation Tabs */}
                        <div className="flex border-b border-white/5 gap-8 overflow-x-auto">
                            <button
                                onClick={() => setActiveTab("overview")}
                                className={`pb-4 text-sm font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${activeTab === 'overview' ? 'text-orange-400 border-b-2 border-orange-400' : 'text-gray-500 hover:text-white'}`}
                            >
                                Setup & Tasks
                            </button>
                            <button
                                onClick={() => setActiveTab("applications")}
                                className={`pb-4 text-sm font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${activeTab === 'applications' ? 'text-orange-400 border-b-2 border-orange-400' : 'text-gray-500 hover:text-white'}`}
                            >
                                Candidates ({applications.length})
                            </button>
                            <button
                                onClick={() => setActiveTab("interviews")}
                                className={`pb-4 text-sm font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${activeTab === 'interviews' ? 'text-orange-400 border-b-2 border-orange-400' : 'text-gray-500 hover:text-white'}`}
                            >
                                Interview Panel
                            </button>
                        </div>

                        {activeTab === 'overview' ? (
                            <div className="space-y-6">
                                {/* Timeline Section */}
                                <div className="bg-[#0b0c15] p-6 rounded-2xl border border-white/5">
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                        <span className="w-1.5 h-6 bg-orange-500 rounded-lg"></span> Timeline Roadmap
                                    </h3>

                                    <div className="space-y-6 relative ml-2 border-l border-white/10 pl-6 pb-4">
                                        {selectedDrive.timeline && selectedDrive.timeline.length > 0 ? selectedDrive.timeline.map((item, index) => (
                                            <div key={item.id} className="relative group">
                                                <div className={`absolute -left-[31px] top-1.5 w-3 h-3 rounded-full border-2 ${item.is_completed ? 'bg-green-500 border-green-500' : 'bg-black border-gray-600'}`} />
                                                <div className="flex justify-between items-start bg-white/5 p-4 rounded-xl border border-white/5 hover:border-white/10 transition">
                                                    <div>
                                                        <h4 className={`font-bold ${item.is_completed ? 'text-gray-500 line-through' : 'text-white'}`}>{item.title}</h4>
                                                        <div className="text-sm mt-1 flex items-center gap-2">
                                                            {item.original_date && <span className="text-red-400/60 line-through text-xs">{formatDateIST(item.original_date)}</span>}
                                                            <span className={`${item.original_date ? 'text-orange-400 font-bold' : 'text-gray-400'}`}>{formatDateIST(item.date)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => handleEditTimeline(item)} className="text-gray-500 hover:text-white p-1"><FileText size={14} /></button>
                                                        <input type="checkbox" checked={item.is_completed} onChange={() => handleToggleComplete(item)} className="w-5 h-5 accent-green-500 rounded cursor-pointer" />
                                                        <button onClick={() => handleDeleteEvent(item.id)} className="text-gray-600 hover:text-red-400 p-1"><Trash size={14} /></button>
                                                    </div>
                                                </div>
                                            </div>
                                        )) : <p className="text-gray-500 italic">No timeline events set.</p>}
                                    </div>

                                    <form onSubmit={handleAddTimeline} className="mt-6 pt-6 border-t border-white/5 flex flex-col gap-3">
                                        <div className="flex justify-between items-center text-xs font-bold uppercase text-gray-500 mb-1">
                                            <span>{timelineForm.id ? "Edit Event" : "New Event"}</span>
                                            {timelineForm.id && <button type="button" onClick={() => setTimelineForm({ id: null, title: "", date: "", is_completed: false })} className="text-red-400 hover:text-red-300">Cancel</button>}
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <input placeholder="Event Title" className="flex-[2] bg-white/5 rounded-lg px-4 py-2 border border-white/10 focus:border-orange-500 outline-none" required value={timelineForm.title} onChange={e => setTimelineForm({ ...timelineForm, title: e.target.value })} />
                                            <input type="datetime-local" className="flex-1 bg-white/5 rounded-lg px-4 py-2 border border-white/10 focus:border-orange-500 outline-none text-white/70" required value={timelineForm.date} onChange={e => setTimelineForm({ ...timelineForm, date: e.target.value })} />
                                            <button type="submit" className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg font-bold text-sm transition">{timelineForm.id ? "Update" : "Add"}</button>
                                        </div>
                                    </form>
                                </div>

                                {/* Assignments Section */}
                                <div className="bg-[#0b0c15] p-6 rounded-2xl border border-white/5">
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                        <span className="w-1.5 h-6 bg-blue-500 rounded-lg"></span> SIG Assignments (Tasks)
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {selectedDrive.assignments && selectedDrive.assignments.map(asn => (
                                            <div key={asn.id} className="p-4 bg-white/5 border border-white/5 rounded-xl flex justify-between items-start group">
                                                <div className="flex gap-3">
                                                    <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg h-fit"><FileText size={18} /></div>
                                                    <div>
                                                        <h4 className="font-bold text-white leading-tight">{asn.title}</h4>
                                                        <p className="text-[10px] text-blue-400 font-black uppercase mt-1 tracking-widest">{asn.sig_name} • {asn.submission_type}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                                                    <button onClick={() => handleEditAssignment(asn)} className="text-gray-600 hover:text-white p-1"><FileText size={14} /></button>
                                                    <button onClick={() => handleDeleteAssignment(asn.id)} className="text-gray-600 hover:text-red-400 p-1"><Trash size={14} /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <form id="assignment-form" onSubmit={handleAddAssignment} className="mt-6 pt-6 border-t border-white/5 space-y-4">
                                        <div className="flex justify-between items-center text-xs text-gray-500 font-bold uppercase tracking-widest">
                                            <span>{assignmentForm.id ? "Edit Task" : "New Task"}</span>
                                            {assignmentForm.id && <button type="button" onClick={() => setAssignmentForm({ id: null, title: "", description: "", sig: "", external_link: "", submission_type: "FILE" })} className="text-red-400 hover:text-red-300">Cancel Edit</button>}
                                        </div>
                                        <div className="grid sm:grid-cols-3 gap-4">
                                            <input placeholder="Task Title" className="sm:col-span-2 bg-white/5 rounded-lg px-4 py-2 border border-white/10 focus:border-blue-500 outline-none text-sm" required value={assignmentForm.title} onChange={e => setAssignmentForm({ ...assignmentForm, title: e.target.value })} />
                                            <select className="bg-white/5 rounded-lg px-4 py-2 border border-white/10 focus:border-blue-500 outline-none text-sm text-gray-400" required value={assignmentForm.sig} onChange={e => setAssignmentForm({ ...assignmentForm, sig: e.target.value })} >
                                                <option value="">Select SIG</option>
                                                {sigs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="grid sm:grid-cols-2 gap-4">
                                            <select className="bg-white/5 rounded-lg px-4 py-2 border border-white/10 focus:border-blue-500 outline-none text-sm text-gray-400" value={assignmentForm.submission_type} onChange={e => setAssignmentForm({ ...assignmentForm, submission_type: e.target.value })} >
                                                <option value="FILE">Require File Upload</option>
                                                <option value="LINK">Require Link Submission</option>
                                            </select>
                                            <input placeholder="OR External Link (Drive/Doc)" className="bg-white/5 rounded-lg px-4 py-2 border border-white/10 focus:border-blue-500 outline-none text-sm" value={assignmentForm.external_link} onChange={e => setAssignmentForm({ ...assignmentForm, external_link: e.target.value })} />
                                        </div>
                                        <textarea placeholder="Task description..." className="w-full bg-white/5 rounded-lg px-4 py-2 border border-white/10 focus:border-blue-500 outline-none text-sm h-20" value={assignmentForm.description} onChange={e => setAssignmentForm({ ...assignmentForm, description: e.target.value })} />
                                        <div className="grid sm:grid-cols-2 gap-4">
                                            <label className="flex items-center justify-center gap-2 bg-white/5 border border-dashed border-white/10 rounded-lg p-3 cursor-pointer hover:border-blue-500/50 transition">
                                                <Upload size={16} className="text-gray-500" />
                                                <span className="text-xs text-gray-400">{assignmentFile ? assignmentFile.name : (assignmentForm.id ? "Change File (Optional)" : "Choose File (Optional)")}</span>
                                                <input type="file" className="hidden" onChange={e => setAssignmentFile(e.target.files[0])} />
                                            </label>
                                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-lg font-bold text-sm text-black transition">{assignmentForm.id ? "Update Task" : "Add Task"}</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        ) : activeTab === 'applications' ? (
                            <div className="space-y-6">
                                {/* Leaderboard View */}
                                <div className="bg-[#0b0c15] p-6 rounded-2xl border border-white/5">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                                        <h3 className="text-xl font-bold flex items-center gap-3">
                                            <Award className="text-orange-400" /> Recruitment Leaderboard
                                        </h3>
                                        <div className="flex gap-2">
                                            <button onClick={downloadCSV} className="flex items-center gap-2 px-3 py-2 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg hover:bg-green-500/20 text-xs font-bold">
                                                <Download size={14} /> Export CSV
                                            </button>
                                            <div className="text-xs text-gray-400 p-2 bg-white/5 rounded-lg border border-white/5">
                                                Total Score = OA + Assessment + Interview
                                            </div>
                                        </div>
                                    </div>

                                    {/* Filters Bar */}
                                    <div className="flex flex-wrap gap-4 mb-6 p-4 bg-white/5 rounded-xl border border-white/5">
                                        <div className="flex-1 min-w-[200px] relative">
                                            <Search className="absolute left-3 top-2.5 text-gray-500" size={16} />
                                            <input
                                                className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:border-orange-500 outline-none"
                                                placeholder="Search name or ID..."
                                                value={searchQuery}
                                                onChange={e => setSearchQuery(e.target.value)}
                                            />
                                        </div>
                                        <select
                                            className="bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm outline-none focus:border-orange-500"
                                            value={filterSig}
                                            onChange={e => setFilterSig(e.target.value)}
                                        >
                                            <option value="">All SIGs</option>
                                            {sigs.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                        </select>
                                        <select
                                            className="bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm outline-none focus:border-orange-500"
                                            value={sortConfig.key}
                                            onChange={e => setSortConfig(prev => ({ ...prev, key: e.target.value }))}
                                        >
                                            <option value="total">Sort: Total Score</option>
                                            <option value="oa_score">Sort: OA Score</option>
                                            <option value="assessment_score">Sort: Assessment</option>
                                            <option value="interview_score">Sort: Interview</option>
                                        </select>
                                        <button
                                            onClick={() => setSortConfig(prev => ({ ...prev, direction: prev.direction === 'asc' ? 'desc' : 'asc' }))}
                                            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10"
                                        >
                                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                        </button>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-white/10">
                                                    <th className="py-4 px-2 text-[10px] font-black uppercase text-gray-500 tracking-widest">Rank</th>
                                                    <th className="py-4 px-2 text-[10px] font-black uppercase text-gray-500 tracking-widest">Candidate (ID)</th>
                                                    <th className="py-4 px-2 text-[10px] font-black uppercase text-gray-500 tracking-widest">SIG</th>
                                                    <th className="py-4 px-2 text-[10px] font-black uppercase text-gray-500 tracking-widest">OA</th>
                                                    <th className="py-4 px-2 text-[10px] font-black uppercase text-gray-500 tracking-widest">Assessment</th>
                                                    <th className="py-4 px-2 text-[10px] font-black uppercase text-gray-500 tracking-widest">Interview</th>
                                                    <th className="py-4 px-2 text-[10px] font-black uppercase text-gray-500 tracking-widest">Total</th>
                                                    <th className="py-4 px-2 text-[10px] font-black uppercase text-gray-500 tracking-widest">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {sortedApplications.map((app, i) => (
                                                    <tr key={app.id} className="group hover:bg-white/[0.02] transition-colors">
                                                        <td className="py-4 px-2 font-mono text-orange-400 font-bold">#{i + 1}</td>
                                                        <td className="py-4 px-2">
                                                            <input
                                                                className="bg-transparent border-b border-transparent focus:border-white/20 outline-none font-bold text-white text-sm w-full"
                                                                value={app.candidate_name || ""}
                                                                placeholder="New Applicant"
                                                                onChange={(e) => handleUpdateApplication(app.id, { candidate_name: e.target.value })}
                                                            />
                                                            <p className="text-[10px] text-gray-500 font-mono italic">{app.identifier}</p>
                                                        </td>
                                                        <td className="py-4 px-2">
                                                            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-bold rounded uppercase tracking-tighter">{app.sig_name || "N/A"}</span>
                                                        </td>
                                                        <td className="py-4 px-2">
                                                            <input type="number" className="w-16 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs outline-none focus:border-orange-500" value={app.oa_score || ""} onChange={(e) => handleUpdateApplication(app.id, { oa_score: e.target.value })} placeholder="--" />
                                                        </td>
                                                        <td className="py-4 px-2">
                                                            <input type="number" className="w-16 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs outline-none focus:border-orange-500 font-bold text-orange-400" value={app.assessment_score || ""} onChange={(e) => handleUpdateApplication(app.id, { assessment_score: e.target.value })} placeholder="--" />
                                                        </td>
                                                        <td className="py-4 px-2">
                                                            <input type="number" className="w-16 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs outline-none focus:border-orange-500 text-green-400" value={app.interview_score || ""} onChange={(e) => handleUpdateApplication(app.id, { interview_score: e.target.value })} placeholder="--" />
                                                        </td>
                                                        <td className="py-4 px-2 font-black text-sm">{(parseFloat(app.oa_score) || 0) + (parseFloat(app.assessment_score) || 0) + (parseFloat(app.interview_score) || 0)}</td>
                                                        <td className="py-4 px-2">
                                                            <div className="flex gap-2">
                                                                {app.solution_link && <a href={app.solution_link} target="_blank" rel="noreferrer" className="p-2 bg-white/5 text-blue-400 rounded-lg hover:bg-white/10 border border-white/5"><ExternalLink size={14} /></a>}
                                                                {app.assessment_file && <a href={app.assessment_file} target="_blank" rel="noreferrer" className="p-2 bg-white/5 text-orange-400 rounded-lg hover:bg-white/10 border border-white/5"><Download size={14} /></a>}
                                                                <button onClick={() => setSchedulingApp(app)} className="p-2 bg-white/5 text-gray-400 rounded-lg border border-white/5 hover:text-green-400"><Calendar size={14} /></button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                        ) : activeTab === 'interviews' ? (
                            <div className="space-y-6">
                                <div className="bg-[#0b0c15] p-6 rounded-2xl border border-white/5">
                                    <h3 className="text-xl font-bold flex items-center gap-3 mb-6">
                                        <MessageSquare className="text-orange-400" /> Interview Schedule
                                    </h3>

                                    <div className="space-y-4">
                                        {applications.filter(app => app.status === 'INTERVIEW_SCHEDULED' || app.status === 'INTERVIEW_COMPLETED').length === 0 && (
                                            <p className="text-gray-500 italic">No interviews scheduled yet.</p>
                                        )}
                                        {applications.filter(app => app.status === 'INTERVIEW_SCHEDULED' || app.status === 'INTERVIEW_COMPLETED')
                                            .sort((a, b) => new Date(a.interview_time) - new Date(b.interview_time))
                                            .map(app => (
                                                <div key={app.id} className="p-4 bg-white/5 border border-white/5 rounded-xl flex flex-col md:flex-row justify-between gap-4 items-center group hover:bg-white/10 transition">
                                                    <div className="flex items-center gap-4 flex-1">
                                                        <div className="p-3 bg-orange-500/10 text-orange-400 rounded-lg">
                                                            <Users size={20} />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="font-bold text-white text-lg">{app.candidate_name || app.identifier}</h4>
                                                                <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 rounded uppercase font-bold">{app.sig_name}</span>
                                                            </div>
                                                            <div className="flex items-center gap-4 mt-1">
                                                                <p className="text-sm text-gray-400 font-mono flex items-center gap-1.5">
                                                                    <Calendar size={12} className="text-gray-500" />
                                                                    {app.interview_time ? formatDateIST(app.interview_time) : "Time not set"}
                                                                </p>
                                                                {app.status === 'INTERVIEW_COMPLETED' && <span className="text-[10px] text-green-400 font-bold bg-green-500/10 px-2 rounded">COMPLETED</span>}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                                        <div className="text-right hidden sm:block">
                                                            <p className="text-[10px] uppercase font-bold text-gray-600">Scores</p>
                                                            <p>OA: <span className="text-white">{app.oa_score || '-'}</span> • Asm: <span className="text-white">{app.assessment_score || '-'}</span></p>
                                                        </div>
                                                        <div className="h-8 w-[1px] bg-white/10 hidden sm:block"></div>
                                                        <button
                                                            onClick={() => {
                                                                setEvaluatingApp(app);
                                                                setEvaluationForm({
                                                                    max_score: 10,
                                                                    raw_score: app.interview_score || 0,
                                                                    notes: app.notes || ""
                                                                });
                                                            }}
                                                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-lg shadow-lg shadow-blue-500/20 transition flex items-center gap-2"
                                                        >
                                                            <Award size={16} />
                                                            {app.status === 'INTERVIEW_COMPLETED' ? "Update Score" : "Evaluate"}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>
                ) : (
                    <div className="lg:col-span-2 flex items-center justify-center p-12 text-gray-500 border border-white/5 rounded-2xl bg-white/5">Select a cycle to manage</div>
                )}
            </div>

            {
                showDriveForm && (
                    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="glass p-8 rounded-2xl w-full max-w-md border border-orange-500/30 shadow-2xl">
                            <h2 className="text-2xl font-bold mb-6 font-[Orbitron] text-orange-400">Initialize Cycle</h2>
                            <form onSubmit={handleCreateDrive} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Title</label>
                                    <input className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-orange-500 outline-none" required value={driveForm.title} onChange={e => setDriveForm({ ...driveForm, title: e.target.value })} />
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <button type="button" onClick={() => setShowDriveForm(false)} className="px-4 py-2 rounded-lg text-gray-400 hover:text-white">Cancel</button>
                                    <button type="submit" className="px-6 py-2 bg-gradient-to-r from-orange-500 to-pink-500 rounded-lg font-bold text-black shadow-lg shadow-orange-500/20">Create</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Evaluation Modal */}
            {
                evaluatingApp && (
                    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-[#111] p-8 rounded-2xl w-full max-w-lg border border-white/10 shadow-2xl relative">
                            <button onClick={() => setEvaluatingApp(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><Trash size={16} /></button>

                            <div className="flex items-start gap-4 mb-6">
                                <div className="p-4 bg-blue-500/10 rounded-xl text-blue-400"><Users size={24} /></div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">{evaluatingApp.candidate_name || evaluatingApp.identifier}</h2>
                                    <p className="text-sm text-gray-400">{evaluatingApp.sig_name} • OA: {evaluatingApp.oa_score || 'N/A'} • Asm: {evaluatingApp.assessment_score || 'N/A'}</p>
                                </div>
                            </div>

                            <form onSubmit={handleCompleteInterview} className="space-y-6">

                                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Scoring Control</label>
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <p className="text-xs text-gray-400 mb-1">Max Score</p>
                                            <input
                                                type="number"
                                                className="w-full bg-black border border-white/20 rounded-lg p-2 text-center font-bold text-gray-500 focus:text-white focus:border-blue-500 outline-none"
                                                value={evaluationForm.max_score}
                                                onChange={e => setEvaluationForm({ ...evaluationForm, max_score: parseFloat(e.target.value) })}
                                            />
                                        </div>
                                        <div className="text-2xl font-black text-gray-600">/</div>
                                        <div className="flex-1">
                                            <p className="text-xs text-blue-400 font-bold mb-1">Obtained</p>
                                            <input
                                                type="number"
                                                autoFocus
                                                className="w-full bg-black border border-blue-500/50 rounded-lg p-2 text-center font-bold text-blue-400 text-xl focus:ring-2 ring-blue-500/20 outline-none"
                                                value={evaluationForm.raw_score}
                                                onChange={e => setEvaluationForm({ ...evaluationForm, raw_score: parseFloat(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-2 text-center">
                                        <p className="text-[10px] text-gray-500">
                                            Normalized: <span className="text-white font-bold">{((evaluationForm.raw_score / evaluationForm.max_score) * 10 || 0).toFixed(1)} / 10</span>
                                            <span className="mx-2 text-gray-700">|</span>
                                            <span className="text-white font-bold">{((evaluationForm.raw_score / evaluationForm.max_score) * 100 || 0).toFixed(0)}%</span>
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Remarks / Observations</label>
                                    <textarea
                                        className="w-full bg-black border border-white/10 rounded-xl p-4 text-sm focus:border-blue-500 outline-none h-32"
                                        placeholder="Enter detailed feedback here..."
                                        value={evaluationForm.notes}
                                        onChange={e => setEvaluationForm({ ...evaluationForm, notes: e.target.value })}
                                    />
                                </div>

                                <button type="submit" className="w-full py-3 bg-green-500 hover:bg-green-400 text-black font-bold rounded-xl transition shadow-lg shadow-green-500/20">
                                    Confirm & Update Score
                                </button>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Scheduling Modal */}
            {
                schedulingApp && (
                    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-[#111] p-6 rounded-2xl w-full max-w-sm border border-white/10 shadow-2xl">
                            <h2 className="text-lg font-bold mb-1 text-white">Schedule Interview</h2>
                            <p className="text-xs text-gray-500 mb-6">For {schedulingApp.candidate_name || schedulingApp.identifier}</p>

                            <form onSubmit={handleScheduleInterview} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        name="interview_time"
                                        className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-orange-500 outline-none"
                                        defaultValue={schedulingApp.interview_time?.slice(0, 16)}
                                        required
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <button type="button" onClick={() => setSchedulingApp(null)} className="px-4 py-2 rounded-lg text-gray-400 hover:text-white text-sm">Cancel</button>
                                    <button type="submit" className="px-4 py-2 bg-green-500 text-black rounded-lg font-bold text-sm">Save Schedule</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
