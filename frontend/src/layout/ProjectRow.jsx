import { useNavigate } from "react-router-dom";
import { NavLink } from "react-router-dom";
import { Hash, MoreHorizontal, Pencil, Heart, Trash2 } from "lucide-react";
import Popover from "../components/Popover";
import { useUpdateProject, useDeleteProject } from "../api/projects";

/** A project row in the sidebar with a hover ⋯ menu (rename / favorite / delete). */
export default function ProjectRow({ project, onRename }) {
  const navigate = useNavigate();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  function remove() {
    deleteProject.mutate(project.id);
    navigate("/inbox");
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

      <Popover trigger={menuTrigger} align="right" className="w-48 p-1 text-sm">
        {(close) => (
          <div>
            <button
              onClick={() => { onRename(project); close(); }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-gray-700 hover:bg-gray-100"
            >
              <Pencil size={15} /> Rename
            </button>
            <button
              onClick={() => { updateProject.mutate({ id: project.id, patch: { favorite: !project.favorite } }); close(); }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-gray-700 hover:bg-gray-100"
            >
              <Heart size={15} /> {project.favorite ? "Remove from favorites" : "Add to favorites"}
            </button>
            <div className="my-1 border-t border-gray-100" />
            <button
              onClick={() => { remove(); close(); }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[#dc4c3e] hover:bg-gray-100"
            >
              <Trash2 size={15} /> Delete
            </button>
          </div>
        )}
      </Popover>
    </div>
  );
}
