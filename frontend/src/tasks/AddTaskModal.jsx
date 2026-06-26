import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../components/Modal";
import Toast from "../components/Toast";
import TaskForm from "./TaskForm";
import { useProjects, useInbox } from "../api/projects";
import { useCreateTaskInProject } from "../api/tasks";
import { useAttachFileToTask } from "../api/attachments";

/**
 * Global "Add task" popup (sidebar button). Centered over any page. Defaults to
 * the Inbox but the composer's project picker lets you redirect the task to any
 * project; a "Task added to X" toast then links to where it landed.
 */
export default function AddTaskModal({ open, onClose }) {
  const navigate = useNavigate();
  const { inbox } = useInbox();
  const { data: projects = [] } = useProjects();
  const createTask = useCreateTaskInProject();
  const uploadAttachment = useAttachFileToTask();
  const [toast, setToast] = useState(null);

  function handleSubmit({ file, projectId, ...values }) {
    const target = projectId || inbox?.id;
    createTask.mutate(
      { projectId: target, ...values },
      { onSuccess: (task) => { if (file && task?.id) uploadAttachment.mutate({ taskId: task.id, file }); } }
    );
    const project = projects.find((p) => p.id === target);
    setToast({
      message: `Task added to ${project?.name ?? "Inbox"}`,
      to: project?.inbox ? "/inbox" : `/project/${target}`,
    });
    onClose();
  }

  return (
    <>
      <Modal open={open} onClose={onClose}>
        {inbox ? (
          <TaskForm
            projectId={inbox.id}
            showDescription
            showProjectPicker
            onSubmit={handleSubmit}
            onCancel={onClose}
            pending={createTask.isPending}
          />
        ) : (
          <div className="p-4 text-sm text-gray-400">Loading…</div>
        )}
      </Modal>
      {toast && (
        <Toast
          message={toast.message}
          align="left"
          action={{ label: "Open", onClick: () => navigate(toast.to) }}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
