"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Filter,
  Link2,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Wand2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type ZoneFilter = {
  severity: number;
  occurrence: number;
};

type FmeaRow = {
  id: string;
  itemFunction: string;
  failureMode: string;
  failureEffects: string;
  severity: number;
  causes: string;
  occurrence: number;
  currentControls: string;
  detection: number;
  recommendedActions: string;
  responsibility: string;
  targetDate: string;
  actionTaken: string;
  newSeverity: number;
  newOccurrence: number;
  newDetection: number;
};

type ClauseNode = {
  id: string;
  code: string;
  title: string;
  summary: string;
  designElements: string[];
  linkedRequirements: string[];
  evidence: string[];
  children?: ClauseNode[];
};

const panelClass =
  "rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(9,17,33,0.94),rgba(4,10,22,0.9))] shadow-[0_30px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl";

const deviceType = "Dual-Chamber Pacemaker";

const designIrSeeds = [
  "DDD pacing with adaptive AV delay and capture confirmation",
  "Li-I battery with predictive depletion telemetry",
  "Titanium hermetic can with EMI-filtered feedthrough",
  "Lead integrity monitoring using impedance trending",
  "402MHz telemetry + BLE service mode for programmer workflows",
];

const baseFmeaRows: FmeaRow[] = [
  {
    id: "lead-dislodgement",
    itemFunction: "Lead delivery pathway",
    failureMode: "Atrial lead dislodgement",
    failureEffects: "Loss of atrial sensing and capture, symptomatic bradycardia, reduced AV synchrony.",
    severity: 4,
    causes: "Insufficient fixation torque, patient motion immediately after implant, poor slack management.",
    occurrence: 3,
    currentControls: "Active fixation lead, implant fluoroscopy check, impedance trending at follow-up.",
    detection: 3,
    recommendedActions: "Add telemetry lead-integrity alert and implant checklist hard-stop for slack verification.",
    responsibility: "Systems + Clinical Eng",
    targetDate: "2026-06-24",
    actionTaken: "Lead-integrity alert added to telemetry build and implant checklist updated for slack capture.",
    newSeverity: 4,
    newOccurrence: 2,
    newDetection: 2,
  },
  {
    id: "battery-depletion",
    itemFunction: "Power source",
    failureMode: "Battery depletion earlier than service-life prediction",
    failureEffects: "Unexpected elective replacement indicator, pacing reserve reduction, urgent generator replacement.",
    severity: 5,
    causes: "Higher-than-modeled telemetry duty cycle, repeated high-output pacing, battery lot variation.",
    occurrence: 2,
    currentControls: "Battery model validation, depletion telemetry, elective replacement indicator, lot screening.",
    detection: 2,
    recommendedActions: "Tighten current-consumption budget and add end-of-service trend review to every clinic sync.",
    responsibility: "Power + Reliability",
    targetDate: "2026-07-08",
    actionTaken: "Current budget re-baselined and clinic sync dashboard updated with depletion trend slope.",
    newSeverity: 5,
    newOccurrence: 1,
    newDetection: 2,
  },
  {
    id: "emi-inhibition",
    itemFunction: "Sensing front end",
    failureMode: "EMI causes inappropriate pacing inhibition",
    failureEffects: "Missed pacing during exposure to strong electromagnetic fields and transient presyncope.",
    severity: 5,
    causes: "Insufficient common-mode rejection, feedthrough filtering saturation, external field coupling.",
    occurrence: 3,
    currentControls: "Titanium can shielding, feedthrough filter, EMC test plan, magnet mode fallback.",
    detection: 4,
    recommendedActions: "Increase conducted immunity margin and add field-exposure clinician guidance in IFU.",
    responsibility: "HW EMC",
    targetDate: "2026-06-30",
    actionTaken: "Feedthrough filter stack updated and EMC bench campaign expanded for handheld source exposures.",
    newSeverity: 5,
    newOccurrence: 2,
    newDetection: 2,
  },
  {
    id: "inappropriate-therapy",
    itemFunction: "Pacing therapy logic",
    failureMode: "Rapid ventricular tracking from inappropriate atrial sensing",
    failureEffects: "Palpitations, hemodynamic intolerance, inappropriate high-rate pacing episode.",
    severity: 5,
    causes: "Far-field sensing, myopotential oversensing, atrial blanking window mis-tuning.",
    occurrence: 2,
    currentControls: "Post-ventricular atrial blanking, refractory timing, programmer limits, clinic review.",
    detection: 4,
    recommendedActions: "Add far-field discrimination analytics and tighten maximum sensor-driven tracking limits.",
    responsibility: "Algorithms",
    targetDate: "2026-07-15",
    actionTaken: "Far-field discrimination thresholds tuned with bench replay set and programmer guardrails revised.",
    newSeverity: 5,
    newOccurrence: 1,
    newDetection: 3,
  },
  {
    id: "loss-of-capture",
    itemFunction: "Output stage",
    failureMode: "Loss of ventricular capture after threshold rise",
    failureEffects: "Failure to stimulate myocardium, prolonged pauses, pacemaker dependency risk.",
    severity: 5,
    causes: "Fibrotic tissue growth, lead maturation, output setting below capture threshold.",
    occurrence: 3,
    currentControls: "Capture management, threshold testing, output safety margin, clinician review windows.",
    detection: 3,
    recommendedActions: "Enable automatic threshold search with larger adaptive safety margin for dependency profiles.",
    responsibility: "Firmware + Clinical",
    targetDate: "2026-06-19",
    actionTaken: "Auto-threshold feature promoted to default for pacemaker-dependent patient profiles.",
    newSeverity: 5,
    newOccurrence: 2,
    newDetection: 2,
  },
  {
    id: "moisture-ingress",
    itemFunction: "Hermetic enclosure",
    failureMode: "Feedthrough seal breach and moisture ingress",
    failureEffects: "Corrosion, latent electronics failure, unpredictable therapy interruption.",
    severity: 5,
    causes: "Seal process drift, weld void, particulate contamination at assembly.",
    occurrence: 2,
    currentControls: "Helium leak test, weld inspection, particulate controls, incoming lot sample destruct test.",
    detection: 4,
    recommendedActions: "Add tighter feedthrough process capability monitoring and expanded helium leak sampling.",
    responsibility: "Manufacturing Quality",
    targetDate: "2026-08-05",
    actionTaken: "Feedthrough process capability dashboard deployed and leak sample plan doubled for launch lots.",
    newSeverity: 5,
    newOccurrence: 1,
    newDetection: 2,
  },
  {
    id: "firmware-timing",
    itemFunction: "Timing engine",
    failureMode: "AV timing scheduler defect",
    failureEffects: "Incorrect AV delay delivery, reduced cardiac output, patient intolerance during mode transitions.",
    severity: 4,
    causes: "State-machine regression, timing rollover edge case, incomplete verification around mode switching.",
    occurrence: 2,
    currentControls: "Unit tests, HIL pacing scenarios, independent code review, software SOUP restrictions.",
    detection: 4,
    recommendedActions: "Add boundary-condition regression pack and mode-switch coverage metric to release gate.",
    responsibility: "Software",
    targetDate: "2026-07-01",
    actionTaken: "Boundary timing regression pack added to HIL and release checklist now enforces mode-switch coverage.",
    newSeverity: 4,
    newOccurrence: 1,
    newDetection: 3,
  },
  {
    id: "telemetry-dropout",
    itemFunction: "Programmer telemetry",
    failureMode: "Telemetry dropout during reprogramming session",
    failureEffects: "Incomplete configuration transfer, delayed follow-up, possible repeat clinic session.",
    severity: 3,
    causes: "RF interference, patient posture attenuation, programmer timeout settings.",
    occurrence: 2,
    currentControls: "Transaction retry, session checksum, clinician confirmation screen, programmer diagnostics.",
    detection: 3,
    recommendedActions: "Add session quality score and require commit confirmation before parameter activation.",
    responsibility: "Connectivity",
    targetDate: "2026-06-27",
    actionTaken: "Session quality score added to programmer UI and parameter commit now requires checksum validation.",
    newSeverity: 3,
    newOccurrence: 1,
    newDetection: 2,
  },
];

const aiExtendedRows: FmeaRow[] = [
  ...baseFmeaRows,
  {
    id: "accelerometer-oversensing",
    itemFunction: "Rate response subsystem",
    failureMode: "Accelerometer-driven rate response oversensing",
    failureEffects: "Unnecessary rate increase during vibration exposure, patient discomfort, battery burden.",
    severity: 3,
    causes: "Aggressive activity classifier tuning, external vibration near implant pocket, poor debounce.",
    occurrence: 3,
    currentControls: "Classifier smoothing, programmable rate-response profiles, clinic review of sensor trends.",
    detection: 3,
    recommendedActions: "Add vibration rejection profile and patient-activity replay dataset to verification suite.",
    responsibility: "Algorithms",
    targetDate: "2026-07-22",
    actionTaken: "Vibration rejection profile drafted from treadmill and vehicle ride replay sessions.",
    newSeverity: 3,
    newOccurrence: 2,
    newDetection: 2,
  },
  {
    id: "reed-switch-stuck",
    itemFunction: "Magnet mode switch",
    failureMode: "Reed switch false activation or stuck state",
    failureEffects: "Unexpected asynchronous pacing mode or inability to enter programmer-safe magnet workflow.",
    severity: 4,
    causes: "Switch tolerance drift, strong ambient magnetic source, repeated shock during handling.",
    occurrence: 2,
    currentControls: "Incoming switch screening, final magnet functional test, programmer magnet-state alarm.",
    detection: 3,
    recommendedActions: "Add repeated-cycle magnet verification and switch-state debounce in firmware diagnostics.",
    responsibility: "Hardware",
    targetDate: "2026-08-12",
    actionTaken: "Repeated-cycle magnet verification added to final assembly traveler for pilot lots.",
    newSeverity: 4,
    newOccurrence: 1,
    newDetection: 2,
  },
];

const initialClauseTree: ClauseNode[] = [
  {
    id: "iec-60601-1",
    code: "IEC 60601-1",
    title: "Medical electrical equipment",
    summary: "General safety and essential performance clauses mapped to the implant generator and programmer ecosystem.",
    designElements: [],
    linkedRequirements: [],
    evidence: [],
    children: [
      {
        id: "iec-60601-1-8",
        code: "Clause 8",
        title: "Protection against electrical hazards",
        summary: "Electrical isolation, feedthrough protection, leakage current, and applied part safeguards.",
        designElements: [],
        linkedRequirements: [],
        evidence: [],
        children: [
          {
            id: "iec-60601-1-8.1",
            code: "8.1",
            title: "Basic protection",
            summary: "Foundational protection for patient-connected functions and internal isolation boundaries.",
            designElements: [],
            linkedRequirements: [],
            evidence: [],
            children: [
              {
                id: "iec-60601-1-8.1.1",
                code: "8.1.1",
                title: "Applied part isolation and separation",
                summary: "Isolation between patient-connected leads, header contacts, and internal supply domains.",
                designElements: ["Hermetic titanium can", "Ceramic feedthrough isolation stack", "Lead header creepage geometry"],
                linkedRequirements: ["REQ-HW-021", "REQ-ISO-008", "REQ-EMC-014"],
                evidence: ["DV-114 dielectric withstand", "Leak + isolation combo report"],
              },
            ],
          },
          {
            id: "iec-60601-1-8.7",
            code: "8.7",
            title: "Leakage current and insulation coordination",
            summary: "Verification of leakage behavior across the programmer charger and external service accessories.",
            designElements: [],
            linkedRequirements: [],
            evidence: [],
          },
        ],
      },
      {
        id: "iec-60601-1-14",
        code: "Clause 14",
        title: "Programmable electrical medical systems",
        summary: "Software-driven essential performance for implant plus programming chain.",
        designElements: [],
        linkedRequirements: [],
        evidence: [],
        children: [
          {
            id: "iec-60601-1-14.11",
            code: "14.11",
            title: "PEMS validation and risk control linkage",
            summary: "Trace software mitigations to hazards and verification evidence for mode transitions and therapy timing.",
            designElements: ["Timing scheduler", "Mode-switch protection", "HIL regression harness"],
            linkedRequirements: ["REQ-SW-031", "REQ-RISK-009", "REQ-VAL-017"],
            evidence: ["HIL timing regression pack", "Software risk control trace report"],
          },
          {
            id: "iec-60601-1-14.13",
            code: "14.13",
            title: "Alarm and operator messaging linkage",
            summary: "Ensure programmer-facing warnings and patient follow-up messages match residual risk expectations.",
            designElements: [],
            linkedRequirements: [],
            evidence: [],
          },
        ],
      },
    ],
  },
  {
    id: "iso-14971",
    code: "ISO 14971",
    title: "Risk management for medical devices",
    summary: "Hazard analysis, risk control, residual risk evaluation, and production feedback mapping.",
    designElements: [],
    linkedRequirements: [],
    evidence: [],
    children: [
      {
        id: "iso-14971-7",
        code: "Clause 7",
        title: "Risk control",
        summary: "Translate hazard analysis into design controls, information for safety, and residual-risk review.",
        designElements: [],
        linkedRequirements: [],
        evidence: [],
        children: [
          {
            id: "iso-14971-7.2",
            code: "7.2",
            title: "Implement and verify risk control measures",
            summary: "Pacemaker risk controls tied to lead monitoring, battery depletion management, and EMI immunity.",
            designElements: ["Lead-integrity telemetry", "Battery depletion predictor", "EMI feedthrough filter"],
            linkedRequirements: ["REQ-RISK-001", "REQ-RISK-003", "REQ-SAFE-014"],
            evidence: ["Risk control verification matrix", "Clinical review signoff"],
          },
        ],
      },
    ],
  },
  {
    id: "iec-62304",
    code: "IEC 62304",
    title: "Software lifecycle processes",
    summary: "Software safety class linkage, verification rigor, and change management for timing and telemetry code.",
    designElements: [],
    linkedRequirements: [],
    evidence: [],
    children: [
      {
        id: "iec-62304-5.7",
        code: "5.7",
        title: "Software risk control measures",
        summary: "Hazard mitigations for capture management, mode switching, and programmer update flows.",
        designElements: ["Capture management service", "Mode-switch guardrails", "Programmer checksum commit"],
        linkedRequirements: ["REQ-SW-018", "REQ-SW-029", "REQ-CFG-006"],
        evidence: ["Static analysis report", "HIL pacing replay coverage"],
      },
    ],
  },
];

const matrixDotOffsets = [
  { x: 22, y: 20 },
  { x: 52, y: 22 },
  { x: 24, y: 52 },
  { x: 52, y: 52 },
];

function clampScore(value: number) {
  if (Number.isNaN(value)) {
    return 1;
  }
  return Math.max(1, Math.min(5, Math.round(value)));
}

function calculateRpn(severity: number, occurrence: number, detection: number) {
  return severity * occurrence * detection;
}

function nominalZoneBand(severity: number, occurrence: number) {
  return severity * occurrence * 3;
}

function getBandClasses(value: number) {
  if (value > 50) {
    return "border-rose-400/30 bg-rose-500/18 text-rose-50";
  }
  if (value > 25) {
    return "border-orange-400/30 bg-orange-500/18 text-orange-50";
  }
  if (value >= 10) {
    return "border-amber-300/30 bg-amber-400/16 text-amber-50";
  }
  return "border-emerald-400/25 bg-emerald-500/16 text-emerald-50";
}

function getRpnChipClasses(value: number) {
  if (value >= 50) {
    return "border-rose-400/25 bg-rose-500/14 text-rose-100";
  }
  if (value >= 25) {
    return "border-orange-400/25 bg-orange-500/14 text-orange-100";
  }
  if (value >= 10) {
    return "border-amber-400/25 bg-amber-500/14 text-amber-100";
  }
  return "border-emerald-400/25 bg-emerald-500/14 text-emerald-100";
}

function getCellCenter(severity: number, occurrence: number) {
  return {
    x: (occurrence - 0.5) * 100,
    y: (5 - severity + 0.5) * 100,
  };
}

function getLeafNodes(nodes: ClauseNode[]): ClauseNode[] {
  return nodes.flatMap((node) =>
    node.children && node.children.length > 0 ? getLeafNodes(node.children) : [node],
  );
}

function countLeafNodes(node: ClauseNode): number {
  if (!node.children || node.children.length === 0) {
    return 1;
  }
  return node.children.reduce((total, child) => total + countLeafNodes(child), 0);
}

function countCoveredLeaves(node: ClauseNode): number {
  if (!node.children || node.children.length === 0) {
    return node.linkedRequirements.length > 0 ? 1 : 0;
  }
  return node.children.reduce((total, child) => total + countCoveredLeaves(child), 0);
}

function findClause(nodes: ClauseNode[], clauseId: string): ClauseNode | null {
  for (const node of nodes) {
    if (node.id === clauseId) {
      return node;
    }
    if (node.children) {
      const childMatch = findClause(node.children, clauseId);
      if (childMatch) {
        return childMatch;
      }
    }
  }
  return null;
}

function updateClause(nodes: ClauseNode[], clauseId: string, updater: (node: ClauseNode) => ClauseNode): ClauseNode[] {
  return nodes.map((node) => {
    if (node.id === clauseId) {
      return updater(node);
    }
    if (!node.children) {
      return node;
    }
    return {
      ...node,
      children: updateClause(node.children, clauseId, updater),
    };
  });
}

function MetricCard({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: string;
  sublabel: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
      <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{label}</div>
      <div className="mt-3 text-2xl font-semibold text-white">{value}</div>
      <div className="mt-2 text-sm text-slate-400">{sublabel}</div>
    </div>
  );
}

function ClauseTreeNode(props: {
  node: ClauseNode;
  depth: number;
  selectedId: string;
  openIds: Set<string>;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
}) {
  const { node, depth, selectedId, openIds, onSelect, onToggle } = props;
  const hasChildren = Boolean(node.children?.length);
  const isOpen = openIds.has(node.id);
  const isSelected = selectedId === node.id;
  const coveredLeaves = countCoveredLeaves(node);
  const totalLeaves = countLeafNodes(node);
  const isGapLeaf = !hasChildren && node.linkedRequirements.length === 0;

  return (
    <div className="space-y-1">
      <div
        className={cn(
          "flex items-center gap-2 rounded-2xl border px-2 py-2 transition",
          isSelected ? "border-sky-400/35 bg-sky-500/12" : "border-white/8 bg-white/4 hover:bg-white/7",
          isGapLeaf && !isSelected && "border-rose-400/20 bg-rose-500/10",
        )}
        style={{ marginLeft: depth * 14 }}
      >
        {hasChildren ? (
          <Collapsible open={isOpen} onOpenChange={() => onToggle(node.id)}>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex size-7 items-center justify-center rounded-xl border border-white/8 bg-white/6 text-slate-300 transition hover:bg-white/10"
                aria-label={isOpen ? "Collapse clause" : "Expand clause"}
              >
                <ChevronRight className={cn("size-4 transition", isOpen && "rotate-90")} />
              </button>
            </CollapsibleTrigger>
          </Collapsible>
        ) : (
          <div className="flex size-7 items-center justify-center rounded-xl border border-white/8 bg-white/4 text-slate-500">
            <Link2 className="size-3.5" />
          </div>
        )}

        <button type="button" className="min-w-0 flex-1 text-left" onClick={() => onSelect(node.id)}>
          <div className="flex items-center gap-2">
            <span className={cn("text-sm font-medium", isGapLeaf ? "text-rose-100" : "text-white")}>{node.code}</span>
            <Badge
              variant="outline"
              className={cn(
                "border-white/10 bg-white/6 text-slate-300",
                coveredLeaves === totalLeaves && "border-emerald-400/20 bg-emerald-500/12 text-emerald-100",
                coveredLeaves === 0 && "border-rose-400/20 bg-rose-500/12 text-rose-100",
              )}
            >
              {coveredLeaves}/{totalLeaves}
            </Badge>
          </div>
          <div className="mt-1 truncate text-sm text-slate-400">{node.title}</div>
        </button>
      </div>

      {hasChildren ? (
        <Collapsible open={isOpen} onOpenChange={() => onToggle(node.id)}>
          <CollapsibleContent className="space-y-1">
            {node.children?.map((child) => (
              <ClauseTreeNode
                key={child.id}
                node={child}
                depth={depth + 1}
                selectedId={selectedId}
                openIds={openIds}
                onSelect={onSelect}
                onToggle={onToggle}
              />
            ))}
          </CollapsibleContent>
        </Collapsible>
      ) : null}
    </div>
  );
}

export function ComplianceHub() {
  const [activeTab, setActiveTab] = React.useState("heatmap");
  const [rows, setRows] = React.useState(baseFmeaRows);
  const [zoneFilter, setZoneFilter] = React.useState<ZoneFilter | null>(null);
  const [clauses, setClauses] = React.useState(initialClauseTree);
  const [selectedClauseId, setSelectedClauseId] = React.useState("iec-60601-1-8.1.1");
  const [openClauseIds, setOpenClauseIds] = React.useState(
    () => new Set(["iec-60601-1", "iec-60601-1-8", "iec-60601-1-8.1", "iso-14971", "iec-62304"]),
  );
  const [aiMessage, setAiMessage] = React.useState<string | null>(null);

  const rowNumberMap = React.useMemo(
    () => new Map(rows.map((row, index) => [row.id, index + 1])),
    [rows],
  );

  const totalCurrentRpn = React.useMemo(
    () => rows.reduce((total, row) => total + calculateRpn(row.severity, row.occurrence, row.detection), 0),
    [rows],
  );
  const totalResidualRpn = React.useMemo(
    () =>
      rows.reduce(
        (total, row) => total + calculateRpn(row.newSeverity, row.newOccurrence, row.newDetection),
        0,
      ),
    [rows],
  );
  const criticalRows = React.useMemo(
    () => rows.filter((row) => calculateRpn(row.severity, row.occurrence, row.detection) >= 40).length,
    [rows],
  );
  const highestRpn = React.useMemo(
    () => Math.max(...rows.map((row) => calculateRpn(row.severity, row.occurrence, row.detection))),
    [rows],
  );
  const averageResidualImprovement = React.useMemo(() => {
    const improvement = rows.reduce(
      (total, row) =>
        total +
        (calculateRpn(row.severity, row.occurrence, row.detection) -
          calculateRpn(row.newSeverity, row.newOccurrence, row.newDetection)),
      0,
    );
    return Math.round(improvement / rows.length);
  }, [rows]);

  const filteredRows = React.useMemo(() => {
    if (!zoneFilter) {
      return rows;
    }
    return rows.filter(
      (row) => row.severity === zoneFilter.severity && row.occurrence === zoneFilter.occurrence,
    );
  }, [rows, zoneFilter]);

  const previewRows = React.useMemo(() => {
    if (zoneFilter) {
      return filteredRows;
    }
    return [...rows]
      .sort(
        (left, right) =>
          calculateRpn(right.severity, right.occurrence, right.detection) -
          calculateRpn(left.severity, left.occurrence, left.detection),
      )
      .slice(0, 5);
  }, [filteredRows, rows, zoneFilter]);

  const leafClauses = React.useMemo(() => getLeafNodes(clauses), [clauses]);
  const coveredClauseCount = React.useMemo(
    () => leafClauses.filter((clause) => clause.linkedRequirements.length > 0).length,
    [leafClauses],
  );
  const selectedClause = React.useMemo(() => findClause(clauses, selectedClauseId), [clauses, selectedClauseId]);

  function updateNumericField(
    rowId: string,
    field: keyof Pick<
      FmeaRow,
      "severity" | "occurrence" | "detection" | "newSeverity" | "newOccurrence" | "newDetection"
    >,
    value: string,
  ) {
    const parsed = clampScore(Number(value));
    setRows((current) =>
      current.map((row) =>
        row.id === rowId
          ? {
              ...row,
              [field]: parsed,
            }
          : row,
      ),
    );
  }

  function handleGenerateWithAi() {
    setRows(aiExtendedRows);
    setAiMessage(`AI generated ${aiExtendedRows.length} pacemaker hazard rows from ${deviceType} design inputs.`);
  }

  function handleAddRequirement() {
    if (!selectedClause) {
      return;
    }
    const requirementCode = `REQ-COMP-${String(coveredClauseCount + 1).padStart(3, "0")}`;
    setClauses((current) =>
      updateClause(current, selectedClause.id, (clause) => ({
        ...clause,
        linkedRequirements: clause.linkedRequirements.length > 0 ? clause.linkedRequirements : [requirementCode],
        designElements:
          clause.designElements.length > 0 ? clause.designElements : ["Derived compliance control package"],
        evidence:
          clause.evidence.length > 0 ? clause.evidence : ["Open action created for standards linkage review"],
      })),
    );
  }

  function toggleOpenClause(clauseId: string) {
    setOpenClauseIds((current) => {
      const next = new Set(current);
      if (next.has(clauseId)) {
        next.delete(clauseId);
      } else {
        next.add(clauseId);
      }
      return next;
    });
  }

  return (
    <div className="-m-4 min-h-[calc(100svh-6rem)] overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.12),transparent_32%),linear-gradient(180deg,#07111f_0%,#020817_100%)] p-4 sm:-m-6 sm:p-6">
      <div className="space-y-5">
        <section className={cn(panelClass, "overflow-hidden px-6 py-6")}>
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border border-sky-400/20 bg-sky-500/12 text-sky-100">
                  <ShieldCheck className="mr-1 size-3" />
                  Risk Management Hub
                </Badge>
                <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-300">
                  {deviceType}
                </Badge>
                <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-300">
                  ISO 14971 + IEC 60601-1 + IEC 62304
                </Badge>
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Visual risk management, FMEA, and standards linkage in one workspace.
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                Live pacemaker hazard scoring updates the heat map and FMEA instantly, while clause coverage tracks where design controls still need explicit requirement links.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[430px] xl:grid-cols-2">
              <MetricCard label="Open Hazards" value={String(rows.length)} sublabel="Current FMEA entries in active review." />
              <MetricCard label="Critical RPN" value={String(criticalRows)} sublabel={`Highest current RPN is ${highestRpn}.`} />
              <MetricCard label="Residual Delta" value={`-${averageResidualImprovement}`} sublabel="Average RPN reduction after planned controls." />
              <MetricCard
                label="Clause Coverage"
                value={`${coveredClauseCount}/${leafClauses.length}`}
                sublabel="Leaf clauses with at least one linked requirement."
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {designIrSeeds.map((seed) => (
              <div
                key={seed}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300"
              >
                {seed}
              </div>
            ))}
          </div>
        </section>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
          <div className={cn(panelClass, "px-4 py-4")}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <TabsList variant="line" className="rounded-full border border-white/10 bg-white/5 p-1">
                <TabsTrigger value="heatmap" className="rounded-full px-4 py-2 text-slate-300 data-[state=active]:bg-white/10 data-[state=active]:text-white">
                  Risk Heat Map
                </TabsTrigger>
                <TabsTrigger value="fmea" className="rounded-full px-4 py-2 text-slate-300 data-[state=active]:bg-white/10 data-[state=active]:text-white">
                  FMEA Table
                </TabsTrigger>
                <TabsTrigger value="clauses" className="rounded-full px-4 py-2 text-slate-300 data-[state=active]:bg-white/10 data-[state=active]:text-white">
                  Standard Clause Linker
                </TabsTrigger>
              </TabsList>

              <div className="flex flex-wrap items-center gap-2">
                {zoneFilter ? (
                  <Badge className="border border-cyan-400/20 bg-cyan-500/10 text-cyan-100">
                    <Filter className="mr-1 size-3" />
                    S{zoneFilter.severity} / O{zoneFilter.occurrence} filter active
                  </Badge>
                ) : null}
                <Button
                  type="button"
                  variant="secondary"
                  className="rounded-full border border-white/10 bg-white/6 text-white hover:bg-white/12"
                  onClick={handleGenerateWithAi}
                >
                  <Wand2 className="size-4 text-amber-200" />
                  Generate with AI
                </Button>
              </div>
            </div>

            <AnimatePresence>
              {aiMessage ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mt-4 flex items-start gap-3 rounded-[22px] border border-sky-400/20 bg-sky-500/10 px-4 py-3 text-sm text-sky-100"
                >
                  <BrainCircuit className="mt-0.5 size-4 shrink-0 text-sky-200" />
                  <div className="flex-1">{aiMessage}</div>
                  <button
                    type="button"
                    className="text-xs uppercase tracking-[0.18em] text-sky-200/80 transition hover:text-sky-100"
                    onClick={() => setAiMessage(null)}
                  >
                    Dismiss
                  </button>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <TabsContent value="heatmap" className="mt-0">
            <div className="space-y-5">
              <section className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_380px]">
                <div className={cn(panelClass, "overflow-hidden px-5 py-5")}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-sm font-semibold text-white">5 x 5 Risk Matrix</div>
                      <div className="mt-1 text-sm text-slate-400">
                        Click any zone to filter the linked hazards. Numbered dots mark current risk items, and arrows show residual-risk movement after controls.
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {zoneFilter ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="rounded-full text-slate-300 hover:bg-white/10 hover:text-white"
                          onClick={() => setZoneFilter(null)}
                        >
                          Clear Filter
                        </Button>
                      ) : null}
                      <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">
                        Banding uses nominal RPN zones
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 lg:grid-cols-[72px_minmax(0,1fr)]">
                    <div className="hidden flex-col items-center justify-center text-[11px] uppercase tracking-[0.24em] text-slate-500 lg:flex">
                      <span className="-rotate-90">Severity</span>
                    </div>

                    <div className="space-y-3">
                      <div className="grid grid-cols-[repeat(5,minmax(0,1fr))] gap-2 pl-0 text-center text-[11px] uppercase tracking-[0.24em] text-slate-500 sm:pl-3">
                        {Array.from({ length: 5 }, (_, index) => index + 1).map((occurrence) => (
                          <div key={occurrence}>O{occurrence}</div>
                        ))}
                      </div>

                      <div className="grid gap-3 sm:grid-cols-[56px_minmax(0,1fr)]">
                        <div className="grid grid-rows-5 gap-2 text-center text-[11px] uppercase tracking-[0.24em] text-slate-500">
                          {[5, 4, 3, 2, 1].map((severity) => (
                            <div key={severity} className="flex items-center justify-center rounded-2xl border border-white/8 bg-white/4">
                              S{severity}
                            </div>
                          ))}
                        </div>

                        <div className="relative aspect-square">
                          <div className="grid h-full grid-cols-5 grid-rows-5 gap-2">
                            {[5, 4, 3, 2, 1].flatMap((severity) =>
                              [1, 2, 3, 4, 5].map((occurrence) => {
                                const currentZoneRows = rows.filter(
                                  (row) => row.severity === severity && row.occurrence === occurrence,
                                );
                                const residualZoneRows = rows.filter(
                                  (row) => row.newSeverity === severity && row.newOccurrence === occurrence,
                                );
                                const band = nominalZoneBand(severity, occurrence);
                                const isSelected =
                                  zoneFilter?.severity === severity && zoneFilter.occurrence === occurrence;

                                return (
                                  <HoverCard key={`${severity}-${occurrence}`} openDelay={120}>
                                    <HoverCardTrigger asChild>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setZoneFilter((current) =>
                                            current?.severity === severity && current.occurrence === occurrence
                                              ? null
                                              : { severity, occurrence },
                                          )
                                        }
                                        className={cn(
                                          "relative overflow-hidden rounded-[22px] border p-3 text-left transition",
                                          getBandClasses(band),
                                          isSelected && "ring-2 ring-sky-300/70 ring-offset-2 ring-offset-[#07111f]",
                                        )}
                                      >
                                        <div className="flex items-start justify-between">
                                          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-80">
                                            {band}
                                          </div>
                                          <div className="text-[10px] text-white/70">
                                            {currentZoneRows.length + residualZoneRows.length} items
                                          </div>
                                        </div>
                                        <div className="mt-4 text-xs text-white/85">
                                          {currentZoneRows.length > 0 ? `${currentZoneRows.length} current` : "No current"}
                                        </div>
                                        <div className="mt-1 text-[11px] text-white/60">
                                          {residualZoneRows.length > 0 ? `${residualZoneRows.length} residual` : "Residual clear"}
                                        </div>

                                        {currentZoneRows.slice(0, 4).map((row, index) => {
                                          const offset = matrixDotOffsets[index] ?? matrixDotOffsets[matrixDotOffsets.length - 1];
                                          return (
                                            <div
                                              key={row.id}
                                              className="absolute flex size-6 items-center justify-center rounded-full border border-slate-950/30 bg-slate-950/70 text-[11px] font-semibold text-white shadow-[0_10px_18px_rgba(0,0,0,0.22)]"
                                              style={{ left: `${offset.x}%`, top: `${offset.y}%` }}
                                            >
                                              {rowNumberMap.get(row.id)}
                                            </div>
                                          );
                                        })}

                                        {currentZoneRows.length > 4 ? (
                                          <div className="absolute bottom-3 right-3 rounded-full bg-slate-950/70 px-2 py-1 text-[10px] font-semibold text-white">
                                            +{currentZoneRows.length - 4}
                                          </div>
                                        ) : null}
                                      </button>
                                    </HoverCardTrigger>

                                    <HoverCardContent className="w-80 border border-white/10 bg-slate-950/96 p-0 text-white">
                                      <div className="border-b border-white/8 px-4 py-3">
                                        <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                                          Zone S{severity} / O{occurrence}
                                        </div>
                                        <div className="mt-1 text-sm font-semibold text-white">
                                          {currentZoneRows.length + residualZoneRows.length} hazards mapped here
                                        </div>
                                      </div>
                                      <div className="space-y-3 px-4 py-4 text-sm">
                                        <div>
                                          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Current risk items</div>
                                          <div className="mt-2 space-y-2">
                                            {currentZoneRows.length > 0 ? (
                                              currentZoneRows.map((row) => (
                                                <div key={row.id} className="rounded-2xl border border-white/8 bg-white/5 px-3 py-2">
                                                  <div className="font-medium text-slate-100">
                                                    #{rowNumberMap.get(row.id)} {row.failureMode}
                                                  </div>
                                                  <div className="mt-1 text-xs text-slate-400">{row.failureEffects}</div>
                                                </div>
                                              ))
                                            ) : (
                                              <div className="rounded-2xl border border-white/8 bg-white/5 px-3 py-2 text-slate-400">
                                                No current hazards in this zone.
                                              </div>
                                            )}
                                          </div>
                                        </div>

                                        <div>
                                          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Residual positions</div>
                                          <div className="mt-2 space-y-2">
                                            {residualZoneRows.length > 0 ? (
                                              residualZoneRows.map((row) => (
                                                <div key={row.id} className="rounded-2xl border border-emerald-400/12 bg-emerald-500/8 px-3 py-2">
                                                  <div className="font-medium text-emerald-50">
                                                    #{rowNumberMap.get(row.id)} {row.failureMode}
                                                  </div>
                                                  <div className="mt-1 text-xs text-emerald-100/70">
                                                    Residual RPN {calculateRpn(row.newSeverity, row.newOccurrence, row.newDetection)}
                                                  </div>
                                                </div>
                                              ))
                                            ) : (
                                              <div className="rounded-2xl border border-white/8 bg-white/5 px-3 py-2 text-slate-400">
                                                No residual end-points land here.
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </HoverCardContent>
                                  </HoverCard>
                                );
                              }),
                            )}
                          </div>

                          <svg viewBox="0 0 500 500" className="pointer-events-none absolute inset-0 h-full w-full">
                            <defs>
                              <marker id="risk-arrowhead" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
                                <path d="M 0 0 L 10 5 L 0 10 z" fill="#7dd3fc" />
                              </marker>
                            </defs>
                            {rows.map((row, index) => {
                              const start = getCellCenter(row.severity, row.occurrence);
                              const end = getCellCenter(row.newSeverity, row.newOccurrence);
                              const offset = matrixDotOffsets[index % matrixDotOffsets.length];
                              const offsetX = ((offset.x - 37) / 100) * 28;
                              const offsetY = ((offset.y - 37) / 100) * 28;
                              const startX = start.x + offsetX;
                              const startY = start.y + offsetY;
                              const endX = end.x + offsetX * 0.35;
                              const endY = end.y + offsetY * 0.35;
                              const controlY = Math.min(startY, endY) - 18 - Math.abs(endX - startX) * 0.04;
                              const isVisible =
                                !zoneFilter ||
                                (row.severity === zoneFilter.severity && row.occurrence === zoneFilter.occurrence);

                              if (startX === endX && startY === endY) {
                                return (
                                  <circle
                                    key={row.id}
                                    cx={end.x}
                                    cy={end.y}
                                    r={7}
                                    fill="#34d399"
                                    opacity={isVisible ? 0.7 : 0.18}
                                  />
                                );
                              }

                              return (
                                <g key={row.id} opacity={isVisible ? 0.78 : 0.14}>
                                  <path
                                    d={`M ${startX} ${startY} Q ${(startX + endX) / 2} ${controlY} ${endX} ${endY}`}
                                    fill="none"
                                    stroke="#7dd3fc"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    markerEnd="url(#risk-arrowhead)"
                                  />
                                  <circle cx={endX} cy={endY} r="6.5" fill="#34d399" stroke="#07111f" strokeWidth="2" />
                                </g>
                              );
                            })}
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <aside className={cn(panelClass, "space-y-4 px-5 py-5")}>
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {zoneFilter ? `Selected Zone S${zoneFilter.severity} / O${zoneFilter.occurrence}` : "Risk Matrix Guide"}
                    </div>
                    <div className="mt-1 text-sm leading-6 text-slate-400">
                      {zoneFilter
                        ? "Current-zone filtering is active across this tab and the FMEA table."
                        : "Hover a zone for hazard details, or click it to isolate the corresponding FMEA entries."}
                    </div>
                  </div>

                  <div className="grid gap-3">
                    {[
                      { label: "Green", detail: "Nominal zone band under 10", classes: getBandClasses(6) },
                      { label: "Yellow", detail: "Nominal zone band from 10 to 25", classes: getBandClasses(15) },
                      { label: "Amber", detail: "Nominal zone band from 26 to 50", classes: getBandClasses(36) },
                      { label: "Red", detail: "Nominal zone band above 50", classes: getBandClasses(60) },
                    ].map((legend) => (
                      <div key={legend.label} className={cn("rounded-[22px] border px-4 py-3", legend.classes)}>
                        <div className="text-sm font-semibold">{legend.label}</div>
                        <div className="mt-1 text-xs text-white/75">{legend.detail}</div>
                      </div>
                    ))}
                  </div>
                </aside>
              </section>

              <section className={cn(panelClass, "overflow-hidden")}>
                <div className="flex flex-col gap-3 border-b border-white/8 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-white">Filtered FMEA View</div>
                    <div className="mt-1 text-sm text-slate-400">
                      {zoneFilter
                        ? `Showing hazards currently scored at severity ${zoneFilter.severity} and occurrence ${zoneFilter.occurrence}.`
                        : "Showing the highest-current-RPN hazards across the pacemaker risk file."}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    className="rounded-full border border-white/10 bg-white/6 text-white hover:bg-white/12"
                    onClick={() => setActiveTab("fmea")}
                  >
                    Open Full FMEA
                  </Button>
                </div>

                <ScrollArea className="h-[360px]">
                  <Table className="min-w-[920px]">
                    <TableHeader>
                      <TableRow className="border-white/8">
                        <TableHead className="text-slate-400">Item / Function</TableHead>
                        <TableHead className="text-slate-400">Failure Mode</TableHead>
                        <TableHead className="text-slate-400">Current RPN</TableHead>
                        <TableHead className="text-slate-400">Residual RPN</TableHead>
                        <TableHead className="text-slate-400">Recommended Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewRows.map((row) => (
                        <TableRow key={row.id} className="border-white/8">
                          <TableCell className="whitespace-normal text-slate-200">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-200">
                                #{rowNumberMap.get(row.id)}
                              </Badge>
                              <span>{row.itemFunction}</span>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[280px] whitespace-normal text-slate-200">{row.failureMode}</TableCell>
                          <TableCell>
                            <Badge className={cn("border", getRpnChipClasses(calculateRpn(row.severity, row.occurrence, row.detection)))}>
                              {calculateRpn(row.severity, row.occurrence, row.detection)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn("border", getRpnChipClasses(calculateRpn(row.newSeverity, row.newOccurrence, row.newDetection)))}>
                              {calculateRpn(row.newSeverity, row.newOccurrence, row.newDetection)}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[360px] whitespace-normal text-slate-300">
                            {row.recommendedActions}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </section>
            </div>
          </TabsContent>

          <TabsContent value="fmea" className="mt-0">
            <section className={cn(panelClass, "overflow-hidden")}>
              <div className="flex flex-col gap-4 border-b border-white/8 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">Failure Modes and Effects Analysis</div>
                  <div className="mt-1 text-sm text-slate-400">
                    Numeric severity, occurrence, and detection fields are editable inline. RPN values update immediately and feed the heat map.
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-300">
                    Current total RPN {totalCurrentRpn}
                  </Badge>
                  <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-300">
                    Residual total RPN {totalResidualRpn}
                  </Badge>
                  {zoneFilter ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="rounded-full text-slate-300 hover:bg-white/10 hover:text-white"
                      onClick={() => setZoneFilter(null)}
                    >
                      Clear S{zoneFilter.severity}/O{zoneFilter.occurrence}
                    </Button>
                  ) : null}
                </div>
              </div>

              <ScrollArea className="h-[calc(100svh-19rem)]">
                <Table className="min-w-[2400px]">
                  <TableHeader>
                    <TableRow className="border-white/8">
                      {[
                        "Item / Function",
                        "Failure Mode",
                        "Failure Effects",
                        "Severity (1-5)",
                        "Causes",
                        "Occurrence (1-5)",
                        "Current Controls",
                        "Detection (1-5)",
                        "RPN",
                        "Recommended Actions",
                        "Responsibility",
                        "Target Date",
                        "Action Taken",
                        "New Severity",
                        "New Occurrence",
                        "New Detection",
                        "New RPN",
                      ].map((heading) => (
                        <TableHead key={heading} className="text-slate-400">
                          {heading}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRows.map((row) => {
                      const currentRpn = calculateRpn(row.severity, row.occurrence, row.detection);
                      const newRpn = calculateRpn(row.newSeverity, row.newOccurrence, row.newDetection);

                      return (
                        <TableRow key={row.id} className="border-white/8 align-top">
                          <TableCell className="min-w-[200px] whitespace-normal text-slate-100">
                            <div className="space-y-2">
                              <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-200">
                                Hazard #{rowNumberMap.get(row.id)}
                              </Badge>
                              <div>{row.itemFunction}</div>
                            </div>
                          </TableCell>
                          <TableCell className="min-w-[240px] whitespace-normal text-slate-200">{row.failureMode}</TableCell>
                          <TableCell className="min-w-[280px] whitespace-normal text-slate-300">{row.failureEffects}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={1}
                              max={5}
                              value={row.severity}
                              onChange={(event) => updateNumericField(row.id, "severity", event.target.value)}
                              className="h-10 w-20 border-white/10 bg-white/5 text-white"
                            />
                          </TableCell>
                          <TableCell className="min-w-[260px] whitespace-normal text-slate-300">{row.causes}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={1}
                              max={5}
                              value={row.occurrence}
                              onChange={(event) => updateNumericField(row.id, "occurrence", event.target.value)}
                              className="h-10 w-20 border-white/10 bg-white/5 text-white"
                            />
                          </TableCell>
                          <TableCell className="min-w-[280px] whitespace-normal text-slate-300">{row.currentControls}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={1}
                              max={5}
                              value={row.detection}
                              onChange={(event) => updateNumericField(row.id, "detection", event.target.value)}
                              className="h-10 w-20 border-white/10 bg-white/5 text-white"
                            />
                          </TableCell>
                          <TableCell>
                            <Badge className={cn("border", getRpnChipClasses(currentRpn))}>{currentRpn}</Badge>
                          </TableCell>
                          <TableCell className="min-w-[320px] whitespace-normal text-slate-300">{row.recommendedActions}</TableCell>
                          <TableCell className="whitespace-normal text-slate-200">{row.responsibility}</TableCell>
                          <TableCell className="whitespace-normal text-slate-300">{row.targetDate}</TableCell>
                          <TableCell className="min-w-[320px] whitespace-normal text-slate-300">{row.actionTaken}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={1}
                              max={5}
                              value={row.newSeverity}
                              onChange={(event) => updateNumericField(row.id, "newSeverity", event.target.value)}
                              className="h-10 w-20 border-white/10 bg-white/5 text-white"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={1}
                              max={5}
                              value={row.newOccurrence}
                              onChange={(event) => updateNumericField(row.id, "newOccurrence", event.target.value)}
                              className="h-10 w-20 border-white/10 bg-white/5 text-white"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={1}
                              max={5}
                              value={row.newDetection}
                              onChange={(event) => updateNumericField(row.id, "newDetection", event.target.value)}
                              className="h-10 w-20 border-white/10 bg-white/5 text-white"
                            />
                          </TableCell>
                          <TableCell>
                            <Badge className={cn("border", getRpnChipClasses(newRpn))}>{newRpn}</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </section>
          </TabsContent>

          <TabsContent value="clauses" className="mt-0">
            <section className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
              <div className={cn(panelClass, "overflow-hidden")}>
                <div className="border-b border-white/8 px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-white">Standard Clause Browser</div>
                      <div className="mt-1 text-sm text-slate-400">
                        Expand standards and clauses to inspect coverage and gap status.
                      </div>
                    </div>
                    <Badge className="border border-white/10 bg-white/5 text-slate-200">
                      {coveredClauseCount}/{leafClauses.length} covered
                    </Badge>
                  </div>
                </div>
                <ScrollArea className="h-[calc(100svh-18rem)] px-4 py-4">
                  <div className="space-y-2">
                    {clauses.map((node) => (
                      <ClauseTreeNode
                        key={node.id}
                        node={node}
                        depth={0}
                        selectedId={selectedClauseId}
                        openIds={openClauseIds}
                        onSelect={setSelectedClauseId}
                        onToggle={toggleOpenClause}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <div className={cn(panelClass, "overflow-hidden")}>
                <div className="border-b border-white/8 px-5 py-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="text-sm font-semibold text-white">
                        {selectedClause ? `${selectedClause.code} - ${selectedClause.title}` : "Clause detail"}
                      </div>
                      <div className="mt-1 text-sm text-slate-400">
                        {selectedClause?.summary ?? "Select a clause from the browser to inspect linked controls."}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        className={cn(
                          "border",
                          selectedClause?.linkedRequirements.length
                            ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
                            : "border-rose-400/20 bg-rose-500/10 text-rose-100",
                        )}
                      >
                        {selectedClause?.linkedRequirements.length ? (
                          <>
                            <CheckCircle2 className="mr-1 size-3" />
                            Covered
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="mr-1 size-3" />
                            Gap
                          </>
                        )}
                      </Badge>
                      {!selectedClause?.linkedRequirements.length ? (
                        <Button
                          type="button"
                          variant="secondary"
                          className="rounded-full border border-white/10 bg-white/6 text-white hover:bg-white/12"
                          onClick={handleAddRequirement}
                        >
                          <Plus className="size-4 text-emerald-200" />
                          Add Requirement
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 px-5 py-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="space-y-4">
                    <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Linked design elements</div>
                      <div className="mt-3 space-y-2">
                        {selectedClause?.designElements.length ? (
                          selectedClause.designElements.map((element) => (
                            <div key={element} className="rounded-2xl border border-white/8 bg-slate-950/50 px-3 py-3 text-sm text-slate-200">
                              {element}
                            </div>
                          ))
                        ) : (
                          <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-3 py-3 text-sm text-rose-100">
                            No linked design elements yet. Add a requirement package to close the standards gap.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Linked requirements</div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedClause?.linkedRequirements.length ? (
                          selectedClause.linkedRequirements.map((requirement) => (
                            <Badge
                              key={requirement}
                              variant="outline"
                              className="border-sky-400/20 bg-sky-500/10 text-sky-100"
                            >
                              {requirement}
                            </Badge>
                          ))
                        ) : (
                          <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-3 py-3 text-sm text-rose-100">
                            This clause is currently a gap. No requirement has been linked.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Evidence and verification hooks</div>
                      <div className="mt-3 space-y-2">
                        {selectedClause?.evidence.length ? (
                          selectedClause.evidence.map((item) => (
                            <div key={item} className="rounded-2xl border border-white/8 bg-slate-950/50 px-3 py-3 text-sm text-slate-200">
                              {item}
                            </div>
                          ))
                        ) : (
                          <div className="rounded-2xl border border-white/8 bg-slate-950/50 px-3 py-3 text-sm text-slate-400">
                            No evidence linked yet.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <aside className="space-y-4">
                    <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Coverage indicator</div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="text-3xl font-semibold text-white">
                          {coveredClauseCount}/{leafClauses.length}
                        </div>
                        <Badge className="border border-white/10 bg-white/5 text-slate-200">
                          {Math.round((coveredClauseCount / leafClauses.length) * 100)}%
                        </Badge>
                      </div>
                      <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/8">
                        <div
                          className="h-full rounded-full bg-[linear-gradient(90deg,#38bdf8,#34d399)]"
                          style={{ width: `${(coveredClauseCount / leafClauses.length) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Gap clauses</div>
                      <div className="mt-3 space-y-2">
                        {leafClauses.filter((clause) => clause.linkedRequirements.length === 0).map((clause) => (
                          <button
                            key={clause.id}
                            type="button"
                            onClick={() => setSelectedClauseId(clause.id)}
                            className="w-full rounded-2xl border border-rose-400/20 bg-rose-500/10 px-3 py-3 text-left transition hover:bg-rose-500/16"
                          >
                            <div className="flex items-center gap-2 text-sm font-medium text-rose-100">
                              <ShieldAlert className="size-4" />
                              {clause.code}
                            </div>
                            <div className="mt-1 text-sm text-rose-100/75">{clause.title}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </aside>
                </div>
              </div>
            </section>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
