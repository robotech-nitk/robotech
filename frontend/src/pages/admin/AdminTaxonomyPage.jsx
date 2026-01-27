import { useEffect, useState, useRef } from "react";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";
import {
    GripVertical,
    Plus,
    RefreshCw,
    Trash2,
    Edit3,
    Link as LinkIcon,
    Settings2
} from "lucide-react";

export default function AdminTaxonomyPage() {
    const navigate = useNavigate();
    const [sigs, setSigs] = useState([]);
    const [fields, setFields] = useState([]);
    const [positions, setPositions] = useState([]);
    const [roles, setRoles] = useState([]);

    const [tab, setTab] = useState("sigs"); // "sigs" | "fields" | "positions"

    const [editItem, setEditItem] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [sigRes, fieldRes, posRes, roleRes] = await Promise.all([
                api.get("/sigs/"),
                api.get("/profile-fields/"),
                api.get("/positions/"),
                api.get("/roles/")
            ]);
            // Ensure they are sorted by order
            setSigs(sigRes.data.sort((a, b) => a.order - b.order));
            setFields(fieldRes.data.sort((a, b) => a.order - b.order));
            setPositions(posRes.data.sort((a, b) => a.rank - b.rank));
            setRoles(roleRes.data);
        } catch (err) {
            console.error(err);
        }
    };

    // Generic CRUD
    const handleSave = async (e) => {
        e.preventDefault();
        let endpoint = "/sigs/";
        if (tab === 'fields') endpoint = "/profile-fields/";
        if (tab === 'positions') endpoint = "/positions/";

        const payload = { ...editItem };
        // Clean up
        if (tab === 'fields' && !payload.limit_to_sig) payload.limit_to_sig = null;

        if (tab === 'fields' && payload.label && !payload.key) {
            payload.key = payload.label.toLowerCase().replace(/\s+/g, '_');
        }

        // Handle Role Link for positions
        if (tab === 'positions' && !payload.role_link) payload.role_link = null;

        try {
            if (payload.id) {
                await api.put(`${endpoint}${payload.id}/`, payload);
            } else {
                await api.post(endpoint, payload);
            }
            setIsFormOpen(false);
            loadData();
        } catch (err) {
            alert("Failed to save. Ensure unique constraints.");
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure? This action cannot be undone.")) return;
        let endpoint = "/sigs/";
        if (tab === 'fields') endpoint = "/profile-fields/";
        if (tab === 'positions') endpoint = "/positions/";

        try {
            await api.delete(`${endpoint}${id}/`);
            loadData();
        } catch (err) {
            alert("Failed to delete. It might be in use.");
        }
    };

    const openCreate = () => {
        if (tab === 'sigs') setEditItem({ name: "", description: "" });
        if (tab === 'positions') setEditItem({ name: "", rank: 10, role_link: "" });
        if (tab === 'fields') setEditItem({ label: "", key: "", field_type: "text", is_required: false, limit_to_sig: "" });
        setIsFormOpen(true);
    };

    /* ================= DRAG & DROP LOGIC ================= */
    const dragItem = useRef();
    const dragOverItem = useRef();

    const handleDragStart = (e, item, index, listType) => {
        dragItem.current = { index, listType };
    };

    const handleDragEnter = (e, index, listType) => {
        dragOverItem.current = { index, listType };
    };

    const handleDragEnd = async () => {
        if (!dragItem.current || !dragOverItem.current) return;
        const source = dragItem.current;
        const dest = dragOverItem.current;

        if (source.listType !== dest.listType) return;
        if (source.index === dest.index) return;

        // Clone list based on type
        let listClone = [];
        let setList = null;
        let endpoint = "";

        if (tab === 'sigs') {
            listClone = [...sigs];
            setList = setSigs;
            endpoint = "/sigs/reorder-sigs/";
        } else if (tab === 'fields') {
            listClone = [...fields];
            setList = setFields;
            endpoint = "/profile-fields/reorder-fields/";
        } else {
            return; // No DnD for positions yet
        }

        // Reorder
        const itemToMove = listClone[source.index];
        listClone.splice(source.index, 1);
        listClone.splice(dest.index, 0, itemToMove);

        // Optimistic Update
        setList(listClone);

        // API Call
        const payload = listClone.map((item, idx) => ({
            id: item.id,
            order: idx
        }));

        try {
            await api.post(endpoint, { items: payload });
        } catch (err) {
            console.error("Reorder failed", err);
            loadData(); // Revert
        }

        dragItem.current = null;
        dragOverItem.current = null;
    };


    return (
        <div className="max-w-6xl mx-auto animate-fade-in pb-20 p-4 sm:p-6 min-h-screen">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <button onClick={() => navigate("/portal/dashboard")} className="text-sm text-cyan-400 hover:underline mb-2">← Dashboard</button>
                    <h1 className="text-3xl md:text-4xl font-bold font-[Orbitron] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 uppercase tracking-tight">
                        Structure Command
                    </h1>
                </div>
            </div>

            {/* TABS */}
            <div className="flex gap-2 mb-8 border-b border-white/5 overflow-x-auto no-scrollbar scroll-smooth">
                <button onClick={() => setTab("sigs")} className={`pb-3 px-6 whitespace-nowrap transition-all font-bold tracking-widest text-xs uppercase ${tab === 'sigs' ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-400/5' : 'text-gray-500 hover:text-gray-300'}`}>
                    SIGs (Teams)
                </button>
                <button onClick={() => setTab("positions")} className={`pb-3 px-6 whitespace-nowrap transition-all font-bold tracking-widest text-xs uppercase ${tab === 'positions' ? 'text-emerald-400 border-b-2 border-emerald-400 bg-emerald-400/5' : 'text-gray-500 hover:text-gray-300'}`}>
                    Ranks
                </button>
                <button onClick={() => setTab("fields")} className={`pb-3 px-6 whitespace-nowrap transition-all font-bold tracking-widest text-xs uppercase ${tab === 'fields' ? 'text-pink-400 border-b-2 border-pink-400 bg-pink-400/5' : 'text-gray-500 hover:text-gray-300'}`}>
                    Profile Schema
                </button>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={openCreate} className="flex-1 sm:flex-none bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 px-6 py-2.5 rounded-xl text-white flex items-center justify-center gap-2 transition shadow-lg shadow-cyan-500/20 font-bold text-sm">
                        <Plus size={18} /> New {tab === 'sigs' ? "SIG" : tab === 'positions' ? "Rank" : "Field"}
                    </button>
                    <button onClick={loadData} className="bg-white/5 hover:bg-white/10 p-2.5 rounded-xl text-gray-400 hover:text-white transition border border-white/10" title="Refresh">
                        <RefreshCw size={18} />
                    </button>
                </div>
                {(tab === 'sigs' || tab === 'fields') && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 border border-white/5 rounded-lg">
                        <GripVertical size={14} className="text-gray-500" />
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">DRAG ELEMENTS TO REORDER</span>
                    </div>
                )}
            </div>

            {/* LISTS */}
            <div className="space-y-4">
                {/* SIGS */}
                {tab === 'sigs' && sigs.map((sig, index) => (
                    <div
                        key={sig.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, sig, index, 'sigs')}
                        onDragEnter={(e) => handleDragEnter(e, index, 'sigs')}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => e.preventDefault()}
                        className="bg-[#0d0e14] p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-4 group border border-white/5 hover:border-cyan-500/30 transition shadow-lg"
                    >
                        <div className="flex items-center gap-4 flex-1">
                            <div className="p-2 bg-black/40 rounded-lg cursor-grab active:cursor-grabbing text-gray-600 hover:text-cyan-400 transition border border-white/5 shrink-0">
                                <GripVertical size={20} />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-lg text-cyan-400">{sig.name}</h3>
                                <p className="text-gray-500 text-sm mt-0.5">{sig.description || "No transmission description available."}</p>
                            </div>
                        </div>
                        <div className="flex gap-2 sm:opacity-0 group-hover:opacity-100 transition-all duration-300 justify-end mt-4 sm:mt-0">
                            <button onClick={() => { setEditItem(sig); setIsFormOpen(true); }} className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg hover:bg-cyan-500/20 transition border border-cyan-500/20" title="Edit">
                                <Edit3 size={18} />
                            </button>
                            <button onClick={() => handleDelete(sig.id)} className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition border border-red-500/20" title="Delete">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}

                {/* POSITIONS */}
                {tab === 'positions' && positions.map(p => (
                    <div key={p.id} className="bg-[#0d0e14] p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 group border border-white/5 hover:border-emerald-500/30 transition shadow-lg">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex flex-col items-center justify-center border border-emerald-500/20 shrink-0" title="System Rank">
                                <span className="text-[10px] font-black opacity-40 leading-none">RANK</span>
                                <span className="text-lg font-bold font-[Orbitron]">{p.rank}</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-white uppercase tracking-tight">{p.name}</h3>
                                {p.role_link && (
                                    <button onClick={() => navigate("/portal/roles")} className="text-[10px] text-emerald-500/80 hover:text-emerald-400 transition bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10 mt-1.5 flex items-center gap-1.5 uppercase font-bold tracking-widest">
                                        <LinkIcon size={12} /> Access: {roles.find(r => r.id === p.role_link)?.name || "Unknown"}
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2 sm:opacity-0 group-hover:opacity-100 transition-all duration-300 justify-end mt-4 sm:mt-0">
                            <button onClick={() => { setEditItem(p); setIsFormOpen(true); }} className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition border border-emerald-500/20" title="Edit">
                                <Edit3 size={18} />
                            </button>
                            <button onClick={() => handleDelete(p.id)} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition border border-red-500/20" title="Delete">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}

                {/* FIELDS */}
                {tab === 'fields' && fields.map((f, index) => (
                    <div
                        key={f.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, f, index, 'fields')}
                        onDragEnter={(e) => handleDragEnter(e, index, 'fields')}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => e.preventDefault()}
                        className="bg-[#0d0e14] p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-4 group border border-white/5 hover:border-pink-500/30 transition shadow-lg"
                    >
                        <div className="flex items-center gap-4 flex-1">
                            <div className="p-2 bg-black/40 rounded-lg cursor-grab active:cursor-grabbing text-gray-600 hover:text-pink-400 transition border border-white/5 shrink-0">
                                <GripVertical size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="font-bold text-lg text-pink-400 truncate tracking-tight">{f.label}</h3>
                                    <span className="text-[9px] font-black uppercase tracking-widest bg-white/5 border border-white/10 px-2 py-0.5 rounded text-gray-400">{f.field_type}</span>
                                    {f.limit_to_sig && (
                                        <span className="text-[9px] font-black uppercase tracking-widest bg-cyan-900/20 px-2 py-0.5 rounded text-cyan-400 border border-cyan-500/20">
                                            Sector: {sigs.find(s => s.id === f.limit_to_sig)?.name || "SIG#" + f.limit_to_sig}
                                        </span>
                                    )}
                                </div>
                                <p className="text-gray-600 text-[10px] font-mono mt-1 uppercase tracking-tighter truncate">Identifier: {f.key}</p>
                            </div>
                        </div>
                        <div className="flex gap-2 sm:opacity-0 group-hover:opacity-100 transition-all duration-300 justify-end mt-4 sm:mt-0">
                            <button onClick={() => { setEditItem(f); setIsFormOpen(true); }} className="p-2 bg-pink-500/10 text-pink-400 rounded-lg hover:bg-pink-500/20 transition border border-pink-500/20" title="Edit">
                                <Edit3 size={18} />
                            </button>
                            <button onClick={() => handleDelete(f.id)} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition border border-red-500/20" title="Delete">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* MODAL */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fade-in overflow-y-auto">
                    <form onSubmit={handleSave} className="glass border border-white/10 p-5 sm:p-8 rounded-3xl w-full max-w-md space-y-6 shadow-2xl animate-scale-in my-auto relative max-h-[95vh] overflow-y-auto custom-scrollbar">
                        <button type="button" onClick={() => setIsFormOpen(false)} className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition group">
                            <span className="text-xl">&times;</span>
                        </button>

                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                <Settings2 size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-white tracking-tight font-[Orbitron]">
                                {editItem.id ? "Resource Config" : "New Resource"}
                            </h2>
                        </div>

                        {tab === 'sigs' && (
                            <div className="space-y-4">
                                <div><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1.5 ml-1">Sector Name</label><input required className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-cyan-500 outline-none transition" value={editItem.name} onChange={e => setEditItem({ ...editItem, name: e.target.value })} placeholder="e.g. Aero / Bot" /></div>
                                <div><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1.5 ml-1">Mission Parameters</label><textarea className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-cyan-400 outline-none transition h-24" value={editItem.description} onChange={e => setEditItem({ ...editItem, description: e.target.value })} placeholder="Describe this sector's goals..." /></div>
                            </div>
                        )}

                        {tab === 'positions' && (
                            <div className="space-y-4">
                                <div><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1.5 ml-1">Rank Title</label><input required className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-emerald-500 outline-none transition" value={editItem.name} onChange={e => setEditItem({ ...editItem, name: e.target.value })} placeholder="e.g. Sector Lead" /></div>
                                <div><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1.5 ml-1">System Rank (1=Highest)</label><input type="number" required className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-emerald-500 outline-none transition" value={editItem.rank} onChange={e => setEditItem({ ...editItem, rank: parseInt(e.target.value) })} /></div>

                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1.5 ml-1">Link Authorization Role</label>
                                    <select className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-emerald-500 outline-none transition" value={editItem.role_link || ""} onChange={e => setEditItem({ ...editItem, role_link: e.target.value ? parseInt(e.target.value) : null })}>
                                        <option value="">-- No Permissions --</option>
                                        {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                    </select>
                                    <p className="text-[9px] text-gray-600 mt-2 font-medium italic px-1 opacity-70">Users assigned to this rank will automatically inherit these protocols.</p>
                                </div>
                            </div>
                        )}

                        {tab === 'fields' && (
                            <div className="space-y-4">
                                <div><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1.5 ml-1">Display Label</label><input required className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-pink-500 outline-none transition" value={editItem.label} onChange={e => setEditItem({ ...editItem, label: e.target.value })} placeholder="e.g. GitHub Link" /></div>
                                <div><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1.5 ml-1">System Identifier</label><input className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white font-mono text-xs focus:border-pink-500 outline-none transition disabled:opacity-50" value={editItem.key} onChange={e => setEditItem({ ...editItem, key: e.target.value })} disabled={!!editItem.id} placeholder="Auto-generated if empty" /></div>
                                <div><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1.5 ml-1">Protocol Type</label><select className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-pink-500 outline-none transition" value={editItem.field_type} onChange={e => setEditItem({ ...editItem, field_type: e.target.value })}><option value="text">Standard Vector (Text)</option><option value="url">Network Link (URL)</option><option value="date">Temporal Point (Date)</option><option value="number">Scalar Value (Number)</option><option value="textarea">Extended Logs (Textarea)</option></select></div>

                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1.5 ml-1">Sector Restriction (Optional)</label>
                                    <select className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-pink-500 outline-none transition" value={editItem.limit_to_sig || ""} onChange={e => setEditItem({ ...editItem, limit_to_sig: e.target.value ? parseInt(e.target.value) : null })}>
                                        <option value="">-- Global Deployment --</option>
                                        {sigs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                    <p className="text-[9px] text-gray-600 mt-2 font-medium italic px-1 opacity-70">If locked, this schema field only appears for members of the selected sector.</p>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-white/5">
                            <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-500 font-bold tracking-widest text-[10px] uppercase transition border border-white/5 order-2 sm:order-1">Abort</button>
                            <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl text-white font-black tracking-widest text-[10px] uppercase transition shadow-lg shadow-cyan-500/20 order-1 sm:order-2">Confirm</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

