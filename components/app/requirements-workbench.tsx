"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BookOpenText,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  ClipboardCheck,
  Copy,
  FileCode2,
  FileInput,
  FileSpreadsheet,
  FlaskConical,
  FolderTree,
  GripVertical,
  Link2,
  MoreHorizontal,
  Plus,
  ScanSearch,
  Shield,
  Sparkles,
  Target,
  Trash2,
  UploadCloud,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { AIStreamOutput } from "@/components/ui/med/ai-stream-output";
import { DataTable, type DataTableColumn } from "@/components/ui/med/data-table";
import { ProgressRing } from "@/components/ui/med/progress-ring";
import { cn } from "@/lib/utils";

type RequirementType = "FR" | "NFR" | "REG" | "CONST";
type RequirementPriority = "P1" | "P2" | "P3";

interface RequirementComment {
  id: string;
  author: string;
  initials: string;
  text: string;
  timestamp: string;
}

interface RequirementNode {
  id: string;
  title: string;
  type: RequirementType;
  priority: RequirementPriority;
  status: "Draft" | "Reviewed" | "Approved" | "Flagged";
  ambiguity: number;
  linkedElements: number;
  description: string;
  acceptanceCriteria: string;
  ambiguityExplanation: string;
  standards: string[];
  designElements: string[];
  testCases: string[];
  history: string[];
  comments: RequirementComment[];
  children: RequirementNode[];
}

interface GapItem {
  id: string;
  group: "Missing Regulatory" | "Unverifiable" | "Orphan" | "Duplicate";
  description: string;
  suggestion: string;
}

const requirementSeed: RequirementNode[] = [
  {
    id: "REQ-001",
    title: "Therapy delivery safety envelope",
    type: "REG",
    priority: "P1",
    status: "Approved",
    ambiguity: 9,
    linkedElements: 12,
    description:
      "Establish the governing therapy constraints for infusion startup, steady-state delivery, and operator intervention windows.",
    acceptanceCriteria:
      "Pump shall remain inside programmed flow tolerance, alarm within 250 ms for occlusion conditions, and capture every intervention in the audit trail.",
    ambiguityExplanation:
      "Strong numeric thresholds exist, but the response-time requirement still references two external clauses that are not linked yet.",
    standards: ["IEC 62304 5.2.3", "ISO 14971 7.4", "FDA 21 CFR 820.30"],
    designElements: ["Infusion control state machine", "Alarm supervisor", "Event journal"],
    testCases: ["VT-112 Occlusion response", "VT-118 Startup tolerance", "SYS-22 Audit replay"],
    history: [
      "v3 baseline locked by Systems on Apr 01",
      "Residual risk note attached by Quality on Mar 29",
      "Acceptance criteria clarified after ICU workflow review",
    ],
    comments: [
      {
        id: "c-1",
        author: "Nisha Rao",
        initials: "NR",
        text: "Keep the 250 ms alarm threshold tied to the hazard analysis entry so we do not drift in later baselines.",
        timestamp: "10 min ago",
      },
      {
        id: "c-2",
        author: "Owen Park",
        initials: "OP",
        text: "Need a linked verification for therapy pause recovery after power brownout.",
        timestamp: "42 min ago",
      },
    ],
    children: [
      {
        id: "REQ-002",
        title: "Closed-loop dose correction",
        type: "FR",
        priority: "P1",
        status: "Reviewed",
        ambiguity: 18,
        linkedElements: 7,
        description:
          "Compute correction deltas from sensor trends and clinician-selected therapy objectives.",
        acceptanceCriteria:
          "Correction engine shall recalculate within 2 seconds and never exceed configured max delta per cycle.",
        ambiguityExplanation:
          "The cadence is specific, but clinician override precedence is described in prose instead of decision logic.",
        standards: ["IEC 62304 5.3.4"],
        designElements: ["Dose estimator", "Sensor fusion service"],
        testCases: ["ALG-07 Adaptive correction", "INT-15 Sensor dropout"],
        history: ["Drafted by Controls on Mar 30", "Tagged as high-risk by AI import"],
        comments: [
          {
            id: "c-3",
            author: "Leah Kim",
            initials: "LK",
            text: "This likely needs a separate constraint for stale sensor data tolerance.",
            timestamp: "1 hr ago",
          },
        ],
        children: [
          {
            id: "REQ-003",
            title: "Sensor dropout handling",
            type: "CONST",
            priority: "P2",
            status: "Draft",
            ambiguity: 47,
            linkedElements: 2,
            description:
              "Constrain correction behavior during transient telemetry loss or stale sensor packets.",
            acceptanceCriteria:
              "On dropout, controller shall hold prior therapy recommendation until fallback logic completes.",
            ambiguityExplanation:
              "Fallback duration is not quantified and the hold behavior is not tied to any verification case yet.",
            standards: ["IEC 60601 alarm guidance"],
            designElements: ["Fallback arbiter"],
            testCases: ["INT-15 Sensor dropout"],
            history: ["Imported from draft clinical notes"],
            comments: [
              {
                id: "c-4",
                author: "Marta Liu",
                initials: "ML",
                text: "Ambiguous timeout. We need an explicit upper bound before locking baseline.",
                timestamp: "2 hr ago",
              },
            ],
            children: [],
          },
        ],
      },
      {
        id: "REQ-004",
        title: "Thermal enclosure performance",
        type: "NFR",
        priority: "P2",
        status: "Approved",
        ambiguity: 12,
        linkedElements: 5,
        description:
          "Maintain enclosure and component temperature margins during continuous bedside operation.",
        acceptanceCriteria:
          "Surface temperature shall remain below 41 C at 32 C ambient with charging active.",
        ambiguityExplanation:
          "Requirement is measurable and linked, but service-state thermal behavior is still under review.",
        standards: ["IEC 60601 thermal safety"],
        designElements: ["Fan controller", "Battery charging board"],
        testCases: ["ENV-09 Hot chamber run"],
        history: ["Approved in thermal review on Mar 27"],
        comments: [
          {
            id: "c-5",
            author: "Rafael Stone",
            initials: "RS",
            text: "Thermal margin looks good. Need service-mode measurement added to test notes.",
            timestamp: "Yesterday",
          },
        ],
        children: [],
      },
    ],
  },
  {
    id: "REQ-005",
    title: "Hospital network interoperability",
    type: "FR",
    priority: "P2",
    status: "Flagged",
    ambiguity: 61,
    linkedElements: 4,
    description:
      "Synchronize treatment state, alarms, and clinician acknowledgements with hospital infrastructure.",
    acceptanceCriteria:
      "System shall exchange treatment summaries and critical alarms with connected nurse station services.",
    ambiguityExplanation:
      "Protocol and timing details are missing, so the requirement cannot yet be verified or decomposed cleanly.",
    standards: ["HL7 profile draft", "IEC 80001 linkage note"],
    designElements: ["Integration gateway"],
    testCases: ["NET-01 Interface smoke"],
    history: ["AI conflict detector flagged missing protocol binding"],
    comments: [
      {
        id: "c-6",
        author: "Priya Sen",
        initials: "PS",
        text: "This is effectively two requirements. One for alarm relay, one for summary sync.",
        timestamp: "Yesterday",
      },
    ],
    children: [
      {
        id: "REQ-006",
        title: "Outbound alarm relay",
        type: "REG",
        priority: "P1",
        status: "Reviewed",
        ambiguity: 23,
        linkedElements: 6,
        description:
          "Transmit alarms with acknowledged severity and operator context to the connected hospital system.",
        acceptanceCriteria:
          "Critical alarms shall reach the relay endpoint within 1 second with delivery acknowledgement stored locally.",
        ambiguityExplanation:
          "Timing is defined, but endpoint availability behavior requires a separate fallback requirement.",
        standards: ["IEC 60601 alarm systems", "IEC 62304 5.5.3"],
        designElements: ["Alarm bridge", "Connectivity watchdog"],
        testCases: ["NET-03 Alarm egress", "SYS-41 Ack persistence"],
        history: ["Split out from parent sync requirement"],
        comments: [
          {
            id: "c-7",
            author: "Jared Holt",
            initials: "JH",
            text: "Looks good. Need duplicate check against IEC alarm wording before final approval.",
            timestamp: "Yesterday",
          },
        ],
        children: [],
      },
    ],
  },
];

const gapSeed: GapItem[] = [
  {
    id: "gap-1",
    group: "Missing Regulatory",
    description: "No explicit cybersecurity maintenance requirement linked to software update workflow.",
    suggestion: "Create a REG requirement for authenticated update packages and post-install integrity validation.",
  },
  {
    id: "gap-2",
    group: "Unverifiable",
    description: "REQ-005 uses 'synchronize' without protocol, cadence, or timeout definitions.",
    suggestion: "Split the sync requirement by interface type and add measurable latency plus retry bounds.",
  },
  {
    id: "gap-3",
    group: "Orphan",
    description: "REQ-003 has no downstream design module mapped outside the fallback arbiter note.",
    suggestion: "Link the requirement to the connectivity supervisor and verification matrix before baseline lock.",
  },
  {
    id: "gap-4",
    group: "Duplicate",
    description: "Outbound alarm relay language overlaps with two existing standards notes in the team library.",
    suggestion: "Merge shared wording into a single parent REG requirement and reference it from the child node.",
  },
];

const previewRows = [
  { id: "import-1", title: "Battery transport lockout", type: "REG", priority: "P1", source: "pdf" },
  { id: "import-2", title: "Nurse call alarm acknowledgement", type: "FR", priority: "P1", source: "docx" },
  { id: "import-3", title: "Service diagnostics export", type: "NFR", priority: "P3", source: "csv" },
];

const typeMeta: Record<
  RequirementType,
  {
    className: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  FR: { className: "bg-[#0a84ff]/12 text-[#0a84ff]", icon: FileCode2 },
  NFR: { className: "bg-slate-500/12 text-slate-500", icon: Shield },
  REG: { className: "bg-violet-500/12 text-violet-500", icon: BookOpenText },
  CONST: { className: "bg-amber-500/12 text-amber-600", icon: FlaskConical },
};

const priorityMeta: Record<RequirementPriority, string> = {
  P1: "bg-rose-500",
  P2: "bg-amber-500",
  P3: "bg-slate-400",
};

const gapMeta: Record<GapItem["group"], { color: string; icon: React.ComponentType<{ className?: string }> }> = {
  "Missing Regulatory": { color: "text-rose-500", icon: AlertTriangle },
  Unverifiable: { color: "text-amber-500", icon: ScanSearch },
  Orphan: { color: "text-sky-500", icon: Link2 },
  Duplicate: { color: "text-slate-500", icon: Copy },
};

function flattenRequirements(nodes: RequirementNode[], trail: string[] = []): Array<RequirementNode & { trail: string[] }> {
  return nodes.flatMap((node) => [{ ...node, trail }, ...flattenRequirements(node.children, [...trail, node.title])]);
}

function findRequirement(nodes: RequirementNode[], id?: string | null): RequirementNode | null {
  if (!id) {
    return null;
  }

  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }
    const child = findRequirement(node.children, id);
    if (child) {
      return child;
    }
  }

  return null;
}

function updateRequirement(
  nodes: RequirementNode[],
  id: string,
  updater: (node: RequirementNode) => RequirementNode,
): RequirementNode[] {
  return nodes.map((node) => {
    if (node.id === id) {
      return updater(node);
    }

    return node.children.length
      ? {
          ...node,
          children: updateRequirement(node.children, id, updater),
        }
      : node;
  });
}

function removeRequirement(
  nodes: RequirementNode[],
  id: string,
): { removed: RequirementNode | null; nodes: RequirementNode[] } {
  let removed: RequirementNode | null = null;
  const nextNodes = nodes
    .map((node) => {
      if (node.id === id) {
        removed = node;
        return null;
      }

      if (!node.children.length) {
        return node;
      }

      const next = removeRequirement(node.children, id);
      if (next.removed) {
        removed = next.removed;
      }

      return {
        ...node,
        children: next.nodes,
      };
    })
    .filter(Boolean) as RequirementNode[];

  return { removed, nodes: nextNodes };
}

function insertBeforeRequirement(
  nodes: RequirementNode[],
  targetId: string,
  incoming: RequirementNode,
): { inserted: boolean; nodes: RequirementNode[] } {
  const targetIndex = nodes.findIndex((node) => node.id === targetId);
  if (targetIndex >= 0) {
    const next = [...nodes];
    next.splice(targetIndex, 0, incoming);
    return { inserted: true, nodes: next };
  }

  let inserted = false;
  const nextNodes = nodes.map((node) => {
    if (inserted || !node.children.length) {
      return node;
    }

    const next = insertBeforeRequirement(node.children, targetId, incoming);
    inserted = next.inserted;

    return inserted
      ? {
          ...node,
          children: next.nodes,
        }
      : node;
  });

  return { inserted, nodes: nextNodes };
}

function filterRequirements(nodes: RequirementNode[], query: string): RequirementNode[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return nodes;
  }

  return nodes
    .map((node) => {
      const childMatches = filterRequirements(node.children, normalized);
      const matchesSelf =
        node.id.toLowerCase().includes(normalized) ||
        node.title.toLowerCase().includes(normalized) ||
        node.description.toLowerCase().includes(normalized);

      if (!matchesSelf && !childMatches.length) {
        return null;
      }

      return {
        ...node,
        children: childMatches,
      };
    })
    .filter(Boolean) as RequirementNode[];
}

function getMaxRequirementNumber(nodes: RequirementNode[]): number {
  return flattenRequirements(nodes).reduce((max, node) => {
    const parsed = Number(node.id.replace("REQ-", ""));
    return Number.isNaN(parsed) ? max : Math.max(max, parsed);
  }, 0);
}

function buildRequirement(id: string, partial?: Partial<RequirementNode>): RequirementNode {
  return {
    id,
    title: partial?.title ?? "New requirement",
    type: partial?.type ?? "FR",
    priority: partial?.priority ?? "P2",
    status: partial?.status ?? "Draft",
    ambiguity: partial?.ambiguity ?? 34,
    linkedElements: partial?.linkedElements ?? 0,
    description:
      partial?.description ??
      "Describe the intended behavior, constraints, and downstream design implications.",
    acceptanceCriteria:
      partial?.acceptanceCriteria ??
      "Document measurable acceptance criteria before approving this requirement.",
    ambiguityExplanation:
      partial?.ambiguityExplanation ??
      "Imported or new requirement pending AI review for specificity and verification strength.",
    standards: partial?.standards ?? [],
    designElements: partial?.designElements ?? [],
    testCases: partial?.testCases ?? [],
    history: partial?.history ?? ["Created in working baseline"],
    comments: partial?.comments ?? [],
    children: partial?.children ?? [],
  };
}

function cloneRequirementTree(node: RequirementNode, createId: () => string): RequirementNode {
  return {
    ...node,
    id: createId(),
    title: `${node.title} (Copy)`,
    children: node.children.map((child) => cloneRequirementTree(child, createId)),
  };
}

function ambiguityTone(score: number) {
  if (score >= 70) {
    return "text-rose-500";
  }
  if (score >= 35) {
    return "text-amber-500";
  }
  return "text-emerald-500";
}

function shellTone(score: number) {
  if (score >= 70) {
    return "border-rose-500/20 bg-rose-500/8";
  }
  if (score >= 35) {
    return "border-amber-500/20 bg-amber-500/8";
  }
  return "border-emerald-500/20 bg-emerald-500/8";
}

function RequirementTreeNode({
  node,
  depth,
  expandedIds,
  filterActive,
  selectedId,
  dropTargetId,
  onToggle,
  onSelect,
  onDragStart,
  onDragEnter,
  onDrop,
  onAddChild,
  onClone,
  onDelete,
  onLinkStandard,
}: {
  node: RequirementNode;
  depth: number;
  expandedIds: Set<string>;
  filterActive: boolean;
  selectedId: string | null;
  dropTargetId: string | null;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragEnter: (id: string) => void;
  onDrop: (id: string) => void;
  onAddChild: (id: string) => void;
  onClone: (id: string) => void;
  onDelete: (id: string) => void;
  onLinkStandard: (id: string) => void;
}) {
  const isExpanded = filterActive || expandedIds.has(node.id);
  const meta = typeMeta[node.type];
  const Icon = meta.icon;

  return (
    <motion.div layout className="space-y-1">
      <ContextMenu>
        <ContextMenuTrigger>
          <motion.div
            layout
            draggable
            onDragStart={() => onDragStart(node.id)}
            onDragOver={(event) => event.preventDefault()}
            onDragEnter={() => onDragEnter(node.id)}
            onDrop={() => onDrop(node.id)}
            onClick={() => onSelect(node.id)}
            className={cn(
              "group flex items-center gap-2 rounded-[20px] border px-3 py-2.5 transition-all",
              selectedId === node.id
                ? "border-[color:color-mix(in_srgb,var(--primary)_26%,transparent)] bg-[color:color-mix(in_srgb,var(--primary)_12%,transparent)] shadow-[0_16px_30px_rgba(10,132,255,0.15)]"
                : "border-transparent hover:border-[var(--border)] hover:bg-white/40 dark:hover:bg-white/5",
              dropTargetId === node.id && "border-sky-500/50 bg-sky-500/10",
            )}
            style={{ marginLeft: depth * 14 }}
          >
            <button
              type="button"
              className="flex size-6 items-center justify-center rounded-full text-[var(--text-secondary)] transition hover:bg-white/70 hover:text-[var(--text-primary)] dark:hover:bg-white/10"
              onClick={(event) => {
                event.stopPropagation();
                onToggle(node.id);
              }}
              aria-label={isExpanded ? "Collapse requirement" : "Expand requirement"}
            >
              {node.children.length ? (
                isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />
              ) : (
                <Circle className="size-2.5 fill-current" />
              )}
            </button>
            <GripVertical className="size-4 text-[var(--text-secondary)]" />
            <span className="rounded-full border border-[var(--border)] bg-[var(--card)]/80 px-2 py-1 text-[10px] font-semibold tracking-[0.18em] text-[var(--text-secondary)]">
              {node.id}
            </span>
            <span className={cn("inline-flex size-7 items-center justify-center rounded-full", meta.className)}>
              <Icon className="size-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-[var(--text-primary)]">{node.title}</div>
            </div>
            <div className="inline-flex items-center gap-2">
              <span className={cn("size-2.5 rounded-full", priorityMeta[node.priority])} />
              <span className={cn("text-xs font-medium", ambiguityTone(node.ambiguity))}>{node.ambiguity}</span>
            </div>
          </motion.div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-52">
          <ContextMenuItem onSelect={() => onAddChild(node.id)}>
            <Plus className="size-4" />
            Add child
          </ContextMenuItem>
          <ContextMenuItem onSelect={() => onClone(node.id)}>
            <Copy className="size-4" />
            Clone
          </ContextMenuItem>
          <ContextMenuItem onSelect={() => onLinkStandard(node.id)}>
            <Link2 className="size-4" />
            Link to standard
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem variant="destructive" onSelect={() => onDelete(node.id)}>
            <Trash2 className="size-4" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <AnimatePresence initial={false}>
        {node.children.length && isExpanded ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-1 pt-1">
              {node.children.map((child) => (
                <RequirementTreeNode
                  key={child.id}
                  node={child}
                  depth={depth + 1}
                  expandedIds={expandedIds}
                  filterActive={filterActive}
                  selectedId={selectedId}
                  dropTargetId={dropTargetId}
                  onToggle={onToggle}
                  onSelect={onSelect}
                  onDragStart={onDragStart}
                  onDragEnter={onDragEnter}
                  onDrop={onDrop}
                  onAddChild={onAddChild}
                  onClone={onClone}
                  onDelete={onDelete}
                  onLinkStandard={onLinkStandard}
                />
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

export function RequirementsWorkbench() {
  const [requirements, setRequirements] = React.useState(requirementSeed);
  const [selectedId, setSelectedId] = React.useState<string | null>("REQ-002");
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(
    () => new Set(["REQ-001", "REQ-002", "REQ-005"]),
  );
  const [filter, setFilter] = React.useState("");
  const [draggedId, setDraggedId] = React.useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = React.useState<string | null>(null);
  const [analysisOpen, setAnalysisOpen] = React.useState(false);
  const [analysisRunning, setAnalysisRunning] = React.useState(false);
  const [analysisReady, setAnalysisReady] = React.useState(false);
  const [versionTag, setVersionTag] = React.useState("BL-2026.04");
  const [dropActive, setDropActive] = React.useState(false);
  const [titleEditing, setTitleEditing] = React.useState(false);
  const [titleDraft, setTitleDraft] = React.useState("");
  const [replyDraft, setReplyDraft] = React.useState("");
  const [gapResults, setGapResults] = React.useState(gapSeed);
  const [gapScanning, setGapScanning] = React.useState(false);
  const [coverage, setCoverage] = React.useState(74);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const idCounterRef = React.useRef(getMaxRequirementNumber(requirementSeed) + 1);

  const selectedRequirement = findRequirement(requirements, selectedId);
  const visibleTree = filterRequirements(requirements, filter);
  const flatRows = flattenRequirements(requirements);
  const conflictCount = 3;

  React.useEffect(() => {
    setTitleDraft(selectedRequirement?.title ?? "");
  }, [selectedRequirement?.id, selectedRequirement?.title]);

  React.useEffect(() => {
    if (!analysisRunning) {
      return;
    }

    setAnalysisReady(false);
    const timer = window.setTimeout(() => {
      setAnalysisRunning(false);
      setAnalysisReady(true);
    }, 4200);

    return () => window.clearTimeout(timer);
  }, [analysisRunning]);

  function createRequirementId() {
    const next = `REQ-${String(idCounterRef.current).padStart(3, "0")}`;
    idCounterRef.current += 1;
    return next;
  }

  function addRootRequirement() {
    const id = createRequirementId();
    setRequirements((current) => [
      ...current,
      buildRequirement(id, {
        title: "New imported requirement cluster",
        type: "REG",
        priority: "P2",
      }),
    ]);
    setSelectedId(id);
  }

  function addChildRequirement(targetId: string) {
    const id = createRequirementId();
    setRequirements((current) =>
      updateRequirement(current, targetId, (node) => ({
        ...node,
        children: [
          ...node.children,
          buildRequirement(id, {
            title: `${node.title} - child requirement`,
            type: node.type === "REG" ? "FR" : node.type,
            priority: node.priority,
          }),
        ],
      })),
    );
    setExpandedIds((current) => new Set(current).add(targetId));
    setSelectedId(id);
  }

  function cloneRequirement(targetId: string) {
    const target = findRequirement(requirements, targetId);
    if (!target) {
      return;
    }

    const clone = cloneRequirementTree(target, createRequirementId);
    const next = insertBeforeRequirement(requirements, targetId, clone);
    setRequirements(next.inserted ? next.nodes : [...requirements, clone]);
    setSelectedId(clone.id);
  }

  function deleteRequirement(targetId: string) {
    const next = removeRequirement(requirements, targetId);
    setRequirements(next.nodes);
    if (selectedId === targetId) {
      const fallback = flattenRequirements(next.nodes)[0];
      setSelectedId(fallback?.id ?? null);
    }
  }

  function linkRequirementToStandard(targetId: string) {
    setRequirements((current) =>
      updateRequirement(current, targetId, (node) => ({
        ...node,
        standards: node.standards.includes("IEC 62366 usability")
          ? node.standards
          : [...node.standards, "IEC 62366 usability"],
      })),
    );
  }

  function handleDrop(targetId: string) {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDropTargetId(null);
      return;
    }

    const removed = removeRequirement(requirements, draggedId);
    if (!removed.removed) {
      setDraggedId(null);
      setDropTargetId(null);
      return;
    }

    const inserted = insertBeforeRequirement(removed.nodes, targetId, removed.removed);
    setRequirements(inserted.inserted ? inserted.nodes : [...removed.nodes, removed.removed]);
    setDraggedId(null);
    setDropTargetId(null);
  }

  function updateSelected(updater: (node: RequirementNode) => RequirementNode) {
    if (!selectedRequirement) {
      return;
    }

    setRequirements((current) => updateRequirement(current, selectedRequirement.id, updater));
  }

  function saveTitle() {
    if (!selectedRequirement || !titleDraft.trim()) {
      setTitleEditing(false);
      return;
    }

    updateSelected((node) => ({
      ...node,
      title: titleDraft.trim(),
    }));
    setTitleEditing(false);
  }

  function addReply() {
    if (!selectedRequirement || !replyDraft.trim()) {
      return;
    }

    updateSelected((node) => ({
      ...node,
      comments: [
        ...node.comments,
        {
          id: `comment-${Date.now()}`,
          author: "Harsh Singh",
          initials: "HS",
          text: replyDraft.trim(),
          timestamp: "Just now",
        },
      ],
    }));
    setReplyDraft("");
  }

  function startAnalysis() {
    setAnalysisOpen(true);
    setAnalysisRunning(true);
  }

  function confirmImport() {
    const id = createRequirementId();
    setRequirements((current) => [
      ...current,
      buildRequirement(id, {
        title: "Battery transport lockout",
        type: "REG",
        priority: "P1",
        ambiguity: 16,
        linkedElements: 3,
      }),
    ]);
    setSelectedId(id);
    setAnalysisOpen(false);
    setAnalysisReady(false);
  }

  function runGapAnalysis() {
    setGapScanning(true);
    window.setTimeout(() => {
      setGapScanning(false);
      setCoverage(88);
    }, 2200);
  }

  const columns: Array<DataTableColumn<(typeof flatRows)[number]>> = [
    {
      id: "id",
      header: "ID",
      accessor: "id",
      sortable: true,
      cell: (row) => (
        <button type="button" className="font-medium text-[var(--primary)]" onClick={() => setSelectedId(row.id)}>
          {row.id}
        </button>
      ),
    },
    {
      id: "title",
      header: "Title",
      accessor: "title",
      sortable: true,
      cell: (row) => <span className="line-clamp-1 max-w-[280px]">{row.title}</span>,
    },
    {
      id: "type",
      header: "Type",
      accessor: "type",
      cell: (row) => (
        <span className={cn("inline-flex rounded-full px-2 py-1 text-xs font-semibold", typeMeta[row.type].className)}>
          {row.type}
        </span>
      ),
    },
    {
      id: "priority",
      header: "Priority",
      accessor: "priority",
      cell: (row) => (
        <span className="inline-flex items-center gap-2">
          <span className={cn("size-2.5 rounded-full", priorityMeta[row.priority])} />
          {row.priority}
        </span>
      ),
    },
    {
      id: "ambiguity",
      header: "Ambiguity",
      accessor: "ambiguity",
      sortable: true,
      cell: (row) => <span className={cn("font-semibold", ambiguityTone(row.ambiguity))}>{row.ambiguity}</span>,
    },
    { id: "status", header: "Status", accessor: "status" },
    { id: "linkedElements", header: "Linked Elements", accessor: "linkedElements" },
    {
      id: "actions",
      header: "Actions",
      accessor: (row) => row.id,
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="rounded-full">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onSelect={() => setSelectedId(row.id)}>Open detail</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => cloneRequirement(row.id)}>Clone</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => linkRequirementToStandard(row.id)}>Link standard</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const panelClassName =
    "relative h-full overflow-hidden rounded-[30px] border border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--card)_92%,transparent),color-mix(in_srgb,var(--surface)_82%,transparent))] shadow-[0_22px_60px_rgba(8,15,29,0.14)]";

  return (
    <>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--card)_85%,transparent)] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-[var(--text-secondary)]">
            <FolderTree className="size-3.5 text-[var(--primary)]" />
            AI Requirements Management
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
              Requirements Control Room
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
              Drag through the requirements tree, stream AI tagging output, and keep standards,
              design elements, and comments attached to the same baseline surface.
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-[24px] border border-[var(--border)] bg-white/50 px-4 py-3 dark:bg-white/5">
            <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-secondary)]">Active baseline</div>
            <div className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{versionTag}</div>
          </div>
          <div className="rounded-[24px] border border-[var(--border)] bg-white/50 px-4 py-3 dark:bg-white/5">
            <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-secondary)]">Conflicts</div>
            <div className="mt-2 text-lg font-semibold text-amber-500">{conflictCount} flagged</div>
          </div>
          <div className="rounded-[24px] border border-[var(--border)] bg-white/50 px-4 py-3 dark:bg-white/5">
            <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-secondary)]">Coverage</div>
            <div className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{coverage}% clauses mapped</div>
          </div>
        </div>
      </div>

      <div className="h-[calc(100vh-13.5rem)] min-h-[760px] overflow-hidden rounded-[36px] border border-[var(--border)] bg-[linear-gradient(135deg,rgba(8,20,34,0.04),transparent_20%,rgba(10,132,255,0.05)_100%)] p-2">
        <ResizablePanelGroup orientation="horizontal" className="h-full gap-2">
          <ResizablePanel defaultSize={21} minSize={18}>
            <div className={cn(panelClassName, "flex h-full flex-col")}>
              <div className="border-b border-[var(--border)] p-4">
                <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-[var(--text-secondary)]">
                  <FolderTree className="size-3.5 text-[var(--primary)]" />
                  Requirement Tree
                </div>
                <Input
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                  placeholder="Filter requirements"
                  className="rounded-full"
                />
              </div>
              <div className="flex-1 overflow-auto p-3">
                <div className="space-y-1">
                  {visibleTree.map((node) => (
                    <RequirementTreeNode
                      key={node.id}
                      node={node}
                      depth={0}
                      expandedIds={expandedIds}
                      filterActive={Boolean(filter.trim())}
                      selectedId={selectedId}
                      dropTargetId={dropTargetId}
                      onToggle={(id) =>
                        setExpandedIds((current) => {
                          const next = new Set(current);
                          if (next.has(id)) {
                            next.delete(id);
                          } else {
                            next.add(id);
                          }
                          return next;
                        })
                      }
                      onSelect={setSelectedId}
                      onDragStart={setDraggedId}
                      onDragEnter={setDropTargetId}
                      onDrop={handleDrop}
                      onAddChild={addChildRequirement}
                      onClone={cloneRequirement}
                      onDelete={deleteRequirement}
                      onLinkStandard={linkRequirementToStandard}
                    />
                  ))}
                </div>
              </div>
              <div className="border-t border-[var(--border)] p-3">
                <Button className="h-11 w-full rounded-[18px]" onClick={addRootRequirement}>
                  <Plus className="mr-2 size-4" />
                  Add Requirement
                </Button>
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle className="rounded-full bg-transparent" />

          <ResizablePanel defaultSize={53} minSize={36}>
            <div className={cn(panelClassName, "flex h-full flex-col")}>
              <div className="border-b border-[var(--border)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".docx,.pdf,.csv"
                      onChange={() => setDropActive(false)}
                    />
                    <Button variant="outline" className="rounded-full" onClick={() => fileInputRef.current?.click()}>
                      <FileInput className="mr-2 size-4" />
                      Import
                    </Button>
                    <Button className="rounded-full" onClick={startAnalysis} disabled={analysisRunning}>
                      {analysisRunning ? <Spinner className="mr-2 size-4" /> : <Sparkles className="mr-2 size-4" />}
                      Analyze & Tag
                    </Button>
                    <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)]/70 px-2 py-1">
                      <Input
                        value={versionTag}
                        onChange={(event) => setVersionTag(event.target.value)}
                        className="h-8 w-28 border-0 bg-transparent px-2 focus-visible:ring-0"
                        aria-label="Baseline version tag"
                      />
                      <Button variant="secondary" className="rounded-full">
                        <ClipboardCheck className="mr-2 size-4" />
                        Lock Baseline
                      </Button>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="rounded-full">
                        Export
                        <ChevronDown className="ml-2 size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem>Export CSV matrix</DropdownMenuItem>
                      <DropdownMenuItem>Export review packet</DropdownMenuItem>
                      <DropdownMenuItem>Export baseline JSON</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.002 }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDropActive(true);
                  }}
                  onDragLeave={() => setDropActive(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDropActive(false);
                    startAnalysis();
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "relative mt-4 w-full overflow-hidden rounded-[28px] border border-dashed px-5 py-7 text-left transition-all",
                    dropActive
                      ? "border-[color:color-mix(in_srgb,var(--primary)_46%,transparent)] bg-[color:color-mix(in_srgb,var(--primary)_10%,transparent)]"
                      : "border-[var(--border)] bg-[color:color-mix(in_srgb,var(--card)_74%,transparent)]",
                  )}
                >
                  <AnimatePresence>
                    {dropActive ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-[radial-gradient(circle_at_center,color-mix(in_srgb,var(--primary)_18%,transparent),transparent_68%)]"
                      />
                    ) : null}
                  </AnimatePresence>
                  <div className="relative flex flex-wrap items-center gap-4">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--primary),#57b0ff)] text-white shadow-[0_16px_40px_rgba(10,132,255,0.32)]">
                      <UploadCloud className="size-6" />
                    </div>
                    <div className="space-y-1">
                      <div className="text-base font-semibold text-[var(--text-primary)]">
                        Drop requirements file here or click to browse
                      </div>
                      <div className="text-sm text-[var(--text-secondary)]">
                        Accepts .docx, .pdf, and .csv for AI parsing, tagging, and conflict detection.
                      </div>
                    </div>
                  </div>
                </motion.button>
              </div>

              <div className="flex-1 overflow-auto p-4">
                <AnimatePresence mode="wait">
                  {selectedRequirement ? (
                    <motion.div
                      key={selectedRequirement.id}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      className="space-y-5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-2">
                          <div className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-secondary)]">
                            {selectedRequirement.id} / {flatRows.find((row) => row.id === selectedRequirement.id)?.trail.join(" > ") || "Root Epic"}
                          </div>
                          {titleEditing ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <Input
                                value={titleDraft}
                                onChange={(event) => setTitleDraft(event.target.value)}
                                className="h-11 min-w-[320px] rounded-full"
                              />
                              <Button className="rounded-full" onClick={saveTitle}>
                                Save
                              </Button>
                              <Button variant="outline" className="rounded-full" onClick={() => setTitleEditing(false)}>
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setTitleEditing(true)}
                              className="text-left text-3xl font-semibold tracking-tight text-[var(--text-primary)]"
                            >
                              {selectedRequirement.title}
                            </button>
                          )}
                        </div>
                        <Button variant="outline" className="rounded-full" onClick={() => setSelectedId(null)}>
                          All requirements
                        </Button>
                      </div>

                      <Tabs defaultValue="overview" className="space-y-4">
                        <TabsList variant="line" className="flex w-full flex-wrap justify-start gap-2 rounded-full bg-transparent p-0">
                          <TabsTrigger value="overview" className="rounded-full px-4 py-2 data-active:bg-[var(--card)]">Overview</TabsTrigger>
                          <TabsTrigger value="standards" className="rounded-full px-4 py-2 data-active:bg-[var(--card)]">Linked Standards</TabsTrigger>
                          <TabsTrigger value="design" className="rounded-full px-4 py-2 data-active:bg-[var(--card)]">Design Elements</TabsTrigger>
                          <TabsTrigger value="tests" className="rounded-full px-4 py-2 data-active:bg-[var(--card)]">Test Cases</TabsTrigger>
                          <TabsTrigger value="history" className="rounded-full px-4 py-2 data-active:bg-[var(--card)]">History</TabsTrigger>
                          <TabsTrigger value="comments" className="rounded-full px-4 py-2 data-active:bg-[var(--card)]">Comments</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-4">
                          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_320px]">
                            <div className="space-y-4 rounded-[28px] border border-[var(--border)] bg-[var(--card)]/72 p-5">
                              <div>
                                <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">Description</div>
                                <p className="mt-2 text-sm leading-7 text-[var(--text-primary)]">{selectedRequirement.description}</p>
                              </div>
                              <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                  <div className="mb-2 text-[11px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">Type</div>
                                  <Select value={selectedRequirement.type} onValueChange={(value) => updateSelected((node) => ({ ...node, type: value as RequirementType }))}>
                                    <SelectTrigger className="h-11 w-full rounded-[18px]"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      {Object.keys(typeMeta).map((value) => (
                                        <SelectItem key={value} value={value}>{value}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <div className="mb-2 text-[11px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">Priority</div>
                                  <Select value={selectedRequirement.priority} onValueChange={(value) => updateSelected((node) => ({ ...node, priority: value as RequirementPriority }))}>
                                    <SelectTrigger className="h-11 w-full rounded-[18px]"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="P1">P1</SelectItem>
                                      <SelectItem value="P2">P2</SelectItem>
                                      <SelectItem value="P3">P3</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div>
                                <div className="mb-2 text-[11px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">Acceptance Criteria</div>
                                <Textarea
                                  value={selectedRequirement.acceptanceCriteria}
                                  onChange={(event) => updateSelected((node) => ({ ...node, acceptanceCriteria: event.target.value }))}
                                  className="min-h-[140px] rounded-[20px]"
                                />
                              </div>
                            </div>
                            <div className="space-y-4">
                              <div className={cn("rounded-[28px] border p-5", shellTone(selectedRequirement.ambiguity))}>
                                <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">Ambiguity Score</div>
                                <div className={cn("mt-3 text-4xl font-semibold", ambiguityTone(selectedRequirement.ambiguity))}>{selectedRequirement.ambiguity}</div>
                                <p className="mt-3 text-sm leading-7 text-[var(--text-primary)]">{selectedRequirement.ambiguityExplanation}</p>
                              </div>
                              <div className="rounded-[28px] border border-[var(--border)] bg-[var(--card)]/72 p-5">
                                <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">Linked Elements</div>
                                <div className="mt-3 text-3xl font-semibold text-[var(--text-primary)]">{selectedRequirement.linkedElements}</div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {selectedRequirement.designElements.map((item) => (
                                    <span key={item} className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--text-secondary)]">
                                      {item}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </TabsContent>
                        <TabsContent value="standards">
                          <div className="rounded-[28px] border border-[var(--border)] bg-[var(--card)]/72 p-5">
                            <div className="mb-4 text-[11px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">Standards linked to this requirement</div>
                            <div className="grid gap-3">
                              {selectedRequirement.standards.map((item) => (
                                <div key={item} className="rounded-[20px] border border-[var(--border)] bg-white/50 p-4 dark:bg-white/5">{item}</div>
                              ))}
                            </div>
                          </div>
                        </TabsContent>
                        <TabsContent value="design">
                          <div className="grid gap-3 md:grid-cols-2">
                            {selectedRequirement.designElements.map((item) => (
                              <div key={item} className="rounded-[24px] border border-[var(--border)] bg-[var(--card)]/72 p-4">
                                <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
                                  <Target className="size-4 text-[var(--primary)]" />
                                  {item}
                                </div>
                                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                                  Traced from the active baseline and waiting for interface confirmation.
                                </p>
                              </div>
                            ))}
                          </div>
                        </TabsContent>
                        <TabsContent value="tests">
                          <div className="space-y-3 rounded-[28px] border border-[var(--border)] bg-[var(--card)]/72 p-5">
                            {selectedRequirement.testCases.map((item) => (
                              <div key={item} className="flex items-center gap-3 rounded-[20px] border border-[var(--border)] px-4 py-3">
                                <CheckCircle2 className="size-4 text-emerald-500" />
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>
                        </TabsContent>
                        <TabsContent value="history">
                          <div className="space-y-3 rounded-[28px] border border-[var(--border)] bg-[var(--card)]/72 p-5">
                            {selectedRequirement.history.map((item) => (
                              <div key={item} className="rounded-[20px] border border-[var(--border)] px-4 py-3 text-sm text-[var(--text-primary)]">{item}</div>
                            ))}
                          </div>
                        </TabsContent>
                        <TabsContent value="comments">
                          <div className="space-y-4">
                            {selectedRequirement.comments.map((comment) => (
                              <div key={comment.id} className="flex gap-3 rounded-[24px] border border-[var(--border)] bg-[var(--card)]/72 p-4">
                                <Avatar className="size-10">
                                  <AvatarFallback>{comment.initials}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-[var(--text-primary)]">{comment.author}</span>
                                    <span className="text-xs text-[var(--text-secondary)]">{comment.timestamp}</span>
                                  </div>
                                  <p className="mt-2 text-sm leading-7 text-[var(--text-primary)]">{comment.text}</p>
                                  <Button variant="link" className="mt-2 h-auto px-0 text-xs">Reply</Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </TabsContent>
                      </Tabs>

                      <div className="rounded-[28px] border border-[var(--border)] bg-[var(--card)]/72 p-5">
                        <div className="mb-4 text-[11px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">Comment Thread</div>
                        <div className="space-y-4">
                          {selectedRequirement.comments.map((comment) => (
                            <div key={comment.id} className="flex gap-3">
                              <Avatar className="size-10">
                                <AvatarFallback>{comment.initials}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 rounded-[20px] border border-[var(--border)] px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-[var(--text-primary)]">{comment.author}</span>
                                  <span className="text-xs text-[var(--text-secondary)]">{comment.timestamp}</span>
                                </div>
                                <p className="mt-2 text-sm leading-7 text-[var(--text-primary)]">{comment.text}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 rounded-[20px] border border-[var(--border)] bg-white/50 p-3 dark:bg-white/5">
                          <Textarea
                            value={replyDraft}
                            onChange={(event) => setReplyDraft(event.target.value)}
                            placeholder="Reply with review context, verification notes, or regulatory rationale"
                            className="min-h-[110px] border-0 bg-transparent px-1 focus-visible:ring-0"
                          />
                          <div className="mt-3 flex justify-end">
                            <Button className="rounded-full" onClick={addReply}>Post reply</Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="list-view"
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 16 }}
                      className="space-y-4"
                    >
                      <div className="rounded-[24px] border border-amber-500/20 bg-amber-500/10 px-5 py-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                              Conflict detector found {conflictCount} issues in the active baseline
                            </div>
                            <div className="mt-1 text-sm text-[var(--text-secondary)]">
                              Overlapping wording, unverifiable criteria, and missing standards links were detected.
                            </div>
                          </div>
                          <Button variant="secondary" className="rounded-full">Review</Button>
                        </div>
                      </div>
                      <DataTable ariaLabel="Requirements list" caption="All requirements" columns={columns} data={flatRows} pageSize={6} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle className="rounded-full bg-transparent" />

          <ResizablePanel defaultSize={26} minSize={22}>
            <div className={cn(panelClassName, "h-full overflow-auto p-4")}>
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.22em] text-[var(--text-secondary)]">AI Gap Analyzer</div>
                    <div className="mt-2 text-xl font-semibold text-[var(--text-primary)]">Coverage and issue clustering</div>
                  </div>
                  <Button className="rounded-full" onClick={runGapAnalysis} disabled={gapScanning}>
                    {gapScanning ? <Spinner className="mr-2 size-4" /> : <Bot className="mr-2 size-4" />}
                    Run Gap Analysis
                  </Button>
                </div>

                <div className="relative overflow-hidden rounded-[28px] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(10,132,255,0.08),transparent)] p-4">
                  <AnimatePresence>
                    {gapScanning ? (
                      <motion.div
                        initial={{ x: "-120%" }}
                        animate={{ x: "120%" }}
                        exit={{ opacity: 0 }}
                        transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.2, ease: "linear" }}
                        className="absolute inset-y-0 w-1/2 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent)]"
                      />
                    ) : null}
                  </AnimatePresence>
                  <div className="relative flex items-center justify-between gap-4">
                    <ProgressRing percentage={coverage} label="Standard coverage" size={120} color="var(--primary)" />
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-[var(--text-primary)]">{coverage}% of tracked clauses covered</div>
                      <p className="text-sm leading-7 text-[var(--text-secondary)]">
                        AI is comparing the current requirement graph against IEC, ISO, and internal verification libraries to surface blind spots before design promotion.
                      </p>
                    </div>
                  </div>
                </div>

                {(["Missing Regulatory", "Unverifiable", "Orphan", "Duplicate"] as GapItem["group"][]).map((group) => {
                  const items = gapResults.filter((item) => item.group === group);
                  if (!items.length) {
                    return null;
                  }
                  const meta = gapMeta[group];
                  const Icon = meta.icon;

                  return (
                    <div key={group} className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                        <Icon className={cn("size-4", meta.color)} />
                        <span>{group}</span>
                        <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-xs text-[var(--text-secondary)]">{items.length}</span>
                      </div>
                      {items.map((item) => (
                        <motion.div key={item.id} layout className="rounded-[24px] border border-[var(--border)] bg-[var(--card)]/72 p-4">
                          <div className="flex items-start gap-3">
                            <div className={cn("mt-1", meta.color)}><Icon className="size-4" /></div>
                            <div className="min-w-0 flex-1 space-y-3">
                              <p className="text-sm leading-7 text-[var(--text-primary)]">{item.description}</p>
                              <div className="rounded-[18px] border border-[var(--border)] bg-white/50 p-3 text-sm text-[var(--text-secondary)] dark:bg-white/5">
                                <div className="mb-1 text-[11px] uppercase tracking-[0.18em] text-[var(--text-secondary)]">AI Suggested Fix</div>
                                {item.suggestion}
                              </div>
                              <div className="flex items-center gap-2">
                                <Button size="sm" className="rounded-full" onClick={() => setGapResults((current) => current.filter((gap) => gap.id !== item.id))}>
                                  Accept
                                </Button>
                                <Button variant="outline" size="sm" className="rounded-full" onClick={() => setGapResults((current) => current.filter((gap) => gap.id !== item.id))}>
                                  Dismiss
                                </Button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <Dialog open={analysisOpen} onOpenChange={setAnalysisOpen}>
        <DialogContent showCloseButton={false} className="max-w-6xl rounded-[32px] border-[var(--border)] bg-[#07111e]/96 p-0 text-white shadow-[0_40px_120px_rgba(5,10,18,0.65)]">
          <div className="border-b border-white/10 px-6 py-5">
            <DialogHeader>
              <DialogTitle className="text-xl text-white">AI Import Analysis</DialogTitle>
              <DialogDescription className="text-slate-300">
                Terminal-style parsing stream with tagging, conflict detection, and preview before import.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="grid gap-0 xl:grid-cols-[minmax(0,1.1fr)_380px]">
            <div className="border-r border-white/10 p-6">
              <AIStreamOutput
                className="border-white/10 bg-[linear-gradient(180deg,rgba(8,17,30,0.82),rgba(12,24,42,0.92))] text-white"
                phases={["Parsing document...", "Identifying requirements...", "Classifying FR/NFR/REG...", "Detecting conflicts...", "Analysis complete"]}
                tokenBudget={1200}
                text='{"phase":"complete","requirements":3,"conflicts":1,"baseline":"candidate","notes":["tagged for standards linkage","scored ambiguity for every requirement","generated preview rows for operator confirmation"]}'
              />
            </div>
            <div className="space-y-4 p-6">
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-3 text-sm font-medium text-white">
                  <ScanSearch className="size-4 text-cyan-300" />
                  Analysis status
                </div>
                <div className="mt-3 text-sm leading-7 text-slate-300">
                  {analysisRunning
                    ? "Streaming classification trace. Preview table unlocks when the AI pass completes."
                    : "Preview ready. Confirm import to push tagged requirements into the active baseline."}
                </div>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
                  <FileSpreadsheet className="size-4 text-emerald-300" />
                  Results preview
                </div>
                {analysisReady ? (
                  <div className="space-y-3">
                    {previewRows.map((row) => (
                      <div key={row.id} className="rounded-[18px] border border-white/10 bg-black/20 px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-medium text-white">{row.title}</div>
                            <div className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">{row.id} / {row.source}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={cn("rounded-full px-2 py-1 text-[10px] font-semibold", typeMeta[row.type as RequirementType].className)}>{row.type}</span>
                            <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] text-slate-300">{row.priority}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-[18px] border border-white/10 bg-black/20 px-4 py-6 text-sm text-slate-300">
                    <Spinner className="size-4" />
                    Preparing preview table...
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="border-t border-white/10 bg-black/20">
            <Button variant="outline" className="rounded-full border-white/15 bg-transparent text-white hover:bg-white/10" onClick={() => setAnalysisOpen(false)}>
              Cancel
            </Button>
            <Button className="rounded-full bg-[linear-gradient(135deg,#0a84ff,#30d158)] text-white" disabled={!analysisReady} onClick={confirmImport}>
              Confirm Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
