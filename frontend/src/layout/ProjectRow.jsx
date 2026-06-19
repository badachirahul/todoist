import { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
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
      className="rounded p-1 text-gray-400 opacity-0 hover:bg-gray-200 group-hover:opacity-100"
      aria-label="Project actions"
    >
      <MoreHorizontal size={16} />
    </button>
  );

  return (
    <div className="group flex items-center">
      <NavLink
        to={`/project/${project.id}`}
        className={({ isActive }) =>
          [
            "flex flex-1 items-center gap-3 rounded-md px-2 py-1.5 text-sm transition",
            isActive ? "bg-[#ffefe9] font-medium text-[#dc4c3e]" : "text-gray-700 hover:bg-gray-200/60",
          ].join(" ")
        }
      >
        <Hash size={18} className="text-gray-500" />
        <span className="flex-1 truncate">{project.name}</span>
        {project.favorite && <Heart size={13} className="text-[#dc4c3e]" fill="#dc4c3e" />}
      </NavLink>

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

      {addAt != null && (
        <ProjectModal project={null} insertPosition={addAt} onClose={() => setAddAt(null)} />
      )}
      {shareOpen && <ShareDialog project={project} onClose={() => setShareOpen(false)} />}
    </div>
  );
}
