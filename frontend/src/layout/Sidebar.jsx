import { NavLink, useMatch, useNavigate } from "react-router-dom";
import {
  Search,
  Inbox,
  CalendarDays,
  CalendarRange,
  LayoutGrid,
  TrendingUp,
  Bell,
  PanelLeft,
  Plus,
  AudioLines,
  ChevronDown,
  CircleHelp,
} from "lucide-react";
import { useState } from "react";
import { useMe } from "../auth/useMe";
import { useProjects } from "../api/projects";
import { useUnreadCount } from "../api/notifications";
import AddTaskModal from "../tasks/AddTaskModal";
import ProjectRow from "./ProjectRow";
import ProjectModal from "../projects/ProjectModal";
import SearchModal from "../search/SearchModal";

const RED = "#dc4c3e";

const NAV_ITEMS = [
  { to: "/inbox", label: "Inbox", icon: Inbox },
  { to: "/today", label: "Today", icon: CalendarDays },
  { to: "/upcoming", label: "Upcoming", icon: CalendarRange },
  { to: "/filters", label: "Filters & Labels", icon: LayoutGrid },
  { to: "/reporting", label: "Reporting", icon: TrendingUp },
];

function NavRow({ to, label, icon: Icon, count }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "flex h-[34px] items-center gap-3 rounded-md px-2 text-sm transition",
          isActive
            ? "bg-[#ffefe5] font-semibold text-[#202020]"
            : "text-gray-700 hover:bg-gray-200/60",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={20} className={isActive ? "text-[#202020]" : "text-gray-500"} />
          <span className="flex-1 truncate">{label}</span>
          {count > 0 && <span className="text-xs text-gray-400">{count}</span>}
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar({ onCollapse }) {
  const { data: user } = useMe();
  const { data: projects = [] } = useProjects();
  const { data: unreadCount = 0 } = useUnreadCount();
  const navigate = useNavigate();
  const inboxCount = projects.find((p) => p.inbox)?.taskCount ?? 0;
  const favorites = projects.filter((p) => p.favorite && !p.inbox);
  const initial = (user?.name?.[0] || "?").toUpperCase();
  const [addOpen, setAddOpen] = useState(false);
  // null = closed; "create" = new project; project object = rename
  const [projectModal, setProjectModal] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [projectsCollapsed, setProjectsCollapsed] = useState(false);
  const [favoritesCollapsed, setFavoritesCollapsed] = useState(false);
  const projectsActive = !!useMatch("/projects");

  return (
    <aside className="group/sidebar flex h-screen w-[280px] flex-col bg-[#fcfaf8] px-3 py-3">
      {/* Workspace header */}
      <div className="flex items-center gap-2 px-2">
        <button className="flex items-center gap-2 rounded-md px-1 py-1 hover:bg-gray-200/60">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="h-7 w-7 rounded-full" referrerPolicy="no-referrer" />
          ) : (
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold text-white">
              {initial}
            </span>
          )}
          <span className="max-w-[120px] truncate text-sm font-semibold text-gray-800">
            {user?.name || "Account"}
          </span>
          <ChevronDown size={16} className="text-gray-500" />
        </button>
        <div className="ml-auto flex items-center gap-1 text-gray-500">
          <button
            onClick={() => navigate("/notifications")}
            className="relative rounded p-1.5 hover:bg-gray-200/60"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 block h-2 w-2 rounded-full bg-[#f60] ring-2 ring-[#fcfaf8]" />
            )}
          </button>
          <button onClick={onCollapse} className="rounded p-1.5 hover:bg-gray-200/60" aria-label="Collapse sidebar">
            <PanelLeft size={18} />
          </button>
        </div>
      </div>

      {/* Add task */}
      <button
        onClick={() => setAddOpen(true)}
        className="mt-4 flex h-[34px] items-center gap-2 rounded-md px-2 text-sm font-semibold hover:bg-gray-200/40"
        style={{ color: RED }}
      >
        <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full" style={{ backgroundColor: RED }}>
          <Plus size={15} className="text-white" strokeWidth={3} />
        </span>
        Add task
        <AudioLines size={18} className="ml-auto" style={{ color: RED }} />
      </button>

      {/* Search + nav */}
      <nav className="mt-2 flex flex-col gap-0.5">
        <button onClick={() => setSearchOpen(true)} className="flex h-[34px] items-center gap-3 rounded-md px-2 text-sm text-gray-700 transition hover:bg-gray-200/60">
          <Search size={20} className="text-gray-500" />
          <span className="flex-1 text-left">Search</span>
        </button>
        {NAV_ITEMS.map((item) => (
          <NavRow key={item.to} {...item} count={item.to === "/inbox" ? inboxCount : undefined} />
        ))}
      </nav>

      {/* Favorites — favorited projects, same rows as My Projects */}
      {favorites.length > 0 && (
        <>
          <div className="group/fav mt-6 flex h-[34px] items-center rounded-md px-2 transition hover:bg-gray-200/60">
            <span className="flex-1 truncate text-sm font-semibold leading-[normal] text-[#202020]">Favorites</span>
            <button
              onClick={() => setFavoritesCollapsed((c) => !c)}
              className="-my-0.5 rounded p-0.5 text-gray-500 opacity-0 transition hover:bg-gray-300/60 group-hover/sidebar:opacity-100"
              aria-label={favoritesCollapsed ? "Expand favorites" : "Collapse favorites"}
            >
              <ChevronDown size={16} className={favoritesCollapsed ? "-rotate-90 transition" : "transition"} />
            </button>
          </div>
          {!favoritesCollapsed && (
            <div className="mt-1 flex flex-col gap-0.5">
              {favorites.map((p) => (
                <ProjectRow key={`fav-${p.id}`} project={p} onRename={(proj) => setProjectModal(proj)} />
              ))}
            </div>
          )}
        </>
      )}

      {/* My Projects — same px-2 py-1.5 rounded-md box as the nav rows above.
          Chevron reveals on sidebar-wide hover; + and bg on this row's hover. */}
      <div
        className={[
          "group/projects mt-6 flex h-[34px] items-center rounded-md px-2 transition",
          projectsActive ? "bg-[#ffefe5]" : "hover:bg-gray-200/60",
        ].join(" ")}
      >
        <NavLink
          to="/projects"
          className="flex flex-1 items-center truncate text-sm font-semibold leading-[normal] text-[#202020] transition"
        >
          <span className="truncate">My Projects</span>
        </NavLink>
        <button
          onClick={() => setProjectModal("create")}
          className="-my-0.5 rounded p-0.5 text-gray-500 opacity-0 transition hover:bg-gray-300/60 group-hover/projects:opacity-100"
          aria-label="Add project"
        >
          <Plus size={16} />
        </button>
        <button
          onClick={() => setProjectsCollapsed((c) => !c)}
          className="-my-0.5 rounded p-0.5 text-gray-500 opacity-0 transition hover:bg-gray-300/60 group-hover/sidebar:opacity-100"
          aria-label={projectsCollapsed ? "Expand projects" : "Collapse projects"}
        >
          <ChevronDown size={16} className={projectsCollapsed ? "-rotate-90 transition" : "transition"} />
        </button>
      </div>
      {!projectsCollapsed && (
        <div className="mt-1 flex flex-col gap-0.5">
          {projects.filter((p) => !p.inbox).map((p) => (
            <ProjectRow key={p.id} project={p} onRename={(proj) => setProjectModal(proj)} />
          ))}
          {projects.filter((p) => !p.inbox).length === 0 && (
            <div className="px-2 text-xs text-gray-400">No projects yet</div>
          )}
        </div>
      )}

      {/* Bottom */}
      <div className="mt-auto">
        <button className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-200/60">
          <CircleHelp size={20} className="text-gray-500" />
          Help &amp; resources
        </button>
      </div>

      <AddTaskModal open={addOpen} onClose={() => setAddOpen(false)} />
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      {projectModal && (
        <ProjectModal
          project={projectModal === "create" ? null : projectModal}
          onClose={() => setProjectModal(null)}
        />
      )}
    </aside>
  );
}
