import { useEffect, useState } from "react";
import { X, Hash, Plus, Check, Paperclip } from "lucide-react";
import { useProjects } from "../api/projects";
import {
  useTask,
  useUpdateTaskById,
  useSubtasks,
  useCreateSubtask,
  useComments,
  useCreateComment,
} from "../api/taskDetail";
import DatePicker from "./DatePicker";
import PriorityDropdown, { PRIORITY_COLOR } from "./PriorityDropdown";

function fmtDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

// --- Sub-tasks section ---
function Subtasks({ parentId }) {
  const { data: subtasks = [] } = useSubtasks(parentId);
  const update = useUpdateTaskById();
  const createSubtask = useCreateSubtask(parentId);
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");

  function add(e) {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    createSubtask.mutate(t);
    setText("");
  }

  return (
    <div className="mt-4">
      {subtasks.map((st) => (
        <div key={st.id} className="flex items-center gap-2 border-b border-gray-100 py-1.5">
          <button
            onClick={() => update.mutate({ id: st.id, patch: { completed: !st.completed } })}
            className="flex h-[16px] w-[16px] flex-none items-center justify-center rounded-full border-2"
            style={{ borderColor: PRIORITY_COLOR[st.priority], backgroundColor: st.completed ? PRIORITY_COLOR[st.priority] : "transparent" }}
          >
            {st.completed && <Check size={10} strokeWidth={3} className="text-white" />}
          </button>
          <span className={`text-sm ${st.completed ? "text-gray-400 line-through" : "text-gray-800"}`}>{st.content}</span>
        </div>
      ))}

      {adding ? (
        <form onSubmit={add} className="mt-2">
          <input autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="Sub-task name"
            className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm outline-none" />
          <div className="mt-2 flex gap-2">
            <button type="submit" disabled={!text.trim()} className="rounded-md bg-[#dc4c3e] px-3 py-1 text-sm font-medium text-white disabled:opacity-50">Add</button>
            <button type="button" onClick={() => { setAdding(false); setText(""); }} className="rounded-md bg-gray-100 px-3 py-1 text-sm text-gray-600">Cancel</button>
          </div>
        </form>
      ) : (
        <button onClick={() => setAdding(true)} className="mt-2 flex items-center gap-2 text-sm text-gray-500 hover:text-[#dc4c3e]">
          <Plus size={16} /> Add sub-task
        </button>
      )}
    </div>
  );
}

// --- Comments section ---
function Comments({ taskId }) {
  const { data: comments = [] } = useComments(taskId);
  const createComment = useCreateComment(taskId);
  const [text, setText] = useState("");

  function add(e) {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    createComment.mutate(t);
    setText("");
  }

  return (
    <div className="mt-6 border-t border-gray-100 pt-4">
      {comments.map((c) => (
        <div key={c.id} className="mb-3 flex gap-2">
          <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold text-white">
            {(c.authorName?.[0] || "?").toUpperCase()}
          </span>
          <div>
            <div className="text-xs text-gray-500">
              <span className="font-medium text-gray-700">{c.authorName}</span> · {fmtDate(c.createdAt)}
            </div>
            <p className="text-sm text-gray-800">{c.content}</p>
          </div>
        </div>
      ))}

      <form onSubmit={add} className="mt-2 rounded-lg border border-gray-300 p-2">
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Comment"
          className="w-full resize-none text-sm outline-none" rows={2} />
        <div className="flex items-center justify-between">
          <Paperclip size={16} className="text-gray-400" />
          <button type="submit" disabled={!text.trim()} className="rounded-md bg-[#dc4c3e] px-3 py-1 text-sm font-medium text-white disabled:opacity-50">Comment</button>
        </div>
      </form>
    </div>
  );
}

// --- Right properties panel ---
function PropRow({ label, children }) {
  return (
    <div className="border-b border-gray-200 py-3">
      <div className="text-xs font-medium text-gray-500">{label}</div>
      <div className="mt-1">{children}</div>
    </div>
  );
}

export default function TaskDetailModal({ taskId, onClose }) {
  const { data: task } = useTask(taskId);
  const { data: projects = [] } = useProjects();
  const update = useUpdateTaskById();

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");

  useEffect(() => {
    if (task) { setTitle(task.content); setDesc(task.description || ""); }
  }, [task?.id, task?.content, task?.description]);

  const project = projects.find((p) => p.id === task?.projectId);

  function saveTitle() {
    if (task && title.trim() && title !== task.content) update.mutate({ id: task.id, patch: { content: title.trim() } });
  }
  function saveDesc() {
    if (task && desc !== (task.description || "")) update.mutate({ id: task.id, patch: { description: desc } });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-[8vh]" onMouseDown={onClose}>
      <div className="flex max-h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5 text-sm text-gray-500">
          <span className="flex items-center gap-1.5">
            <Hash size={15} /> {project?.name || "Task"}
          </span>
          <button onClick={onClose} className="rounded p-1 hover:bg-gray-100"><X size={18} /></button>
        </div>

        {!task ? (
          <div className="p-8 text-sm text-gray-400">Loading…</div>
        ) : (
          <div className="flex flex-1 overflow-hidden">
            {/* Left main column */}
            <div className="flex-1 overflow-y-auto p-5">
              <div className="flex items-start gap-3">
                <button
                  onClick={() => { update.mutate({ id: task.id, patch: { completed: true } }); onClose(); }}
                  className="mt-1.5 flex h-[18px] w-[18px] flex-none items-center justify-center rounded-full border-2"
                  style={{ borderColor: PRIORITY_COLOR[task.priority] }}
                  aria-label="Complete task"
                />
                <div className="flex-1">
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={saveTitle}
                    onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                    className="w-full text-lg font-semibold text-gray-900 outline-none"
                  />
                  <textarea
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    onBlur={saveDesc}
                    placeholder="Description"
                    rows={2}
                    className="mt-1 w-full resize-none text-sm text-gray-600 outline-none placeholder:text-gray-400"
                  />
                </div>
              </div>

              <Subtasks parentId={task.id} />
              <Comments taskId={task.id} />
            </div>

            {/* Right properties panel */}
            <div className="w-60 flex-none overflow-y-auto bg-gray-50 px-4 py-3">
              <PropRow label="Project">
                <span className="flex items-center gap-1.5 text-sm text-gray-700"><Hash size={14} /> {project?.name}</span>
              </PropRow>
              <PropRow label="Date">
                <DatePicker value={task.dueDate} onChange={(d) => d && update.mutate({ id: task.id, patch: { dueDate: d } })} />
              </PropRow>
              <PropRow label="Priority">
                <PriorityDropdown value={task.priority} onChange={(p) => update.mutate({ id: task.id, patch: { priority: p } })} />
              </PropRow>
              <PropRow label="Labels">
                <span className="text-sm text-gray-400">Coming in Phase 6</span>
              </PropRow>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
