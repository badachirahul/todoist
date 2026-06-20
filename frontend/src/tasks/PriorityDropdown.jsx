import { Flag, Check, ChevronDown } from "lucide-react";
import Popover from "../components/Popover";

// P1 red, P2 orange, P3 blue, P4 gray (default). Reused by composer + task detail.
export const PRIORITY_COLOR = {
  1: "#dc4c3e",
  2: "#eb8909",
  3: "#246fe0",
  4: "#9ca3af",
};

const OPTIONS = [1, 2, 3, 4];

/**
 * Priority selector. `variant="button"` (default) = bordered control for the
 * composer; `variant="inline"` = borderless, full-width row with a flag + Pn on
 * the left and a chevron on the right, peach hover — for the task detail panel.
 */
export default function PriorityDropdown({ value = 4, onChange, variant = "button" }) {
  const color = PRIORITY_COLOR[value];
  const flag = <Flag size={16} style={{ color }} fill={value < 4 ? color : "none"} />;

  const trigger = variant === "inline" ? (
    <button
      type="button"
      className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-sm text-gray-700 hover:bg-[#ffefe5]"
    >
      {flag}
      <span className="flex-1 text-left">{value < 4 ? `P${value}` : "Priority"}</span>
      <ChevronDown size={15} className="text-gray-400" />
    </button>
  ) : (
    <button
      type="button"
      className="flex items-center gap-1.5 rounded-md border border-gray-300 px-2.5 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
    >
      {flag}
      {value < 4 ? `P${value}` : "Priority"}
      <ChevronDown size={15} className="text-gray-400" />
    </button>
  );

  return (
    <Popover trigger={trigger} className="w-44 p-1">
      {(close) =>
        OPTIONS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => { onChange(p); close(); }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
          >
            <Flag
              size={16}
              style={{ color: PRIORITY_COLOR[p] }}
              fill={p < 4 ? PRIORITY_COLOR[p] : "none"}
            />
            <span className="flex-1 text-left">Priority {p}</span>
            {value === p && <Check size={15} className="text-gray-600" />}
          </button>
        ))
      }
    </Popover>
  );
}
