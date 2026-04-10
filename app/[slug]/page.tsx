import { notFound } from "next/navigation";

import { WorkspaceView } from "@/components/app/workspace-view";
import { getPageDefinition } from "@/lib/page-registry";

export default function SectionPage({ params }: { params: { slug: string } }) {
  const page = getPageDefinition(params.slug);

  if (page.slug !== params.slug) {
    notFound();
  }

  return <WorkspaceView slug={params.slug} />;
}

