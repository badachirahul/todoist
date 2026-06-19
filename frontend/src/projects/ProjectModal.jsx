import { useState } from "react";
import Modal from "../components/Modal";
import { useCreateProject, useUpdateProject } from "../api/projects";

/**
 * Create or rename a project. Parent mounts it only while open, so state seeds
 * correctly from `project` (rename) or empty (create).
 */
export default function ProjectModal({ project, onClose, insertPosition }) {
  const editing = !!project;
  const [name, setName] = useState(project?.name ?? "");
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();

  function submit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    if (editing) updateProject.mutate({ id: project.id, patch: { name: trimmed } });
    else createProject.mutate(
      insertPosition != null ? { name: trimmed, position: insertPosition } : { name: trimmed }
    );
    onClose();
  }

  return (
    <Modal open onClose={onClose} className="max-w-md">
      <form onSubmit={submit}>
        <h2 className="text-base font-semibold text-gray-900">
          {editing ? "Rename project" : "Add project"}
        </h2>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Project name"
          className="mt-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name.trim()}
            className="rounded-md bg-[#dc4c3e] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {editing ? "Save" : "Add"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
