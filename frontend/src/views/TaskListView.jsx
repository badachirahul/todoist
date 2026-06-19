import { useState } from "react";
import { useTasks } from "../api/tasks";
import { useSections } from "../api/sections";
import TaskTree from "../tasks/TaskTree";
import TaskComposer from "../tasks/TaskComposer";
import SectionBlock from "../tasks/SectionBlock";
import AddSection from "../tasks/AddSection";
import TaskDetailModal from "../tasks/TaskDetailModal";

/**
 * Shared "title + tasks + sections + add-task" view. Used by Inbox and every
 * project. The sectionless tasks render as a drag-and-drop nesting tree first;
 * sectioned tasks render under their section headers (each its own tree).
 */
export default function TaskListView({ projectId, title, headerSlot }) {
  const { data: tasks = [], isLoading } = useTasks(projectId);
  const { data: sections = [] } = useSections(projectId);
  const [detailTaskId, setDetailTaskId] = useState(null);

  const sectionless = tasks.filter((t) => !t.sectionId);
  const tasksOf = (sectionId) => tasks.filter((t) => t.sectionId === sectionId);

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="flex items-center gap-2">
        <h1 className="text-[26px] font-bold leading-[35px] text-[#202020]">{title}</h1>
        {headerSlot}
      </div>

      <div className="mt-4">
        <TaskTree
          tasks={sectionless}
          sectionId={null}
          projectId={projectId}
          onOpenDetail={setDetailTaskId}
        />
      </div>

      {!isLoading && tasks.length === 0 && sections.length === 0 && (
        <p className="mt-3 text-sm text-gray-400">No tasks yet — add your first one below.</p>
      )}

      <TaskComposer projectId={projectId} />

      {sections.map((section) => (
        <SectionBlock
          key={section.id}
          section={section}
          tasks={tasksOf(section.id)}
          projectId={projectId}
          onOpenDetail={setDetailTaskId}
        />
      ))}

      <AddSection projectId={projectId} />

      {detailTaskId && (
        <TaskDetailModal taskId={detailTaskId} onClose={() => setDetailTaskId(null)} />
      )}
    </div>
  );
}
