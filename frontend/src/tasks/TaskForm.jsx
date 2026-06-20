import { useState } from "react";
import { UserPlus } from "lucide-react";
import DatePicker from "./DatePicker";
import PriorityDropdown from "./PriorityDropdown";
import AssigneePicker from "./AssigneePicker";
import Avatar from "../components/Avatar";
import { useMembers } from "../api/members";

/**
 * Presentational add/edit form (name + Date + Priority [+ Assignee]). Decoupled
 * from any mutation: the parent passes onSubmit({content, priority, dueDate,
 * assigneeId}). Shared by the inline composer, the global modal, and inline edit.
 * The assignee control only appears when `projectId` is a shared project (>1 member).
 */
export default function TaskForm({
  initial,
  submitLabel = "Add task",
  onSubmit,
  onCancel,
  resetAfterSubmit = false,
  autoFocus = true,
  pending = false,
  projectId,
}) {
  const [content, setContent] = useState(initial?.content ?? "");
  const [priority, setPriority] = useState(initial?.priority ?? 4);
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? null);
  const [assigneeId, setAssigneeId] = useState(initial?.assigneeId ?? null);

  const { data: members = [] } = useMembers(projectId);
  const shared = members.length > 1;
  const assignee = members.find((m) => m.userId === assigneeId);

  function submit(e) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    onSubmit({ content: trimmed, priority, dueDate, assigneeId });
    if (resetAfterSubmit) {
      setContent("");
      setPriority(4);
      setDueDate(null);
      setAssigneeId(null);
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
        {shared && (
          <AssigneePicker
            projectId={projectId}
            value={assigneeId}
            onChange={setAssigneeId}
            trigger={
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-600 hover:bg-gray-50"
              >
                {assignee ? <Avatar name={assignee.name} avatarUrl={assignee.avatarUrl} size={18} /> : <UserPlus size={15} />}
                {assignee ? assignee.name : "Assign"}
              </button>
            }
          />
        )}
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
