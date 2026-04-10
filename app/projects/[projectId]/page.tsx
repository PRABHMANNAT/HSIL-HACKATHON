import { ProjectDetailView } from "@/components/app/project-detail-view";

export default function ProjectDetailPage({
  params,
}: {
  params: { projectId: string };
}) {
  return <ProjectDetailView projectId={params.projectId} />;
}
