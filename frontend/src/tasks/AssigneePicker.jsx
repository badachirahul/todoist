import { Check, UserX } from "lucide-react";
import Popover from "../components/Popover";
import Avatar from "../components/Avatar";
import { useMembers } from "../api/members";

/**
 * Pick the assignee for a task from its project's members. `value` is the
 * current assignee's user id (or null); `onChange(userId | null)` is fired on
 * select. Used in the task detail panel and the inline composer.
 */
export default function AssigneePicker({ projectId, value, onChange, trigger, align = "left" }) {
  const { data: members = [] } = useMembers(projectId);

  return (
    <Popover trigger={trigger} align={align} className="w-56">
      {(close) => (
        <div className="text-sm">
          <div className="border-b border-gray-100 px-3 py-2 text-xs font-medium text-gray-400">
            Assign to
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            <button
              onClick={() => { onChange(null); close(); }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-100"
            >
              <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-gray-100 text-gray-400">
                <UserX size={15} />
              </span>
              <span className="flex-1 text-left text-gray-700">Unassigned</span>
              {!value && <Check size={15} className="text-gray-600" />}
            </button>

            {members.map((m) => (
              <button
                key={m.userId}
                onClick={() => { onChange(m.userId); close(); }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-100"
              >
                <Avatar name={m.name} avatarUrl={m.avatarUrl} size={28} />
                <span className="flex-1 truncate text-left text-gray-700">{m.name}</span>
                {value === m.userId && <Check size={15} className="text-gray-600" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </Popover>
  );
}
