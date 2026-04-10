"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Circle,
  FileDown,
  Filter,
  GitBranch,
  Link2,
  Radar,
  ShieldAlert,
  TestTube2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type RequirementType = "FR" | "NFR" | "REG";
type VerificationStatus = "verified" | "in-progress" | "not-started";

type Requirement = {
  id: string;
  title: string;
  type: RequirementType;
  verification: VerificationStatus;
  owner: string;
  rationale: string;
};

type DesignElement = {
  id: string;
  title: string;
  domain: string;
  maturity: "released" | "prototype" | "planned";
};

type TraceLink = {
  requirementId: string;
  designElementId: string;
  status: VerificationStatus;
  why: string;
  testCases: string[];
};

const panelClass =
  "rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(9,17,33,0.94),rgba(4,10,22,0.9))] shadow-[0_30px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl";

const requirements: Requirement[] = [
  {
    id: "REQ-001",
    title: "Maintain ventricular pacing above programmed lower rate limit during complete AV block.",
    type: "FR",
    verification: "verified",
    owner: "Systems",
    rationale: "Therapy continuity for pacemaker-dependent patients.",
  },
  {
    id: "REQ-002",
    title: "Detect lead impedance excursions and raise service telemetry within one interrogation cycle.",
    type: "FR",
    verification: "in-progress",
    owner: "Firmware",
    rationale: "Early detection of lead fracture or dislodgement.",
  },
  {
    id: "REQ-003",
    title: "Maintain EMC immunity in MedRadio and handheld RF exposure environments.",
    type: "REG",
    verification: "in-progress",
    owner: "HW EMC",
    rationale: "Reduces inappropriate inhibition and supports regulatory compliance.",
  },
  {
    id: "REQ-004",
    title: "Provide programmer audit logs for every parameter change and clinician confirmation.",
    type: "NFR",
    verification: "verified",
    owner: "Connectivity",
    rationale: "Traceable configuration governance for clinical workflows.",
  },
  {
    id: "REQ-005",
    title: "Hold a 2.5x safety margin above measured ventricular capture threshold in dependency mode.",
    type: "FR",
    verification: "verified",
    owner: "Algorithms",
    rationale: "Mitigates loss of capture when thresholds drift upward post-implant.",
  },
  {
    id: "REQ-006",
    title: "Support end-of-service evidence pack generation for 510(k) and CE submissions.",
    type: "REG",
    verification: "not-started",
    owner: "Regulatory",
    rationale: "Submission readiness requires linked artifacts and controlled outputs.",
  },
  {
    id: "REQ-007",
    title: "Prevent BLE service mode from affecting therapy timing while a patient session is active.",
    type: "NFR",
    verification: "in-progress",
    owner: "Software",
    rationale: "Service connectivity must remain isolated from pacing logic.",
  },
];

const designElements: DesignElement[] = [
  { id: "DE-001", title: "Timing Engine Scheduler", domain: "Therapy core", maturity: "released" },
  { id: "DE-002", title: "Lead Integrity Monitor", domain: "Sensing", maturity: "prototype" },
  { id: "DE-003", title: "EMC Feedthrough Filter Stack", domain: "Hardware", maturity: "prototype" },
  { id: "DE-004", title: "Programmer Audit Ledger", domain: "Connectivity", maturity: "released" },
  { id: "DE-005", title: "Adaptive Capture Manager", domain: "Algorithms", maturity: "released" },
  { id: "DE-006", title: "Service Mode Isolation Gateway", domain: "Software", maturity: "planned" },
  { id: "DE-007", title: "Submission Artifact Composer", domain: "Regulatory tooling", maturity: "planned" },
];

const traceLinks: TraceLink[] = [
  {
    requirementId: "REQ-001",
    designElementId: "DE-001",
    status: "verified",
    why: "Escape interval logic and AV timers guarantee ventricular support pacing in DDD/VVI modes.",
    testCases: ["TC-PACE-014", "TC-HIL-027", "TC-SYS-002"],
  },
  {
    requirementId: "REQ-002",
    designElementId: "DE-002",
    status: "in-progress",
    why: "Impedance trend engine compares lead vectors against implant baselines and telemetry thresholds.",
    testCases: ["TC-LEAD-003", "TC-HIL-041"],
  },
  {
    requirementId: "REQ-003",
    designElementId: "DE-003",
    status: "in-progress",
    why: "Feedthrough capacitor stack and shield routing raise conducted and radiated immunity margin.",
    testCases: ["TC-EMC-009", "TC-EMC-022"],
  },
  {
    requirementId: "REQ-004",
    designElementId: "DE-004",
    status: "verified",
    why: "Audit ledger stores parameter revisions, operator identity, and commit checksum on every session.",
    testCases: ["TC-CONN-017", "TC-SW-031"],
  },
  {
    requirementId: "REQ-005",
    designElementId: "DE-005",
    status: "verified",
    why: "Capture manager enforces threshold search and dependency-mode safety multipliers before save.",
    testCases: ["TC-ALG-005", "TC-HIL-056", "TC-CLIN-008"],
  },
  {
    requirementId: "REQ-007",
    designElementId: "DE-006",
    status: "in-progress",
    why: "Isolation gateway separates BLE diagnostic flows from real-time pacing threads and parameter write path.",
    testCases: ["TC-SW-021", "TC-CYB-006"],
  },
  {
    requirementId: "REQ-003",
    designElementId: "DE-001",
    status: "in-progress",
    why: "Timing engine watchdog ensures EMI faults cannot starve escape timers or freeze state transitions.",
    testCases: ["TC-EMC-030"],
  },
];

function linkKey(requirementId: string, designElementId: string) {
  return `${requirementId}:${designElementId}`;
}

function statusTone(status: VerificationStatus) {
  if (status === "verified") {
    return {
      badge: "bg-emerald-500/15 text-emerald-200",
      fill: "bg-emerald-400 shadow-[0_0_0_10px_rgba(52,211,153,0.12)]",
      cell: "border-emerald-400/35 bg-emerald-500/10",
    };
  }

  if (status === "in-progress") {
    return {
      badge: "bg-sky-500/15 text-sky-200",
      fill: "bg-sky-400 shadow-[0_0_0_10px_rgba(56,189,248,0.12)]",
      cell: "border-sky-400/35 bg-sky-500/10",
    };
  }

  return {
    badge: "bg-slate-500/20 text-slate-200",
    fill: "bg-slate-400 shadow-[0_0_0_10px_rgba(148,163,184,0.1)]",
    cell: "border-slate-400/30 bg-slate-500/10",
  };
}

function csvEscape(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export function TraceabilityMatrix() {
  const [showOnlyGaps, setShowOnlyGaps] = React.useState(false);
  const [gapHighlighter, setGapHighlighter] = React.useState(true);
  const [typeFilter, setTypeFilter] = React.useState<RequirementType | "ALL">("ALL");
  const [verificationFilter, setVerificationFilter] = React.useState<VerificationStatus | "ALL">("ALL");
  const [selectedRequirementId, setSelectedRequirementId] = React.useState<string>("REQ-003");

  const linkMap = React.useMemo(() => {
    const map = new Map<string, TraceLink>();
    for (const link of traceLinks) {
      map.set(linkKey(link.requirementId, link.designElementId), link);
    }
    return map;
  }, []);

  const requirementLinkCounts = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const requirement of requirements) {
      map.set(requirement.id, 0);
    }
    for (const link of traceLinks) {
      map.set(link.requirementId, (map.get(link.requirementId) ?? 0) + 1);
    }
    return map;
  }, []);

  const designLinkCounts = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const designElement of designElements) {
      map.set(designElement.id, 0);
    }
    for (const link of traceLinks) {
      map.set(link.designElementId, (map.get(link.designElementId) ?? 0) + 1);
    }
    return map;
  }, []);

  const filteredRequirements = requirements.filter((requirement) => {
    if (showOnlyGaps && (requirementLinkCounts.get(requirement.id) ?? 0) > 0) {
      return false;
    }
    if (typeFilter !== "ALL" && requirement.type !== typeFilter) {
      return false;
    }
    if (verificationFilter !== "ALL" && requirement.verification !== verificationFilter) {
      return false;
    }
    return true;
  });

  const selectedRequirement =
    filteredRequirements.find((requirement) => requirement.id === selectedRequirementId) ??
    requirements.find((requirement) => requirement.id === selectedRequirementId) ??
    filteredRequirements[0] ??
    requirements[0];

  const selectedLinks = traceLinks.filter((link) => link.requirementId === selectedRequirement.id);
  const selectedDesignIds = new Set(selectedLinks.map((link) => link.designElementId));
  const linkedTestCases = Array.from(new Set(selectedLinks.flatMap((link) => link.testCases)));

  const coveredRequirementCount = requirements.filter(
    (requirement) => (requirementLinkCounts.get(requirement.id) ?? 0) > 0,
  ).length;
  const uncoveredRequirementCount = requirements.length - coveredRequirementCount;
  const verifiedLinkCount = traceLinks.filter((link) => link.status === "verified").length;
  const coverage = Math.round((coveredRequirementCount / requirements.length) * 100);

  function exportCsv() {
    const header =
      "Requirement ID,Requirement Title,Requirement Type,Design Element ID,Design Element Title,Verification Status,Why Linked,Linked Test Cases";
    const rows = traceLinks.map((link) => {
      const requirement = requirements.find((item) => item.id === link.requirementId);
      const designElement = designElements.find((item) => item.id === link.designElementId);
      return [
        csvEscape(link.requirementId),
        csvEscape(requirement?.title ?? ""),
        csvEscape(requirement?.type ?? ""),
        csvEscape(link.designElementId),
        csvEscape(designElement?.title ?? ""),
        csvEscape(link.status),
        csvEscape(link.why),
        csvEscape(link.testCases.join(" | ")),
      ].join(",");
    });

    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "traceability-links.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function exportPng() {
    const visibleRequirements = filteredRequirements;
    const cellSize = 54;
    const headerWidth = 220;
    const headerHeight = 110;
    const width = headerWidth + designElements.length * cellSize + 60;
    const height = headerHeight + visibleRequirements.length * cellSize + 120;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    const gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#08111f");
    gradient.addColorStop(1, "#050915");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);

    context.fillStyle = "#d8e2ff";
    context.font = "600 20px Inter, sans-serif";
    context.fillText("Traceability Matrix", 32, 42);
    context.font = "12px Inter, sans-serif";
    context.fillStyle = "#8fa3ca";
    context.fillText(`Coverage ${coverage}% | Covered ${coveredRequirementCount}/${requirements.length}`, 32, 66);

    for (let column = 0; column <= designElements.length; column += 1) {
      const x = headerWidth + column * cellSize;
      context.strokeStyle = "rgba(148, 163, 184, 0.22)";
      context.beginPath();
      context.moveTo(x, headerHeight);
      context.lineTo(x, height - 46);
      context.stroke();
    }

    for (let row = 0; row <= visibleRequirements.length; row += 1) {
      const y = headerHeight + row * cellSize;
      context.strokeStyle = "rgba(148, 163, 184, 0.22)";
      context.beginPath();
      context.moveTo(28, y);
      context.lineTo(width - 28, y);
      context.stroke();
    }

    context.font = "600 11px Inter, sans-serif";
    for (let index = 0; index < designElements.length; index += 1) {
      const designElement = designElements[index];
      const x = headerWidth + index * cellSize + cellSize / 2;
      context.save();
      context.translate(x, 94);
      context.rotate(-Math.PI / 3.2);
      context.fillStyle = (designLinkCounts.get(designElement.id) ?? 0) === 0 ? "#fda4af" : "#d8e2ff";
      context.fillText(designElement.id, 0, 0);
      context.restore();
    }

    for (let index = 0; index < visibleRequirements.length; index += 1) {
      const requirement = visibleRequirements[index];
      const y = headerHeight + index * cellSize + 33;
      const isGap = (requirementLinkCounts.get(requirement.id) ?? 0) === 0;
      context.fillStyle = isGap ? "#fecaca" : "#d8e2ff";
      context.font = "600 11px Inter, sans-serif";
      context.fillText(requirement.id, 32, y - 10);
      context.fillStyle = "#8fa3ca";
      context.font = "10px Inter, sans-serif";
      context.fillText(requirement.title.slice(0, 35), 32, y + 8);
    }

    for (let row = 0; row < visibleRequirements.length; row += 1) {
      for (let column = 0; column < designElements.length; column += 1) {
        const requirement = visibleRequirements[row];
        const designElement = designElements[column];
        const link = linkMap.get(linkKey(requirement.id, designElement.id));
        const centerX = headerWidth + column * cellSize + cellSize / 2;
        const centerY = headerHeight + row * cellSize + cellSize / 2;

        context.beginPath();
        context.arc(centerX, centerY, 11, 0, Math.PI * 2);

        if (link) {
          context.fillStyle =
            link.status === "verified"
              ? "#34d399"
              : link.status === "in-progress"
                ? "#38bdf8"
                : "#94a3b8";
          context.shadowColor = context.fillStyle;
          context.shadowBlur = 14;
          context.fill();
          context.shadowBlur = 0;
        } else {
          const gap = (requirementLinkCounts.get(requirement.id) ?? 0) === 0;
          context.fillStyle = gap ? "rgba(251,113,133,0.15)" : "rgba(148,163,184,0.08)";
          context.fill();
          context.strokeStyle = gap ? "rgba(251,113,133,0.8)" : "rgba(148,163,184,0.35)";
          context.lineWidth = 1.4;
          context.stroke();
        }
      }
    }

    canvas.toBlob((blob) => {
      if (!blob) {
        return;
      }
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "traceability-matrix.png";
      anchor.click();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <div className="space-y-6">
      <section className={cn(panelClass, "overflow-hidden p-6 sm:p-7")}>
        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <Badge className="bg-sky-500/15 text-sky-100">Bidirectional Traceability</Badge>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Requirement-to-design coverage with impact-aware gaps.
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-slate-300">
                The matrix ties pacemaker requirements to design elements and linked verification evidence. Gap
                filters, row and column highlighting, and requirement-centric impact tracing make change review fast.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.24em] text-slate-400">
                <span>Coverage</span>
                <span>{coverage}%</span>
              </div>
              <div className="mt-4 h-2 rounded-full bg-white/8">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-cyan-300"
                  style={{ width: `${coverage}%` }}
                />
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm text-slate-200">
                <CheckCircle2 className="size-4 text-emerald-300" />
                {coveredRequirementCount} of {requirements.length} requirements mapped
              </div>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Verification-ready links</div>
              <div className="mt-4 text-3xl font-semibold text-white">{verifiedLinkCount}</div>
              <div className="mt-2 text-sm text-slate-300">Released design evidence already anchored to tests.</div>
            </div>
            <div className="rounded-[24px] border border-red-400/20 bg-red-500/8 p-4">
              <div className="text-xs uppercase tracking-[0.24em] text-red-200/70">Open gaps</div>
              <div className="mt-4 text-3xl font-semibold text-white">{uncoveredRequirementCount}</div>
              <div className="mt-2 text-sm text-red-100/80">Rows with no active design linkage are flagged red.</div>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Selected impact</div>
              <div className="mt-4 flex items-center gap-2 text-sm text-slate-200">
                <GitBranch className="size-4 text-sky-300" />
                {selectedLinks.length} design links
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm text-slate-200">
                <TestTube2 className="size-4 text-indigo-300" />
                {linkedTestCases.length} test cases
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_360px]">
        <div className={cn(panelClass, "overflow-hidden p-5")}>
          <div className="flex flex-col gap-4 border-b border-white/10 pb-5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-slate-300">
                <Filter className="size-3.5" />
                Matrix Filters
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">
                <span className="text-slate-400">Selected:</span>
                <span className="font-medium text-white">{selectedRequirement.id}</span>
              </div>
            </div>
            <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto_auto_auto]">
              <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as RequirementType | "ALL")}>
                <SelectTrigger className="border-white/10 bg-white/5 text-slate-100">
                  <SelectValue placeholder="Requirement type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All types</SelectItem>
                  <SelectItem value="FR">FR</SelectItem>
                  <SelectItem value="NFR">NFR</SelectItem>
                  <SelectItem value="REG">REG</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={verificationFilter}
                onValueChange={(value) => setVerificationFilter(value as VerificationStatus | "ALL")}
              >
                <SelectTrigger className="border-white/10 bg-white/5 text-slate-100">
                  <SelectValue placeholder="Verification status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All verification states</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="in-progress">In progress</SelectItem>
                  <SelectItem value="not-started">Not started</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant={showOnlyGaps ? "secondary" : "outline"}
                className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
                onClick={() => setShowOnlyGaps((current) => !current)}
              >
                <ShieldAlert className="size-4" />
                Show only gaps
              </Button>
              <Button
                variant="outline"
                className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
                onClick={exportPng}
              >
                <FileDown className="size-4" />
                Export PNG
              </Button>
              <Button
                variant="outline"
                className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
                onClick={exportCsv}
              >
                <Link2 className="size-4" />
                Export CSV
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-3 rounded-[22px] border border-white/10 bg-slate-950/50 px-4 py-3">
              <Switch checked={gapHighlighter} onCheckedChange={setGapHighlighter} />
              <div className="text-sm text-slate-200">Gap highlighter</div>
              <div className="text-xs text-slate-400">
                Highlights rows or columns with zero linked coverage in red.
              </div>
            </div>
          </div>

          <ScrollArea className="mt-5 w-full">
            <div className="min-w-[980px] pb-2">
              <div
                className="grid gap-px rounded-[26px] border border-white/10 bg-white/6 p-1"
                style={{ gridTemplateColumns: `240px repeat(${designElements.length}, minmax(88px, 1fr))` }}
              >
                <div className="rounded-[22px] bg-slate-950/65 p-4 text-left">
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Requirements</div>
                  <div className="mt-2 text-sm font-medium text-white">Mapped against design elements</div>
                </div>
                {designElements.map((designElement) => {
                  const isColumnGap = (designLinkCounts.get(designElement.id) ?? 0) === 0;
                  const isSelected = selectedDesignIds.has(designElement.id);

                  return (
                    <div
                      key={designElement.id}
                      className={cn(
                        "rounded-[22px] border border-transparent px-3 py-4 text-center",
                        isSelected ? "bg-sky-500/12 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.4)]" : "bg-slate-950/55",
                        gapHighlighter && isColumnGap && "bg-red-500/12 shadow-[inset_0_0_0_1px_rgba(248,113,113,0.45)]",
                      )}
                    >
                      <div className="text-xs font-semibold tracking-[0.18em] text-slate-300">{designElement.id}</div>
                      <div className="mt-2 text-sm font-medium leading-5 text-white">{designElement.title}</div>
                      <div className="mt-2 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                        {designElement.domain}
                      </div>
                    </div>
                  );
                })}
                {filteredRequirements.map((requirement) => {
                  const rowGap = (requirementLinkCounts.get(requirement.id) ?? 0) === 0;
                  const rowSelected = selectedRequirement.id === requirement.id;

                  return (
                    <React.Fragment key={requirement.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedRequirementId(requirement.id)}
                        className={cn(
                          "rounded-[22px] border p-4 text-left transition-all",
                          rowSelected
                            ? "border-sky-400/45 bg-sky-500/10"
                            : "border-transparent bg-slate-950/55 hover:border-white/12 hover:bg-white/6",
                          gapHighlighter && rowGap && "border-red-400/35 bg-red-500/10",
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-xs font-semibold tracking-[0.18em] text-slate-300">
                              {requirement.id}
                            </div>
                            <div className="mt-2 text-sm font-medium leading-5 text-white">{requirement.title}</div>
                          </div>
                          <Badge className={cn("shrink-0", statusTone(requirement.verification).badge)}>
                            {requirement.type}
                          </Badge>
                        </div>
                        <div className="mt-3 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                          {requirement.owner}
                        </div>
                      </button>

                      {designElements.map((designElement) => {
                        const link = linkMap.get(linkKey(requirement.id, designElement.id));
                        const tone = link ? statusTone(link.status) : null;
                        const isGapCell = !link && rowGap;
                        const isImpactCell = selectedRequirement.id === requirement.id && selectedDesignIds.has(designElement.id);

                        return (
                          <HoverCard key={linkKey(requirement.id, designElement.id)} openDelay={80}>
                            <HoverCardTrigger asChild>
                              <button
                                type="button"
                                onClick={() => setSelectedRequirementId(requirement.id)}
                                className={cn(
                                  "group relative flex min-h-[118px] items-center justify-center rounded-[22px] border transition-all",
                                  link
                                    ? cn("bg-slate-950/55", tone?.cell)
                                    : "border-white/6 bg-slate-950/40 hover:bg-white/6",
                                  isImpactCell && "shadow-[inset_0_0_0_1px_rgba(125,211,252,0.6),0_0_28px_rgba(14,165,233,0.18)]",
                                  gapHighlighter && isGapCell && "border-red-400/35 bg-red-500/10",
                                )}
                              >
                                {link ? (
                                  <div className="flex flex-col items-center gap-3">
                                    <span className={cn("size-5 rounded-full", tone?.fill)} />
                                    <span className="text-[11px] uppercase tracking-[0.18em] text-slate-300">
                                      {link.status === "verified"
                                        ? "Verified"
                                        : link.status === "in-progress"
                                          ? "In progress"
                                          : "Not started"}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center gap-3 text-slate-500">
                                    <Circle className="size-5" />
                                    <span className="text-[11px] uppercase tracking-[0.18em]">
                                      {isGapCell ? "Gap" : "Unlinked"}
                                    </span>
                                  </div>
                                )}
                              </button>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-80 border border-white/10 bg-[#091121]/96 text-slate-100 shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
                              <div className="space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
                                      {requirement.id} <ArrowRight className="mx-1 inline size-3" /> {designElement.id}
                                    </div>
                                    <div className="mt-2 text-sm font-semibold text-white">
                                      {designElement.title}
                                    </div>
                                  </div>
                                  {link ? (
                                    <Badge className={statusTone(link.status).badge}>{link.status}</Badge>
                                  ) : (
                                    <Badge className="bg-red-500/15 text-red-100">gap</Badge>
                                  )}
                                </div>
                                <p className="text-sm leading-6 text-slate-300">
                                  {link
                                    ? link.why
                                    : "No trace link exists for this cell yet. This requirement currently depends on a design allocation decision or decomposition update."}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {(link?.testCases ?? ["Pending test assignment"]).map((testCase) => (
                                    <span
                                      key={testCase}
                                      className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300"
                                    >
                                      {testCase}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </HoverCardContent>
                          </HoverCard>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </ScrollArea>
        </div>

        <div className="space-y-6">
          <section className={cn(panelClass, "p-5")}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Change impact</div>
                <h2 className="mt-2 text-xl font-semibold text-white">{selectedRequirement.id}</h2>
              </div>
              <Badge className={statusTone(selectedRequirement.verification).badge}>{selectedRequirement.type}</Badge>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-300">{selectedRequirement.title}</p>
            <div className="mt-4 rounded-[22px] border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300">
              {selectedRequirement.rationale}
            </div>
            <div className="mt-5 grid gap-3">
              <div className="rounded-[22px] border border-sky-400/20 bg-sky-500/8 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-sky-100">
                  <Radar className="size-4" />
                  Linked design elements
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedLinks.length > 0 ? (
                    selectedLinks.map((link) => (
                      <span
                        key={link.designElementId}
                        className="rounded-full border border-sky-300/20 bg-sky-400/10 px-2.5 py-1 text-xs text-sky-100"
                      >
                        {link.designElementId}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">No linked design elements yet.</span>
                  )}
                </div>
              </div>
              <div className="rounded-[22px] border border-indigo-400/20 bg-indigo-500/8 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-indigo-100">
                  <TestTube2 className="size-4" />
                  Impacted test cases
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {linkedTestCases.length > 0 ? (
                    linkedTestCases.map((testCase) => (
                      <span
                        key={testCase}
                        className="rounded-full border border-indigo-300/20 bg-indigo-400/10 px-2.5 py-1 text-xs text-indigo-100"
                      >
                        {testCase}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">Verification plan not assigned.</span>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className={cn(panelClass, "p-5")}>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-slate-500">
              <AlertTriangle className="size-3.5" />
              Coverage signals
            </div>
            <div className="mt-4 space-y-3">
              {requirements.map((requirement) => {
                const count = requirementLinkCounts.get(requirement.id) ?? 0;
                return (
                  <div
                    key={requirement.id}
                    className={cn(
                      "rounded-[20px] border px-4 py-3",
                      count === 0 ? "border-red-400/20 bg-red-500/10" : "border-white/10 bg-white/5",
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium text-white">{requirement.id}</div>
                      <div className="text-xs text-slate-400">{count} linked DEs</div>
                    </div>
                    <div className="mt-2 text-sm leading-5 text-slate-300">{requirement.title}</div>
                  </div>
                );
              })}
            </div>
          </section>

          <AnimatePresence mode="wait">
            <motion.section
              key={selectedRequirement.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={cn(panelClass, "p-5")}
            >
              <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Selected requirement pathway</div>
              <div className="mt-4 space-y-3">
                {selectedLinks.length > 0 ? (
                  selectedLinks.map((link) => {
                    const designElement = designElements.find((item) => item.id === link.designElementId);
                    return (
                      <div
                        key={link.designElementId}
                        className="rounded-[22px] border border-white/10 bg-white/5 p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-medium text-white">{designElement?.title}</div>
                          <Badge className={statusTone(link.status).badge}>{link.designElementId}</Badge>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-300">{link.why}</p>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-[22px] border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100">
                    This requirement has no mapped design element yet. It remains a traceability gap and will surface in
                    export outputs.
                  </div>
                )}
              </div>
            </motion.section>
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}
