import type { ProjectLifecycleState } from "@/lib/med-types";
import type { DashboardRegion, DeviceType } from "@/lib/dashboard-data";

export interface ProjectRecord {
  id: string;
  slug: string;
  name: string;
  deviceType: DeviceType | "Custom";
  deviceClass: "I" | "II" | "III";
  regulatoryTrack: "FDA" | "MDR";
  regions: DashboardRegion[];
  phase: ProjectLifecycleState;
  ownerNames: string[];
  ownerInitials: string[];
  lastModified: string;
  updatedAt: string;
  riskScore: number;
  coverage: number;
  progress: {
    requirements: number;
    design: number;
    simulation: number;
    compliance: number;
  };
}

export interface ProjectTemplate {
  id: string;
  name: string;
  deviceType: DeviceType | "Custom";
  requirementsCount: number;
  estimatedTimeline: string;
  standards: string[];
  caption: string;
}

export interface DeviceTypeOption {
  id: string;
  label: DeviceType | "Custom";
  description: string;
  standards: string[];
}

export const projectRecords: ProjectRecord[] = [
  {
    id: "prj-atria",
    slug: "atria-vx7",
    name: "Atria VX-7 Pacemaker",
    deviceType: "Pacemaker",
    deviceClass: "III",
    regulatoryTrack: "FDA",
    regions: ["US", "EU", "IN"],
    phase: "Validation",
    ownerNames: ["Priya Shah", "Nadia Islam", "Marco Ruiz"],
    ownerInitials: ["PS", "NI", "MR"],
    lastModified: "18 min ago",
    updatedAt: "2026-04-07",
    riskScore: 8,
    coverage: 94,
    progress: { requirements: 98, design: 92, simulation: 87, compliance: 81 },
  },
  {
    id: "prj-nimbus",
    slug: "nimbus-air",
    name: "Nimbus Air Ventilator",
    deviceType: "Ventilator",
    deviceClass: "II",
    regulatoryTrack: "MDR",
    regions: ["US", "EU"],
    phase: "Design",
    ownerNames: ["Jon Park", "Emily Wu"],
    ownerInitials: ["JP", "EW"],
    lastModified: "42 min ago",
    updatedAt: "2026-04-06",
    riskScore: 6,
    coverage: 86,
    progress: { requirements: 89, design: 74, simulation: 52, compliance: 44 },
  },
  {
    id: "prj-flowguard",
    slug: "flowguard-x",
    name: "FlowGuard X Infusion Pump",
    deviceType: "Infusion Pump",
    deviceClass: "II",
    regulatoryTrack: "FDA",
    regions: ["US", "IN"],
    phase: "Freeze",
    ownerNames: ["Nadia Islam", "Arjun Mehta"],
    ownerInitials: ["NI", "AM"],
    lastModified: "1h ago",
    updatedAt: "2026-04-04",
    riskScore: 4,
    coverage: 97,
    progress: { requirements: 100, design: 96, simulation: 93, compliance: 88 },
  },
  {
    id: "prj-rhythm",
    slug: "rhythmsense-12",
    name: "RhythmSense 12 ECG Monitor",
    deviceType: "ECG Monitor",
    deviceClass: "II",
    regulatoryTrack: "MDR",
    regions: ["EU", "IN"],
    phase: "Requirements",
    ownerNames: ["Emily Wu", "Lina Das"],
    ownerInitials: ["EW", "LD"],
    lastModified: "2h ago",
    updatedAt: "2026-04-02",
    riskScore: 5,
    coverage: 74,
    progress: { requirements: 71, design: 32, simulation: 18, compliance: 14 },
  },
  {
    id: "prj-gluco",
    slug: "glucopilot",
    name: "GlucoPilot Insulin Pump",
    deviceType: "Insulin Pump",
    deviceClass: "III",
    regulatoryTrack: "FDA",
    regions: ["US", "EU"],
    phase: "Submission-Ready",
    ownerNames: ["Marco Ruiz", "Priya Shah"],
    ownerInitials: ["MR", "PS"],
    lastModified: "Today",
    updatedAt: "2026-04-01",
    riskScore: 3,
    coverage: 99,
    progress: { requirements: 100, design: 100, simulation: 97, compliance: 95 },
  },
  {
    id: "prj-vascuseal",
    slug: "vascuseal-mini",
    name: "VascuSeal Mini Surgical Tool",
    deviceType: "Surgical Tool",
    deviceClass: "I",
    regulatoryTrack: "MDR",
    regions: ["EU", "IN"],
    phase: "Draft",
    ownerNames: ["Arjun Mehta"],
    ownerInitials: ["AM"],
    lastModified: "Yesterday",
    updatedAt: "2026-03-31",
    riskScore: 2,
    coverage: 42,
    progress: { requirements: 44, design: 21, simulation: 6, compliance: 4 },
  },
];

export const projectTemplates: ProjectTemplate[] = [
  {
    id: "tpl-pacemaker",
    name: "Cardiac Rhythm Template",
    deviceType: "Pacemaker",
    requirementsCount: 184,
    estimatedTimeline: "34 weeks",
    standards: ["IEC 62304", "ISO 14971", "IEC 60601-1"],
    caption: "Implantable device baseline with hazard seeds and verification matrix.",
  },
  {
    id: "tpl-ventilator",
    name: "Critical Care Ventilator",
    deviceType: "Ventilator",
    requirementsCount: 212,
    estimatedTimeline: "28 weeks",
    standards: ["IEC 62304", "ISO 80601-2-12", "IEC 60601-1"],
    caption: "Alarm-heavy respiratory system with simulation-ready control logic.",
  },
  {
    id: "tpl-infusion",
    name: "Infusion Safety Platform",
    deviceType: "Infusion Pump",
    requirementsCount: 167,
    estimatedTimeline: "22 weeks",
    standards: ["IEC 62304", "ISO 14971", "IEC 60601-2-24"],
    caption: "Occlusion, dosage, and disposable traceability starter pack.",
  },
  {
    id: "tpl-ecg",
    name: "Connected ECG Kit",
    deviceType: "ECG Monitor",
    requirementsCount: 141,
    estimatedTimeline: "18 weeks",
    standards: ["IEC 62304", "IEC 60601-2-27", "IEC 62366"],
    caption: "Monitoring workflow template with data integrity and alert design inputs.",
  },
  {
    id: "tpl-insulin",
    name: "Closed Loop Insulin Program",
    deviceType: "Insulin Pump",
    requirementsCount: 201,
    estimatedTimeline: "30 weeks",
    standards: ["IEC 62304", "ISO 14971", "IEC 60601-1-11"],
    caption: "Home-use insulin delivery package with software safety classification.",
  },
  {
    id: "tpl-custom",
    name: "Custom Device Blank",
    deviceType: "Custom",
    requirementsCount: 64,
    estimatedTimeline: "14 weeks",
    standards: ["IEC 62304", "ISO 14971"],
    caption: "Lean starting point for novel devices and internal concept programs.",
  },
];

export const deviceTypeOptions: DeviceTypeOption[] = [
  {
    id: "Pacemaker",
    label: "Pacemaker",
    description: "Implantable rhythm management program",
    standards: ["IEC 62304", "ISO 14971", "IEC 60601-1", "IEC 62366"],
  },
  {
    id: "Ventilator",
    label: "Ventilator",
    description: "Critical care respiratory support system",
    standards: ["IEC 62304", "ISO 80601-2-12", "IEC 60601-1", "ISO 14971"],
  },
  {
    id: "Infusion Pump",
    label: "Infusion Pump",
    description: "Dose control and fluid delivery platform",
    standards: ["IEC 62304", "IEC 60601-2-24", "ISO 14971"],
  },
  {
    id: "ECG Monitor",
    label: "ECG Monitor",
    description: "Continuous waveform capture and alerting",
    standards: ["IEC 62304", "IEC 60601-2-27", "IEC 62366"],
  },
  {
    id: "Insulin Pump",
    label: "Insulin Pump",
    description: "Wearable or bedside insulin therapy device",
    standards: ["IEC 62304", "ISO 14971", "IEC 60601-1-11"],
  },
  {
    id: "Surgical Tool",
    label: "Surgical Tool",
    description: "Procedure-focused electromechanical instrument",
    standards: ["ISO 14971", "IEC 60601-1", "IEC 62366"],
  },
  {
    id: "Custom",
    label: "Custom",
    description: "Start from a blank regulated workspace",
    standards: ["IEC 62304", "ISO 14971"],
  },
];

export const projectPhaseOptions: ProjectLifecycleState[] = [
  "Draft",
  "Requirements",
  "Design",
  "Validation",
  "Freeze",
  "Submission-Ready",
  "Archived",
];

export const regionOptions: Array<{
  code: DashboardRegion;
  label: string;
  flag: string;
}> = [
  { code: "US", label: "United States", flag: "🇺🇸" },
  { code: "EU", label: "European Union", flag: "🇪🇺" },
  { code: "IN", label: "India", flag: "🇮🇳" },
];

export const teamDirectory = [
  "Priya Shah",
  "Jon Park",
  "Nadia Islam",
  "Emily Wu",
  "Marco Ruiz",
  "Arjun Mehta",
  "Lina Das",
  "Sara Cohen",
];

export const memberRoleOptions = ["Owner", "Engineer", "Reviewer", "Observer"] as const;
