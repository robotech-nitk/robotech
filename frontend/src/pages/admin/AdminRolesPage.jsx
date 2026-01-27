import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

export default function AdminRolesPage() {
    const navigate = useNavigate();

    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // New Role Form
    const [isAdding, setIsAdding] = useState(false);
    const [newRoleName, setNewRoleName] = useState("");

    const PERMISSIONS = [
        { key: "can_manage_users", label: "Manage Users & Roles" },
        { key: "can_manage_projects", label: "Manage Projects" },
        { key: "can_manage_events", label: "Manage Events" },
        { key: "can_manage_team", label: "Manage Team Members" },
        { key: "can_manage_gallery", label: "Manage Gallery" },
        { key: "can_manage_announcements", label: "Manage Announcements" },
        // NEW PERMISSIONS
        { key: "can_manage_security", label: "Manage Security & Audits" },
        { key: "can_manage_messages", label: "Manage Contact Messages" },
        { key: "can_manage_sponsorship", label: "Manage Sponsorships" },
        { key: "can_manage_forms", label: "Manage Dynamic Forms" },
    ];

    /* ================= LOAD DATA ================= */
    useEffect(() => {
        loadRoles();
    }, []);

    const loadRoles = async () => {
        try {
            setLoading(true);
            const res = await api.get("/roles/");
            setRoles(res.data);
        } catch (err) {
            console.error("Failed to load roles", err);
        } finally {
            setLoading(false);
        }
    };

    /* ================= ACTIONS ================= */
    const handleAddRole = async (e) => {
        e.preventDefault();
        if (!newRoleName.trim()) return;

        try {
            setSaving(true);
            await api.post("/roles/", { name: newRoleName });
            setNewRoleName("");
            setIsAdding(false);
            loadRoles();
        } catch (err) {
            alert("Failed to create role");
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleTogglePermission = async (role, permKey) => {
        // Optimistic UI update
        const updatedRoles = roles.map((r) => {
            if (r.id === role.id) {
                return { ...r, [permKey]: !r[permKey] };
            }
            return r;
        });
        setRoles(updatedRoles);

        try {
            await api.patch(`/roles/${role.id}/`, {
                [permKey]: !role[permKey],
            });
        } catch (err) {
            console.error("Failed to update permission", err);
            loadRoles(); // Revert on failure
        }
    };

    const handleDeleteRole = async (id) => {
        if (!window.confirm("Are you sure you want to delete this role?")) return;
        try {
            await api.delete(`/roles/${id}/`);
            loadRoles();
        } catch (err) {
            alert("Failed to delete role");
        }
    };

    return (
        <div className="min-h-screen text-white p-6 sm:p-10 max-w-7xl mx-auto">

            {/* ===== HEADER ===== */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-10">
                <div>
                    <button
                        onClick={() => navigate("/portal/dashboard")}
                        className="text-sm text-cyan-400 hover:underline mb-2"
                    >
                        ← Back to Dashboard
                    </button>
                    <h1 className="text-3xl font-bold font-[Orbitron] text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 uppercase tracking-tight">
                        Security Protocols
                    </h1>
                    <p className="text-gray-400 mt-1 text-sm">
                        Define access levels and institutional authorizations.
                    </p>
                </div>

                <button
                    onClick={() => setIsAdding(true)}
                    className="bg-pink-600 hover:bg-pink-500 text-white px-8 py-3 rounded-xl font-black transition shadow-lg shadow-pink-500/20 uppercase tracking-widest text-xs"
                >
                    + Provision Role
                </button>
            </div>

            {/* ===== ROLE LIST ===== */}
            {loading ? (
                <div className="text-gray-400">Loading roles...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {roles.map((role) => (
                        <div
                            key={role.id}
                            className="bg-[#0f111a] border border-white/5 rounded-xl p-6 hover:border-pink-500/30 transition-colors"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-semibold text-white">
                                    {role.name}
                                </h3>
                                <button
                                    onClick={() => handleDeleteRole(role.id)}
                                    className="text-gray-500 hover:text-red-400 transition"
                                    title="Delete Role"
                                >
                                    🗑️
                                </button>
                            </div>

                            <div className="space-y-3">
                                {PERMISSIONS.map((perm) => (
                                    <label
                                        key={perm.key}
                                        className="flex items-center justify-between cursor-pointer group"
                                    >
                                        <span className={`text-sm transition-colors ${perm.key === 'can_manage_security' ? 'text-red-400 font-bold' : 'text-gray-400 group-hover:text-gray-200'}`}>
                                            {perm.label}
                                        </span>
                                        <div
                                            className={`w-10 h-6 rounded-full p-1 transition-colors ${role[perm.key] ? "bg-pink-500" : "bg-gray-700"
                                                }`}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleTogglePermission(role, perm.key);
                                            }}
                                        >
                                            <div
                                                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${role[perm.key] ? "translate-x-4" : "translate-x-0"
                                                    }`}
                                            />
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ===== ADD ROLE MODAL ===== */}
            {isAdding && (
                <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fade-in">
                    <div className="glass border border-white/10 rounded-3xl p-6 sm:p-8 w-full max-w-md animate-scale-in relative shadow-2xl">
                        <button onClick={() => setIsAdding(false)} className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition">&times;</button>
                        <h2 className="text-2xl font-bold mb-8 font-[Orbitron] text-pink-400">Initialize Role</h2>

                        <form onSubmit={handleAddRole} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest mb-2 ml-1">
                                    Functional Identifier
                                </label>
                                <input
                                    autoFocus
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:border-pink-500 outline-none transition"
                                    placeholder="e.g. MISSION_CONTROL"
                                    value={newRoleName}
                                    onChange={(e) => setNewRoleName(e.target.value)}
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/5">
                                <button
                                    type="button"
                                    onClick={() => setIsAdding(false)}
                                    className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-500 font-bold uppercase tracking-widest text-[10px] transition border border-white/5 order-2 sm:order-1"
                                >
                                    Abort
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-[2] py-3 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-black uppercase tracking-widest text-[10px] transition shadow-lg shadow-pink-500/20 order-1 sm:order-2"
                                >
                                    {saving ? "Processing..." : "Commit Protocol"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
