import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { acceptInvite } from "../api/invitations";

/**
 * Lands here from an invite email's "Accept invite" link (behind RequireAuth, so
 * the invitee logs in / signs up first). Accepts the invitation, then redirects
 * into the shared project.
 */
export default function InviteAccept() {
  const { token } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [error, setError] = useState("");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // guard StrictMode double-invoke
    ran.current = true;
    acceptInvite(token)
      .then(({ projectId }) => {
        qc.invalidateQueries({ queryKey: ["projects"] });
        navigate(`/project/${projectId}`, { replace: true });
      })
      .catch((err) => {
        const status = err?.response?.status;
        setError(status === 404 || status === 410
          ? "This invitation is invalid or has expired."
          : "Couldn't accept the invitation.");
      });
  }, [token, navigate, qc]);

  return (
    <div className="flex min-h-screen items-center justify-center text-gray-500">
      {error ? (
        <div className="text-center">
          <p className="text-[#dc4c3e]">{error}</p>
          <button onClick={() => navigate("/inbox")} className="mt-3 text-sm text-gray-600 underline">
            Go to Inbox
          </button>
        </div>
      ) : (
        <p>Joining project…</p>
      )}
    </div>
  );
}
