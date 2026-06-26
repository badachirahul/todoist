import { useState } from "react";
import { Inbox, Hash, Check, ChevronDown } from "lucide-react";
import Popover from "../components/Popover";
import { useProjects } from "../api/projects";

/**
 * Bottom-left project selector used inside the task composer. Opens a popover
 * with a "Type a project name" search and a list of Inbox + My Projects (no
 * workspaces). `value` is the selected projectId; `onChange(id)` is called on
 * pick. The trigger button shows the current selection (icon + name + chevron).
 */
export default function ProjectPicker({ value, onChange }) {
  const { data: projects = [] } = useProjects();
  const [q, setQ] = useState("");

  const inbox = projects.find((p) => p.inbox);
  const myProjects = projects.filter((p) => !p.inbox && !p.archived);
  const selected = projects.find((p) => p.id === value) || inbox;

  const term = q.trim().toLowerCase();
  const match = (p) => p.name.toLowerCase().includes(term);
  const filteredMine = myProjects.filter(match);

  return (
    <Popover
      align="left"
      className="w-72 p-1.5"
      trigger={
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          {selected?.inbox ? <Inbox size={15} className="text-gray-500" /> : <Hash size={15} className="text-gray-500" />}
          <span className="max-w-[180px] truncate">{selected?.name ?? "Inbox"}</span>
          <ChevronDown size={14} className="text-gray-500" />
        </button>
      }
    >
      {(close) => (
        <div>
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Type a project name"
            className="mb-1 w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm outline-none focus:border-gray-400"
          />
          <div className="max-h-72 overflow-y-auto">
            {inbox && match(inbox) && (
              <ProjectRow
                icon={Inbox}
                name={inbox.name}
                selected={value === inbox.id}
                onClick={() => { onChange(inbox.id); close(); }}
              />
            )}
            {filteredMine.length > 0 && (
              <div className="px-2 pb-1 pt-2 text-[12px] font-semibold text-gray-500">My Projects</div>
            )}
            {filteredMine.map((p) => (
              <ProjectRow
                key={p.id}
                icon={Hash}
                name={p.name}
                selected={value === p.id}
                onClick={() => { onChange(p.id); close(); }}
              />
            ))}
          </div>
        </div>
      )}
    </Popover>
  );
}

function ProjectRow({ icon: Icon, name, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-gray-800 hover:bg-gray-100"
    >
      <Icon size={16} className="flex-none text-gray-500" />
      <span className="flex-1 truncate">{name}</span>
      {selected && <Check size={15} className="flex-none text-[#dc4c3e]" />}
    </button>
  );
}
