import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ListChecks, Circle, CircleDot, UserPlus, UserMinus, MessageSquare, Check } from "lucide-react";
import Avatar from "../components/Avatar";
import {
  useNotifications,
  useMarkAllRead,
  useSetNotificationRead,
  useAcceptInvite,
} from "../api/notifications";

const GREEN = "bg-emerald-600";
const RED = "bg-[#dc4c3e]";

// Vertical gap between notification cards (applies to BOTH read and unread).
// Tweak this single number to adjust the spacing.
const ROW_GAP_PX = 1;

// Small event badge overlaid on the avatar, by notification type.
const BADGES = {
  INVITED_TO_PROJECT: { bg: GREEN, icon: UserPlus },
  ADDED_TO_PROJECT: { bg: GREEN, icon: UserPlus },
  JOINED_PROJECT: { bg: GREEN, icon: UserPlus },
  REMOVED_FROM_PROJECT: { bg: RED, icon: UserMinus },
  LEFT_PROJECT: { bg: RED, icon: UserMinus },
  COMMENT_ADDED: { bg: GREEN, icon: MessageSquare },
};

/** Relative "x hours/minutes ago" label. */
function timeAgo(isoString) {
  const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const units = [
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [label, secs] of units) {
    const n = Math.floor(seconds / secs);
    if (n >= 1) return `${n} ${label}${n > 1 ? "s" : ""} ago`;
  }
  return "Just now";
}

/** The bolded sentence for each notification type (subject = project or task). */
function message(n) {
  const actor = <span className="font-bold text-[#202020]">{n.actorName || "Someone"}</span>;
  const subject = <span className="font-bold text-[#202020]">{n.subjectName}</span>;
  switch (n.type) {
    case "INVITED_TO_PROJECT":
      return <>{actor} invited you to {subject}</>;
    case "ADDED_TO_PROJECT":
      return <>{actor} added you to {subject}</>;
    case "REMOVED_FROM_PROJECT":
      return <>{actor} removed you from {subject}</>;
    case "JOINED_PROJECT":
      return <>{actor} joined {subject}</>;
    case "LEFT_PROJECT":
      return <>{actor} left {subject}</>;
    case "COMMENT_ADDED":
      return <>{actor} added a comment to {subject}</>;
    default:
      return null;
  }
}

/** Where a row navigates when clicked (null = not navigable, e.g. a pending invite). */
function targetFor(n) {
  if (n.type === "INVITED_TO_PROJECT") return null; // must Accept first
  if (n.projectId && n.taskId) return `/project/${n.projectId}?task=${n.taskId}`;
  if (n.projectId) return `/project/${n.projectId}`;
  return null;
}

function NotifAvatar({ n }) {
  const badge = BADGES[n.type];
  return (
    <div className="relative flex-none">
      <Avatar name={n.actorName} size={40} />
      {badge && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full ring-2 ring-white ${badge.bg}`}
        >
          <badge.icon size={11} className="text-white" strokeWidth={2.5} />
        </span>
      )}
    </div>
  );
}

function NotificationRow({ n, onToggle, onAccept, onRowClick }) {
  const navigable = !!targetFor(n);
  const isInvite = n.type === "INVITED_TO_PROJECT";
  return (
    <div
      onClick={() => navigable && onRowClick(n)}
      className={[
        // overflow-hidden clips the rounded corners so the grey unread/hover
        // background (and the orange strip) keep their radius — never square.
        "relative flex items-start gap-3 overflow-hidden transition-colors duration-150",
        n.read ? "bg-white hover:bg-[#eeeeee]" : "bg-[#eeeeee] hover:bg-[#eeeeee]",
        navigable ? "cursor-pointer" : "",
      ].join(" ")}
      style={{
        width: 800,
        minHeight: 78,
        padding: "14px 7px 14px 14px",
        borderRadius: 12,
        // Same gap for every card, read or unread. Adjust via ROW_GAP_PX above.
        marginBottom: ROW_GAP_PX,
      }}
    >
      {/* Orange unread strip — inset-y-0 stretches it to the card's full height
          (78px normal, taller for invites) so it always reaches both rounded corners. */}
      {!n.read && <span className="absolute inset-y-0 left-0 bg-[#dc4c3e]" style={{ width: 4 }} />}

      <NotifAvatar n={n} />

      <div className="min-w-0 flex-1 pl-1">
        <p className="text-[13px] leading-[20px] text-gray-700">{message(n)}</p>

        {isInvite ? (
          // Accept button + timestamp share one row, so invite cards are ~88px
          // (28 padding + 20 message + 8 gap + 32 button) while normal rows stay 78.
          <div className="mt-2 flex items-center gap-3">
            <button
              onClick={(e) => { e.stopPropagation(); onAccept(n); }}
              className="inline-flex items-center justify-center gap-1.5 rounded-md text-[13px] font-semibold text-white"
              style={{ width: 93.63, height: 32, padding: "0 12px", background: "#D33322" }}
            >
              <Check size={16} strokeWidth={3} />
              Accept
            </button>
            <span className="text-[12px] leading-[16px] text-[#808080]">{timeAgo(n.createdAt)}</span>
          </div>
        ) : (
          <p className="text-[12px] leading-[16px] text-[#808080]" style={{ marginTop: 8 }}>
            {timeAgo(n.createdAt)}
          </p>
        )}
      </div>

      {/* Read/unread toggle circle (24x24) */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(n); }}
        className="flex h-6 w-6 flex-none items-center justify-center self-center text-gray-400 transition hover:text-gray-600"
        aria-label={n.read ? "Mark as unread" : "Mark as read"}
      >
        {n.read ? <Circle size={18} /> : <CircleDot size={18} />}
      </button>
    </div>
  );
}

export default function NotificationsView() {
  const [tab, setTab] = useState("all"); // "all" | "unread"
  const navigate = useNavigate();
  const { data: notifications = [], isLoading } = useNotifications();
  const markAllRead = useMarkAllRead();
  const setRead = useSetNotificationRead();
  const acceptInvite = useAcceptInvite();

  // Derived from the list so it updates instantly with optimistic toggles.
  const unreadCount = notifications.filter((n) => !n.read).length;
  const visible = tab === "unread" ? notifications.filter((n) => !n.read) : notifications;

  const toggle = (n) => setRead.mutate({ id: n.id, read: !n.read });
  const accept = (n) => acceptInvite.mutate(n.id);

  // Open the related resource; mark read on the way (decrements the counter/badge).
  const openRow = (n) => {
    const to = targetFor(n);
    if (!to) return;
    if (!n.read) setRead.mutate({ id: n.id, read: true });
    navigate(to);
  };

  return (
    <div className="relative h-full overflow-x-hidden">
      {/* Mark all as read — top-right */}
      <button
        onClick={() => unreadCount > 0 && markAllRead.mutate()}
        disabled={unreadCount === 0}
        className="absolute right-6 top-4 flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-gray-900 disabled:opacity-40"
      >
        <ListChecks size={24} />
        Mark all as read
      </button>

      {/* Centered 800px column */}
      <div className="mx-auto pb-20 pt-20" style={{ width: 800 }}>
        <h1
          className="font-bold text-[#202020]"
          style={{ fontSize: 26, lineHeight: "35px", marginBottom: 24 }}
        >
          Notifications
        </h1>

        {/* All / Unread toggle */}
        <div
          className="inline-flex items-center gap-1 rounded-full"
          style={{ background: "#F5F5F5", padding: "0 4px", marginTop: 8 }}
        >
          {[
            { key: "all", label: "All" },
            { key: "unread", label: unreadCount > 0 ? `Unread ${unreadCount}` : "Unread" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={[
                "rounded-full px-3 py-1.5 text-[14px] font-semibold text-[#202020] transition hover:font-bold",
                tab === t.key ? "bg-white" : "bg-transparent",
              ].join(" ")}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="mt-4">
          {isLoading ? (
            <p className="px-3 py-8 text-sm text-gray-400">Loading…</p>
          ) : visible.length === 0 ? (
            <p className="px-3 py-12 text-center text-sm text-gray-400">
              {tab === "unread" ? "No unread notifications." : "No notifications yet."}
            </p>
          ) : (
            visible.map((n, i) => (
              <div key={n.id} className="group ntf-item">
                <NotificationRow n={n} onToggle={toggle} onAccept={accept} onRowClick={openRow} />
                {/* Divider only under READ rows (unread cards self-separate via grey
                    bg + orange strip). Hidden on hover of THIS row (group-hover) and,
                    via the .ntf-item:has(+:hover) rule in index.css, of the row BELOW
                    it — so a hovered row merges with both neighbours, like Todoist. */}
                {n.read && i < visible.length - 1 && (
                  <div className="ntf-divider h-px bg-[#E5E5E5] group-hover:bg-transparent" style={{ width: 800 }} />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
