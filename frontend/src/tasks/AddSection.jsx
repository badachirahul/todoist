import { useState } from "react";
import { useCreateSection } from "../api/sections";

export default function AddSection({ projectId }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const createSection = useCreateSection(projectId);

  function submit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    createSection.mutate(trimmed);
    setName("");
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-6 w-full border-t border-transparent py-1.5 text-left text-sm text-gray-400 hover:text-[#dc4c3e]"
      >
        + Add section
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="mt-6">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Section name"
        className="w-full border-b border-gray-300 pb-1 text-sm font-semibold outline-none"
      />
      <div className="mt-2 flex gap-2">
        <button type="submit" disabled={!name.trim()} className="rounded-md bg-[#dc4c3e] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
          Add section
        </button>
        <button type="button" onClick={() => { setOpen(false); setName(""); }} className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-200">
          Cancel
        </button>
      </div>
    </form>
  );
}
