import type { ProjectLifecycleState } from "@/lib/med-types";

export type DashboardRegion = "US" | "EU" | "IN";
export type AlertSeverityLevel = "critical" | "warning" | "info";
export type DeviceType =
  | "Pacemaker"
  | "Ventilator"
  | "Infusion Pump"
  | "ECG Monitor"
  | "Insulin Pump"
  | "Surgical Tool";

export interface DashboardVitalMetric {
  id: string;
  label: string;
  value: number;
  unit: string;
  trend: number;
  color: string;
  sparklineData: number[];
}

export interface PortfolioProject {
  id: string;
  name: string;
  slug: string;
  deviceType: DeviceType;
  deviceClass: string;
  regions: DashboardRegion[];
  phase: ProjectLifecycleState;
  coverage: number;
  riskScore: number;
  lastModified: string;
  modifiedBy: string;
}

export interface SmartAlert {
  id: string;
  severity: AlertSeverityLevel;
  title: string;
  age: string;
  actionHref: string;
}

export interface DashboardActivity {
  id: string;
  avatar: string;
  actor: string;
  action: string;
  projectName: string;
  projectHref: string;
  timestamp: string;
}

export const dashboardVitalMetrics: DashboardVitalMetric[] = [
  {
    id: "active-projects",
    label: "Active Projects",
    value: 24,
    unit: "",
    trend: 8.7,
    color: "var(--primary)",
    sparklineData: [17, 18, 19, 20, 22, 23, 24],
  },
  {
    id: "avg-coverage",
    label: "Avg Req Coverage",
    value: 91,
    unit: "%",
    trend: 4.2,
    color: "var(--accent)",
    sparklineData: [81, 83, 84, 86, 88, 89, 91],
  },
  {
    id: "open-risks",
    label: "Open Risk Items",
    value: 13,
    unit: "",
    trend: -11.8,
    color: "var(--danger)",
    sparklineData: [24, 22, 21, 18, 16, 15, 13],
  },
  {
    id: "simulations",
    label: "Simulations This Week",
    value: 18,
    unit: "",
    trend: 12.5,
    color: "var(--warning)",
    sparklineData: [7, 8, 9, 12, 14, 16, 18],
  },
  {
    id: "evidence-packs",
    label: "Evidence Packs Ready",
    value: 9,
    unit: "",
    trend: 28.6,
    color: "var(--accent)",
    sparklineData: [2, 3, 4, 5, 6, 7, 9],
  },
  {
    id: "versions-generated",
    label: "Versions Generated",
    value: 31,
    unit: "",
    trend: 16.4,
    color: "var(--primary)",
    sparklineData: [14, 16, 19, 22, 25, 28, 31],
  },
];

export const dashboardSimulationBreakdown = {
  pass: 12,
  fail: 3,
  pending: 3,
};

export const portfolioProjects: PortfolioProject[] = [
  {
    id: "atria-vx7",
    slug: "atria-vx7",
    name: "Atria VX-7 Pacemaker",
    deviceType: "Pacemaker",
    deviceClass: "Class III",
    regions: ["US", "EU", "IN"],
    phase: "Validation",
    coverage: 94,
    riskScore: 8,
    lastModified: "18 min ago",
    modifiedBy: "Priya Shah",
  },
  {
    id: "nimbus-air",
    slug: "nimbus-air",
    name: "Nimbus Air Ventilator",
    deviceType: "Ventilator",
    deviceClass: "Class II",
    regions: ["US", "EU"],
    phase: "Design",
    coverage: 86,
    riskScore: 6,
    lastModified: "42 min ago",
    modifiedBy: "Jon Park",
  },
  {
    id: "flowguard-x",
    slug: "flowguard-x",
    name: "FlowGuard X Infusion Pump",
    deviceType: "Infusion Pump",
    deviceClass: "Class II",
    regions: ["US", "IN"],
    phase: "Freeze",
    coverage: 97,
    riskScore: 4,
    lastModified: "1h ago",
    modifiedBy: "Nadia Islam",
  },
  {
    id: "rhythmsense-12",
    slug: "rhythmsense-12",
    name: "RhythmSense 12 ECG Monitor",
    deviceType: "ECG Monitor",
    deviceClass: "Class II",
    regions: ["EU", "IN"],
    phase: "Requirements",
    coverage: 74,
    riskScore: 5,
    lastModified: "2h ago",
    modifiedBy: "Emily Wu",
  },
  {
    id: "glucopilot",
    slug: "glucopilot",
    name: "GlucoPilot Insulin Pump",
    deviceType: "Insulin Pump",
    deviceClass: "Class III",
    regions: ["US", "EU"],
    phase: "Submission-Ready",
    coverage: 99,
    riskScore: 3,
    lastModified: "Today",
    modifiedBy: "Marco Ruiz",
  },
];

export const smartAlerts: SmartAlert[] = [
  {
    id: "alert-1",
    severity: "critical",
    title: "Nimbus Air is missing alarm validation evidence for EU dossier",
    age: "2h ago",
    actionHref: "/evidence",
  },
  {
    id: "alert-2",
    severity: "critical",
    title: "Atria VX-7 residual risk score increased after battery drift replay",
    age: "3h ago",
    actionHref: "/risk",
  },
  {
    id: "alert-3",
    severity: "warning",
    title: "FlowGuard X template version is behind the latest infusion standard pack",
    age: "5h ago",
    actionHref: "/standards",
  },
  {
    id: "alert-4",
    severity: "warning",
    title: "RhythmSense 12 coverage dropped below 75% after requirement split",
    age: "7h ago",
    actionHref: "/requirements",
  },
  {
    id: "alert-5",
    severity: "info",
    title: "Three fresh literature reviews were added to the pacemaker evidence library",
    age: "10h ago",
    actionHref: "/research",
  },
];

export const dashboardActivities: DashboardActivity[] = [
  {
    id: "act-1",
    avatar: "PS",
    actor: "Priya Shah",
    action: "approved thermal mitigation updates for",
    projectName: "Atria VX-7 Pacemaker",
    projectHref: "/projects",
    timestamp: "10m ago",
  },
  {
    id: "act-2",
    avatar: "JP",
    actor: "Jon Park",
    action: "pushed a new simulation batch to",
    projectName: "Nimbus Air Ventilator",
    projectHref: "/projects",
    timestamp: "28m ago",
  },
  {
    id: "act-3",
    avatar: "NI",
    actor: "Nadia Islam",
    action: "exported evidence pack v12 for",
    projectName: "FlowGuard X Infusion Pump",
    projectHref: "/projects",
    timestamp: "1h ago",
  },
  {
    id: "act-4",
    avatar: "EW",
    actor: "Emily Wu",
    action: "updated verification ownership in",
    projectName: "RhythmSense 12 ECG Monitor",
    projectHref: "/projects",
    timestamp: "2h ago",
  },
];

export const weeklySimulationSummary = [
  { name: "Pass", value: 67, count: 12, color: "var(--accent)" },
  { name: "Fail", value: 17, count: 3, color: "var(--danger)" },
  { name: "Pending", value: 16, count: 3, color: "var(--warning)" },
];

export const dashboardQuickActions = [
  {
    id: "new-project",
    label: "New Project",
    description: "Open creation wizard",
  },
  {
    id: "import-requirements",
    label: "Import Requirements",
    description: "Bring in specs or legacy DHF",
  },
  {
    id: "run-simulation",
    label: "Run Simulation",
    description: "Launch scenario batch",
  },
  {
    id: "export-evidence",
    label: "Export Evidence",
    description: "Generate audit packet",
  },
];

export const regionFlagMap: Record<DashboardRegion, string> = {
  US: "🇺🇸",
  EU: "🇪🇺",
  IN: "🇮🇳",
};

