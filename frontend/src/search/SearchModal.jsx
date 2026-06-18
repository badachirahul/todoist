import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Hash, CircleDot } from "lucide-react";
import { useSearch, useDebounced } from "../api/search";
import { useProjects } from "../api/projects";

/** Centered search overlay (sidebar "Search"). Lists matching tasks + projects. */
export default function SearchModal({ open, onClose }) {
  const [term, setTerm] = useState("");
  const debounced = useDebounced(term, 250);
  const { data, isFetching } = useSearch(debounced);
  const { data: projects = [] } = useProjects();
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    setTerm("");
    function onKey(e) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  // Route a task to its project view (Inbox -> /inbox).
  function goToTask(task) {
    const proj = projects.find((p) => p.id === task.projectId);
    navigate(proj?.inbox ? "/inbox" : `/project/${task.projectId}`);
    onClose();
  }
  function goToProject(p) {
    navigate(p.inbox ? "/inbox" : `/project/${p.id}`);
    onClose();
  }

  const tasks = data?.tasks ?? [];
  const projectHits = data?.projects ?? [];
  const hasQuery = debounced.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-[12vh]" onMouseDown={onClose}>
      <div className="w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
          <Search size={18} className="text-gray-400" />
          <input
            autoFocus
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search tasks and projects"
            className="flex-1 text-sm outline-none"
          />
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-2">
          {!hasQuery && <p className="px-2 py-3 text-sm text-gray-400">Type to search…</p>}

          {hasQuery && tasks.length === 0 && projectHits.length === 0 && !isFetching && (
            <p className="px-2 py-3 text-sm text-gray-400">No results.</p>
          )}

          {projectHits.length > 0 && (
            <div className="mb-1">
              <div className="px-2 py-1 text-xs font-semibold text-gray-400">Projects</div>
              {projectHits.map((p) => (
                <button key={p.id} onClick={() => goToProject(p)} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100">
                  <Hash size={16} className="text-gray-500" /> {p.name}
                </button>
              ))}
            </div>
          )}

          {tasks.length > 0 && (
            <div>
              <div className="px-2 py-1 text-xs font-semibold text-gray-400">Tasks</div>
              {tasks.map((t) => (
                <button key={t.id} onClick={() => goToTask(t)} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100">
                  <CircleDot size={16} className="flex-none text-gray-400" /> <span className="truncate">{t.content}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
