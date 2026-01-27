import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

export default function AdminUsersPage() {
    const navigate = useNavigate();

    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [sigs, setSigs] = useState([]);
    const [fields, setFields] = useState([]);
    const [positions, setPositions] = useState([]); // NEW

    const [loading, setLoading] = useState(true);
    const [formOpen, setFormOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editUserId, setEditUserId] = useState(null);

    const [form, setForm] = useState({
        username: "", email: "", password: "",
        role_ids: [],
        full_name: "", position: "", team_name: "",
        year: "", branch: "", sig: "",
        is_active: true, is_public: true, is_alumni: false,
        custom_fields: {}
    });

    const [image, setImage] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [deleteId, setDeleteId] = useState(null);

    /* ================= LOAD DATA ================= */
    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [usersRes, rolesRes, sigsRes, fieldsRes, posRes] = await Promise.all([
                api.get("/management/"),
                api.get("/roles/"),
                api.get("/sigs/"),
                api.get("/profile-fields/"),
                api.get("/positions/")
            ]);
            setUsers(usersRes.data);
            setRoles(rolesRes.data);
            setSigs(sigsRes.data);
            setFields(fieldsRes.data);
            setPositions(posRes.data.sort((a, b) => a.rank - b.rank));
        } catch (err) {
            console.error("Failed to load data", err);
        } finally {
            setLoading(false);
        }
    };

    /* ================= FORM LOGIC ================= */
    const handleEdit = (user) => {
        setIsEditing(true);
        setEditUserId(user.id);
        setForm({
            username: user.username,
            email: user.email,
            password: "",
            role_ids: user.user_roles ? user.user_roles.map(r => r.id) : [],
            full_name: user.profile?.full_name || "",
            position: user.profile?.position || "",
            team_name: user.profile?.team_name || "",
            year: user.profile?.year || "",
            branch: user.profile?.branch || "",
            sig: user.profile?.sig || "",
            is_active: user.is_active,
            is_public: user.profile?.is_public !== false,
            is_alumni: user.profile?.is_alumni || false,
            custom_fields: user.profile?.custom_fields || {}
        });
        setImage(null);
        setFormOpen(true);
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const fd = new FormData();
            Object.entries(form).forEach(([k, v]) => {
                if (k === 'role_ids') v.forEach(id => fd.append('role_ids', id));
                else if (k === 'custom_fields') fd.append(k, JSON.stringify(v));
                else fd.append(k, v);
            });
            if (image) fd.append('image', image);

            isEditing ? await api.put(`/management/${editUserId}/`, fd) : await api.post("/management/", fd);
            setFormOpen(false);
            loadData();
        } catch (err) {
            setError(err.response?.data?.error || "Operation failed.");
        } finally {
            setSaving(false);
        }
    };

    // Filter Fields based on selected SIG
    const visibleFields = fields.filter(f => {
        // Show if no limit is set
        if (!f.limit_to_sig) return true;
        // Or if limit matches selected SIG ID
        // Note: form.sig is the SIG Name string (legacy compat), but limit_to_sig is ID.
        // We need to match Name -> ID
        const selectedSigObj = sigs.find(s => s.name === form.sig);
        return selectedSigObj && f.limit_to_sig === selectedSigObj.id;
    });

    return (
        <div className="p-4 sm:p-6 max-w-7xl mx-auto text-white">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold font-[Orbitron] text-cyan-400">User Management</h1>
                <div className="flex gap-2">
                    <button onClick={() => navigate("/portal/taxonomy")} className="bg-white/10 px-4 py-2 rounded text-sm hover:bg-white/20">⚙️ Structure</button>
                    <button onClick={() => { setIsEditing(false); setFormOpen(true); setForm({ ...form, username: "", password: "" }); }} className="bg-cyan-500 px-4 py-2 rounded text-black font-bold">+ New User</button>
                </div>
            </div>

            {/* TABLE */}
            <div className="glass overflow-auto rounded-xl">
                <table className="w-full text-left">
                    <thead className="bg-white/5 border-b border-white/10 text-xs uppercase text-cyan-400">
                        <tr><th className="p-4">User</th><th className="p-4">Role/Position</th><th className="p-4 text-right">Action</th></tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {users.map(u => (
                            <tr key={u.id} className="hover:bg-white/5">
                                <td className="p-4 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-cyan-900 flex items-center justify-center text-xs">{u.username[0]}</div>
                                    <div>
                                        <div className="font-bold">{u.profile?.full_name || u.username}</div>
                                        <div className="text-xs text-gray-400">{u.profile?.sig || "No SIG"}</div>

                                        {/* Projects Info */}
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {u.projects_info?.led?.map(p => (
                                                <span key={p.id} className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30" title="Project Lead">★ {p.title}</span>
                                            ))}
                                            {u.projects_info?.member?.map(p => (
                                                <span key={p.id} className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded border border-blue-500/30" title="Project Member">{p.title}</span>
                                            ))}
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className="text-sm bg-white/10 px-2 py-1 rounded border border-white/10">{u.profile?.position || "Member"}</span>
                                </td>
                                <td className="p-4 text-right">
                                    <button onClick={() => handleEdit(u)} className="text-cyan-400 hover:text-white mr-2">Edit</button>
                                    <button onClick={() => { setDeleteId(u.id); }} className="text-red-400 hover:text-white">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODAL */}
            {formOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm overflow-y-auto">
                    <div className="glass w-full max-w-2xl p-4 sm:p-8 rounded-2xl my-auto relative max-h-[95vh] overflow-y-auto custom-scrollbar shadow-2xl border border-white/5">
                        <button onClick={() => setFormOpen(false)} className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition">✕</button>
                        <h2 className="text-2xl font-bold mb-8 font-[Orbitron] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">{isEditing ? "Modify Personnel" : "Onboard New Member"}</h2>

                        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <div className="space-y-6">
                                <p className="text-[10px] font-black uppercase tracking-widest text-cyan-500 border-b border-white/5 pb-2">Identity & Access</p>
                                <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Username</label><input required disabled={isEditing} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-cyan-500 outline-none transition" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} /></div>
                                {!isEditing && (
                                    <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Access Key (Password)</label><input type="password" required className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-cyan-500 outline-none transition" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="****" /></div>
                                )}

                                <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Authorization Protocols (Roles)</label>
                                    <div className="flex flex-wrap gap-2 mt-2 max-h-40 overflow-y-auto bg-black/40 p-3 rounded-xl border border-white/10 custom-scrollbar">
                                        {roles.map(r => (
                                            <label key={r.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer border transition text-xs font-medium ${form.role_ids.includes(r.id) ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'}`}>
                                                <input
                                                    type="checkbox"
                                                    checked={form.role_ids.includes(r.id)}
                                                    onChange={e => {
                                                        const newIds = e.target.checked
                                                            ? [...form.role_ids, r.id]
                                                            : form.role_ids.filter(id => id !== r.id);
                                                        setForm({ ...form, role_ids: newIds });
                                                    }}
                                                    className="hidden"
                                                />
                                                <span>{r.name}</span>
                                            </label>
                                        ))}
                                    </div></div>
                            </div>

                            <div className="space-y-6">
                                <p className="text-[10px] font-black uppercase tracking-widest text-cyan-500 border-b border-white/5 pb-2">Profile Configuration</p>
                                <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Full Name</label><input className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-cyan-500 outline-none transition" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /></div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Sector (SIG)</label>
                                        <select className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-cyan-500 outline-none transition" value={form.sig} onChange={e => setForm({ ...form, sig: e.target.value })}>
                                            <option value="">None</option>
                                            {sigs.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                        </select></div>
                                    <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Hierarchy Pos</label>
                                        <select className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-cyan-500 outline-none transition" value={form.position} onChange={e => setForm({ ...form, position: e.target.value })}>
                                            <option value="">None</option>
                                            {positions.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                        </select></div>
                                </div>

                                <div className="flex gap-4">
                                    <label className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border transition cursor-pointer ${form.is_public ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-white/5 border-white/10 text-gray-500'}`}>
                                        <input type="checkbox" checked={form.is_public} onChange={e => setForm({ ...form, is_public: e.target.checked })} className="hidden" />
                                        <span className="text-xs font-bold uppercase tracking-widest">Public</span>
                                    </label>
                                    <label className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border transition cursor-pointer ${form.is_alumni ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' : 'bg-white/5 border-white/10 text-gray-500'}`}>
                                        <input type="checkbox" checked={form.is_alumni} onChange={e => setForm({ ...form, is_alumni: e.target.checked })} className="hidden" />
                                        <span className="text-xs font-bold uppercase tracking-widest">Alumni</span>
                                    </label>
                                </div>

                                {/* Restricted Access Toggle (Admin Only) */}
                                <div className="pt-2 border-t border-white/5">
                                    <label className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer ${!form.is_active ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/5 border-white/10'}`}>
                                        <div className="flex flex-col">
                                            <span className={`text-xs font-black uppercase tracking-widest ${!form.is_active ? 'text-red-400' : 'text-green-500'}`}>
                                                {form.is_active ? "Login Enabled" : "Login Disabled"}
                                            </span>
                                            <span className="text-[10px] text-gray-500">
                                                {!form.is_active ? "User cannot access portal" : "Normal system access"}
                                            </span>
                                        </div>

                                        <div className={`w-10 h-5 rounded-full p-0.5 transition-colors ${form.is_active ? 'bg-green-500' : 'bg-gray-700'}`}>
                                            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={form.is_active}
                                            onChange={e => setForm({ ...form, is_active: e.target.checked })}
                                            className="hidden"
                                        />
                                    </label>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1.5">Academic Year</label>
                                    <select
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-cyan-500 outline-none transition"
                                        value={form.year}
                                        onChange={e => setForm({ ...form, year: e.target.value })}
                                    >
                                        <option value="">Select Year...</option>
                                        <option value="1st Year">1st Year</option>
                                        <option value="2nd Year">2nd Year</option>
                                        <option value="3rd Year">3rd Year</option>
                                        <option value="4th Year">4th Year</option>
                                    </select>
                                </div>

                                {/* DYNAMIC FIELDS section */}
                                {visibleFields.length > 0 && (
                                    <div className="bg-cyan-500/5 p-4 rounded-xl border border-cyan-500/20">
                                        <h4 className="text-[10px] font-black text-cyan-500 mb-4 uppercase tracking-widest border-b border-cyan-500/10 pb-2">
                                            {form.sig ? `${form.sig} Core Protocols` : "Extended Metadata"}
                                        </h4>
                                        <div className="space-y-4">
                                            {visibleFields.map(f => (
                                                <div key={f.key}>
                                                    <label className="text-[10px] text-gray-500 font-bold block mb-1 uppercase tracking-tighter">{f.label}</label>
                                                    <input className="w-full bg-transparent border-b border-white/10 text-white text-sm focus:border-cyan-400 outline-none pb-1 transition"
                                                        value={form.custom_fields[f.key] || ""}
                                                        onChange={e => setForm({ ...form, custom_fields: { ...form.custom_fields, [f.key]: e.target.value } })}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="col-span-1 md:col-span-2 flex gap-4 pt-6 mt-4 border-t border-white/5">
                                <button type="button" onClick={() => setFormOpen(false)} className="flex-1 py-3 h-12 rounded-xl border border-white/10 text-gray-500 font-bold hover:bg-white/5 transition tracking-widest text-xs uppercase">Abort</button>
                                <button type="submit" disabled={saving} className="flex-[2] py-3 h-12 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl font-black text-white hover:shadow-lg hover:shadow-cyan-500/20 transition tracking-widest text-xs uppercase disabled:opacity-50">{saving ? "Processing..." : "Commit Changes"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {deleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#111] border border-red-500/30 p-6 rounded-xl text-center">
                        <h3 className="text-red-500 font-bold text-xl mb-4">Confirm Delete?</h3>
                        <div className="flex gap-4">
                            <button onClick={() => setDeleteId(null)} className="py-2 px-4 bg-gray-700 rounded">Cancel</button>
                            <button onClick={async () => { await api.delete(`/management/${deleteId}/`); setDeleteId(null); loadData(); }} className="py-2 px-4 bg-red-600 rounded">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
