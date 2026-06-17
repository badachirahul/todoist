import { useState } from "react";
import { Check, CalendarDays, Pencil, Calendar, MoreHorizontal, Flag, Trash2 } from "lucide-react";
import { PRIORITY_COLOR } from "./PriorityDropdown";
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

export default function TaskRow({ task, onComplete, onUpdate, onDelete, onOpenDetail }) {
  const [hover, setHover] = useState(false);
  const [editing, setEditing] = useState(false);
  const color = PRIORITY_COLOR[task.priority] || PRIORITY_COLOR[4];

  // Inline edit: the row becomes the shared TaskForm with a Save button.
  if (editing) {
    return (
      <div className="my-2 rounded-lg border border-gray-300 p-3 shadow-sm">
        <TaskForm
          initial={{ content: task.content, priority: task.priority, dueDate: task.dueDate }}
          submitLabel="Save"
          onSubmit={(values) => { onUpdate(values); setEditing(false); }}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div
      className="group flex items-start gap-3 border-b border-gray-100 py-2.5"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
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
        {task.dueDate && (
          <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-gray-500">
            <CalendarDays size={13} />
            {formatDue(task.dueDate)}
          </span>
        )}
      </div>

      {/* Hover actions: Edit · Schedule (date) · More (⋯) */}
      <div className="flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
        <button onClick={() => setEditing(true)} className="rounded p-1 text-gray-400 hover:bg-gray-100" aria-label="Edit task">
          <Pencil size={16} />
        </button>
        <DatePicker
          value={task.dueDate}
          onChange={(d) => onUpdate({ dueDate: d })}
          align="right"
          trigger={
            <button className="rounded p-1 text-gray-400 hover:bg-gray-100" aria-label="Schedule task">
              <Calendar size={16} />
            </button>
          }
        />
        <MoreMenu task={task} onEdit={() => setEditing(true)} onUpdate={onUpdate} onDelete={onDelete} />
      </div>
    </div>
  );
}
