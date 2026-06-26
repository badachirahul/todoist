import { useEffect, useRef, useState } from "react";
import { UserPlus, Paperclip, X } from "lucide-react";
import DatePicker from "./DatePicker";
import PriorityDropdown from "./PriorityDropdown";
import AssigneePicker from "./AssigneePicker";
import ProjectPicker from "./ProjectPicker";
import Avatar from "../components/Avatar";
import Toast from "../components/Toast";
import { AttachmentBar } from "../components/Attachment";
import { useMembers } from "../api/members";
import { useProjects } from "../api/projects";

/**
 * Presentational add/edit form (name + Description + Date + Priority [+ Assignee]
 * + project picker). Decoupled from any mutation: the parent passes
 * onSubmit({content, description, priority, dueDate, assigneeId, projectId, file}).
 * Shared by the inline composer, the global modal, the sub-task composer, and
 * inline edit.
 *
 * - `showDescription` renders the Description line.
 * - `showProjectPicker` renders the bottom-left project selector; the selected
 *   project drives BOTH the assignee control (shown only when that project is
 *   shared) and an inline `#project` chip after the title (shown once you pick a
 *   project different from the default `projectId`).
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
  showDescription = false,
  showProjectPicker = false,
}) {
  const [content, setContent] = useState(initial?.content ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [priority, setPriority] = useState(initial?.priority ?? 4);
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? null);
  const [assigneeId, setAssigneeId] = useState(initial?.assigneeId ?? null);
  const [projectIdSel, setProjectIdSel] = useState(projectId ?? null);
  const [file, setFile] = useState(null);   // local attachment (uploaded after the task is created)
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);

  // Assignee + chip follow the SELECTED project (not the default), so switching
  // projects in the picker shows/hides Assignee and updates the chip live.
  const { data: members = [] } = useMembers(projectIdSel);
  const shared = members.length > 1;
  const assignee = members.find((m) => m.userId === assigneeId);
  const { data: projects = [] } = useProjects();

  // The inline chip shows once you redirect the task to a project other than the
  // composer's default.
  const showChip = showProjectPicker && projectIdSel && projectIdSel !== projectId;
  const chipName = showChip ? projects.find((p) => p.id === projectIdSel)?.name : null;

  // When the chip appears (project picked before typing) the title input is
  // tiny, so focus it explicitly — otherwise there's no visible caret.
  const titleRef = useRef(null);
  useEffect(() => { if (showChip) titleRef.current?.focus(); }, [showChip]);

  // Task-name font — ONE source of truth. Used by all three title elements (the
  // plain input, and the chip-case mirror span + overlay input, which must match
  // so the #project chip lands right after the text). Change size/weight here.
  const TITLE_FONT = "text-[15px] font-semibold";

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
    const payload = { content: trimmed, priority, dueDate, assigneeId, file };
    if (showDescription) payload.description = description.trim();
    if (showProjectPicker) payload.projectId = projectIdSel;
    onSubmit(payload);
    if (resetAfterSubmit) {
      setContent("");
      setDescription("");
      setPriority(4);
      setDueDate(null);
      setAssigneeId(null);
      setProjectIdSel(projectId ?? null);
      setFile(null);
    }
  }

  return (
    <form onSubmit={submit}>
      {/* Title — with an inline `#project` chip after the text when redirected.
          In the chip case the input overlays a zero-width mirror span so its
          width tracks the typed text and the chip sits right after it. */}
      {showChip ? (
        <div className="flex flex-wrap items-center gap-x-1.5">
          <span className="relative inline-block min-w-[8px] max-w-full">
            <span className={`invisible whitespace-pre ${TITLE_FONT}`}>{content || "​"}</span>
            <input
              ref={titleRef}
              autoFocus={autoFocus}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={`absolute inset-0 w-full outline-none ${TITLE_FONT}`}
            />
          </span>
          {/* Click the chip to remove it → back to the default project */}
          <button
            type="button"
            onClick={() => setProjectIdSel(projectId ?? null)}
            title="Remove — use the default project"
            className="rounded bg-[#fde8e1] px-1 py-0.5 text-sm font-semibold text-[#c4502f] hover:bg-[#fbd9cd]"
          >
            #{chipName}
          </button>
        </div>
      ) : (
        <input
          autoFocus={autoFocus}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Task name"
          className={`w-full outline-none placeholder:text-gray-400 ${TITLE_FONT}`}
        />
      )}

      {showDescription && (
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          className="mt-1 w-full text-[13px] outline-none placeholder:text-gray-400"
        />
      )}

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
            projectId={projectIdSel}
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

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
        <div className="min-w-0">
          {showProjectPicker && (
            <ProjectPicker
              value={projectIdSel}
              onChange={(id) => { setProjectIdSel(id); setAssigneeId(null); }}
            />
          )}
        </div>
        <div className="flex items-center gap-2">
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
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </form>
  );
}
