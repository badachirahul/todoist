import { useEffect, useMemo, useState } from "react";
import { X, Hash, Plus, Check, Paperclip, Lock, ChevronUp, ChevronDown, ChevronRight, MoreHorizontal, CalendarDays, Sparkles, GitBranch } from "lucide-react";
import { useProjects } from "../api/projects";
import { useTasks } from "../api/tasks";
import {
  useTask,
  useUpdateTaskById,
  useSubtasks,
  useCreateSubtask,
  useComments,
  useCreateComment,
} from "../api/taskDetail";
import Popover from "../components/Popover";
import DatePicker from "./DatePicker";
import PriorityDropdown, { PRIORITY_COLOR } from "./PriorityDropdown";
import LabelPicker, { LabelChips } from "./LabelPicker";
import AssigneePicker from "./AssigneePicker";
import Avatar from "../components/Avatar";
import { buildVisibleTree } from "./treeUtils";

const EMPTY_SET = new Set();
import { useMembers } from "../api/members";

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

const ROW_LABEL = "flex items-center gap-1.5 text-[13px] font-semibold text-gray-700";

// --- Right properties panel: three row types ---

// Type A/B — a single-line 28px full-width button (label left, control right,
// peach hover). A = click-to-open (Date-empty/Labels/Reminders), B = lock
// (Deadline/Location). `wrap` lets a picker wrap the button as its trigger.
function LineRow({ label, badge, right, wrap }) {
  const inner = (
    <button
      type="button"
      className="flex h-8 w-full items-center justify-between rounded-md px-2 text-left transition hover:bg-[#ffefe5]"
    >
      <span className={ROW_LABEL}>{label}{badge}</span>
      {right}
    </button>
  );
  return (
    <div className="border-b border-black/[0.06] py-2 last:border-b-0">
      {wrap ? wrap(inner) : inner}
    </div>
  );
}

// Type C — a label header with the value on its own row below (Project /
// Priority / Assignee / Date-when-set). Roomy vertical spacing like Todoist.
function ValueRow({ label, badge, trailing, children }) {
  return (
    <div className="border-b border-black/[0.06] py-2 last:border-b-0">
      <div className="flex items-center justify-between px-2">
        <span className={ROW_LABEL}>{label}{badge}</span>
        {trailing}
      </div>
      {children && <div className="mt-1.5">{children}</div>}
    </div>
  );
}

export default function TaskDetailModal({ taskId, onClose }) {
  // The modal can navigate between tasks (prev/next, parent, sibling sub-tasks).
  const [currentId, setCurrentId] = useState(taskId);
  useEffect(() => setCurrentId(taskId), [taskId]);
  const navigate = (id) => id && setCurrentId(id);

  const { data: task } = useTask(currentId);
  const { data: projects = [] } = useProjects();
  const { data: members = [] } = useMembers(task?.projectId);
  const shared = members.length > 1;
  const update = useUpdateTaskById();

  // Siblings for ^/v navigation: sub-tasks of the parent, else top-level tasks.
  const parentId = task?.parentTaskId ?? null;
  const { data: parentTask } = useTask(parentId);
  const { data: subtaskSiblings = [] } = useSubtasks(parentId);
  const { data: projectTasks = [] } = useTasks(task?.projectId);
  // Sub-tasks of the parent — for the breadcrumb dropdown + count.
  const siblings = parentId
    ? subtaskSiblings
    : projectTasks.filter((t) => !t.parentTaskId).sort((a, b) => a.position - b.position);
  // ^/v walk the WHOLE project tree depth-first: into a task's sub-tasks if any,
  // otherwise on to the next task below.
  const flat = useMemo(() => buildVisibleTree(projectTasks, EMPTY_SET).map((i) => i.task), [projectTasks]);
  const fidx = flat.findIndex((t) => t.id === currentId);
  const prevTask = fidx > 0 ? flat[fidx - 1] : null;
  const nextTask = fidx >= 0 && fidx < flat.length - 1 ? flat[fidx + 1] : null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={onClose}>
      <div
        className="flex h-[83vh] max-h-[820px] w-[864px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header — ^/v navigate to the previous/next sibling task */}
        <div className="flex h-[48px] flex-none items-center justify-between border-b border-gray-100 pl-3 pr-2 text-sm text-gray-500">
          <span className="flex items-center gap-1.5">
            <Hash size={15} /> {project?.name || "Task"}
          </span>
          <div className="flex items-center gap-0.5">
            <button onClick={() => navigate(prevTask?.id)} disabled={!prevTask} className="rounded p-1.5 text-gray-400 enabled:hover:bg-gray-100 disabled:opacity-30" aria-label="Previous task"><ChevronUp size={18} /></button>
            <button onClick={() => navigate(nextTask?.id)} disabled={!nextTask} className="rounded p-1.5 text-gray-400 enabled:hover:bg-gray-100 disabled:opacity-30" aria-label="Next task"><ChevronDown size={18} /></button>
            <button className="rounded p-1.5 text-gray-400 hover:bg-gray-100" aria-label="More actions"><MoreHorizontal size={18} /></button>
            <button onClick={onClose} className="rounded p-1.5 hover:bg-gray-100" aria-label="Close"><X size={18} /></button>
          </div>
        </div>

        {!task ? (
          <div className="p-8 text-sm text-gray-400">Loading…</div>
        ) : (
          <div className="flex flex-1 overflow-hidden">
            {/* Left main column (604px content at 864 width) */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Parent breadcrumb + sub-tasks dropdown (shown when viewing a sub-task) */}
              {parentId && parentTask && (
                <div className="mb-3 inline-flex items-center rounded-md border border-gray-200 text-sm">
                  <button
                    onClick={() => navigate(parentId)}
                    className="flex items-center gap-1.5 rounded-l-md px-2 py-1 text-gray-700 hover:bg-gray-100"
                  >
                    <span className="h-3.5 w-3.5 flex-none rounded-full border-[1.5px] border-gray-400" />
                    <span className="max-w-[260px] truncate">{parentTask.content}</span>
                  </button>
                  <span className="h-5 w-px bg-gray-200" />
                  <div className="group relative">
                    <Popover
                      align="left"
                      className="w-64 p-1"
                      trigger={
                        <button className="flex items-center gap-1 rounded-r-md px-2 py-1 text-gray-500 hover:bg-gray-100" aria-label="Open sub-tasks">
                          <GitBranch size={14} className="-scale-x-100" />
                          {siblings.length}
                          <ChevronRight size={14} />
                        </button>
                      }
                    >
                      {(close) => (
                        <div>
                          <div className="px-2 py-1.5 text-[13px] font-semibold text-gray-800">Sub-tasks</div>
                          {siblings.map((s) => (
                            <button
                              key={s.id}
                              onClick={() => { navigate(s.id); close(); }}
                              className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm text-gray-800 hover:bg-gray-100"
                            >
                              <span className="h-4 w-4 flex-none rounded-full border-[1.5px] border-gray-400" />
                              <span className="flex-1 truncate">{s.content}</span>
                              {s.id === currentId && <Check size={15} className="flex-none text-gray-600" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </Popover>
                    <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100">
                      Open sub-tasks
                    </span>
                  </div>
                </div>
              )}

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
                    className="w-full text-xl font-bold text-[#202020] outline-none"
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

              {/* Indented under the title (past the checkbox) like Todoist */}
              <div className="pl-[30px]">
                <Subtasks parentId={task.id} />
              </div>
              <Comments taskId={task.id} />
            </div>

            {/* Right properties panel (228px, sidebar cream; rows are full-width) */}
            <div className="w-[260px] min-w-[260px] flex-none overflow-y-auto bg-[#fcfaf8] px-4 py-2">
              {/* Project (Type C) */}
              <ValueRow label="Project">
                <span className="flex items-center gap-1.5 px-2 text-sm text-gray-700"><Hash size={14} className="text-gray-500" /> {project?.name}</span>
              </ValueRow>

              {shared && (
                <ValueRow
                  label="Assigned to"
                  trailing={
                    <AssigneePicker
                      projectId={task.projectId}
                      value={task.assignee?.id ?? null}
                      align="right"
                      onChange={(uid) => update.mutate({ id: task.id, patch: uid ? { assigneeId: uid } : { clearAssignee: true } })}
                      trigger={<button className="rounded p-0.5 text-gray-400 hover:bg-gray-200"><Plus size={15} /></button>}
                    />
                  }
                >
                  {task.assignee && (
                    <span className="flex items-center gap-1.5 px-2 text-sm text-gray-700">
                      <Avatar name={task.assignee.name} avatarUrl={task.assignee.avatarUrl} size={20} />
                      {task.assignee.name}
                    </span>
                  )}
                </ValueRow>
              )}

              {/* Date — empty: click-to-open (Type A); set: value row with hover ✕ (Type C) */}
              {task.dueDate ? (
                <ValueRow label="Date">
                  <div className="group relative">
                    <DatePicker
                      fullWidth
                      value={task.dueDate}
                      align="right"
                      onChange={(d) => update.mutate({ id: task.id, patch: d ? { dueDate: d } : { clearDueDate: true } })}
                      trigger={
                        <button className="flex h-7 w-full items-center gap-1.5 rounded-md px-2 text-sm text-gray-700 transition group-hover:bg-[#ffefe5]">
                          <CalendarDays size={14} className="text-gray-500" />
                          {new Date(task.dueDate + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </button>
                      }
                    />
                    <button
                      onClick={() => update.mutate({ id: task.id, patch: { clearDueDate: true } })}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-500 opacity-0 transition hover:bg-gray-200 group-hover:opacity-100"
                      aria-label="Clear date"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </ValueRow>
              ) : (
                <LineRow
                  label="Date"
                  right={<Plus size={15} className="text-gray-400" />}
                  wrap={(inner) => (
                    <DatePicker fullWidth value={null} align="right" onChange={(d) => update.mutate({ id: task.id, patch: d ? { dueDate: d } : { clearDueDate: true } })} trigger={inner} />
                  )}
                />
              )}

              {/* Deadline — premium (Type B): orange badge + single lock */}
              <LineRow label="Deadline" badge={<Sparkles size={13} className="text-orange-500" fill="currentColor" />} right={<Lock size={15} className="text-gray-300" />} />

              {/* Priority — value row (Type C), no full-row hover button */}
              <ValueRow label="Priority">
                <PriorityDropdown variant="inline" value={task.priority} onChange={(p) => update.mutate({ id: task.id, patch: { priority: p } })} />
              </ValueRow>

              {/* Labels — click-to-open (Type A) */}
              <LineRow
                label="Labels"
                right={task.labels?.length > 0 ? <LabelChips labels={task.labels} /> : <Plus size={15} className="text-gray-400" />}
                wrap={(inner) => <LabelPicker fullWidth task={task} align="right" trigger={inner} />}
              />

              {/* Reminders — parked (Type A, inert) */}
              <LineRow label="Reminders" right={<Plus size={15} className="text-gray-400" />} />

              {/* Location — premium (Type B) */}
              <LineRow label="Location" badge={<Sparkles size={13} className="text-orange-500" fill="currentColor" />} right={<Lock size={15} className="text-gray-300" />} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
