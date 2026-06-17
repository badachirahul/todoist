import { useState } from "react";
import { Plus } from "lucide-react";
import { useCreateTask } from "../api/tasks";

/**
 * Inline "+ Add task" composer. Collapsed it's a muted button; expanded it's a
 * bordered card with a content input. Stays open after adding so you can keep
 * jotting tasks (like Todoist). Date/Priority pickers arrive next.
 */
export default function TaskComposer({ projectId }) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const createTask = useCreateTask(projectId);

  function submit(e) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    createTask.mutate({ content: trimmed });
    setContent("");
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
    <form onSubmit={submit} className="mt-3 rounded-lg border border-gray-300 p-3 shadow-sm">
      <input
        autoFocus
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Task name"
        className="w-full text-sm outline-none placeholder:text-gray-400"
      />
      <div className="mt-3 flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
        <button
          type="button"
          onClick={() => { setOpen(false); setContent(""); }}
          className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!content.trim() || createTask.isPending}
          className="rounded-md bg-[#dc4c3e] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          Add task
        </button>
      </div>
    </form>
  );
}
