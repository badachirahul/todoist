import { useState } from "react";
import { Check, CalendarDays, Trash2 } from "lucide-react";
import { PRIORITY_COLOR } from "./PriorityDropdown";

function formatDue(iso) {
  // "2026-07-01" -> "1 Jul"
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function TaskRow({ task, onComplete, onDelete }) {
  const [hover, setHover] = useState(false);
  const color = PRIORITY_COLOR[task.priority] || PRIORITY_COLOR[4];

  return (
    <div
      className="group flex items-start gap-3 border-b border-gray-100 py-2.5"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Checkbox — border colored by priority; shows a check on hover */}
      <button
        onClick={() => onComplete(task.id)}
        className="mt-0.5 flex h-[18px] w-[18px] flex-none items-center justify-center rounded-full border-2 transition"
        style={{ borderColor: color, backgroundColor: hover ? `${color}1a` : "transparent" }}
        aria-label="Complete task"
      >
        <Check
          size={12}
          strokeWidth={3}
          style={{ color }}
          className={hover ? "opacity-70" : "opacity-0"}
        />
      </button>

      {/* Content + meta */}
      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-800">{task.content}</p>
        {task.description && (
          <p className="truncate text-xs text-gray-400">{task.description}</p>
        )}
        {task.dueDate && (
          <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-gray-500">
            <CalendarDays size={13} />
            {formatDue(task.dueDate)}
          </span>
        )}
      </div>

      {/* Hover actions (delete for now; edit/schedule/comment/more come later) */}
      <div className="flex items-center opacity-0 transition group-hover:opacity-100">
        <button
          onClick={() => onDelete(task.id)}
          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-[#dc4c3e]"
          aria-label="Delete task"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
