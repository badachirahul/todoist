import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/**
 * Dark toast (auto-dismiss + ✕), like Todoist's transient messages. Optional
 * `action` ({ label, onClick }) renders a link before the dismiss button (e.g.
 * the "Open" on a "Task added to X" toast). `align` places it bottom-center
 * (default) or bottom-left.
 */
export default function Toast({ message, onClose, action, align = "center", duration = 4000 }) {
  useEffect(() => {
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [onClose, duration]);

  const pos = align === "left" ? "bottom-6 left-6" : "bottom-6 left-1/2 -translate-x-1/2";

  return createPortal(
    <div className={`fixed z-[60] flex items-center gap-3 rounded-lg bg-[#282828] px-4 py-3 text-sm text-white shadow-lg ${pos}`}>
      <span>{message}</span>
      {action && (
        <button onClick={() => { action.onClick(); onClose(); }} className="font-semibold text-[#ff9a8a] hover:text-[#ffb3a6]">
          {action.label}
        </button>
      )}
      <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Dismiss">
        <X size={16} />
      </button>
    </div>,
    document.body
  );
}
