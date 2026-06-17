import { useInbox } from "../api/projects";
import { useTasks, useUpdateTask, useDeleteTask } from "../api/tasks";
import TaskRow from "../tasks/TaskRow";
import TaskComposer from "../tasks/TaskComposer";

export default function InboxView() {
  const { inbox, isLoading: loadingInbox } = useInbox();
  const { data: tasks = [], isLoading: loadingTasks } = useTasks(inbox?.id);
  const updateTask = useUpdateTask(inbox?.id);
  const deleteTask = useDeleteTask(inbox?.id);

  if (loadingInbox) {
    return <div className="px-6 py-8 text-sm text-gray-400">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>

      <div className="mt-4">
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            onComplete={(id) => updateTask.mutate({ id, patch: { completed: true } })}
            onDelete={(id) => deleteTask.mutate(id)}
          />
        ))}
      </div>

      {!loadingTasks && tasks.length === 0 && (
        <p className="mt-3 text-sm text-gray-400">No tasks yet — add your first one below.</p>
      )}

      {inbox && <TaskComposer projectId={inbox.id} />}
    </div>
  );
}
