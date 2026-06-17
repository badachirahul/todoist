import { useState } from "react";
import DatePicker from "./DatePicker";
import PriorityDropdown from "./PriorityDropdown";

/**
 * Presentational add/edit form (name + Date + Priority). Decoupled from any
 * mutation: the parent passes onSubmit({content, priority, dueDate}). Shared by
 * the inline composer, the global modal, and inline task editing.
 */
export default function TaskForm({
  initial,
  submitLabel = "Add task",
  onSubmit,
  onCancel,
  resetAfterSubmit = false,
  autoFocus = true,
  pending = false,
}) {
  const [content, setContent] = useState(initial?.content ?? "");
  const [priority, setPriority] = useState(initial?.priority ?? 4);
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? null);

  function submit(e) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    onSubmit({ content: trimmed, priority, dueDate });
    if (resetAfterSubmit) {
      setContent("");
      setPriority(4);
      setDueDate(null);
    }
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
          disabled={!content.trim() || pending}
          className="rounded-md bg-[#dc4c3e] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
