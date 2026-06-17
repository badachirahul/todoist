import { useParams, Navigate } from "react-router-dom";
import { useProjects } from "../api/projects";
import TaskListView from "./TaskListView";

export default function ProjectView() {
  const { projectId } = useParams();
  const { data: projects, isLoading } = useProjects();

  if (isLoading) {
    return <div className="px-6 py-8 text-sm text-gray-400">Loading…</div>;
  }

  const project = projects?.find((p) => p.id === projectId);
  // Project gone (deleted or not a member) -> back to Inbox.
  if (!project) return <Navigate to="/inbox" replace />;

  return <TaskListView projectId={project.id} title={project.name} />;
}
