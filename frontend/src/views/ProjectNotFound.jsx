import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useMe } from "../auth/useMe";
import notFoundArt from "../assets/project_not_found.png";

/**
 * Shown when the current user opens a project they can't access — it was deleted,
 * never existed, or they were removed from it by another collaborator. Replaces a
 * silent redirect so a removed user gets clear feedback (matches Todoist).
 */
export default function ProjectNotFound() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: me } = useMe();

  async function logout() {
    try {
      await api.post("/api/auth/logout");
    } catch {
      /* best-effort — clear local state regardless */
    }
    qc.clear();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <img src={notFoundArt} alt="" className="w-[230px]" />
      <h2 className="mt-2 text-[22px] font-bold text-gray-900">Project not found</h2>
      <p className="mt-2 max-w-[320px] text-[15px] leading-snug text-gray-500">
        The project doesn't seem to exist or you don't have permission to access it.
      </p>
      <button
        onClick={() => navigate("/inbox")}
        className="mt-5 rounded-md bg-[#dc4c3e] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
      >
        Go back to home
      </button>
      {me?.email && (
        <p className="mt-5 max-w-[300px] text-[13px] leading-snug text-gray-500">
          You're currently logged in as{" "}
          <span className="font-semibold text-gray-700">{me.email}</span>. Wrong account? Please{" "}
          <button onClick={logout} className="text-gray-600 underline hover:text-gray-800">
            log out
          </button>{" "}
          and back into an account with access.
        </p>
      )}
    </div>
  );
}
