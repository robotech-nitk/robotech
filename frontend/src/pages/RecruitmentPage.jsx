import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { formatDateIST } from "../utils/dateUtils";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Download, CheckCircle2, Circle, Clock, ChevronRight, FileText, Upload, ExternalLink } from "lucide-react";
import { buildMediaUrl } from "../utils/mediaUrl";

export default function RecruitmentPage() {
    const [drive, setDrive] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedSig, setSelectedSig] = useState(null);

    // Submission UI
    const [showUpload, setShowUpload] = useState(false);
    const [candidateName, setCandidateName] = useState("");
    const [identifier, setIdentifier] = useState("");
    const [file, setFile] = useState(null);
    const [solutionLink, setSolutionLink] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });

    useEffect(() => {
        fetchActiveDrive();
    }, []);

    const fetchActiveDrive = async () => {
        try {
            setLoading(true);
            const res = await api.get("/recruitment/drives/active_public/");
            setDrive(res.data);
            if (res.data?.assignments?.length > 0) {
                setSelectedSig(res.data.assignments[0]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!identifier || !candidateName || (!file && !solutionLink)) return setMessage({ text: "Name, ID and solution required", type: "error" });

        try {
            setSubmitting(true);
            const fd = new FormData();
            fd.append("candidate_name", candidateName);
            fd.append("identifier", identifier);
            if (selectedSig?.sig) fd.append("sig", selectedSig.sig);

            if (file) fd.append("assessment_file", file);
            if (solutionLink) fd.append("solution_link", solutionLink);
            fd.append("drive", drive.id);

            // We need a custom action in RecruitmentViewSet or a dedicated upload endpoint
            // For now, let's assume we use a PATCH to a dedicated submission endpoint
            // Or use the RecruitmentApplicationViewSet if we have one.
            // Let's check the backend for a submission endpoint.
            await api.post("/recruitment/drives/submit_assessment/", fd);

            setMessage({ text: "Assessment submitted successfully!", type: "success" });
            setShowUpload(false);
            setFile(null);
            setSolutionLink("");
            setIdentifier("");
        } catch (err) {
            setMessage({ text: err.response?.data?.error || "Submission failed", type: "error" });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="w-12 h-12 border-t-2 border-orange-500 rounded-full animate-spin"></div>
        </div>
    );

    if (!drive) return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            <Navbar />
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <h1 className="text-4xl font-bold font-[Orbitron] mb-4">No Active Recruitment</h1>
                <p className="text-gray-400 max-w-md">There are currently no active recruitment drives. Follow our social media for updates on the next cycle.</p>
                <Link to="/" className="mt-8 text-orange-400 hover:underline">Return Home</Link>
            </div>
            <Footer />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#050505] text-white">
            <Navbar />

            {/* HERO SECTION */}
            <div className="relative pt-32 pb-20 px-6 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-orange-500/10 to-transparent -z-10 blur-3xl opacity-50 rounded-full" />

                <div className="max-w-6xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-xs font-bold uppercase tracking-widest mb-6 animate-fade-in">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                        </span>
                        Live Recruitment Cycle
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black font-[Orbitron] mb-6 tracking-tight uppercase leading-none animate-slide-up">
                        {drive.title}
                    </h1>
                    <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 animate-slide-up animation-delay-100">
                        {drive.description || "Join NITK's premier robotics club. We are looking for passionate engineers, designers, and thinkers."}
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up animation-delay-200">
                        <a href={drive.registration_link} target="_blank" rel="noreferrer" className="px-8 py-4 bg-orange-600 hover:bg-orange-500 text-black font-black rounded-xl transition shadow-xl shadow-orange-600/20 uppercase tracking-widest text-sm w-full sm:w-auto text-center">
                            Start Application
                        </a>
                        <button onClick={() => {
                            const section = document.getElementById('assessments');
                            section?.scrollIntoView({ behavior: 'smooth' });
                        }} className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition uppercase tracking-widest text-sm w-full sm:w-auto text-center">
                            View Assessments
                        </button>
                    </div>
                </div>
            </div>

            <main className="max-w-6xl mx-auto px-6 pb-32 space-y-32">

                {/* TIMELINE SECTION */}
                <section>
                    <div className="flex items-center gap-4 mb-12">
                        <div className="w-12 h-1 bg-orange-600 rounded-full"></div>
                        <h2 className="text-2xl font-[Orbitron] font-black uppercase tracking-widest text-orange-400">Roadmap</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {drive.timeline?.map((item, i) => (
                            <div key={item.id} className="relative group">
                                <div className={`p-6 rounded-2xl border transition-all duration-300 h-full ${item.is_completed ? 'bg-orange-500/5 border-orange-500/20 grayscale translate-y-2 opacity-50' : 'bg-[#111] border-white/5 hover:border-orange-500/30'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`p-2 rounded-lg ${item.is_completed ? 'bg-green-500/20 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>
                                            {item.is_completed ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                                        </div>
                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Step 0{i + 1}</span>
                                    </div>
                                    <h3 className={`text-xl font-bold mb-2 uppercase font-[Orbitron] ${item.is_completed ? 'text-gray-400' : 'text-white'}`}>{item.title}</h3>
                                    <p className="text-sm text-gray-400">
                                        {formatDateIST(item.date, { hour: undefined, minute: undefined })}
                                    </p>

                                    {/* Connection Line (for desktop) */}
                                    {i < drive.timeline.length - 1 && (
                                        <div className="hidden lg:block absolute -right-6 top-1/2 -translate-y-1/2 z-10 text-white/10 group-hover:text-orange-500/50 transition">
                                            <ChevronRight size={24} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ASSESSMENT SECTION */}
                <section id="assessments">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-1 bg-orange-600 rounded-full"></div>
                            <h2 className="text-2xl font-[Orbitron] font-black uppercase tracking-widest text-orange-400">SIG Assignments</h2>
                        </div>
                        <p className="text-gray-500 text-sm max-w-md">Download the task assigned for your applied SIG and submit your solution below.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* SIG Selector */}
                        <div className="space-y-3">
                            {drive.assignments?.map(asn => (
                                <button
                                    key={asn.id}
                                    onClick={() => setSelectedSig(asn)}
                                    className={`w-full p-4 rounded-xl border text-left transition-all ${selectedSig?.id === asn.id
                                        ? "bg-orange-600 border-orange-600 text-black"
                                        : "bg-white/5 border-white/10 text-gray-400 hover:border-white/30"}`}
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold uppercase tracking-wider text-sm">{asn.sig_name}</span>
                                        {selectedSig?.id === asn.id && <ChevronRight size={18} />}
                                    </div>
                                </button>
                            ))}
                            {!drive.assignments?.length && <p className="text-gray-600 italic">No specific assignments uploaded yet.</p>}
                        </div>

                        {/* Assignment Detail */}
                        {selectedSig ? (
                            <div className="lg:col-span-2 bg-[#111] border border-white/10 rounded-3xl p-8 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-6">
                                        <h3 className="text-3xl font-black font-[Orbitron] uppercase text-orange-400">{selectedSig.title}</h3>
                                        <div className="flex gap-2">
                                            {selectedSig.file && (
                                                <a
                                                    href={buildMediaUrl(selectedSig.file)}
                                                    download
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="p-4 bg-orange-600 hover:bg-orange-500 text-black rounded-2xl transition shadow-lg shadow-orange-600/20"
                                                >
                                                    <Download size={24} />
                                                </a>
                                            )}
                                            {selectedSig.external_link && (
                                                <a
                                                    href={selectedSig.external_link}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="p-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition border border-white/10"
                                                >
                                                    <ExternalLink size={24} />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-gray-400 leading-relaxed mb-8 whitespace-pre-wrap">{selectedSig.description || "No description provided. Please refer to the downloaded file for instructions."}</p>
                                </div>

                                <div className="p-6 bg-black/40 rounded-2xl border border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-white/5 rounded-xl text-gray-500"><FileText size={24} /></div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Technical Task</p>
                                            <p className="font-medium text-white">Assessment_{selectedSig.sig_name}.pdf</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowUpload(true)}
                                        className="text-orange-400 font-bold text-sm hover:underline flex items-center gap-2"
                                    >
                                        <Upload size={18} /> Submit Solution
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="lg:col-span-2 flex items-center justify-center border border-dashed border-white/10 rounded-3xl text-gray-600 italic">
                                Select a SIG to view assignment
                            </div>
                        )}
                    </div>
                </section>
            </main>

            {/* UPLOAD MODAL */}
            {showUpload && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in">
                    <div className="w-full max-w-md bg-[#111] border border-orange-500/30 rounded-3xl p-8 shadow-2xl">
                        <h3 className="text-2xl font-bold font-[Orbitron] mb-2 text-orange-400 uppercase">Submit Assessment</h3>
                        <p className="text-gray-500 text-sm mb-8">Enter your primary identifier (Email/Roll No) as used in the form.</p>

                        <form onSubmit={handleUpload} className="space-y-6">
                            {message.text && (
                                <div className={`p-4 rounded-xl text-sm font-bold ${message.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                    {message.text}
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2">Full Name</label>
                                <input
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 focus:border-orange-500 outline-none"
                                    placeholder="Enter your full name"
                                    value={candidateName}
                                    onChange={e => setCandidateName(e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2">Primary Identifier</label>
                                <input
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 focus:border-orange-500 outline-none"
                                    placeholder="Enter Email or Roll No"
                                    value={identifier}
                                    onChange={e => setIdentifier(e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2">Select SIG</label>
                                <select
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 focus:border-orange-500 outline-none text-white appearance-none"
                                    value={selectedSig?.id || ""}
                                    onChange={(e) => {
                                        const found = drive.assignments.find(a => a.id === parseInt(e.target.value));
                                        if (found) setSelectedSig(found);
                                    }}
                                >
                                    {drive.assignments?.map(asn => (
                                        <option key={asn.id} value={asn.id} className="bg-black text-white">
                                            {asn.sig_name} - {asn.title}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {(!selectedSig?.submission_type || selectedSig.submission_type === 'FILE') && (
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2">Solution File (PDF/ZIP)</label>
                                    <label className="w-full h-24 flex flex-col items-center justify-center bg-black/60 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:border-orange-500/50 transition group">
                                        {file ? (
                                            <div className="text-orange-400 font-bold">{file.name}</div>
                                        ) : (
                                            <>
                                                <Upload className="text-gray-600 group-hover:text-orange-500 mb-1" size={24} />
                                                <span className="text-gray-500 text-xs">Drop File</span>
                                            </>
                                        )}
                                        <input type="file" className="hidden" onChange={e => { setFile(e.target.files[0]); setSolutionLink(""); }} accept=".pdf,.zip,.rar" />
                                    </label>
                                </div>
                            )}

                            {selectedSig?.submission_type === 'LINK' && (
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2">Drive / GitHub Link</label>
                                    <input
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-4 focus:border-orange-500 outline-none text-sm"
                                        placeholder="https://drive.google.com/..."
                                        value={solutionLink}
                                        onChange={e => { setSolutionLink(e.target.value); setFile(null); }}
                                    />
                                </div>
                            )}

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowUpload(false)} className="flex-1 py-4 text-gray-500 font-bold hover:bg-white/5 rounded-xl transition uppercase tracking-widest text-xs">Cancel</button>
                                <button type="submit" disabled={submitting} className="flex-1 py-4 bg-orange-600 text-black font-black rounded-xl hover:bg-orange-500 disabled:opacity-50 transition uppercase tracking-widest text-xs shadow-lg shadow-orange-600/20">
                                    {submitting ? "Uploading..." : "Transmit"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}
