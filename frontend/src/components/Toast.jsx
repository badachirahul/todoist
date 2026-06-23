import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/** Dark bottom-center toast (auto-dismiss + ✕), like Todoist's transient messages. */
export default function Toast({ message, onClose, duration = 4000 }) {
  useEffect(() => {
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [onClose, duration]);

  return createPortal(
    <div className="fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-3 rounded-lg bg-[#282828] px-4 py-3 text-sm text-white shadow-lg">
      <span>{message}</span>
      <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Dismiss">
        <X size={16} />
      </button>
    </div>,
    document.body
  );
}
