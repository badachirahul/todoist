import { useRef, useState } from "react";
import { UserPlus, Paperclip, X } from "lucide-react";
import DatePicker from "./DatePicker";
import PriorityDropdown from "./PriorityDropdown";
import AssigneePicker from "./AssigneePicker";
import Avatar from "../components/Avatar";
import Toast from "../components/Toast";
import { AttachmentBar } from "../components/Attachment";
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
  const [file, setFile] = useState(null);   // local attachment (uploaded after the task is created)
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);

  const { data: members = [] } = useMembers(projectId);
  const shared = members.length > 1;
  const assignee = members.find((m) => m.userId === assigneeId);

  // Only one file per task — clicking Attachment again shows the toast.
  function pickFile() {
    if (file) { setToast("Only one file can be attached per task."); return; }
    fileInputRef.current?.click();
  }
  function onFileChosen(e) {
    const f = e.target.files?.[0];
    if (f) setFile(f);
    e.target.value = ""; // allow re-picking the same file later
  }

  function submit(e) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    onSubmit({ content: trimmed, priority, dueDate, assigneeId, file });
    if (resetAfterSubmit) {
      setContent("");
      setPriority(4);
      setDueDate(null);
      setAssigneeId(null);
      setFile(null);
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

      {/* Gray attachment container — above the metadata chips */}
      {file && (
        <div className="mt-3">
          <AttachmentBar file={file} onRemove={() => setFile(null)} />
        </div>
      )}

      <input ref={fileInputRef} type="file" className="hidden" onChange={onFileChosen} />

      <div className="mt-3 flex items-center gap-2">
        <DatePicker value={dueDate} onChange={setDueDate} />
        <PriorityDropdown value={priority} onChange={setPriority} />

        {/* Attachment — beside Priority. Becomes "📎 1 ✕" once a file is picked. */}
        {file ? (
          <span className="flex items-center gap-1.5 rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-600">
            <Paperclip size={15} className="text-[#dc4c3e]" /> 1
            <button type="button" onClick={() => setFile(null)} className="rounded hover:bg-gray-100" aria-label="Remove attachment">
              <X size={14} />
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={pickFile}
            className="flex items-center gap-1.5 rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-600 hover:bg-gray-50"
          >
            <Paperclip size={15} /> Attachment
          </button>
        )}

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

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </form>
  );
}
