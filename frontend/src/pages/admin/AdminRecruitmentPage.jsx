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
    const [forms, setForms] = useState([]); // Available forms
    const [assignmentForm, setAssignmentForm] = useState({ id: null, title: "", description: "", sig: "", external_link: "", submission_type: "FILE" });
    const [assignmentFile, setAssignmentFile] = useState(null);
    const [syncLoading, setSyncLoading] = useState(false);

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

    // Panel Management
    const [panels, setPanels] = useState([]);
    const [selectedPanel, setSelectedPanel] = useState(null);
    const [showPanelModal, setShowPanelModal] = useState(false);
    const [panelForm, setPanelForm] = useState({ panel_number: 1, name: "", members: [] });
    const [memberSearch, setMemberSearch] = useState(""); // Search state for members

    // Slot Generation
    const [slotConfig, setSlotConfig] = useState({ start_time: "", duration_minutes: 20 });
    const [users, setUsers] = useState([]); // Added missing state
    const [selectedCandidates, setSelectedCandidates] = useState([]); // Array of IDs
    const [showCandidatePicker, setShowCandidatePicker] = useState(false);

    useEffect(() => {
        loadDrives();
        loadSigs();
        loadUsers();
        loadForms();
    }, []);

    useEffect(() => {
        if (selectedDrive) {
            loadPanels(selectedDrive.id);
        }
    }, [selectedDrive]);

    const loadSigs = async () => {
        const res = await api.get("/sigs/");
        setSigs(res.data);
    };

    const loadUsers = async () => {
        try {
            const res = await api.get("/management/");
            setUsers(res.data.filter(u => u.is_active));
        } catch (err) { console.error("Failed to load users", err); }
    };

    const loadForms = async () => {
        try {
            const res = await api.get("/forms/");
            setForms(res.data);
        } catch (err) { console.error("Failed to load forms", err); }
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

    const loadPanels = async (driveId) => {
        try {
            const res = await api.get(`/recruitment/panels/?drive_id=${driveId}`);
            setPanels(res.data);
        } catch (err) { console.error(err); }
    };

    const handleCreatePanel = async (e) => {
        e.preventDefault();
        try {
            if (panelForm.id) {
                // UPDATE Existing Panel
                await api.patch(`/recruitment/panels/${panelForm.id}/`, {
                    ...panelForm,
                    drive: selectedDrive.id,
                    members: panelForm.members
                });
            } else {
                // CREATE New Panel
                await api.post("/recruitment/panels/", {
                    ...panelForm,
                    drive: selectedDrive.id,
                    members: panelForm.members
                });
            }
            setShowPanelModal(false);
            setPanelForm({ panel_number: panels.length + 2, name: "", members: [] });
            loadPanels(selectedDrive.id);
        } catch (err) { alert("Failed to save panel"); }
    };

    const handleEditPanel = (panel, e) => {
        e.stopPropagation(); // Prevent selecting the panel
        setPanelForm({
            id: panel.id,
            panel_number: panel.panel_number,
            name: panel.name,
            members: panel.members || [] // Ensure backend sends members list
        });
        setShowPanelModal(true);
    };

    const handleDeletePanel = async (panelId, e) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this panel? All slots will be lost.")) return;
        try {
            await api.delete(`/recruitment/panels/${panelId}/`);
            loadPanels(selectedDrive.id);
            if (selectedPanel?.id === panelId) setSelectedPanel(null);
        } catch (err) { alert("Failed to delete panel"); }
    };

    const handleGenerateSlots = async () => {
        if (!selectedPanel) return;
        if (!slotConfig.start_time) return alert("Please set a start time.");
        if (!slotConfig.duration_minutes) return alert("Please set a duration.");

        try {
            await api.post(`/recruitment/panels/${selectedPanel.id}/generate_slots/`, {
                start_time: slotConfig.start_time,
                duration_minutes: slotConfig.duration_minutes,
                candidate_ids: selectedCandidates
            });
            alert("Slots generated successfully!");
            setSelectedCandidates([]);
            setShowCandidatePicker(false);
            loadPanels(selectedDrive.id);
            const res = await api.get(`/recruitment/panels/${selectedPanel.id}/`);
            setSelectedPanel(res.data);
            loadApplications(selectedDrive.id);
        } catch (err) {
            console.error(err);
            alert("Failed to generate slots");
        }
    };

    const handleUpdateSlotStatus = async (slotId, status) => {
        try {
            await api.patch(`/recruitment/slots/${slotId}/`, { status });
            const res = await api.get(`/recruitment/panels/${selectedPanel.id}/`);
            setSelectedPanel(res.data);
        } catch (err) { alert("Failed to update status"); }
    };

    const handleDeleteSlot = async (slotId) => {
        if (!confirm("Are you sure you want to remove this candidate from the panel?")) return;
        try {
            await api.delete(`/recruitment/slots/${slotId}/`);

            // Refresh panel
            const res = await api.get(`/recruitment/panels/${selectedPanel.id}/`);
            setSelectedPanel(res.data);

            // Reload applications to reflect status change
            loadApplications(selectedDrive.id);
            loadPanels(selectedDrive.id);
        } catch (err) {
            console.error(err);
            alert("Failed to delete slot");
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

    // Configuration Update
    const handleUpdateDriveConfig = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const updates = Object.fromEntries(fd.entries());
        try {
            await api.patch(`/recruitment/drives/${selectedDrive.id}/`, updates);
            // Optimistic update
            setSelectedDrive({ ...selectedDrive, ...updates });
            alert("Configuration Saved.");
        } catch (err) { alert("Failed to update config"); }
    };

    // Sync Candidates
    const handleSyncCandidates = async () => {
        if (!confirm("This will import/update candidates from the linked form based on the configuration. Continue?")) return;
        setSyncLoading(true);
        try {
            const res = await api.post(`/recruitment/drives/${selectedDrive.id}/sync_candidates/`);
            alert(res.data.message);
            loadApplications(selectedDrive.id);
        } catch (err) {
            console.error(err);
            alert("Sync Failed: " + (err.response?.data?.error || "Unknown Error"));
        } finally {
            setSyncLoading(false);
        }
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
                                {/* Configuration Section */}
                                <div className="bg-[#0b0c15] p-6 rounded-2xl border border-white/5">
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                        <span className="w-1.5 h-6 bg-purple-500 rounded-lg"></span> Data Source Configuration
                                    </h3>
                                    <form onSubmit={handleUpdateDriveConfig} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Linked Form</label>
                                            <select
                                                name="form"
                                                className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg p-3 text-sm focus:border-purple-500 outline-none"
                                                defaultValue={selectedDrive.form || ""}
                                            >
                                                <option value="">-- No Form Linked --</option>
                                                {forms.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
                                            </select>
                                            <p className="text-[10px] text-gray-500 mt-1">Select the form collecting applications.</p>
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Primary Identifier Field (UID)</label>
                                            <input
                                                name="primary_field"
                                                className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg p-3 text-sm focus:border-purple-500 outline-none"
                                                defaultValue={selectedDrive.primary_field || ""}
                                                placeholder="e.g. Email / Roll Number"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Name Field (Optional)</label>
                                            <input
                                                name="candidate_name_field"
                                                className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg p-3 text-sm focus:border-purple-500 outline-none"
                                                defaultValue={selectedDrive.candidate_name_field || ""}
                                                placeholder="e.g. Full Name"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">SIG/Domain Field (Optional)</label>
                                            <input
                                                name="sig_field"
                                                className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg p-3 text-sm focus:border-purple-500 outline-none"
                                                defaultValue={selectedDrive.sig_field || ""}
                                                placeholder="e.g. Interested Domain"
                                            />
                                        </div>
                                        <div className="md:col-span-2 flex justify-end">
                                            <button type="submit" className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition text-sm">Save Configuration</button>
                                        </div>
                                    </form>
                                </div>

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
                                            <button
                                                onClick={handleSyncCandidates}
                                                disabled={syncLoading}
                                                className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg hover:bg-purple-500/20 text-xs font-bold disabled:opacity-50"
                                            >
                                                {syncLoading ? "Syncing..." : <><Users size={14} /> Sync Candidates</>}
                                            </button>
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
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                                {/* Panels List */}
                                <div className="lg:col-span-1 space-y-4">
                                    <button
                                        onClick={() => {
                                            setPanelForm({ panel_number: panels.length + 1, name: "", members: [] }); // Reset form
                                            setShowPanelModal(true);
                                        }}
                                        className="w-full py-3 border-2 border-dashed border-white/10 hover:border-orange-500/50 rounded-xl text-gray-400 hover:text-orange-400 font-bold transition flex items-center justify-center gap-2"
                                    >
                                        <Plus size={16} /> Add Panel
                                    </button>

                                    <div className="space-y-2">
                                        {panels.map(panel => {
                                            const ongoing = panel.slots?.find(s => s.status === 'ONGOING');
                                            return (
                                                <div
                                                    key={panel.id}
                                                    onClick={() => {
                                                        setSelectedPanel(panel);
                                                        setSlotConfig({
                                                            start_time: panel.start_time ? panel.start_time.slice(0, 16) : "",
                                                            duration_minutes: 20
                                                        });
                                                    }}
                                                    className={`p-4 rounded-xl cursor-pointer border transition ${selectedPanel?.id === panel.id
                                                        ? "bg-orange-500/10 border-orange-500/50 text-white"
                                                        : "bg-white/5 border-white/5 hover:bg-white/10 text-gray-400"
                                                        }`}
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-bold">Panel {panel.panel_number}</span>
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-xs bg-black/20 px-2 py-0.5 rounded mr-1">{panel.slots?.length || 0} Slots</span>
                                                            <button
                                                                onClick={(e) => handleEditPanel(panel, e)}
                                                                className="p-1 hover:text-white hover:bg-white/10 rounded transition"
                                                            >
                                                                <FileText size={12} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => handleDeletePanel(panel.id, e)}
                                                                className="p-1 hover:text-red-400 hover:bg-red-500/10 rounded transition"
                                                            >
                                                                <Trash size={12} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <p className="text-sm opacity-60 truncate">{panel.name || "General Panel"}</p>
                                                    {ongoing && (
                                                        <div className="mt-2 text-[10px] bg-green-500/10 text-green-400 px-2 py-1 rounded border border-green-500/20 flex items-center gap-1 animate-pulse">
                                                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                                            Ongoing: {ongoing.candidate_name || ongoing.application_identifier}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Panel Detail */}
                                <div className="lg:col-span-3">
                                    {selectedPanel ? (
                                        <div className="space-y-6">
                                            {/* Config Section */}
                                            <div className="bg-[#0b0c15] p-6 rounded-2xl border border-white/5">
                                                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-white/5 pb-6 mb-6">
                                                    <div>
                                                        <h3 className="text-xl font-bold font-[Orbitron]">Panel {selectedPanel.panel_number}: {selectedPanel.name}</h3>
                                                        <p className="text-gray-500 text-sm mt-1">Manage interview slots and candidates.</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => setShowCandidatePicker(true)}
                                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-black font-bold rounded-lg transition text-sm flex items-center gap-2"
                                                        >
                                                            <Users size={16} /> Assign Candidates
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Start Time</label>
                                                        <input
                                                            type="datetime-local"
                                                            className="w-full mt-2 bg-white/5 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-orange-500"
                                                            value={slotConfig.start_time}
                                                            onChange={e => setSlotConfig({ ...slotConfig, start_time: e.target.value })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Slot Duration (Mins)</label>
                                                        <input
                                                            type="number"
                                                            className="w-full mt-2 bg-white/5 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-orange-500"
                                                            value={slotConfig.duration_minutes}
                                                            onChange={e => setSlotConfig({ ...slotConfig, duration_minutes: parseInt(e.target.value) })}
                                                        />
                                                    </div>
                                                </div>

                                                {selectedCandidates.length > 0 && (
                                                    <div className="mt-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl flex justify-between items-center animate-fade-in">
                                                        <div className="text-orange-400 font-bold text-sm">
                                                            {selectedCandidates.length} Candidates Selected
                                                        </div>
                                                        <button
                                                            onClick={handleGenerateSlots}
                                                            className="px-4 py-2 bg-orange-500 hover:bg-orange-400 text-black font-bold rounded-lg text-sm transition"
                                                        >
                                                            Generate Slots
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Slots List */}
                                            <div className="space-y-4">
                                                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Interview Timeline</h4>
                                                {selectedPanel.slots && selectedPanel.slots.length > 0 ? (
                                                    selectedPanel.slots.sort((a, b) => new Date(a.start_time) - new Date(b.start_time)).map(slot => (
                                                        <div key={slot.id} className={`group flex flex-col sm:flex-row gap-4 p-4 rounded-xl border transition items-center ${slot.status === 'ONGOING' ? 'bg-green-500/10 border-green-500/50' :
                                                            slot.status === 'COMPLETED' ? 'bg-white/5 border-white/5 opacity-60' :
                                                                'bg-[#0b0c15] border-white/10'
                                                            }`}>
                                                            <div className="w-32 flex-shrink-0">
                                                                <div className="text-white font-mono font-bold">{formatDateIST(slot.start_time).split(',')[1]}</div>
                                                                <div className="text-[10px] text-gray-500 uppercase font-bold">{formatDateIST(slot.start_time).split(',')[0]}</div>
                                                            </div>

                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2">
                                                                    <h5 className="font-bold text-white text-lg">{slot.candidate_name || slot.application_identifier}</h5>
                                                                    <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase ${slot.status === 'ONGOING' ? 'bg-green-500 text-black' :
                                                                        slot.status === 'COMPLETED' ? 'bg-gray-700 text-gray-300' : 'bg-blue-500/20 text-blue-400'
                                                                        }`}>
                                                                        {slot.status}
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs text-gray-500 mt-1">ID: {slot.application_identifier}</p>
                                                            </div>

                                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                                                                {slot.status !== 'ONGOING' && slot.status !== 'COMPLETED' && (
                                                                    <button onClick={() => handleUpdateSlotStatus(slot.id, 'ONGOING')} className="p-2 bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-black rounded-lg transition" title="Start Interview"><Users size={16} /></button>
                                                                )}
                                                                {slot.status === 'ONGOING' && (
                                                                    <button onClick={() => handleUpdateSlotStatus(slot.id, 'COMPLETED')} className="p-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-black rounded-lg transition" title="Mark Complete"><Award size={16} /></button>
                                                                )}
                                                                <button onClick={() => handleUpdateSlotStatus(slot.id, 'DELAYED')} className="p-2 bg-orange-500/20 text-orange-400 hover:bg-orange-500 hover:text-black rounded-lg transition" title="Delay"><Calendar size={16} /></button>
                                                                <button onClick={() => { setEvaluatingApp(applications.find(a => a.id === slot.application)); }} className="p-2 bg-purple-500/20 text-purple-400 hover:bg-purple-500 hover:text-black rounded-lg transition" title="Evaluate"><FileText size={16} /></button>
                                                                <button onClick={() => handleDeleteSlot(slot.id)} className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-black rounded-lg transition" title="Delete Slot"><Trash size={16} /></button>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-center p-8 border border-dashed border-white/10 rounded-xl text-gray-500">
                                                        No slots generated. Assign candidates and generate slots.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-gray-500 border border-white/5 rounded-2xl bg-white/5 p-12">
                                            Select or create a panel to begin.
                                        </div>
                                    )}
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

            {/* Create Panel Modal */}
            {
                showPanelModal && (
                    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="glass p-8 rounded-2xl w-full max-w-sm border border-orange-500/30 shadow-2xl">
                            <h2 className="text-xl font-bold mb-4 font-[Orbitron] text-orange-400">{panelForm.id ? "Edit Panel" : "Add Interview Panel"}</h2>
                            <form onSubmit={handleCreatePanel}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Panel Number</label>
                                        <input type="number" className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-orange-500 outline-none mt-1" required value={panelForm.panel_number} onChange={e => setPanelForm({ ...panelForm, panel_number: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Panel Name (Optional)</label>
                                        <input className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-orange-500 outline-none mt-1" placeholder="e.g. Design Panel" value={panelForm.name} onChange={e => setPanelForm({ ...panelForm, name: e.target.value })} />
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Panel Members</label>
                                        <input
                                            placeholder="Search users..."
                                            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs mb-2 text-white outline-none focus:border-orange-500"
                                            value={memberSearch}
                                            onChange={e => setMemberSearch(e.target.value)}
                                        />
                                        <div className="flex flex-wrap gap-2 mt-2 bg-black/40 border border-white/10 p-2 rounded-lg max-h-32 overflow-y-auto custom-scrollbar">
                                            {users.filter(u => u.username.toLowerCase().includes(memberSearch.toLowerCase())).map(u => (
                                                <label key={u.id} className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer border transition text-[10px] ${panelForm.members?.includes(u.id) ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 'border-white/10 text-gray-400 opacity-60 hover:opacity-100'}`}>
                                                    <input
                                                        type="checkbox"
                                                        className="hidden"
                                                        checked={panelForm.members?.includes(u.id)}
                                                        onChange={e => {
                                                            const newMembers = e.target.checked
                                                                ? [...(panelForm.members || []), u.id]
                                                                : (panelForm.members || []).filter(id => id !== u.id);
                                                            setPanelForm({ ...panelForm, members: newMembers });
                                                        }}
                                                    />
                                                    {u.username}
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4">
                                        <button type="button" onClick={() => setShowPanelModal(false)} className="px-4 py-2 rounded-lg text-gray-400 hover:text-white">Cancel</button>
                                        <button type="submit" className="px-6 py-2 bg-orange-500 text-black font-bold rounded-lg hover:bg-orange-400">{panelForm.id ? "Update" : "Create"}</button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Candidate Picker Modal */}
            {
                showCandidatePicker && (
                    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-[#111] p-6 rounded-2xl w-full max-w-2xl border border-white/10 shadow-2xl h-[80vh] flex flex-col">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-white">Select Candidates</h2>
                                <button type="button" onClick={() => setShowCandidatePicker(false)} className="text-gray-500 hover:text-white"><Trash size={16} /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                {applications.filter(app => app.status !== 'REJECTED' && app.status !== 'SELECTED').map(app => (
                                    <div
                                        key={app.id}
                                        className={`p-3 rounded-lg border flex justify-between items-center cursor-pointer transition ${selectedCandidates.includes(app.id) ? 'bg-blue-600/20 border-blue-500' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                                        onClick={() => {
                                            if (selectedCandidates.includes(app.id)) {
                                                setSelectedCandidates(selectedCandidates.filter(id => id !== app.id));
                                            } else {
                                                setSelectedCandidates([...selectedCandidates, app.id]);
                                            }
                                        }}
                                    >
                                        <div>
                                            <h4 className="font-bold text-white">{app.candidate_name || app.identifier}</h4>
                                            <p className="text-xs text-gray-400">{app.sig_name} • OA: {app.oa_score || '-'} • Asm: {app.assessment_score || '-'}</p>
                                        </div>
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center ${selectedCandidates.includes(app.id) ? 'bg-blue-500 border-blue-500' : 'border-gray-600'}`}>
                                            {selectedCandidates.includes(app.id) && <div className="w-2 h-2 bg-white rounded-sm" />}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-6 mt-4 border-t border-white/10 flex justify-between items-center">
                                <p className="text-sm text-gray-500">{selectedCandidates.length} selected</p>
                                <button onClick={() => setShowCandidatePicker(false)} className="px-6 py-2 bg-white text-black font-bold rounded-lg hover:bg-gray-200">Done</button>
                            </div>
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
