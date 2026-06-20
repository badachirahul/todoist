import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Minimal popover: a trigger plus a floating panel that closes on outside-click
 * or Escape. `children` is a render-prop receiving `close`.
 *
 * The panel is rendered in a portal with `position: fixed`, anchored to the
 * trigger, so it escapes any `overflow`/clipping ancestors (e.g. the task
 * detail modal). Reused by DatePicker, PriorityDropdown, LabelPicker, the
 * project/task ⋯ menus, etc.
 */
export default function Popover({ trigger, children, align = "left", className = "", fullWidth = false }) {
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  // Position the panel (fixed) anchored to the trigger, clamped to stay fully
  // on-screen. Measures the rendered panel so a tall panel (the date picker)
  // shifts up to fit rather than overflowing — so only its own inner area scrolls.
  useLayoutEffect(() => {
    if (!open) return;
    function place() {
      const el = triggerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const gap = 6;
      const panelH = panelRef.current?.offsetHeight ?? 0;
      let top = r.bottom + gap;
      if (panelH && top + panelH > window.innerHeight - gap) {
        top = Math.max(gap, window.innerHeight - gap - panelH);
      }
      const next = {
        position: "fixed",
        zIndex: 60,
        top,
        maxHeight: window.innerHeight - gap * 2,
        visibility: panelH ? "visible" : "hidden", // hide until measured (no flash)
      };
      if (align === "right") next.right = window.innerWidth - r.right;
      else next.left = r.left;
      setStyle(next);
    }
    place();
    const raf = requestAnimationFrame(place); // re-run once the panel has a height
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open, align]);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e) {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        panelRef.current && !panelRef.current.contains(e.target)
      ) setOpen(false);
    }
    function onKey(e) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <div ref={triggerRef} className={fullWidth ? "block w-full" : "inline-block"} onClick={() => setOpen((o) => !o)}>
        {trigger}
      </div>
      {open && style && createPortal(
        <div
          ref={panelRef}
          style={style}
          className={[
            "overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg",
            className,
          ].join(" ")}
        >
          {typeof children === "function" ? children(() => setOpen(false)) : children}
        </div>,
        document.body
      )}
    </>
  );
}
