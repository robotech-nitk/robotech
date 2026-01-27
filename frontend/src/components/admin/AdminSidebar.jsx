import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    User,
    Users,
    Tag,
    Key,
    ShieldCheck,
    Rocket,
    Calendar,
    Image as ImageIcon,
    Megaphone,
    Handshake,
    Mail,
    FileText,
    Target,
    Lock,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Briefcase
} from "lucide-react";

export default function AdminSidebar({ user, logout }) {
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);

    // Helper check perms
    const hasPerm = (perm) => {
        if (!user) return false;
        if (user.role === 'WEB_LEAD') return true;
        if (user.permissions && user.permissions.includes('can_manage_everything')) return true;
        return user.permissions && user.permissions.includes(perm);
    };

    const isActive = (path) => location.pathname === path;

    const NavItem = ({ to, icon: Icon, label, perm }) => {
        if (perm && !hasPerm(perm)) return null;

        return (
            <Link
                to={to}
                className={`
          flex items-center gap-3 px-4 py-3 rounded-lg transition-all mb-1
          ${isActive(to)
                        ? "bg-gradient-to-r from-cyan-600/20 to-blue-600/20 text-cyan-400 border-l-4 border-cyan-400 shadow-lg shadow-cyan-500/10"
                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                    }
        `}
            >
                <Icon size={20} className={isActive(to) ? "text-cyan-400" : "text-gray-400"} />
                {!collapsed && <span className="font-medium text-sm">{label}</span>}
            </Link>
        );
    };

    return (
        <aside
            className={`
        bg-[#090a10] border-r border-white/5 h-screen sticky top-0
        transition-all duration-300 flex flex-col z-20
        ${collapsed ? "w-20" : "w-64"}
      `}
        >
            {/* HEADER */}
            <div className={`p-6 flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
                {!collapsed && (
                    <h1 className="text-xl font-bold font-[Orbitron] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                        ROBOTECH
                    </h1>
                )}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="text-gray-500 hover:text-white transition p-1 hover:bg-white/5 rounded"
                >
                    {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>
            </div>

            {/* USER SNIPPET */}
            <div className="px-4 mb-6">
                <div className={`p-3 bg-white/5 rounded-xl flex items-center gap-3 border border-white/5 ${collapsed ? "justify-center" : ""}`}>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white shrink-0 shadow-lg shadow-cyan-500/20 overflow-hidden">
                        {user?.profile?.image ? (
                            <img src={user.profile.image} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            user?.username?.[0]?.toUpperCase()
                        )}
                    </div>
                    {!collapsed && (
                        <div className="overflow-hidden">
                            <p className="text-sm font-semibold text-white truncate">{user?.profile?.full_name || user?.username}</p>
                            <p className="text-xs text-gray-400 truncate">{user?.profile?.position || "Member"}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* NAV LINKS */}
            <nav className="flex-1 px-2 overflow-y-auto custom-scrollbar pb-6">
                {location.pathname.startsWith("/portal/projects/") && location.pathname.split('/').length >= 4 ? (
                    <>
                        <p className={`px-4 text-[10px] font-bold text-cyan-500 uppercase mb-2 ${collapsed && "hidden"}`}>Project Command</p>
                        <NavItem to={`${location.pathname}`} icon={LayoutDashboard} label="Overview" />
                        <NavItem to={`${location.pathname}?tab=tasks`} icon={FileText} label="Timeline" />
                        <NavItem to={`${location.pathname}?tab=discussions`} icon={Mail} label="Threads" />
                        <NavItem to={`${location.pathname}?tab=team`} icon={Users} label="Personnel" />

                        <div className="my-4 border-t border-white/5 mx-4" />
                        <NavItem to="/portal/projects" icon={ChevronLeft} label="Exit Workspace" />
                    </>
                ) : (
                    <>
                        <NavItem to="/portal/dashboard" icon={LayoutDashboard} label="Dashboard" />

                        <div className="my-4 border-t border-white/5 mx-4" />
                        <p className={`px-4 text-xs font-bold text-gray-600 uppercase mb-2 ${collapsed && "hidden"}`}>Management</p>

                        <NavItem to="/portal/profile" icon={User} label="My Profile" />
                        <NavItem to="/portal/users" icon={Users} label="Users" perm="can_manage_users" />
                        <NavItem to="/portal/taxonomy" icon={Tag} label="Structure" perm="can_manage_users" />
                        <NavItem to="/portal/roles" icon={Key} label="Roles" perm="can_manage_users" />
                        <NavItem to="/portal/team" icon={ShieldCheck} label="Team Ordering" perm="can_manage_team" />

                        <div className="my-4 border-t border-white/5 mx-4" />
                        <p className={`px-4 text-xs font-bold text-gray-600 uppercase mb-2 ${collapsed && "hidden"}`}>Content</p>

                        <NavItem to="/portal/projects" icon={Rocket} label="Workspaces" />
                        <NavItem to="/portal/events" icon={Calendar} label="Events" perm="can_manage_events" />
                        <NavItem to="/portal/gallery" icon={ImageIcon} label="Gallery" perm="can_manage_gallery" />
                        <NavItem to="/portal/recruitment" icon={Briefcase} label="Recruitment" perm="can_manage_team" />
                        <NavItem to="/portal/announcements" icon={Megaphone} label="Announcements" perm="can_manage_announcements" />

                        <div className="my-4 border-t border-white/5 mx-4" />

                        <NavItem to="/portal/sponsorship" icon={Handshake} label="Sponsors" perm="can_manage_sponsorship" />
                        <NavItem to="/portal/contactMessages" icon={Mail} label="Messages" perm="can_manage_messages" />
                        <NavItem to="/portal/forms" icon={FileText} label="Forms" perm="can_manage_forms" />
                        <NavItem to="/portal/quizzes" icon={Target} label="Assessments" perm="can_manage_forms" />

                        <div className="my-4 border-t border-white/5 mx-4" />
                        <NavItem to="/portal/audit-logs" icon={ShieldCheck} label="Audit Logs" perm="can_manage_security" />
                    </>
                )}
            </nav>

            {/* FOOTER */}
            <div className="p-4 border-t border-white/5">
                <button
                    onClick={logout}
                    className={`
            w-full flex items-center gap-3 px-4 py-3 rounded-lg 
            text-red-400 hover:bg-red-500/10 hover:text-red-300 transition
            ${collapsed ? "justify-center" : ""}
          `}
                >
                    <LogOut size={20} />
                    {!collapsed && <span className="font-medium text-sm">Logout</span>}
                </button>
            </div>
        </aside>
    );
}

