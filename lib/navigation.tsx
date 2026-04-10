import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BookCheck,
  Bot,
  Boxes,
  BrainCircuit,
  ClipboardList,
  FlaskConical,
  FolderKanban,
  GitBranch,
  GitCommitHorizontal,
  HeartPulse,
  Microscope,
  Network,
  PackageSearch,
  PlugZap,
  Scale,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TestTubeDiagonal,
  Users,
} from "lucide-react";

import {
  appSections,
  getPageDefinition,
  getPageDefinitionFromPath,
  getPagePath,
  pageDefinitions,
  type AppSectionKey,
  type PageSlug,
} from "@/lib/page-registry";

const iconMap: Record<PageSlug, LucideIcon> = {
  dashboard: Activity,
  projects: FolderKanban,
  requirements: ClipboardList,
  design: Sparkles,
  architecture: Network,
  components: PackageSearch,
  bom: PackageSearch,
  simulation: HeartPulse,
  "digital-twin": HeartPulse,
  "3d-design": Boxes,
  "what-if-lab": FlaskConical,
  risk: ShieldAlert,
  compliance: ShieldCheck,
  traceability: GitBranch,
  evidence: BookCheck,
  research: Microscope,
  copilot: Bot,
  "model-lab": BrainCircuit,
  collaboration: Users,
  "version-control": GitCommitHorizontal,
  standards: Scale,
  tests: TestTubeDiagonal,
  integrations: PlugZap,
  admin: Settings2,
};

export interface NavigationItem {
  slug: PageSlug;
  label: string;
  section: AppSectionKey;
  description: string;
  path: string;
  badge?: number;
  icon: LucideIcon;
}

export const navigationSections = appSections.map((section) => ({
  id: section,
  label: section,
  items: pageDefinitions
    .filter((page) => page.section === section)
    .map((page) => ({
      ...page,
      path: getPagePath(page.slug),
      icon: iconMap[page.slug],
    })),
}));

export function getNavigationItem(pathname: string): NavigationItem {
  const page = getPageDefinitionFromPath(pathname);
  return {
    ...page,
    path: getPagePath(page.slug),
    icon: iconMap[page.slug],
  };
}

export function getBreadcrumbItems(pathname: string) {
  const page = getNavigationItem(pathname);
  return [
    { label: page.section, href: "/" },
    { label: page.label, href: page.path },
  ];
}

export function getCommandablePages() {
  return pageDefinitions.map((page) => ({
    id: page.slug,
    type: "page" as const,
    label: page.label,
    section: page.section,
    description: page.description,
    path: getPagePath(page.slug),
    icon: iconMap[page.slug],
  }));
}

export function getPageIcon(slug?: string | null) {
  return iconMap[getPageDefinition(slug).slug];
}
