import { useTasks, useUpdateTask, useDeleteTask } from "../api/tasks";
import { useSections } from "../api/sections";
import TaskRow from "../tasks/TaskRow";
import TaskComposer from "../tasks/TaskComposer";
import SectionBlock from "../tasks/SectionBlock";
import AddSection from "../tasks/AddSection";

/**
 * Shared "title + tasks + sections + add-task" view. Used by Inbox and every
 * project. Tasks with no section render first; sectioned tasks render under
 * their section headers.
 */
export default function TaskListView({ projectId, title, headerSlot }) {
  const { data: tasks = [], isLoading } = useTasks(projectId);
  const { data: sections = [] } = useSections(projectId);
  const updateTask = useUpdateTask(projectId);
  const deleteTask = useDeleteTask(projectId);

  const renderRow = (task) => (
    <TaskRow
      key={task.id}
      task={task}
      onComplete={() => updateTask.mutate({ id: task.id, patch: { completed: true } })}
      onUpdate={(patch) => updateTask.mutate({ id: task.id, patch })}
      onDelete={() => deleteTask.mutate(task.id)}
    />
  );

  const sectionless = tasks.filter((t) => !t.sectionId);
  const tasksOf = (sectionId) => tasks.filter((t) => t.sectionId === sectionId);

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {headerSlot}
      </div>

      <div className="mt-4">{sectionless.map(renderRow)}</div>

      {!isLoading && tasks.length === 0 && sections.length === 0 && (
        <p className="mt-3 text-sm text-gray-400">No tasks yet — add your first one below.</p>
      )}

      <TaskComposer projectId={projectId} />

      {sections.map((section) => (
        <SectionBlock
          key={section.id}
          section={section}
          tasks={tasksOf(section.id)}
          renderRow={renderRow}
          projectId={projectId}
        />
      ))}

      <AddSection projectId={projectId} />
    </div>
  );
}
