import type { AlertSeverity, ProjectLifecycleState, RiskBreakdown } from "@/lib/med-types";

export const vitalMetrics = [
  {
    label: "Signal Integrity",
    value: 99.4,
    unit: "%",
    trend: 1.8,
    color: "var(--primary)",
    sparklineData: [94, 95, 95.6, 96.8, 97.4, 98.8, 99.4],
  },
  {
    label: "Thermal Margin",
    value: 4.8,
    unit: "°C",
    trend: -0.7,
    color: "var(--warning)",
    sparklineData: [7.1, 6.6, 6.2, 5.8, 5.3, 5.1, 4.8],
  },
  {
    label: "Battery Envelope",
    value: 17.2,
    unit: "hrs",
    trend: 3.2,
    color: "var(--accent)",
    sparklineData: [13.4, 14.1, 14.8, 15.9, 16.4, 16.9, 17.2],
  },
  {
    label: "Alert Latency",
    value: 123,
    unit: "ms",
    trend: -6.4,
    color: "var(--danger)",
    sparklineData: [172, 166, 151, 149, 141, 132, 123],
  },
];

export const alertBanners: Array<{
  id: string;
  type: AlertSeverity;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
}> = [
  {
    id: "validation-gap",
    type: "warning",
    title: "Validation packet needs thermal evidence",
    description:
      "IEC 60601 enclosure test logs for ICU bedside mode are still missing from the submission packet.",
    actionLabel: "Open evidence queue",
    actionHref: "/evidence",
  },
];

export const projectRows: Array<{
  id: string;
  program: string;
  owner: string;
  state: ProjectLifecycleState;
  risk: number;
  evidence: string;
  verification: string;
  updated: string;
  region: string;
}> = [
  {
    id: "mds-014",
    program: "Atria Monitor",
    owner: "Priya Shah",
    state: "Validation",
    risk: 7,
    evidence: "84%",
    verification: "88/104",
    updated: "12 minutes ago",
    region: "US / EU",
  },
  {
    id: "mds-011",
    program: "Helix Pump",
    owner: "Jon Park",
    state: "Design",
    risk: 5,
    evidence: "61%",
    verification: "49/73",
    updated: "34 minutes ago",
    region: "US",
  },
  {
    id: "mds-020",
    program: "PulseLink Hub",
    owner: "Nadia Islam",
    state: "Submission-Ready",
    risk: 2,
    evidence: "97%",
    verification: "118/122",
    updated: "1 hour ago",
    region: "US / APAC",
  },
  {
    id: "mds-007",
    program: "Lumina Scope",
    owner: "Marco Ruiz",
    state: "Requirements",
    risk: 4,
    evidence: "38%",
    verification: "12/51",
    updated: "2 hours ago",
    region: "EU",
  },
  {
    id: "mds-025",
    program: "Vigil Pod",
    owner: "Emily Wu",
    state: "Freeze",
    risk: 6,
    evidence: "89%",
    verification: "92/101",
    updated: "Today",
    region: "US",
  },
];

export const readinessRings = [
  { label: "Trace Matrix", percentage: 92, color: "var(--primary)" },
  { label: "Verification", percentage: 84, color: "var(--accent)" },
  { label: "Evidence Pack", percentage: 68, color: "var(--warning)" },
];

export const riskPanels: Array<{
  label: string;
  score: number;
  breakdown: RiskBreakdown;
}> = [
  {
    label: "Alarm Delay",
    score: 8,
    breakdown: { low: 18, medium: 27, high: 55 },
  },
  {
    label: "Battery Thermal Drift",
    score: 6,
    breakdown: { low: 29, medium: 44, high: 27 },
  },
  {
    label: "Sensor Disconnection",
    score: 3,
    breakdown: { low: 68, medium: 22, high: 10 },
  },
];

export const activityFeed = [
  {
    id: "tl-1",
    avatar: "PS",
    actor: "Priya Shah",
    action: "approved the IEC 62304 software item hierarchy",
    timestamp: "2026-04-07T09:42:00+05:30",
    href: "/architecture",
    detail:
      "Subsystem allocation for alarm processing now links directly to the verification protocol set and residual risk table.",
  },
  {
    id: "tl-2",
    avatar: "NI",
    actor: "Nadia Islam",
    action: "attached EMC bench evidence to Atria Monitor release packet",
    timestamp: "2026-04-07T08:53:00+05:30",
    href: "/evidence",
    detail:
      "The packet now contains chamber logs, photos, and signed deviation notes for the bedside accessory harness.",
  },
  {
    id: "tl-3",
    avatar: "JP",
    actor: "Jon Park",
    action: "opened a mitigation request for occlusion alarm drift",
    timestamp: "2026-04-07T07:30:00+05:30",
    href: "/risk",
    detail:
      "Recommended action is a tighter debounce threshold with a what-if simulation against neonatal mode noise profiles.",
  },
];

export const architectureNodes = [
  {
    id: "ui",
    position: { x: 0, y: 40 },
    data: { label: "Clinical UI", subtitle: "Touch, alarms, charting" },
    type: "deviceNode",
  },
  {
    id: "logic",
    position: { x: 250, y: 10 },
    data: { label: "Safety Core", subtitle: "Rules, watchdog, fallbacks" },
    type: "deviceNode",
  },
  {
    id: "telemetry",
    position: { x: 250, y: 165 },
    data: { label: "Telemetry Bus", subtitle: "Vitals + diagnostics" },
    type: "deviceNode",
  },
  {
    id: "cloud",
    position: { x: 520, y: 40 },
    data: { label: "Clinical Cloud", subtitle: "Audit, sync, analytics" },
    type: "deviceNode",
  },
  {
    id: "qms",
    position: { x: 520, y: 190 },
    data: { label: "QMS / PLM", subtitle: "CAPA, docs, signatures" },
    type: "deviceNode",
  },
];

export const architectureEdges = [
  { id: "e-ui-logic", source: "ui", target: "logic", animated: true },
  { id: "e-ui-telemetry", source: "ui", target: "telemetry" },
  { id: "e-logic-cloud", source: "logic", target: "cloud", animated: true },
  { id: "e-telemetry-cloud", source: "telemetry", target: "cloud" },
  { id: "e-logic-qms", source: "logic", target: "qms" },
];

export const standardsPalette = [
  "IEC 62304",
  "ISO 14971",
  "IEC 60601-1",
  "FDA DHF",
  "EU MDR Annex II",
];

export const architectureProjects = [
  { id: "p-1", name: "Atria Monitor", status: "Validation" as const },
  { id: "p-2", name: "Helix Pump", status: "Design" as const },
  { id: "p-3", name: "PulseLink Hub", status: "Submission-Ready" as const },
];

export const aiStreamText =
  "Mapped 142 requirements into a safety-core architecture. Flagged three unverified alarm chains, suggested a redundant watchdog heartbeat, and recommended elevating thermal drift evidence before release freeze.";

export const commandActions = [
  {
    id: "toggle-sidebar",
    label: "Toggle sidebar",
    description: "Collapse or expand the medical workspace rail.",
    shortcut: "⌘B",
  },
  {
    id: "open-command",
    label: "Focus command palette",
    description: "Search pages, actions, and active programs.",
    shortcut: "⌘K",
  },
  {
    id: "new-risk-review",
    label: "Create risk review",
    description: "Start a new mitigation review packet for the active program.",
    shortcut: "⌘R",
  },
];

export const recentProjects = [
  { id: "atria-monitor", label: "Atria Monitor", path: "/projects", section: "Projects" },
  { id: "helix-pump", label: "Helix Pump", path: "/projects", section: "Projects" },
  { id: "lumina-scope", label: "Lumina Scope", path: "/projects", section: "Projects" },
];

