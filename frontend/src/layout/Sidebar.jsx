import { NavLink } from "react-router-dom";
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
import { Hash } from "lucide-react";
import { useMe } from "../auth/useMe";
import { useProjects } from "../api/projects";

const RED = "#dc4c3e";

const NAV_ITEMS = [
  { to: "/inbox", label: "Inbox", icon: Inbox },
  { to: "/today", label: "Today", icon: CalendarDays },
  { to: "/upcoming", label: "Upcoming", icon: CalendarRange },
  { to: "/filters", label: "Filters & Labels", icon: LayoutGrid },
  { to: "/reporting", label: "Reporting", icon: TrendingUp },
];

function NavRow({ to, label, icon: Icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "flex items-center gap-3 rounded-md px-2 py-1.5 text-sm transition",
          isActive
            ? "bg-[#ffefe9] font-medium text-[#dc4c3e]"
            : "text-gray-700 hover:bg-gray-200/60",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={20} className={isActive ? "text-[#dc4c3e]" : "text-gray-500"} />
          <span className="flex-1 truncate">{label}</span>
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar() {
  const { data: user } = useMe();
  const { data: projects = [] } = useProjects();
  const initial = (user?.name?.[0] || "?").toUpperCase();

  return (
    <aside className="flex h-screen w-[250px] flex-col border-r border-gray-200 bg-[#fcfaf8] px-2 py-3">
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
          <button className="rounded p-1.5 hover:bg-gray-200/60"><Bell size={18} /></button>
          <button className="rounded p-1.5 hover:bg-gray-200/60"><PanelLeft size={18} /></button>
        </div>
      </div>

      {/* Add task */}
      <button
        className="mt-4 flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-semibold hover:bg-gray-200/40"
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
        <button className="flex items-center gap-3 rounded-md px-2 py-1.5 text-sm text-gray-700 transition hover:bg-gray-200/60">
          <Search size={20} className="text-gray-500" />
          <span className="flex-1 text-left">Search</span>
        </button>
        {NAV_ITEMS.map((item) => (
          <NavRow key={item.to} {...item} />
        ))}
      </nav>

      {/* My Projects */}
      <div className="mt-6 flex items-center px-2">
        <span className="text-xs font-semibold text-gray-500">My Projects</span>
      </div>
      <div className="mt-1 flex flex-col gap-0.5">
        {projects.filter((p) => !p.inbox).map((p) => (
          <NavLink
            key={p.id}
            to={`/project/${p.id}`}
            className={({ isActive }) =>
              [
                "flex items-center gap-3 rounded-md px-2 py-1.5 text-sm transition",
                isActive ? "bg-[#ffefe9] font-medium text-[#dc4c3e]" : "text-gray-700 hover:bg-gray-200/60",
              ].join(" ")
            }
          >
            <Hash size={18} className="text-gray-500" />
            <span className="flex-1 truncate">{p.name}</span>
          </NavLink>
        ))}
        {projects.filter((p) => !p.inbox).length === 0 && (
          <div className="px-2 text-xs text-gray-400">No projects yet</div>
        )}
      </div>

      {/* Bottom */}
      <div className="mt-auto">
        <button className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-200/60">
          <CircleHelp size={20} className="text-gray-500" />
          Help &amp; resources
        </button>
      </div>
    </aside>
  );
}
