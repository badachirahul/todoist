import { useState } from "react";
import { useCreateTask } from "../api/tasks";
import DatePicker from "./DatePicker";
import PriorityDropdown from "./PriorityDropdown";

/**
 * The add-task form internals (name + Date + Priority + buttons), shared by the
 * inline composer and the global modal popup. The outer container (bordered
 * card vs dialog) is supplied by the parent.
 *
 * - onCancel: Cancel button / dismiss
 * - onAdded:  called after a successful create (inline keeps open; modal closes)
 */
export default function TaskForm({ projectId, onCancel, onAdded, autoFocus = true }) {
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState(4);
  const [dueDate, setDueDate] = useState(null);
  const createTask = useCreateTask(projectId);

  function submit(e) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    createTask.mutate({ content: trimmed, priority, dueDate });
    setContent("");
    setPriority(4);
    setDueDate(null);
    onAdded?.();
  }

  return (
    <form onSubmit={submit}>
      <input
        autoFocus={autoFocus}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Task name"
        className="w-full text-sm outline-none placeholder:text-gray-400"
      />

      <div className="mt-3 flex items-center gap-2">
        <DatePicker value={dueDate} onChange={setDueDate} />
        <PriorityDropdown value={priority} onChange={setPriority} />
      </div>

      <div className="mt-3 flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
        <button
          type="button"
          onClick={onCancel}
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
