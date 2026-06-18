import { AnimatedPage } from "@/components/layout/animated-page";

import { ProjectDetailView } from "@/features/projects/components/project-detail-view";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <AnimatedPage>
      <ProjectDetailView projectId={id} />
    </AnimatedPage>
  );
}
