import { useParams } from "react-router-dom";
import { useProjects } from "../api/projects";
import { useProjectStream } from "../api/realtime";
import TaskListView from "./TaskListView";
import ProjectNotFound from "./ProjectNotFound";

export default function ProjectView() {
  const { projectId } = useParams();
  const { data: projects, isLoading } = useProjects();
  useProjectStream(projectId); // live sync for collaborators

  if (isLoading) {
    return <div className="px-6 py-8 text-sm text-gray-400">Loading…</div>;
  }

  const project = projects?.find((p) => p.id === projectId);
  // Project gone (deleted, never existed, or you were removed) -> not-found page.
  if (!project) return <ProjectNotFound />;

  return <TaskListView projectId={project.id} title={project.name} />;
}
