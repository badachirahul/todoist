import { useState } from "react";
import { Plus } from "lucide-react";
import TaskForm from "./TaskForm";

/**
 * Inline "+ Add task". Collapsed it's a muted button; expanded it shows the
 * shared TaskForm in a bordered card. Stays open after adding (onAdded = noop)
 * so you can keep jotting tasks.
 */
export default function TaskComposer({ projectId }) {
  const [open, setOpen] = useState(false);

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
      <TaskForm projectId={projectId} onCancel={() => setOpen(false)} onAdded={() => {}} />
    </div>
  );
}
