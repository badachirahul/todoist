import { Inbox } from "lucide-react";
import Modal from "../components/Modal";
import TaskForm from "./TaskForm";
import { useInbox } from "../api/projects";
import { useCreateTask } from "../api/tasks";

/**
 * Global "Add task" popup (sidebar button). Centered over any page. For now it
 * defaults to the Inbox; a project selector / context-awareness comes with
 * Phase 5 (other projects + per-view context).
 */
export default function AddTaskModal({ open, onClose }) {
  const { inbox } = useInbox();
  const createTask = useCreateTask(inbox?.id);

  return (
    <Modal open={open} onClose={onClose}>
      {inbox ? (
        <>
          <TaskForm
            onSubmit={(values) => { createTask.mutate(values); onClose(); }}
            onCancel={onClose}
            pending={createTask.isPending}
          />
          <div className="mt-3 flex items-center gap-1.5 border-t border-gray-100 pt-3 text-xs text-gray-500">
            <Inbox size={14} /> Inbox
          </div>
        </>
      ) : (
        <div className="p-4 text-sm text-gray-400">Loading…</div>
      )}
    </Modal>
  );
}
