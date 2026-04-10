export type AppSectionKey =
  | "WORKSPACE"
  | "DESIGN"
  | "SIMULATION"
  | "COMPLIANCE"
  | "INTELLIGENCE"
  | "TEAM";

export type PageSlug =
  | "dashboard"
  | "projects"
  | "requirements"
  | "design"
  | "architecture"
  | "components"
  | "bom"
  | "simulation"
  | "digital-twin"
  | "3d-design"
  | "what-if-lab"
  | "risk"
  | "compliance"
  | "traceability"
  | "evidence"
  | "research"
  | "ai-copilot"
  | "model-lab"
  | "collaboration"
  | "version-control"
  | "standards"
  | "tests"
  | "integrations"
  | "admin";

export interface PageDefinition {
  slug: PageSlug;
  label: string;
  section: AppSectionKey;
  description: string;
  badge?: number;
}

export const appSections: AppSectionKey[] = [
  "WORKSPACE",
  "DESIGN",
  "SIMULATION",
  "COMPLIANCE",
  "INTELLIGENCE",
  "TEAM",
];

export const pageDefinitions: PageDefinition[] = [
  {
    slug: "dashboard",
    label: "Dashboard",
    section: "WORKSPACE",
    description: "Clinical program overview, live vitals, and release readiness.",
    badge: 3,
  },
  {
    slug: "projects",
    label: "Projects",
    section: "WORKSPACE",
    description: "Multi-program portfolio tracking with lifecycle and ownership.",
    badge: 8,
  },
  {
    slug: "requirements",
    label: "Requirements",
    section: "DESIGN",
    description: "Requirement intelligence with hazards, verification, and coverage.",
    badge: 12,
  },
  {
    slug: "design",
    label: "Design Engine",
    section: "DESIGN",
    description: "AI-assisted generation, comparison, and promotion of Design IR baselines.",
  },
  {
    slug: "architecture",
    label: "Architecture",
    section: "DESIGN",
    description: "System topology, interfaces, and module dependencies.",
    badge: 2,
  },
  {
    slug: "components",
    label: "Components",
    section: "DESIGN",
    description: "AI-generated bill of materials, supplier intelligence, and alternative sourcing.",
  },
  {
    slug: "bom",
    label: "BOM",
    section: "DESIGN",
    description: "Critical parts, alternates, suppliers, and lot traceability.",
  },
  {
    slug: "simulation",
    label: "Simulation",
    section: "SIMULATION",
    description: "Digital twin pacing simulation, ECG waveforms, and heart response in realtime.",
    badge: 1,
  },
  {
    slug: "digital-twin",
    label: "Digital Twin",
    section: "SIMULATION",
    description: "Realtime device twin with telemetry, heat, and stability envelopes.",
    badge: 1,
  },
  {
    slug: "3d-design",
    label: "3D Design",
    section: "SIMULATION",
    description: "Enclosure, board stacking, and service access validation.",
  },
  {
    slug: "what-if-lab",
    label: "What-if Lab",
    section: "SIMULATION",
    description: "Scenario testing for constraints, failures, and timing margins.",
  },
  {
    slug: "risk",
    label: "Risk",
    section: "COMPLIANCE",
    description: "Hazard scoring, severity ladders, and mitigation residuals.",
    badge: 5,
  },
  {
    slug: "compliance",
    label: "Compliance",
    section: "COMPLIANCE",
    description: "Design control readiness across IEC, ISO, and FDA workflows.",
  },
  {
    slug: "traceability",
    label: "Traceability",
    section: "COMPLIANCE",
    description: "Link requirements to design, verification, and evidence artifacts.",
  },
  {
    slug: "evidence",
    label: "Evidence",
    section: "COMPLIANCE",
    description: "Audit-ready packets, approval chains, and signed records.",
  },
  {
    slug: "research",
    label: "Research",
    section: "INTELLIGENCE",
    description: "Clinical literature, standards deltas, and competitive signals.",
  },
  {
    slug: "ai-copilot",
    label: "AI Copilot",
    section: "INTELLIGENCE",
    description: "Streaming design reasoning, gap analysis, and recommendation traces.",
    badge: 1,
  },
  {
    slug: "model-lab",
    label: "Model Lab",
    section: "INTELLIGENCE",
    description: "Evaluation runs, token budgets, and grounded prompt sets.",
  },
  {
    slug: "collaboration",
    label: "Collaboration",
    section: "TEAM",
    description: "Cross-functional activity feed, reviewers, and approvals.",
  },
  {
    slug: "version-control",
    label: "Version Control",
    section: "TEAM",
    description: "Program baselines, branch windows, and change packets.",
  },
  {
    slug: "standards",
    label: "Standards",
    section: "TEAM",
    description: "Reference libraries for IEC 62304, ISO 14971, and IEC 60601.",
  },
  {
    slug: "tests",
    label: "Tests",
    section: "TEAM",
    description: "Verification plans, bench runs, and automated result intake.",
  },
  {
    slug: "integrations",
    label: "Integrations",
    section: "TEAM",
    description: "Connected PLM, QMS, sensor, and documentation pipelines.",
  },
  {
    slug: "admin",
    label: "Admin",
    section: "TEAM",
    description: "Environment policies, access control, and deployment governance.",
  },
];

export function getPagePath(slug: PageSlug) {
  return `/${slug}`;
}

export function getPageDefinition(slug?: string | null) {
  const normalized = slug ?? "dashboard";
  return (
    pageDefinitions.find((page) => page.slug === normalized) ?? pageDefinitions[0]
  );
}

export function getPageDefinitionFromPath(pathname: string) {
  const normalized = pathname === "/" ? "dashboard" : pathname.replace(/^\/+/, "");
  const topLevel = normalized.split("/")[0];
  return getPageDefinition(topLevel);
}
