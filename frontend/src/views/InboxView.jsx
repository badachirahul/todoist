import { useInbox } from "../api/projects";
import TaskListView from "./TaskListView";

export default function InboxView() {
  const { inbox, isLoading } = useInbox();

  if (isLoading || !inbox) {
    return <div className="px-6 py-8 text-sm text-gray-400">Loading…</div>;
  }

  return <TaskListView projectId={inbox.id} title="Inbox" />;
}
