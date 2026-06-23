import { useLocation } from "react-router-dom";
import { MessageSquare, MoreHorizontal, PanelLeft, SlidersHorizontal, UserPlus, Users } from "lucide-react";
import { useProjects } from "../api/projects";
import { useMembers } from "../api/members";
import Popover from "../components/Popover";
import SharePopup from "../projects/SharePopup";

/**
 * Top bar of the main content area. Left: breadcrumb. Right: action buttons.
 * Share is shown only on a project view (hidden for Inbox and the other views)
 * and opens the project's Share popup anchored below the button; rest are inert.
 */
export default function Topbar({ breadcrumb, sidebarOpen = true, onOpenSidebar }) {
  const { pathname } = useLocation();
  const { data: projects = [] } = useProjects();

  const match = pathname.match(/^\/project\/([^/]+)/);
  const project = match ? projects.find((p) => p.id === match[1]) : null;
  const canShare = project && !project.inbox;

  // Two-person icon once a collaborator has joined; one-person while solo.
  const { data: members = [] } = useMembers(canShare ? project.id : null);
  const ShareIcon = members.length > 1 ? Users : UserPlus;

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
          <Popover
            align="right"
            className="w-[500px] rounded-2xl"
            trigger={
              <button className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm hover:bg-gray-100">
                <ShareIcon size={16} /> Share
              </button>
            }
          >
            <SharePopup project={project} />
          </Popover>
        )}
        <button className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm hover:bg-gray-100">
          <SlidersHorizontal size={16} /> Display
        </button>
        <button className="rounded-md p-1.5 hover:bg-gray-100"><MessageSquare size={18} /></button>
        <button className="rounded-md p-1.5 hover:bg-gray-100"><MoreHorizontal size={18} /></button>
      </div>
    </header>
  );
}
