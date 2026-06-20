import { useState } from "react";
import { X } from "lucide-react";
import Modal from "../components/Modal";
import Avatar from "../components/Avatar";
import { useMe } from "../auth/useMe";
import { useMembers, useAddMember, useRemoveMember } from "../api/members";

/**
 * Share a project: list members and invite a new one by email. Only the owner
 * sees remove buttons (and the owner row can't be removed). Backed by the
 * /api/projects/{id}/members endpoints.
 */
export default function ShareDialog({ project, onClose }) {
  const { data: me } = useMe();
  const { data: members = [] } = useMembers(project.id);
  const addMember = useAddMember(project.id);
  const removeMember = useRemoveMember(project.id);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const iAmOwner = members.some((m) => m.userId === me?.id && m.role === "OWNER");

  function invite(e) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setError("");
    addMember.mutate(trimmed, {
      onSuccess: () => setEmail(""),
      onError: (err) => {
        const status = err?.response?.status;
        setError(
          err?.response?.data?.message ||
            (status === 404 ? "No Todoist user with that email." :
             status === 409 ? "That person is already a member." :
             "Couldn't share the project.")
        );
      },
    });
  }

  return (
    <Modal open onClose={onClose} className="max-w-md">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Share &ldquo;{project.name}&rdquo;</h2>
        <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100" aria-label="Close">
          <X size={18} />
        </button>
      </div>

      <form onSubmit={invite} className="mt-4 flex gap-2">
        <input
          autoFocus
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(""); }}
          placeholder="Invite by email"
          className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500"
        />
        <button
          type="submit"
          disabled={!email.trim() || addMember.isPending}
          className="rounded-md bg-[#dc4c3e] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          Invite
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-[#dc4c3e]">{error}</p>}

      <div className="mt-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
          {members.length} {members.length === 1 ? "member" : "members"}
        </p>
        <div className="flex flex-col gap-1">
          {members.map((m) => (
            <div key={m.userId} className="flex items-center gap-3 rounded-md px-1 py-1.5">
              <Avatar name={m.name} avatarUrl={m.avatarUrl} size={32} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-gray-800">{m.name}</p>
                <p className="truncate text-xs text-gray-400">{m.email}</p>
              </div>
              <span className="text-xs capitalize text-gray-400">{m.role.toLowerCase()}</span>
              {iAmOwner && m.role !== "OWNER" && (
                <button
                  onClick={() => removeMember.mutate(m.userId)}
                  className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-[#dc4c3e]"
                  aria-label={`Remove ${m.name}`}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
