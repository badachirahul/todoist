import { Plus } from "lucide-react";

/**
 * Generic content view for the shell. Renders the big bold title like Todoist.
 * Real task lists / view content arrive in Phase 4+.
 */
export default function ViewPlaceholder({ title, note }) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-[26px] font-bold leading-[35px] text-[#202020]">{title}</h1>

      <button
        className="mt-4 flex items-center gap-2 text-sm text-gray-500 hover:text-[#dc4c3e]"
        disabled
      >
        <Plus size={18} className="text-[#dc4c3e]" />
        Add task
      </button>

      <p className="mt-10 text-sm text-gray-400">
        {note || "This view is part of the shell. Tasks come in the next phase."}
      </p>
    </div>
  );
}
