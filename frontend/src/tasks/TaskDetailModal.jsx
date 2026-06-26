import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Hash, Plus, Check, Paperclip, Lock, ChevronUp, ChevronDown, ChevronRight, MoreHorizontal, CalendarDays, Sparkles, GitBranch, Inbox, Users, Mic, Smile, Type, Pencil, Copy, Link2, Trash2, SmilePlus, AlignLeft } from "lucide-react";
import { useProjects } from "../api/projects";
import { useMe } from "../auth/useMe";
import { useUploadCommentAttachment, useDeleteAttachment, useAttachFileToTask } from "../api/attachments";
import { CommentAttachmentCard } from "../components/Attachment";
import Popover from "../components/Popover";
import Toast from "../components/Toast";
import TaskForm from "./TaskForm";
import { useTasks, useCreateTaskInProject } from "../api/tasks";
import {
  useTask,
  useUpdateTaskById,
  useSubtasks,
  useCreateSubtask,
  useComments,
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
} from "../api/taskDetail";
import DatePicker from "./DatePicker";
import PriorityDropdown, { PRIORITY_COLOR } from "./PriorityDropdown";
import LabelPicker, { LabelChips } from "./LabelPicker";
import AssigneePicker from "./AssigneePicker";
import Avatar from "../components/Avatar";
import { buildVisibleTree } from "./treeUtils";

const EMPTY_SET = new Set();
import { useMembers } from "../api/members";

// "Today 14:37" for same-day comments, else "23 Jun 14:37" (matches Todoist).
function fmtCommentDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === new Date().toDateString()) return `Today ${time}`;
  return `${d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} ${time}`;
}

// --- Sub-tasks section ---
// `parentProjectId` = the parent task's project. The composer is the shared
// TaskForm: if you keep that project, it creates a real sub-task; pick a
// DIFFERENT project and it becomes a top-level task there (parent link dropped),
// with a "Task added to X" toast — matching Todoist.
function Subtasks({ parentId, parentProjectId }) {
  const navigate = useNavigate();
  const { data: subtasks = [] } = useSubtasks(parentId);
  const { data: projects = [] } = useProjects();
  const update = useUpdateTaskById();
  const createSubtask = useCreateSubtask(parentId);
  const createTask = useCreateTaskInProject();
  const uploadAttachment = useAttachFileToTask();
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState(null);

  function handleSubmit({ file, projectId, ...values }) {
    const target = projectId || parentProjectId;
    const onSuccess = (task) => { if (file && task?.id) uploadAttachment.mutate({ taskId: task.id, file }); };
    if (target === parentProjectId) {
      createSubtask.mutate(values, { onSuccess });
    } else {
      createTask.mutate({ projectId: target, ...values }, { onSuccess });
      const project = projects.find((p) => p.id === target);
      setToast({
        message: `Task added to ${project?.name ?? "project"}`,
        to: project?.inbox ? "/inbox" : `/project/${target}`,
      });
    }
    setAdding(false);
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
        <div className="mt-3 rounded-lg border border-gray-300 p-3 shadow-sm">
          <TaskForm
            projectId={parentProjectId}
            showDescription
            showProjectPicker
            onSubmit={handleSubmit}
            onCancel={() => setAdding(false)}
            pending={createSubtask.isPending || createTask.isPending}
          />
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="mt-2 flex items-center gap-2 text-sm text-gray-500 hover:text-[#dc4c3e]">
          <Plus size={16} /> Add sub-task
        </button>
      )}

      {toast && (
        <Toast
          message={toast.message}
          align="left"
          action={{ label: "Open", onClick: () => navigate(toast.to) }}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

// A comment's ⋯ actions menu, hover-revealed. Edit/Delete only for the author;
// Copy text / Copy link are available to everyone.
function CommentMenu({ isOwn, onEdit, onCopyText, onCopyLink, onDelete }) {
  const Item = ({ icon: Icon, label, onClick, danger }) => (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left hover:bg-gray-100 ${danger ? "text-[#dc4c3e]" : "text-gray-700"}`}
    >
      <Icon size={15} /> {label}
    </button>
  );
  return (
    <Popover
      align="right"
      className="w-56 p-1 text-sm"
      trigger={<button className="rounded p-1 text-gray-400 hover:bg-gray-100" aria-label="Comment actions"><MoreHorizontal size={16} /></button>}
    >
      {(close) => (
        <div>
          {isOwn && <Item icon={Pencil} label="Edit" onClick={() => { close(); onEdit(); }} />}
          <Item icon={Copy} label="Copy text" onClick={() => { onCopyText(); close(); }} />
          <Item icon={Link2} label="Copy link to comment" onClick={() => { onCopyLink(); close(); }} />
          {isOwn && (
            <>
              <div className="my-1 border-t border-gray-100" />
              <Item icon={Trash2} label="Delete" danger onClick={() => { close(); onDelete(); }} />
            </>
          )}
        </div>
      )}
    </Popover>
  );
}

function CommentItem({ c, projectId, isInbox, taskId, isOwn, onEdit, onDelete }) {
  const copyText = () => navigator.clipboard?.writeText(c.content || "");
  const copyLink = () => {
    const base = isInbox ? "/inbox" : `/project/${projectId}`;
    navigator.clipboard?.writeText(`${window.location.origin}${base}?task=${taskId}#comment-${c.id}`);
  };
  return (
    // padding 12px + margin 4px -12px (matches Todoist's note_text.has_avatar):
    // the negative side-margin lets the hover bg bleed out while content stays aligned.
    <div className="group -mx-3 my-1 flex gap-3 rounded-lg p-3 hover:bg-gray-50">
      <Avatar name={c.authorName} avatarUrl={c.authorAvatarUrl} size={28} className="mt-0.5" />
      <div className="min-w-0 flex-1">
        <div className="text-[13px]">
          <span className="font-semibold text-gray-800">{c.authorName}</span>
          <span className="ml-2 text-gray-400">{fmtCommentDate(c.createdAt)}</span>
        </div>
        {c.content && <p className="mt-0.5 whitespace-pre-wrap text-sm text-gray-800">{c.content}</p>}
        {c.attachment && <CommentAttachmentCard attachment={c.attachment} />}
      </div>
      <div className="flex items-start gap-1 opacity-0 transition group-hover:opacity-100">
        <button className="rounded p-1 text-gray-400 hover:bg-gray-100" aria-label="React"><SmilePlus size={16} /></button>
        <CommentMenu isOwn={isOwn} onEdit={onEdit} onCopyText={copyText} onCopyLink={copyLink} onDelete={onDelete} />
      </div>
    </div>
  );
}

/**
 * Shared comment composer — used for a NEW comment and for editing one. Project
 * tasks show the Notify/Nobody chip on a new comment. Handles the single
 * attachment: an existing one (edit) can be removed, or a new file picked
 * (changes stay local until submit). onSubmit({ text, file, removeExisting }).
 */
function CommentEditor({ isProject, isNew, initialText = "", initialAttachment = null, submitLabel, onSubmit, onCancel }) {
  const [text, setText] = useState(initialText);
  const [file, setFile] = useState(null);                          // newly picked file
  const [keepExisting, setKeepExisting] = useState(!!initialAttachment);
  const fileRef = useRef(null);

  const existing = keepExisting && initialAttachment && !file ? initialAttachment : null;
  const hasAttachment = !!existing || !!file;

  function pickFile() { if (!hasAttachment) fileRef.current?.click(); }
  function onFileChosen(e) { const f = e.target.files?.[0]; if (f) { setFile(f); setKeepExisting(false); } e.target.value = ""; }
  function removeAttachment() { if (file) setFile(null); else setKeepExisting(false); }

  function submit() {
    if (!text.trim()) return;
    onSubmit({ text: text.trim(), file, removeExisting: !!initialAttachment && !keepExisting });
    // For a new comment the composer stays open — clear it for the next one.
    if (isNew) { setText(""); setFile(null); setKeepExisting(false); if (fileRef.current) fileRef.current.value = ""; }
  }

  return (
    <div className="rounded-xl border border-gray-300 p-3 shadow-sm">
      {isProject && isNew && (
        <div className="mb-2 flex items-center gap-2 text-[13px]">
          <span className="rounded bg-gray-100 px-2 py-0.5 font-semibold text-gray-700">Notify</span>
          <span className="text-gray-400">Nobody</span>
        </div>
      )}
      <textarea
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Comment"
        rows={3}
        className="w-full resize-none text-sm outline-none placeholder:text-gray-400"
      />
      {/* Attachment preview while composing/editing — trash on the left (Todoist) */}
      {hasAttachment && (
        <div className="mt-2 flex items-center gap-2 rounded-md" style={{ padding: "6px 8px", background: "rgba(0,0,0,.04)" }}>
          <button type="button" onClick={removeAttachment} className="text-[#dc4c3e]" aria-label="Remove attachment"><Trash2 size={16} /></button>
          <span className="min-w-0 flex-1 truncate text-sm text-gray-700">{file ? file.name : existing.filename}</span>
        </div>
      )}
      <input ref={fileRef} type="file" className="hidden" onChange={onFileChosen} />
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-3 text-gray-400">
          <button type="button" onClick={pickFile} className="hover:text-gray-600" aria-label="Attach file"><Paperclip size={18} /></button>
          <Mic size={18} />
          <Smile size={18} />
          <Type size={18} />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onCancel} className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-200">Cancel</button>
          <button onClick={submit} disabled={!text.trim()} className="rounded-md bg-[#dc4c3e] px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50">{submitLabel}</button>
        </div>
      </div>
    </div>
  );
}

/**
 * Comments. Project (group) tasks get a collapsible "Comments N" header + the
 * Notify chip on new comments; Inbox/personal tasks keep the simpler editor.
 * Each comment has a hover ⋯ menu (Edit / Copy / Delete) and edits in place.
 */
function Comments({ taskId, projectId, isProject, isInbox }) {
  const { data: comments = [] } = useComments(taskId);
  const { data: me } = useMe();
  const updateComment = useUpdateComment(taskId);
  const deleteComment = useDeleteComment(taskId);
  const uploadCommentAtt = useUploadCommentAttachment();
  const deleteAttachment = useDeleteAttachment();
  const [collapsed, setCollapsed] = useState(false); // comments list (project only)
  const [editingId, setEditingId] = useState(null);

  const hasComments = comments.length > 0;

  // Scroll the newest comment into view when one is added (+1), so a freshly
  // posted comment is visible. The +1 check avoids scrolling on the initial
  // bulk load (0 -> N), which would otherwise hide the title on open.
  const bottomRef = useRef(null);
  const prevLen = useRef(comments.length);
  useEffect(() => {
    if (comments.length === prevLen.current + 1) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
    prevLen.current = comments.length;
  }, [comments.length]);

  function submitEdit(c, { text, file, removeExisting }) {
    updateComment.mutate({ id: c.id, content: text }, {
      onSuccess: async () => {
        if (removeExisting && c.attachment) await deleteAttachment.mutateAsync(c.attachment.id);
        if (file) await uploadCommentAtt.mutateAsync({ commentId: c.id, file });
        setEditingId(null);
      },
    });
  }

  function remove(c) {
    if (window.confirm("Delete this comment?")) deleteComment.mutate(c.id);
  }

  return (
    <div className="mt-6 border-t border-gray-100 pt-4">
      {/* Collapsible header — shown whenever there are comments (incl. Inbox) */}
      {hasComments && (
        <button onClick={() => setCollapsed((c) => !c)} className="mb-3 flex items-center gap-2 text-sm">
          <ChevronDown size={16} className={`text-gray-500 transition-transform duration-200 ${collapsed ? "-rotate-90" : ""}`} />
          <span className="font-bold text-gray-800">Comments</span>
          <span className="text-gray-500">{comments.length}</span>
        </button>
      )}

      {/* Comment list + editor are indented to line up with the task title /
          "Add sub-task" (the header chevron stays at the far left).
          ↓↓ change pl-[30px] to adjust the space before the comment avatars ↓↓ */}
      <div className="pl-[30px]">
      <div className={`grid transition-[grid-template-rows] duration-200 ease-in-out ${collapsed ? "grid-rows-[0fr]" : "grid-rows-[1fr]"}`}>
        <div className="min-h-0 overflow-hidden">
        {comments.map((c) =>
          editingId === c.id ? (
            <div key={c.id} className="mb-4">
              <CommentEditor
                isProject={isProject}
                isNew={false}
                initialText={c.content}
                initialAttachment={c.attachment}
                submitLabel="Update"
                onCancel={() => setEditingId(null)}
                onSubmit={(payload) => submitEdit(c, payload)}
              />
            </div>
          ) : (
            <CommentItem
              key={c.id}
              c={c}
              projectId={projectId}
              isInbox={isInbox}
              taskId={taskId}
              isOwn={c.authorId === me?.id}
              onEdit={() => setEditingId(c.id)}
              onDelete={() => remove(c)}
            />
          )
        )}
        <div ref={bottomRef} />
        </div>
      </div>
      </div>
    </div>
  );
}

/**
 * New-comment composer — pinned at the bottom of the task-detail left column
 * (never scrolls, regardless of comment count). Collapsed it's a single-line
 * "Comment" pill; clicking expands it into the full editor (image 2). The
 * comment list lives in the scrollable area above, in <Comments />.
 */
function CommentComposer({ taskId, isProject }) {
  const { data: me } = useMe();
  const createComment = useCreateComment(taskId);
  const uploadCommentAtt = useUploadCommentAttachment();
  const [expanded, setExpanded] = useState(false);

  function submitNew({ text, file }) {
    createComment.mutate(text, {
      onSuccess: (comment) => { if (file && comment?.id) uploadCommentAtt.mutate({ commentId: comment.id, file }); },
    });
    // Stay expanded after posting (the editor clears itself) so you can keep
    // adding comments; only Cancel collapses back to the pill.
  }

  return (
    <div className="pl-[30px]">
      {expanded ? (
        <CommentEditor isProject={isProject} isNew submitLabel="Comment" onCancel={() => setExpanded(false)} onSubmit={submitNew} />
      ) : (
        <div className="flex items-center gap-3">
          <Avatar name={me?.name} avatarUrl={me?.avatarUrl} size={28} />
          <button
            onClick={() => setExpanded(true)}
            className="flex flex-1 items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-left text-sm text-gray-400 transition hover:border-gray-400"
          >
            <span className="flex-1">Comment</span>
            <Paperclip size={18} />
          </button>
        </div>
      )}
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
  const [editing, setEditing] = useState(false);
  const [focusDesc, setFocusDesc] = useState(false);

  useEffect(() => {
    if (task) { setTitle(task.content); setDesc(task.description || ""); }
    setEditing(false);
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
            {project?.inbox ? <Inbox size={15} /> : <Hash size={15} />}
            {project?.name || "Task"}
            {shared && !project?.inbox && <Users size={14} className="text-gray-400" />}
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
            {/* Left main column (604px content at 864 width) — title/description/
                sub-tasks/comments share ONE scroll region; the comment composer is
                a fixed footer below it, so the scrollbar ends above the composer
                (not at the modal bottom), matching Todoist. Default flex (grow 0,
                shrink 1) + min-h-0 lets the region sit at content height when short
                (composer rises right under the comments) and shrink + scroll once
                it overflows. */}
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="min-h-0 overflow-y-auto px-4 pt-4">
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
                  {!editing ? (
                    <>
                      <h2
                        onClick={() => { setFocusDesc(false); setEditing(true); }}
                        className="cursor-text text-xl font-bold text-[#202020]"
                      >
                        {title}
                      </h2>
                      {desc ? (
                        <p
                          onClick={() => { setFocusDesc(true); setEditing(true); }}
                          className="mt-1 cursor-text whitespace-pre-wrap text-sm text-gray-600"
                        >
                          {desc}
                        </p>
                      ) : (
                        <button
                          onClick={() => { setFocusDesc(true); setEditing(true); }}
                          className="mt-1 flex cursor-text items-center gap-1.5 text-sm text-gray-400"
                        >
                          <AlignLeft size={15} /> Description
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="ml-[3px] rounded-lg border border-gray-300 px-[7px] pt-1 focus-within:border-gray-400">
                        <input
                          autoFocus={!focusDesc}
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") { e.preventDefault(); saveTitle(); saveDesc(); setEditing(false); }
                            if (e.key === "Escape") { setTitle(task.content); setDesc(task.description || ""); setEditing(false); }
                          }}
                          placeholder="Task name"
                          className="w-full text-xl font-bold text-[#202020] outline-none"
                        />
                        <div className="mt-0.5 flex gap-1.5">
                          <AlignLeft size={15} className="mt-1 flex-none text-gray-400" />
                          <textarea
                            autoFocus={focusDesc}
                            value={desc}
                            onChange={(e) => setDesc(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Escape") { setTitle(task.content); setDesc(task.description || ""); setEditing(false); } }}
                            placeholder="Description"
                            className="min-h-[72px] w-full resize-none pb-1 text-sm text-gray-600 outline-none placeholder:text-gray-400"
                          />
                        </div>
                      </div>
                      <div className="mt-2 flex justify-end gap-2">
                        <button
                          onClick={() => { setTitle(task.content); setDesc(task.description || ""); setEditing(false); }}
                          className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-200"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => { saveTitle(); saveDesc(); setEditing(false); }}
                          className="rounded-md bg-[#dc4c3e] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#c53727]"
                        >
                          Save
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Indented under the title (past the checkbox) like Todoist */}
              <div className="pl-[30px]">
                <Subtasks parentId={task.id} parentProjectId={task.projectId} />
              </div>
              <Comments
                taskId={task.id}
                projectId={task.projectId}
                isProject={!!project && !project.inbox}
                isInbox={!!project?.inbox}
              />
              </div>

              {/* Fixed comment composer — the scroll region above ends here, so the
                  scrollbar stops above it (matches Todoist). */}
              <div className="flex-none px-4 pb-4 pt-2">
                <CommentComposer taskId={task.id} isProject={!!project && !project.inbox} />
              </div>
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
