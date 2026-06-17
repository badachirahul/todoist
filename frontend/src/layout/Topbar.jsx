import { MessageSquare, MoreHorizontal, SlidersHorizontal, UserPlus } from "lucide-react";

/**
 * Top bar of the main content area. Left: breadcrumb. Right: action buttons
 * (Share / Display / comments / more) — inert for now, wired in later phases.
 */
export default function Topbar({ breadcrumb }) {
  return (
    <header className="flex h-12 items-center justify-between px-6">
      <div className="text-sm text-gray-500">{breadcrumb}</div>
      <div className="flex items-center gap-1 text-gray-500">
        <button className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm hover:bg-gray-100">
          <UserPlus size={16} /> Share
        </button>
        <button className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm hover:bg-gray-100">
          <SlidersHorizontal size={16} /> Display
        </button>
        <button className="rounded-md p-1.5 hover:bg-gray-100"><MessageSquare size={18} /></button>
        <button className="rounded-md p-1.5 hover:bg-gray-100"><MoreHorizontal size={18} /></button>
      </div>
    </header>
  );
}
