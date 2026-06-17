import { useTasks, useUpdateTask, useDeleteTask } from "../api/tasks";
import TaskRow from "../tasks/TaskRow";
import TaskComposer from "../tasks/TaskComposer";

/**
 * The shared "title + task list + add-task" view. Used by the Inbox and every
 * project (Inbox is just a project under the hood). `headerSlot` lets callers
 * add things next to the title (e.g. a project ⋯ menu later).
 */
export default function TaskListView({ projectId, title, headerSlot }) {
  const { data: tasks = [], isLoading } = useTasks(projectId);
  const updateTask = useUpdateTask(projectId);
  const deleteTask = useDeleteTask(projectId);

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {headerSlot}
      </div>

      <div className="mt-4">
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            onComplete={() => updateTask.mutate({ id: task.id, patch: { completed: true } })}
            onUpdate={(patch) => updateTask.mutate({ id: task.id, patch })}
            onDelete={() => deleteTask.mutate(task.id)}
          />
        ))}
      </div>

      {!isLoading && tasks.length === 0 && (
        <p className="mt-3 text-sm text-gray-400">No tasks yet — add your first one below.</p>
      )}

      {projectId && <TaskComposer projectId={projectId} />}
    </div>
  );
}
