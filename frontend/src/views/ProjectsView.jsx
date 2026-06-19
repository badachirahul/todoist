import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Hash, Plus, ChevronDown } from "lucide-react";
import { useProjects } from "../api/projects";
import Popover from "../components/Popover";
import ProjectModal from "../projects/ProjectModal";

/** Small pill toggle matching Todoist's "Archived projects only" switch. */
function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={[
        "relative h-[18px] w-[32px] rounded-full transition",
        checked ? "bg-[#dc4c3e]" : "bg-gray-300",
      ].join(" ")}
    >
      <span
        className={[
          "absolute top-[2px] h-[14px] w-[14px] rounded-full bg-white transition",
          checked ? "left-[16px]" : "left-[2px]",
        ].join(" ")}
      />
    </button>
  );
}

/**
 * The "My Projects" landing page (route /projects). Lists the user's projects
 * with a client-side search filter, an archived-only toggle, and Add actions.
 * Matches docs/ui-reference/my-projects-view.png.
 */
export default function ProjectsView() {
  const navigate = useNavigate();
  const [archived, setArchived] = useState(false);
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const { data: projects = [] } = useProjects(archived);

  // Hide Inbox; filter client-side by the search box.
  const visible = projects
    .filter((p) => !p.inbox)
    .filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-[26px] font-bold leading-[35px] text-[#202020]">My Projects</h1>
      <p className="mt-1 text-sm text-gray-400">Free</p>

      {/* Search projects */}
      <div className="relative mt-5">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search projects"
          className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-gray-500"
        />
      </div>

      {/* Archived toggle + Add */}
      <div className="mt-4 flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <span>Archived projects only</span>
          <Toggle checked={archived} onChange={setArchived} />
        </label>

        <Popover
          align="right"
          className="w-44 p-1 text-sm"
          trigger={
            <button className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <Plus size={15} /> Add <ChevronDown size={14} className="text-gray-400" />
            </button>
          }
        >
          {(close) => (
            <button
              onClick={() => { setAddOpen(true); close(); }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-gray-700 hover:bg-gray-100"
            >
              <Hash size={15} /> Add project
            </button>
          )}
        </Popover>
      </div>

      <div className="mt-5 border-t border-gray-100 pt-4">
        <p className="text-sm font-bold text-gray-900">
          {visible.length} {visible.length === 1 ? "project" : "projects"}
        </p>

        <div className="mt-2">
          {visible.map((p) => (
            <button
              key={p.id}
              onClick={() => navigate(`/project/${p.id}`)}
              className="flex w-full items-center gap-3 border-b border-gray-100 py-2.5 text-left text-sm text-gray-800 hover:bg-gray-50"
            >
              <Hash size={18} className="text-gray-500" />
              <span className="truncate">{p.name}</span>
            </button>
          ))}
        </div>

        {!archived && (
          <button
            onClick={() => setAddOpen(true)}
            className="mt-3 flex items-center gap-2 text-sm text-gray-500 hover:text-[#dc4c3e]"
          >
            <Plus size={16} className="text-[#dc4c3e]" /> Add project
          </button>
        )}
      </div>

      {addOpen && <ProjectModal project={null} onClose={() => setAddOpen(false)} />}
    </div>
  );
}
