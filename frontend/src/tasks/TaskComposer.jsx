import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import TaskForm from "./TaskForm";
import Toast from "../components/Toast";
import { useCreateTask, useCreateTaskInProject } from "../api/tasks";
import { useProjects } from "../api/projects";
import { useAttachFileToTask } from "../api/attachments";

/**
 * Inline "+ Add task". Collapsed it's a muted button; expanded it shows the
 * shared TaskForm in a bordered card. Stays open after adding so you can keep
 * jotting tasks. The project picker defaults to the current project; pick a
 * different one and the task is redirected there (with a "Task added to X"
 * toast) instead of being added here.
 */
export default function TaskComposer({ projectId, sectionId }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { data: projects = [] } = useProjects();
  const createTask = useCreateTask(projectId);
  const createElsewhere = useCreateTaskInProject();
  const uploadAttachment = useAttachFileToTask();
  const [toast, setToast] = useState(null);

  function handleSubmit({ file, projectId: chosen, ...values }) {
    const target = chosen || projectId;
    const onSuccess = (task) => { if (file && task?.id) uploadAttachment.mutate({ taskId: task.id, file }); };
    if (target === projectId) {
      // Same project — keep the section context.
      createTask.mutate({ ...values, sectionId }, { onSuccess });
    } else {
      // Redirected to another project — drop the (project-specific) section.
      createElsewhere.mutate({ projectId: target, ...values }, { onSuccess });
      const project = projects.find((p) => p.id === target);
      setToast({
        message: `Task added to ${project?.name ?? "project"}`,
        to: project?.inbox ? "/inbox" : `/project/${target}`,
      });
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-2 flex items-center gap-2 py-1.5 text-sm text-gray-500 hover:text-[#dc4c3e]"
      >
        <Plus size={18} className="text-[#dc4c3e]" />
        Add task
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-lg border border-gray-300 p-3 shadow-sm">
      <TaskForm
        projectId={projectId}
        showDescription
        showProjectPicker
        onSubmit={handleSubmit}
        onCancel={() => setOpen(false)}
        resetAfterSubmit
        pending={createTask.isPending || createElsewhere.isPending}
      />
      {toast && (
        <Toast
          message={toast.message}
          align="left"
          action={{ label: "Open", onClick: () => navigate(toast.to) }}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
