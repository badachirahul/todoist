import { useEffect, useRef, useState } from "react";

/**
 * Minimal popover: renders a trigger and a floating panel that closes on
 * outside-click or Escape. `children` is a render-prop receiving `close`.
 * Reused by PriorityDropdown, DatePicker, and (later) the task ⋯ menu.
 */
export default function Popover({ trigger, children, align = "left", className = "" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <div onClick={() => setOpen((o) => !o)}>{trigger}</div>
      {open && (
        <div
          className={[
            "absolute z-50 mt-1 rounded-lg border border-gray-200 bg-white shadow-lg",
            align === "right" ? "right-0" : "left-0",
            className,
          ].join(" ")}
        >
          {typeof children === "function" ? children(() => setOpen(false)) : children}
        </div>
      )}
    </div>
  );
}
