import { useState } from "react";
import { ChevronDown, ChevronRight, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Popover from "../components/Popover";
import TaskComposer from "./TaskComposer";
import TaskTree from "./TaskTree";
import { useRenameSection, useDeleteSection } from "../api/sections";

export default function SectionBlock({ section, tasks, projectId, onOpenDetail }) {
  const [collapsed, setCollapsed] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(section.name);
  const renameSection = useRenameSection(projectId);
  const deleteSection = useDeleteSection(projectId);

  function commitRename() {
    const trimmed = name.trim();
    if (trimmed && trimmed !== section.name) renameSection.mutate({ id: section.id, name: trimmed });
    else setName(section.name);
    setRenaming(false);
  }

  const menuTrigger = (
    <button className="rounded p-1 text-gray-400 opacity-0 hover:bg-gray-100 group-hover/sec:opacity-100" aria-label="Section actions">
      <MoreHorizontal size={16} />
    </button>
  );

  return (
    <div className="mt-6">
      <div className="group/sec flex items-center gap-1 border-b border-gray-200 pb-1">
        <button onClick={() => setCollapsed((c) => !c)} className="rounded p-0.5 text-gray-500 hover:bg-gray-100">
          {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
        </button>

        {renaming ? (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") { setName(section.name); setRenaming(false); } }}
            className="flex-1 rounded border border-gray-300 px-1 text-sm font-semibold outline-none"
          />
        ) : (
          <span className="flex-1 text-sm font-semibold text-gray-800">{section.name}</span>
        )}

        {tasks.length > 0 && <span className="text-xs text-gray-400">{tasks.length}</span>}

        <Popover trigger={menuTrigger} align="right" className="w-44 p-1 text-sm">
          {(close) => (
            <div>
              <button onClick={() => { setRenaming(true); close(); }} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-gray-700 hover:bg-gray-100">
                <Pencil size={15} /> Rename
              </button>
              <button onClick={() => { deleteSection.mutate(section.id); close(); }} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[#dc4c3e] hover:bg-gray-100">
                <Trash2 size={15} /> Delete section
              </button>
            </div>
          )}
        </Popover>
      </div>

      {!collapsed && (
        <div className="mt-1 pl-6">
          <TaskTree
            tasks={tasks}
            sectionId={section.id}
            projectId={projectId}
            onOpenDetail={onOpenDetail}
          />
          <TaskComposer projectId={projectId} sectionId={section.id} />
        </div>
      )}
    </div>
  );
}
