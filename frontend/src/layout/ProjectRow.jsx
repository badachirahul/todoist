import { useState } from "react";
import { useNavigate, NavLink, useMatch } from "react-router-dom";
import {
  Hash, MoreHorizontal, ArrowUp, ArrowDown, Pencil, Heart, ArrowRight, Copy,
  UserPlus, Link2, Activity, LayoutTemplate, Gem, Puzzle, Download, Upload,
  Mail, CalendarDays, Archive, Trash2,
} from "lucide-react";
import Popover from "../components/Popover";
import ProjectModal from "../projects/ProjectModal";
import ShareDialog from "../projects/ShareDialog";
import { useUpdateProject, useDeleteProject } from "../api/projects";

function Item({ icon: Icon, label, onClick, danger, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left",
        disabled
          ? "cursor-default text-gray-300"
          : danger
            ? "text-[#dc4c3e] hover:bg-gray-100"
            : "text-gray-700 hover:bg-gray-100",
      ].join(" ")}
    >
      <Icon size={15} className="flex-none" /> <span className="truncate">{label}</span>
    </button>
  );
}

const Divider = () => <div className="my-1 border-t border-gray-100" />;

/** A project row in the sidebar with the full Todoist ⋯ context menu. */
export default function ProjectRow({ project, onRename }) {
  const navigate = useNavigate();
  const active = !!useMatch(`/project/${project.id}`);
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const [shareOpen, setShareOpen] = useState(false);
  // null = closed; otherwise the position to insert a new sibling at.
  const [addAt, setAddAt] = useState(null);

  function remove() {
    deleteProject.mutate(project.id);
    navigate("/inbox");
  }

  function copyLink() {
    navigator.clipboard?.writeText(`${window.location.origin}/project/${project.id}`);
  }

  const menuTrigger = (
    <button
      className="flex rounded p-1 text-gray-500 hover:bg-gray-300/60"
      aria-label="Project actions"
    >
      <MoreHorizontal size={16} />
    </button>
  );

  return (
    <div
      className={[
        "group flex items-center rounded-md pr-1 transition",
        active ? "bg-[#ffefe9]" : "hover:bg-gray-200/60",
      ].join(" ")}
    >
      <NavLink
        to={`/project/${project.id}`}
        className={[
          "flex min-w-0 flex-1 items-center gap-3 py-1.5 pl-2 text-sm leading-[normal] transition",
          active ? "font-medium text-[#dc4c3e]" : "text-[#202020]",
        ].join(" ")}
      >
        <Hash size={18} className="flex-none text-gray-500" />
        <span className="flex-1 truncate">{project.name}</span>
        {project.favorite && <Heart size={13} className="flex-none text-[#dc4c3e]" fill="#dc4c3e" />}
      </NavLink>

      {/* Right slot: task count by default, swaps to the ⋯ menu on row hover */}
      {project.taskCount > 0 && (
        <span className="px-1.5 text-xs text-gray-400 group-hover:hidden">{project.taskCount}</span>
      )}
      <div className="hidden pr-1 group-hover:block">
      <Popover trigger={menuTrigger} align="right" className="w-60 p-1 text-sm">
        {(close) => (
          <div>
            <Item icon={ArrowUp} label="Add project above" onClick={() => { setAddAt(project.position); close(); }} />
            <Item icon={ArrowDown} label="Add project below" onClick={() => { setAddAt(project.position + 1); close(); }} />
            <Divider />
            <Item icon={Pencil} label="Edit" onClick={() => { onRename(project); close(); }} />
            <Item
              icon={Heart}
              label={project.favorite ? "Remove from favorites" : "Add to favorites"}
              onClick={() => { updateProject.mutate({ id: project.id, patch: { favorite: !project.favorite } }); close(); }}
            />
            <Item icon={ArrowRight} label="Move to…" disabled />
            <Item icon={Copy} label="Duplicate" disabled />
            <Divider />
            <Item icon={UserPlus} label="Share" onClick={() => { setShareOpen(true); close(); }} />
            <Item icon={Link2} label="Copy link to project" onClick={() => { copyLink(); close(); }} />
            <Item icon={Activity} label="View activity" disabled />
            <Divider />
            <Item icon={LayoutTemplate} label="Save as template" disabled />
            <Item icon={Gem} label="Browse templates" disabled />
            <Divider />
            <Item icon={Puzzle} label="Add extension…" disabled />
            <Item icon={Download} label="Import from CSV" disabled />
            <Item icon={Upload} label="Export to CSV" disabled />
            <Item icon={Mail} label="Email tasks to this project" disabled />
            <Item icon={CalendarDays} label="Project calendar feed" disabled />
            <Divider />
            <Item
              icon={Archive}
              label="Archive"
              onClick={() => { updateProject.mutate({ id: project.id, patch: { archived: true } }); navigate("/inbox"); close(); }}
            />
            <Item icon={Trash2} label="Delete" danger onClick={() => { remove(); close(); }} />
          </div>
        )}
      </Popover>
      </div>

      {addAt != null && (
        <ProjectModal project={null} insertPosition={addAt} onClose={() => setAddAt(null)} />
      )}
      {shareOpen && <ShareDialog project={project} onClose={() => setShareOpen(false)} />}
    </div>
  );
}
