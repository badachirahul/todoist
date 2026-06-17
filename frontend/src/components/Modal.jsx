import { useEffect } from "react";

/** Centered modal over a dim backdrop. Closes on backdrop click / Escape. */
export default function Modal({ open, onClose, children, className = "" }) {
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-[15vh]"
      onMouseDown={onClose}
    >
      <div
        className={`w-full max-w-xl rounded-xl bg-white p-4 shadow-2xl ${className}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
