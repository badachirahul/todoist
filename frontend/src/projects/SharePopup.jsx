import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { X, Lock, ChevronDown, Link2, HelpCircle, User, Check, Users } from "lucide-react";
import Avatar from "../components/Avatar";
import Popover from "../components/Popover";
import { useMe } from "../auth/useMe";
import { useMembers, useRemoveMember } from "../api/members";
import { useInvitations, useInviteMember, useCancelInvitation } from "../api/invitations";
import shareIllustration from "../assets/image.png";

/**
 * Role dropdown shown on each collaborator / pending row. Roles are display-only
 * (Todoist's Collaborator/Guest); only "Remove from project" is wired up.
 */
function CollaboratorMenu({ onRemove }) {
  return (
    <Popover
      align="right"
      className="w-72 p-1"
      trigger={
        <button className="flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-sm text-gray-700 hover:bg-gray-200">
          Collaborator <ChevronDown size={14} />
        </button>
      }
    >
      {(close) => (
        <div className="text-sm">
          <button
            onClick={close}
            className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left hover:bg-gray-100"
          >
            <Check size={16} className="mt-0.5 flex-none text-gray-800" />
            <span>
              <span className="block font-medium text-gray-800">Collaborator</span>
              <span className="block text-xs text-gray-500">Full permissions to edit this project</span>
            </span>
          </button>
          <button
            onClick={close}
            className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left hover:bg-gray-100"
          >
            <span className="mt-0.5 w-4 flex-none" />
            <span>
              <span className="block font-medium text-gray-800">Guest</span>
              <span className="block text-xs text-gray-500">
                Restricted from sharing or removing this project. Available for teams{" "}
                <span className="text-[#dc4c3e]">Learn more</span>
              </span>
            </span>
          </button>
          <div className="my-1 h-px bg-gray-100" />
          <button
            onClick={() => { onRemove(); close(); }}
            className="flex w-full items-center rounded-md px-2 py-1.5 text-left text-[#dc4c3e] hover:bg-gray-100"
          >
            Remove from project
          </button>
        </div>
      )}
    </Popover>
  );
}

/** Bottom-left toast confirming an invite was sent. Auto-hides after ~4s. */
function InviteToast({ onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  return createPortal(
    <div className="fixed bottom-5 left-5 z-[1000] flex items-center gap-3 rounded-lg bg-[#1f1f1f] px-4 py-3 text-sm text-white shadow-lg">
      <Check size={16} className="text-green-400" />
      <span>Invitation has been sent</span>
      <button onClick={onClose} className="ml-2 text-gray-400 hover:text-white" aria-label="Dismiss">
        <X size={14} />
      </button>
    </div>,
    document.body
  );
}

/** Gray generic avatar for an email with no account yet (typed/invited). */
function EmailAvatar({ size = 24 }) {
  return (
    <span
      style={{ width: size, height: size }}
      className="flex flex-none items-center justify-center rounded-full bg-gray-200 text-gray-500"
    >
      <User size={Math.round(size * 0.55)} />
    </span>
  );
}

/**
 * Todoist-style Share popup (500×535), rendered as the panel of the top-bar
 * Share button's Popover. Three sections: header (email input), body
 * (illustration / collaborators), footer. Backend is current (invite = existing
 * user added immediately); "Pending" isn't modelled, so members show their role.
 */
export default function SharePopup({ project }) {
  const navigate = useNavigate();
  const { data: me } = useMe();
  const { data: members = [] } = useMembers(project.id);
  const { data: invitations = [] } = useInvitations(project.id);
  const inviteMember = useInviteMember(project.id);
  const removeMember = useRemoveMember(project.id);
  const cancelInvitation = useCancelInvitation(project.id);

  const [input, setInput] = useState("");
  const [chips, setChips] = useState([]); // emails picked, not yet invited
  const [error, setError] = useState("");
  const [showToast, setShowToast] = useState(false);

  // Role is invisible in the Share list: your own row always shows "Leave",
  // everyone else's shows the Collaborator menu (with Remove). Both/all members
  // can remove each other. The current user floats to the top, like Todoist.
  const ordered = [...members].sort((a, b) =>
    a.userId === me?.id ? -1 : b.userId === me?.id ? 1 : 0
  );
  const hasPeople = members.length > 1 || invitations.length > 0;

  const showDropdown = input.trim().length > 0;
  // Is the typed email already an active member of this project?
  const alreadyMember = members.some(
    (m) => (m.email || "").toLowerCase() === input.trim().toLowerCase()
  );

  function pick(email) {
    const e = email.trim();
    if (!e) return;
    // Active members can't be re-invited; keep the input so the message stays.
    if (members.some((m) => (m.email || "").toLowerCase() === e.toLowerCase())) return;
    if (!chips.includes(e)) setChips((c) => [...c, e]);
    setInput("");
  }
  function copyLink() {
    navigator.clipboard?.writeText(`${window.location.origin}/project/${project.id}`);
  }
  function invite() {
    setError("");
    chips.forEach((email) =>
      inviteMember.mutate(email, {
        onSuccess: () => setShowToast(true),
        onError: (err) => {
          const status = err?.response?.status;
          setError(
            err?.response?.data?.message ||
              (status === 409 ? "This person is already in this project." : "Couldn't send the invite.")
          );
        },
      })
    );
    setChips([]);
  }

  return (
    <div className="flex h-[535px] flex-col text-sm">
      {/* 1. Header — email input (+ chips) */}
      <div className="relative flex-none p-4">
        <div className="flex min-h-[38px] flex-wrap items-center gap-1.5 rounded-lg border border-gray-300 px-2 py-1 focus-within:border-gray-400">
          {chips.map((c) => (
            <span key={c} className="flex items-center gap-1.5 rounded-md bg-gray-100 py-0.5 pl-1 pr-1.5 text-gray-700">
              <EmailAvatar size={20} />
              {c}
              <button onClick={() => setChips((cs) => cs.filter((x) => x !== c))} className="text-gray-400 hover:text-gray-700" aria-label={`Remove ${c}`}>
                <X size={13} />
              </button>
            </span>
          ))}
          <input
            autoFocus
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(""); }}
            onKeyDown={(e) => { if (e.key === "Enter" && input.trim()) pick(input); }}
            placeholder={chips.length ? "" : "Add people by name or email"}
            className="min-w-[140px] flex-1 px-1 py-1 text-sm outline-none placeholder:text-gray-400"
          />
        </div>

        {/* Typing dropdown — "Invite someone new" */}
        {showDropdown && (
          <div className="w-117 absolute left-4 right-4 top-[52px] z-10 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-[13px] font-semibold text-gray-800">Invite someone new</span>
              <button onClick={() => pick(input)} className="text-[13px] font-medium text-gray-500 hover:text-gray-800">Done</button>
            </div>
            <button
              onClick={() => pick(input)}
              disabled={alreadyMember}
              className={`ml-4 mr-4 flex w-[434px] items-center gap-2.5 rounded-lg px-3 py-2 text-left ${alreadyMember ? "mb-1" : "mb-4 hover:bg-gray-100"}`}
            >
              <EmailAvatar size={28} />
              <span className="font-semibold text-gray-800">{input.trim()}</span>
            </button>
            {alreadyMember && (
              <p className="mb-4 ml-4 mr-4 px-3 text-[13px] text-[#dc4c3e]">
                This person is already in this project.
              </p>
            )}
          </div>
        )}
        {error && <p className="mt-1 px-1 text-xs text-[#dc4c3e]">{error}</p>}
      </div>

      {/* 2. Body */}
      {chips.length > 0 ? (
        <div className="flex-1" />
      ) : hasPeople ? (
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {/* Access */}
          <p className="mb-2 text-base font-bold text-gray-900">Access</p>
          <div className="mb-5">
            <Popover
              fullWidth
              align="left"
              className="w-80 p-1"
              trigger={
                <button className="-mx-2 flex w-full items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-gray-100">
                  <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-gray-100 text-gray-500">
                    <Lock size={16} />
                  </span>
                  <span className="flex-1 text-left">
                    <span className="block font-semibold text-gray-800">Restricted</span>
                    <span className="block text-xs text-gray-500">Only invited people can edit</span>
                  </span>
                  <ChevronDown size={18} className="text-gray-400" />
                </button>
              }
            >
              {(close) => (
                <div className="text-sm">
                  <button onClick={close} className="flex w-full items-start gap-3 rounded-md px-2 py-2 text-left hover:bg-gray-100">
                    <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-gray-100 text-gray-600"><Lock size={15} /></span>
                    <span className="flex-1">
                      <span className="block font-semibold text-gray-800">Restricted</span>
                      <span className="block text-xs text-gray-500">Only invited people can edit</span>
                    </span>
                    <Check size={16} className="mt-0.5 flex-none text-gray-800" />
                  </button>
                  <button onClick={close} className="flex w-full items-start gap-3 rounded-md px-2 py-2 text-left hover:bg-gray-100">
                    <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-gray-100 text-gray-600"><Users size={15} /></span>
                    <span className="flex-1">
                      <span className="block font-semibold text-gray-800">Team</span>
                      <span className="block text-xs text-gray-500">
                        Everyone in your team can edit. Available for teams.{" "}
                        <span className="text-[#dc4c3e]">Learn more</span>
                      </span>
                    </span>
                  </button>
                </div>
              )}
            </Popover>
          </div>

          <p className="mb-2 text-base font-bold text-gray-900">In this project</p>
          {/* Members — your own row = "Leave"; everyone else = Collaborator menu (Remove) */}
          {ordered.map((m) => (
            <div key={m.userId} className="flex items-center gap-3 py-2">
              <Avatar name={m.name} avatarUrl={m.avatarUrl} size={36} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-gray-800">{m.name || m.email}{m.userId === me?.id ? " (Me)" : ""}</p>
                <p className="truncate text-xs text-gray-500">{m.email}</p>
              </div>
              {m.userId === me?.id ? (
                <button
                  onClick={() =>
                    removeMember.mutate(m.userId, {
                      onSuccess: () => navigate("/inbox"), // you chose to leave -> go home
                      onError: () => setError("Couldn't leave the project. Please try again."),
                    })
                  }
                  className="text-sm font-medium text-gray-700 hover:underline"
                >
                  Leave
                </button>
              ) : (
                <CollaboratorMenu onRemove={() => removeMember.mutate(m.userId)} />
              )}
            </div>
          ))}
          {/* Pending invitations */}
          {invitations.map((inv) => (
            <div key={inv.id} className="flex items-center gap-3 py-2">
              <EmailAvatar size={36} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-gray-800">{inv.email}</p>
                <p className="truncate text-xs text-gray-500">Pending</p>
              </div>
              <CollaboratorMenu onRemove={() => cancelInvitation.mutate(inv.id)} />
            </div>
          ))}
        </div>
      ) : (
        /* Initial — illustration */
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-6 text-center">
          <img src={shareIllustration} alt="" className="h-auto w-[220px]" />
          <p className="text-[16px] font-bold text-gray-900">Collaborate with friends and family</p>
          <p className="mt-2 max-w-[280px] text-gray-500">
            Invite others to finally get on top of those household chores or plan that dream holiday.
          </p>
          <button className="mt-4 font-medium text-[#dc4c3e] hover:underline">Or, add a team to Todoist instead</button>
        </div>
      )}

      {/* 3. Footer */}
      {chips.length > 0 ? (
        <div className="flex h-16 flex-none items-center justify-end gap-2 border-t border-gray-100 p-4">
          <button onClick={() => setChips([])} className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-200">Cancel</button>
          <button onClick={invite} className="rounded-md bg-[#dc4c3e] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90">Invite</button>
        </div>
      ) : (
        <div className="flex h-16 flex-none items-center justify-between border-t border-gray-100 p-4 text-sm">
          <span className="flex items-center gap-1.5 text-gray-500"><HelpCircle size={16} /> Learn about sharing</span>
          <button onClick={copyLink} className="flex items-center gap-1.5 rounded-md bg-gray-100 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-200">
            <Link2 size={13} /> Copy link
          </button>
        </div>
      )}

      {showToast && <InviteToast onClose={() => setShowToast(false)} />}
    </div>
  );
}
