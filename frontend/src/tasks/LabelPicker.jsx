import { useState } from "react";
import { Check, Tag } from "lucide-react";
import Popover from "../components/Popover";
import { useLabels, useCreateLabel, useSetTaskLabels } from "../api/labels";

// A few named colors -> hex for the label dot; falls back to gray.
const LABEL_COLORS = {
  red: "#dc4c3e", orange: "#eb8909", yellow: "#f9d75b", green: "#25b84c",
  blue: "#246fe0", purple: "#692fc2", grey: "#808080", gray: "#808080",
};
export const labelColor = (c) => LABEL_COLORS[c] || "#808080";

/** Read-only label chips (used on task rows + detail). */
export function LabelChips({ labels }) {
  if (!labels?.length) return null;
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {labels.map((l) => {
        const c = labelColor(l.color);
        return (
          <span key={l.id} className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs"
                style={{ backgroundColor: `${c}1a`, color: c }}>
            <Tag size={11} /> {l.name}
          </span>
        );
      })}
    </span>
  );
}

/**
 * Reusable label picker for a task. Lists the user's labels with checkmarks,
 * filters by typed text, and creates a new label on the fly. Used in the task
 * detail panel (and reusable elsewhere).
 */
export default function LabelPicker({ task, trigger, align = "left" }) {
  const { data: labels = [] } = useLabels();
  const createLabel = useCreateLabel();
  const setTaskLabels = useSetTaskLabels();
  const [term, setTerm] = useState("");

  const currentIds = task.labels.map((l) => l.id);

  function toggle(label) {
    const next = currentIds.includes(label.id)
      ? currentIds.filter((i) => i !== label.id)
      : [...currentIds, label.id];
    setTaskLabels.mutate({ taskId: task.id, labelIds: next });
  }

  async function createAndAdd(name) {
    const created = await createLabel.mutateAsync({ name });
    setTaskLabels.mutate({ taskId: task.id, labelIds: [...currentIds, created.id] });
    setTerm("");
  }

  const filtered = labels.filter((l) => l.name.toLowerCase().includes(term.trim().toLowerCase()));
  const exact = labels.some((l) => l.name.toLowerCase() === term.trim().toLowerCase());

  return (
    <Popover trigger={trigger} align={align} className="w-56">
      {() => (
        <div className="text-sm">
          <div className="border-b border-gray-100 p-2">
            <input
              autoFocus
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Type a label"
              className="w-full text-sm outline-none"
            />
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {filtered.map((label) => (
              <button
                key={label.id}
                onClick={() => toggle(label)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-100"
              >
                <Tag size={14} style={{ color: labelColor(label.color) }} />
                <span className="flex-1 text-left text-gray-700">{label.name}</span>
                {currentIds.includes(label.id) && <Check size={15} className="text-gray-600" />}
              </button>
            ))}

            {term.trim() && !exact && (
              <button
                onClick={() => createAndAdd(term.trim())}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[#dc4c3e] hover:bg-gray-100"
              >
                <Tag size={14} /> Create &ldquo;{term.trim()}&rdquo;
              </button>
            )}

            {labels.length === 0 && !term.trim() && (
              <p className="px-2 py-2 text-xs text-gray-400">No labels yet — type to create one.</p>
            )}
          </div>
        </div>
      )}
    </Popover>
  );
}
