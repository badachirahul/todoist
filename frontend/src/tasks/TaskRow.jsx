import { useState } from "react";
import {
  Check, CalendarDays, Pencil, Calendar, MoreHorizontal, Flag, Trash2,
  GripVertical, ChevronRight, ChevronDown, GitBranch,
} from "lucide-react";
import { PRIORITY_COLOR } from "./PriorityDropdown";
import { INDENT } from "./treeUtils";
import Avatar from "../components/Avatar";
import { LabelChips } from "./LabelPicker";
import Popover from "../components/Popover";
import DatePicker from "./DatePicker";
import TaskForm from "./TaskForm";

function formatDue(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// The ⋯ menu: edit, quick priority flags, delete.
function MoreMenu({ task, onEdit, onUpdate, onDelete }) {
  const trigger = (
    <button className="rounded p-1 text-gray-400 hover:bg-gray-100" aria-label="More actions">
      <MoreHorizontal size={16} />
    </button>
  );
  return (
    <Popover trigger={trigger} align="right" className="w-52 p-1 text-sm">
      {(close) => (
        <div>
          <button
            onClick={() => { onEdit(); close(); }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-gray-700 hover:bg-gray-100"
          >
            <Pencil size={15} /> Edit
          </button>

          <div className="mt-1 border-t border-gray-100 px-2 pt-2 pb-1">
            <div className="mb-1 text-xs text-gray-400">Priority</div>
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((p) => (
                <button
                  key={p}
                  onClick={() => { onUpdate({ priority: p }); close(); }}
                  className="flex h-7 w-7 items-center justify-center rounded hover:bg-gray-100"
                  title={`Priority ${p}`}
                >
                  <Flag size={16} style={{ color: PRIORITY_COLOR[p] }} fill={p < 4 ? PRIORITY_COLOR[p] : "none"} />
                </button>
              ))}
            </div>
          </div>

          <div className="mt-1 border-t border-gray-100 pt-1">
            <button
              onClick={() => { onDelete(); close(); }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[#dc4c3e] hover:bg-gray-100"
            >
              <Trash2 size={15} /> Delete
            </button>
          </div>
        </div>
      )}
    </Popover>
  );
}

export default function TaskRow({
  task, onComplete, onUpdate, onDelete, onOpenDetail,
  depth = 0, hasChildren = false, collapsed = false, onToggleCollapse,
  dragHandle, isOverlay = false,
}) {
  const [hover, setHover] = useState(false);
  const [editing, setEditing] = useState(false);
  const color = PRIORITY_COLOR[task.priority] || PRIORITY_COLOR[4];

  // Inline edit: the row becomes the shared TaskForm with a Save button.
  if (editing) {
    return (
      <div className="my-2 rounded-lg border border-gray-300 p-3 shadow-sm" style={{ marginLeft: depth * INDENT }}>
        <TaskForm
          initial={{ content: task.content, priority: task.priority, dueDate: task.dueDate }}
          submitLabel="Save"
          onSubmit={(values) => { onUpdate(values); setEditing(false); }}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  // Checkbox + content + hover actions — shared by the normal row and the drag overlay.
  const body = (
    <>
      {/* Checkbox — border colored by priority; shows a check on hover */}
      <button
        onClick={onComplete}
        className="mt-0.5 flex h-[18px] w-[18px] flex-none items-center justify-center rounded-full border-2 transition"
        style={{ borderColor: color, backgroundColor: hover ? `${color}1a` : "transparent" }}
        aria-label="Complete task"
      >
        <Check size={12} strokeWidth={3} style={{ color }} className={hover ? "opacity-70" : "opacity-0"} />
      </button>

      {/* Content + meta — click opens the detail modal (pencil does inline edit) */}
      <div className="min-w-0 flex-1 cursor-pointer" onClick={onOpenDetail}>
        <p className="text-sm text-gray-800">{task.content}</p>
        {task.description && <p className="truncate text-xs text-gray-400">{task.description}</p>}
        {(task.dueDate || task.labels?.length > 0 || task.subtaskTotal > 0) && (
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            {task.dueDate && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                <CalendarDays size={13} />
                {formatDue(task.dueDate)}
              </span>
            )}
            {task.subtaskTotal > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                <GitBranch size={13} className="-scale-x-100" />
                {task.subtaskDone}/{task.subtaskTotal}
              </span>
            )}
            <LabelChips labels={task.labels} />
          </div>
        )}
      </div>

      {/* Assignee avatar (shared projects) */}
      {task.assignee && (
        <Avatar name={task.assignee.name} avatarUrl={task.assignee.avatarUrl} size={22} className="mt-0.5" />
      )}

      {/* Hover actions: Edit · Schedule (date) · More (⋯) */}
      {!isOverlay && (
        <div className="flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
          <button onClick={() => setEditing(true)} className="rounded p-1 text-gray-400 hover:bg-gray-100" aria-label="Edit task">
            <Pencil size={16} />
          </button>
          <DatePicker
            value={task.dueDate}
            onChange={(d) => onUpdate(d ? { dueDate: d } : { clearDueDate: true })}
            align="right"
            trigger={
              <button className="rounded p-1 text-gray-400 hover:bg-gray-100" aria-label="Schedule task">
                <Calendar size={16} />
              </button>
            }
          />
          <MoreMenu task={task} onEdit={() => setEditing(true)} onUpdate={onUpdate} onDelete={onDelete} />
        </div>
      )}
    </>
  );

  // Floating clone shown under the cursor while dragging.
  if (isOverlay) {
    return <div className="flex items-start gap-2 rounded-md bg-white px-3 py-2.5 shadow-lg">{body}</div>;
  }

  return (
    // -ml-6 extends the hover zone into the left margin so the (depth-tracking)
    // drag handle stays reachable; paddingLeft adds it back (+ the nesting indent).
    <div
      className="group relative -ml-6 flex items-start"
      style={{ paddingLeft: 24 + depth * INDENT }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Drag handle — in the left rail next to this row, shown on hover */}
      <button
        ref={dragHandle?.setActivatorNodeRef}
        {...(dragHandle?.attributes ?? {})}
        {...(dragHandle?.listeners ?? {})}
        style={{ left: depth * INDENT + 4 }}
        className="invisible absolute top-3 cursor-grab text-gray-300 group-hover:visible active:cursor-grabbing"
        aria-label="Reorder task"
      >
        <GripVertical size={16} />
      </button>

      {/* Chevron gutter — fixed width so checkboxes align with or without a caret */}
      <div className="flex w-[18px] flex-none justify-center pt-3">
        {hasChildren && (
          <button
            onClick={onToggleCollapse}
            className="rounded text-gray-500 hover:bg-gray-100"
            aria-label={collapsed ? "Expand sub-tasks" : "Collapse sub-tasks"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
      </div>

      {/* Bordered content row — the divider starts here (at the checkbox), so it
          aligns with the task and indents with sub-tasks. */}
      <div className="flex flex-1 items-start gap-2 border-b border-gray-100 py-2.5">
        {body}
      </div>
    </div>
  );
}
