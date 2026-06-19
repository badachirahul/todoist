import { useState } from "react";
import { useLocation } from "react-router-dom";
import { MessageSquare, MoreHorizontal, PanelLeft, SlidersHorizontal, UserPlus } from "lucide-react";
import { useProjects } from "../api/projects";
import ShareDialog from "../projects/ShareDialog";

/**
 * Top bar of the main content area. Left: breadcrumb. Right: action buttons.
 * Share is shown only on a project view (hidden for Inbox and the other views)
 * and opens the project's ShareDialog; the rest are inert for now.
 */
export default function Topbar({ breadcrumb, sidebarOpen = true, onOpenSidebar }) {
  const { pathname } = useLocation();
  const { data: projects = [] } = useProjects();
  const [shareOpen, setShareOpen] = useState(false);

  const match = pathname.match(/^\/project\/([^/]+)/);
  const project = match ? projects.find((p) => p.id === match[1]) : null;
  const canShare = project && !project.inbox;

  return (
    <header className="flex h-12 items-center justify-between px-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        {!sidebarOpen && (
          <button
            onClick={onOpenSidebar}
            className="rounded p-1.5 text-gray-500 hover:bg-gray-100"
            aria-label="Open sidebar"
          >
            <PanelLeft size={18} />
          </button>
        )}
        {breadcrumb}
      </div>
      <div className="flex items-center gap-1 text-gray-500">
        {canShare && (
          <button
            onClick={() => setShareOpen(true)}
            className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm hover:bg-gray-100"
          >
            <UserPlus size={16} /> Share
          </button>
        )}
        <button className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm hover:bg-gray-100">
          <SlidersHorizontal size={16} /> Display
        </button>
        <button className="rounded-md p-1.5 hover:bg-gray-100"><MessageSquare size={18} /></button>
        <button className="rounded-md p-1.5 hover:bg-gray-100"><MoreHorizontal size={18} /></button>
      </div>

      {shareOpen && project && <ShareDialog project={project} onClose={() => setShareOpen(false)} />}
    </header>
  );
}
