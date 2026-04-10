"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BrainCircuit,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  Cpu,
  GitCompareArrows,
  History,
  PlayCircle,
  Radar,
  ShieldCheck,
  Square,
  Workflow,
} from "lucide-react";
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar as RadarShape, RadarChart } from "recharts";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { ChartContainer } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

type ProviderId = "twinsuite" | "gpt4o" | "claude" | "gemini";

interface ProviderOption {
  id: ProviderId;
  label: string;
  logo: string;
  accent: string;
  surface: string;
}

interface QualityScore {
  metric: string;
  value: number;
}

interface DesignVariant {
  id: string;
  providerId: ProviderId;
  providerLabel: string;
  overall: number;
  quality: QualityScore[];
  requirementsCovered: number;
  hazards: number;
  components: number;
  sections: Array<{ key: string; label: string; color: string; payload: Record<string, unknown> }>;
  differences: string[];
}

interface VersionEntry {
  id: string;
  label: string;
  timestamp: string;
  providerSummary: string;
  overall: number;
  variants: DesignVariant[];
}

const phaseLabels = [
  "Requirements Analysis",
  "Functional Decomposition",
  "Architecture",
  "Component Selection",
  "Risk Items",
  "Test Specs",
];

const providerOptions: ProviderOption[] = [
  {
    id: "twinsuite",
    label: "TwinSuite Heuristic",
    logo: "TS",
    accent: "from-cyan-400 to-blue-500",
    surface: "border-cyan-400/20 bg-cyan-400/8",
  },
  {
    id: "gpt4o",
    label: "GPT-4o",
    logo: "4O",
    accent: "from-sky-500 to-indigo-500",
    surface: "border-sky-500/20 bg-sky-500/8",
  },
  {
    id: "claude",
    label: "Claude Opus",
    logo: "CO",
    accent: "from-orange-400 to-rose-500",
    surface: "border-orange-400/20 bg-orange-400/8",
  },
  {
    id: "gemini",
    label: "Gemini Pro",
    logo: "GP",
    accent: "from-fuchsia-500 to-violet-500",
    surface: "border-fuchsia-500/20 bg-fuchsia-500/8",
  },
];

const baselineOptions = ["BL-2026.04", "BL-2026.03", "BL-2026.02"];

const radarConfig = {
  score: {
    label: "Quality",
    color: "var(--primary)",
  },
};

const versionSeed: VersionEntry[] = [
  {
    id: "v3",
    label: "v3",
    timestamp: "Apr 07, 2026 18:22",
    providerSummary: "GPT-4o",
    overall: 91,
    variants: [],
  },
  {
    id: "v2",
    label: "v2",
    timestamp: "Apr 06, 2026 20:08",
    providerSummary: "TwinSuite Heuristic",
    overall: 87,
    variants: [],
  },
  {
    id: "v1",
    label: "v1",
    timestamp: "Apr 05, 2026 14:42",
    providerSummary: "Claude Opus",
    overall: 84,
    variants: [],
  },
];

function buildVariant(provider: ProviderOption, baseline: string): DesignVariant {
  const variants: Record<ProviderId, Omit<DesignVariant, "id" | "providerId" | "providerLabel">> = {
    twinsuite: {
      overall: 88,
      quality: [
        { metric: "Coverage", value: 91 },
        { metric: "Safety", value: 93 },
        { metric: "Clarity", value: 79 },
        { metric: "Modularity", value: 87 },
        { metric: "Compliance", value: 90 },
        { metric: "Verifiability", value: 84 },
      ],
      requirementsCovered: 23,
      hazards: 12,
      components: 16,
      sections: [
        { key: "meta", label: "meta", color: "border-cyan-400", payload: { baseline, provider: provider.label, confidence: "0.88", status: "candidate" } },
        { key: "requirements_mapping", label: "requirements_mapping", color: "border-sky-500", payload: { mapped: 23, uncovered: ["REQ-003"], criticalPaths: ["therapy-control", "alarm-relay"] } },
        { key: "functional_decomposition", label: "functional_decomposition", color: "border-emerald-500", payload: { services: ["Dose Estimator", "Connectivity Supervisor", "Alarm Bridge"], notes: "Separates therapy loop from integration workflows." } },
        { key: "architecture", label: "architecture", color: "border-violet-500", payload: { topology: "Event-driven clinical core with isolated safety kernel", interfaces: 8 } },
        { key: "components", label: "components", color: "border-amber-500", payload: { selected: ["Safety MCU", "Battery board", "Connectivity module"], rationale: "Optimized for deterministic supervision." } },
        { key: "software_modules", label: "software_modules", color: "border-pink-500", payload: { modules: ["therapy-core", "alarm-broker", "audit-journal", "gateway-sync"] } },
        { key: "interfaces", label: "interfaces", color: "border-cyan-500", payload: { internal: 6, external: 2, contractStyle: "typed event contracts" } },
        { key: "risk_items", label: "risk_items", color: "border-rose-500", payload: { identified: 12, highlights: ["sensor dropout", "alarm queue saturation", "update package integrity"] } },
        { key: "test_specs", label: "test_specs", color: "border-lime-500", payload: { suites: ["integration", "timing", "fault-injection"], generated: 18 } },
        { key: "compliance_hints", label: "compliance_hints", color: "border-slate-500", payload: { standards: ["IEC 62304", "ISO 14971", "IEC 60601"], nextActions: ["link cybersecurity maintenance requirement"] } },
      ],
      differences: ["More conservative hazard set", "Cleaner module boundaries", "Higher emphasis on deterministic watchdog logic"],
    },
    gpt4o: {
      overall: 93,
      quality: [
        { metric: "Coverage", value: 95 },
        { metric: "Safety", value: 91 },
        { metric: "Clarity", value: 92 },
        { metric: "Modularity", value: 88 },
        { metric: "Compliance", value: 93 },
        { metric: "Verifiability", value: 90 },
      ],
      requirementsCovered: 24,
      hazards: 10,
      components: 15,
      sections: [
        { key: "meta", label: "meta", color: "border-sky-500", payload: { baseline, provider: provider.label, confidence: "0.93", status: "recommended" } },
        { key: "requirements_mapping", label: "requirements_mapping", color: "border-cyan-500", payload: { mapped: 24, uncovered: [], criticalPaths: ["therapy-loop", "clinical-ui", "hospital-bridge"] } },
        { key: "functional_decomposition", label: "functional_decomposition", color: "border-emerald-500", payload: { services: ["Therapy Core", "Sensor Fusion", "Clinical Workflow Orchestrator"], notes: "Separates clinician-facing orchestration from safety-critical timing." } },
        { key: "architecture", label: "architecture", color: "border-violet-500", payload: { topology: "Safety kernel with orchestrated service shell", interfaces: 9 } },
        { key: "components", label: "components", color: "border-amber-500", payload: { selected: ["ARM control board", "Redundant alarm driver", "Secure update enclave"], rationale: "Balanced for traceability and change isolation." } },
        { key: "software_modules", label: "software_modules", color: "border-pink-500", payload: { modules: ["therapy-kernel", "sensor-fusion", "ui-session", "integration-gateway", "trace-engine"] } },
        { key: "interfaces", label: "interfaces", color: "border-blue-500", payload: { internal: 7, external: 2, contractStyle: "JSON IR + typed command events" } },
        { key: "risk_items", label: "risk_items", color: "border-rose-500", payload: { identified: 10, highlights: ["operator override race", "stale sensor data", "network outage during alarm relay"] } },
        { key: "test_specs", label: "test_specs", color: "border-lime-500", payload: { suites: ["component", "integration", "formal timing"], generated: 20 } },
        { key: "compliance_hints", label: "compliance_hints", color: "border-slate-500", payload: { standards: ["IEC 62304", "ISO 14971", "IEC 62366"], nextActions: ["promote to simulation and traceability"] } },
      ],
      differences: ["Best requirement coverage", "Clearer operator workflow decomposition", "Lower hazard count but stronger verification scaffolding"],
    },
    claude: {
      overall: 86,
      quality: [
        { metric: "Coverage", value: 84 },
        { metric: "Safety", value: 89 },
        { metric: "Clarity", value: 90 },
        { metric: "Modularity", value: 80 },
        { metric: "Compliance", value: 88 },
        { metric: "Verifiability", value: 83 },
      ],
      requirementsCovered: 22,
      hazards: 11,
      components: 14,
      sections: [
        { key: "meta", label: "meta", color: "border-orange-400", payload: { baseline, provider: provider.label, confidence: "0.86", status: "candidate" } },
        { key: "requirements_mapping", label: "requirements_mapping", color: "border-emerald-500", payload: { mapped: 22, uncovered: ["REQ-003", "REQ-005"], criticalPaths: ["therapy-core", "alarm-ack"] } },
        { key: "functional_decomposition", label: "functional_decomposition", color: "border-amber-500", payload: { services: ["Control Logic", "Alarm Broker", "Verification Adapter"], notes: "Emphasizes narrative clarity and trace notes." } },
        { key: "architecture", label: "architecture", color: "border-rose-500", payload: { topology: "Layered controller with documented handoff boundaries", interfaces: 7 } },
        { key: "components", label: "components", color: "border-fuchsia-500", payload: { selected: ["Control SoC", "Safety relay board", "Encrypted storage"], rationale: "Biases toward explainability over minimal part count." } },
        { key: "software_modules", label: "software_modules", color: "border-violet-500", payload: { modules: ["control", "alarms", "verification", "telemetry"] } },
        { key: "interfaces", label: "interfaces", color: "border-cyan-500", payload: { internal: 5, external: 2, contractStyle: "service contracts with review notes" } },
        { key: "risk_items", label: "risk_items", color: "border-rose-500", payload: { identified: 11, highlights: ["manual override drift", "relay timeout"] } },
        { key: "test_specs", label: "test_specs", color: "border-lime-500", payload: { suites: ["acceptance", "integration"], generated: 15 } },
        { key: "compliance_hints", label: "compliance_hints", color: "border-slate-500", payload: { standards: ["IEC 62304", "ISO 14971"], nextActions: ["decompose network synchronization"] } },
      ],
      differences: ["Most human-readable structure", "Lower coverage for integration requirements", "Moderate verification depth"],
    },
    gemini: {
      overall: 84,
      quality: [
        { metric: "Coverage", value: 82 },
        { metric: "Safety", value: 86 },
        { metric: "Clarity", value: 81 },
        { metric: "Modularity", value: 90 },
        { metric: "Compliance", value: 83 },
        { metric: "Verifiability", value: 80 },
      ],
      requirementsCovered: 21,
      hazards: 9,
      components: 17,
      sections: [
        { key: "meta", label: "meta", color: "border-fuchsia-500", payload: { baseline, provider: provider.label, confidence: "0.84", status: "candidate" } },
        { key: "requirements_mapping", label: "requirements_mapping", color: "border-sky-500", payload: { mapped: 21, uncovered: ["REQ-005"], criticalPaths: ["scheduler", "data-bus", "device-gateway"] } },
        { key: "functional_decomposition", label: "functional_decomposition", color: "border-emerald-500", payload: { services: ["Scheduler", "State Publisher", "Diagnostics Mesh"], notes: "Strong component architecture but needs more compliance hints." } },
        { key: "architecture", label: "architecture", color: "border-violet-500", payload: { topology: "Highly modular event mesh", interfaces: 11 } },
        { key: "components", label: "components", color: "border-amber-500", payload: { selected: ["Messaging bus", "Edge gateway", "Watchdog MCU"], rationale: "Optimized for subsystem isolation." } },
        { key: "software_modules", label: "software_modules", color: "border-pink-500", payload: { modules: ["event-mesh", "diagnostics", "alarm-relay", "ui-flow"] } },
        { key: "interfaces", label: "interfaces", color: "border-cyan-500", payload: { internal: 8, external: 3, contractStyle: "event contracts + schema registry" } },
        { key: "risk_items", label: "risk_items", color: "border-rose-500", payload: { identified: 9, highlights: ["schema drift", "event backlog"] } },
        { key: "test_specs", label: "test_specs", color: "border-lime-500", payload: { suites: ["contract", "performance"], generated: 14 } },
        { key: "compliance_hints", label: "compliance_hints", color: "border-slate-500", payload: { standards: ["IEC 62304"], nextActions: ["raise usability and traceability hints"] } },
      ],
      differences: ["Best module isolation", "Lowest compliance completeness", "More aggressive interface decomposition"],
    },
  };

  return {
    ...variants[provider.id],
    id: `${provider.id}-${baseline}`,
    providerId: provider.id,
    providerLabel: provider.label,
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function highlightJsonSnippet(value: string) {
  return escapeHtml(value)
    .replace(/("(?:\\.|[^"])*")(?=\s*:)/g, '<span class="text-sky-300">$1</span>')
    .replace(/:\s*("(?:\\.|[^"])*")/g, ': <span class="text-emerald-300">$1</span>')
    .replace(/\b(true|false|null)\b/g, '<span class="text-fuchsia-300">$1</span>')
    .replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="text-amber-300">$1</span>');
}

function ProviderCard({
  option,
  active,
  onClick,
}: {
  option: ProviderOption;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-[24px] border px-4 py-4 text-left transition-all",
        active
          ? "border-[color:color-mix(in_srgb,var(--primary)_28%,transparent)] bg-[color:color-mix(in_srgb,var(--primary)_10%,transparent)] shadow-[0_18px_40px_rgba(10,132,255,0.18)]"
          : "border-[var(--border)] bg-[var(--card)]/72 hover:bg-white/70 dark:hover:bg-white/5",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={cn("flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br text-sm font-semibold text-white", option.accent)}>
            {option.logo}
          </div>
          <div>
            <div className="text-sm font-medium text-[var(--text-primary)]">{option.label}</div>
            <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">Provider</div>
          </div>
        </div>
        <div className={cn("flex size-6 items-center justify-center rounded-full border", active ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--border)] text-transparent")}>
          <Check className="size-3.5" />
        </div>
      </div>
    </button>
  );
}

export function DesignEngine() {
  const [abMode, setAbMode] = React.useState(false);
  const [activeProviders, setActiveProviders] = React.useState<ProviderId[]>(["gpt4o"]);
  const [baseline, setBaseline] = React.useState(baselineOptions[0]);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [phaseIndex, setPhaseIndex] = React.useState(0);
  const [streamedJson, setStreamedJson] = React.useState("");
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [promotionOpen, setPromotionOpen] = React.useState(false);
  const [compareOpen, setCompareOpen] = React.useState(false);
  const [diffMode, setDiffMode] = React.useState(false);
  const [compareSelection, setCompareSelection] = React.useState<string[]>([]);
  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(
    () => new Set(["meta", "requirements_mapping", "architecture"]),
  );
  const [versions, setVersions] = React.useState(versionSeed);
  const [currentVariants, setCurrentVariants] = React.useState<DesignVariant[]>([
    buildVariant(providerOptions.find((provider) => provider.id === "gpt4o")!, baselineOptions[0]),
  ]);

  const activeVariant = currentVariants[0];
  const currentStreamSource = JSON.stringify(
    (currentVariants[0] ?? buildVariant(providerOptions[1], baseline)).sections.reduce<Record<string, unknown>>(
      (accumulator, section) => {
        accumulator[section.key] = section.payload;
        return accumulator;
      },
      {},
    ),
    null,
    2,
  );

  React.useEffect(() => {
    if (!isGenerating) {
      return;
    }

    setPhaseIndex(0);
    setStreamedJson("");

    const phaseTimer = window.setInterval(() => {
      setPhaseIndex((current) => Math.min(current + 1, phaseLabels.length - 1));
    }, 900);

    const streamTimer = window.setInterval(() => {
      setStreamedJson((current) => currentStreamSource.slice(0, Math.min(current.length + 9, currentStreamSource.length)));
    }, 24);

    const completeTimer = window.setTimeout(() => {
      const selectedProviders = providerOptions.filter((provider) => activeProviders.includes(provider.id));
      const nextVariants = selectedProviders.map((provider) => buildVariant(provider, baseline));
      const overall = Math.round(nextVariants.reduce((sum, variant) => sum + variant.overall, 0) / nextVariants.length);

      setCurrentVariants(nextVariants);
      setVersions((current) => [
        {
          id: `v${current.length + 1}`,
          label: `v${current.length + 1}`,
          timestamp: "Apr 07, 2026 18:45",
          providerSummary: nextVariants.map((variant) => variant.providerLabel).join(" / "),
          overall,
          variants: nextVariants,
        },
        ...current,
      ]);
      setIsGenerating(false);
      setStreamedJson(currentStreamSource);
    }, 5600);

    return () => {
      window.clearInterval(phaseTimer);
      window.clearInterval(streamTimer);
      window.clearTimeout(completeTimer);
    };
  }, [activeProviders, baseline, currentStreamSource, isGenerating]);

  function toggleProvider(id: ProviderId) {
    if (abMode) {
      setActiveProviders((current) => {
        if (current.includes(id)) {
          return current.length === 1 ? current : current.filter((item) => item !== id);
        }
        return [...current, id].slice(0, 4);
      });
      return;
    }

    setActiveProviders([id]);
  }

  function launchGeneration() {
    setIsGenerating(true);
  }

  function restoreVersion(versionId: string) {
    const version = versions.find((entry) => entry.id === versionId);
    if (!version || !version.variants.length) {
      return;
    }

    setCurrentVariants(version.variants);
    setActiveProviders(version.variants.map((variant) => variant.providerId));
    setAbMode(version.variants.length > 1);
    setHistoryOpen(false);
  }

  return (
    <>
      <div className="mb-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--card)_88%,transparent)] px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-[var(--text-secondary)]">
              <BrainCircuit className="size-3.5 text-[var(--primary)]" />
              AI Design Engine
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)]">Design Generation Core</h1>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
                Stream Design IR in real time, compare providers side by side, then promote the winning baseline into simulation, compliance, and traceability.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="rounded-full" onClick={() => setHistoryOpen(true)}>
              <History className="mr-2 size-4" />
              Version History
            </Button>
            <Button className="h-11 rounded-full bg-[linear-gradient(135deg,#0a84ff,#30d158)] px-6 text-white shadow-[0_18px_40px_rgba(10,132,255,0.24)]" onClick={launchGeneration}>
              {isGenerating ? <Spinner className="mr-2 size-4" /> : <PlayCircle className="mr-2 size-4" />}
              Generate Design
            </Button>
          </div>
        </div>

        <div className="rounded-[32px] border border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--card)_92%,transparent),color-mix(in_srgb,var(--surface)_78%,transparent))] p-4 shadow-[0_24px_70px_rgba(8,15,29,0.14)]">
          <div className="grid gap-4 xl:grid-cols-[1.45fr_320px]">
            <div className="space-y-3">
              <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">Provider selector</div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {providerOptions.map((option) => (
                  <ProviderCard key={option.id} option={option} active={activeProviders.includes(option.id)} onClick={() => toggleProvider(option.id)} />
                ))}
              </div>
              <button
                type="button"
                onClick={() => setAbMode((current) => !current)}
                className={cn(
                  "w-full rounded-[24px] border px-4 py-3 text-left transition-all md:w-auto",
                  abMode ? "border-[var(--primary)] bg-[color:color-mix(in_srgb,var(--primary)_10%,transparent)]" : "border-[var(--border)] bg-[var(--card)]/72",
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#101828,#4f46e5)] text-white">
                    <GitCompareArrows className="size-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[var(--text-primary)]">A/B Compare</div>
                    <div className="text-xs text-[var(--text-secondary)]">Select multiple providers when enabled</div>
                  </div>
                </div>
              </button>
            </div>

            <div className="space-y-4 rounded-[28px] border border-[var(--border)] bg-[var(--card)]/72 p-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">Active requirements baseline</div>
                <Select value={baseline} onValueChange={setBaseline}>
                  <SelectTrigger className="mt-2 h-11 w-full rounded-[18px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {baselineOptions.map((option) => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-[var(--text-secondary)]">1,247 / 100,000 tokens used this month</span>
                  <span className="font-medium text-[var(--text-primary)]">1.2%</span>
                </div>
                <Progress value={1.2} className="mt-3 h-2 rounded-full" />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[20px] border border-[var(--border)] px-3 py-3">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-secondary)]">Active providers</div>
                  <div className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{activeProviders.length}</div>
                </div>
                <div className="rounded-[20px] border border-[var(--border)] px-3 py-3">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-secondary)]">Current score</div>
                  <div className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{currentVariants[0]?.overall ?? "--"}</div>
                </div>
                <div className="rounded-[20px] border border-[var(--border)] px-3 py-3">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-secondary)]">Phase</div>
                  <div className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{phaseLabels[phaseIndex]}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="wait">
          {isGenerating ? (
            <motion.div
              key="generation"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_300px]"
            >
              <div className="overflow-hidden rounded-[34px] border border-[var(--border)] bg-[#07111e] shadow-[0_32px_90px_rgba(5,10,18,0.5)]">
                <div className="border-b border-white/10 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-lg font-semibold text-white">Live generation stream</div>
                    <Button variant="outline" className="rounded-full border-white/15 bg-transparent text-white hover:bg-white/10" onClick={() => setIsGenerating(false)}>
                      <Square className="mr-2 size-4" />
                      Cancel
                    </Button>
                  </div>
                  <div className="mt-5 grid gap-3 md:grid-cols-6">
                    {phaseLabels.map((phase, index) => (
                      <div key={phase} className="space-y-2">
                        <div className={cn("flex items-center gap-2 rounded-full border px-3 py-2 text-xs", index < phaseIndex ? "border-emerald-400/30 bg-emerald-400/12 text-emerald-300" : index === phaseIndex ? "border-sky-400/30 bg-sky-400/12 text-sky-300" : "border-white/10 bg-white/5 text-slate-400")}>
                          {index < phaseIndex ? <Check className="size-3.5" /> : index === phaseIndex ? <Spinner className="size-3.5" /> : <Clock3 className="size-3.5" />}
                          <span className="truncate">{phase}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_280px]">
                  <div className="min-h-[560px] border-r border-white/10 p-5">
                    <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-slate-400">
                      <Cpu className="size-3.5 text-sky-300" />
                      Design IR stream
                    </div>
                    <div className="min-h-[500px] rounded-[26px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(96,165,250,0.12),transparent_30%),rgba(2,6,23,0.84)] p-5 font-mono text-sm leading-7 text-slate-100">
                      <pre
                        className="whitespace-pre-wrap break-words"
                        dangerouslySetInnerHTML={{ __html: highlightJsonSnippet(streamedJson || "{\n  \"status\": \"booting\"\n}") }}
                      />
                      <motion.span
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ duration: 0.8, repeat: Number.POSITIVE_INFINITY }}
                        className="inline-block h-5 w-2 rounded-full bg-sky-400 align-middle"
                      />
                    </div>
                  </div>
                  <div className="space-y-4 p-5">
                    <div className="rounded-[26px] border border-white/10 bg-white/5 p-4">
                      <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Live metrics</div>
                      <div className="mt-4 space-y-4">
                        <div>
                          <div className="text-sm text-slate-300">Requirements covered</div>
                          <div className="mt-1 text-2xl font-semibold text-white">{Math.min(24, phaseIndex * 4 + 4)}/24</div>
                        </div>
                        <div>
                          <div className="text-sm text-slate-300">Hazards identified</div>
                          <div className="mt-1 text-2xl font-semibold text-white">{Math.min(12, phaseIndex * 2)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-slate-300">Components selected</div>
                          <div className="mt-1 text-2xl font-semibold text-white">{Math.min(16, phaseIndex * 3)}</div>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-[26px] border border-white/10 bg-white/5 p-4 text-sm leading-7 text-slate-300">
                      <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-slate-400">
                        <Workflow className="size-3.5 text-emerald-300" />
                        Engine status
                      </div>
                      Requirements are being decomposed into modules, interface boundaries, and verifiable specifications.
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              className="space-y-4"
            >
              {abMode && currentVariants.length > 1 ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">A/B results</div>
                      <div className="mt-1 text-xl font-semibold text-[var(--text-primary)]">Provider comparison grid</div>
                    </div>
                    <Button variant="outline" className="rounded-full" onClick={() => setDiffMode((current) => !current)}>
                      <Radar className="mr-2 size-4" />
                      {diffMode ? "Hide differences" : "Diff viewer"}
                    </Button>
                  </div>
                  <div className={cn("grid gap-4", currentVariants.length === 2 ? "xl:grid-cols-2" : currentVariants.length === 3 ? "xl:grid-cols-3" : "xl:grid-cols-4")}>
                    {currentVariants.map((variant) => {
                      const option = providerOptions.find((provider) => provider.id === variant.providerId)!;
                      return (
                        <div key={variant.id} className="rounded-[32px] border border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--card)_92%,transparent),color-mix(in_srgb,var(--surface)_82%,transparent))] p-5 shadow-[0_24px_70px_rgba(8,15,29,0.14)]">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className={cn("flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br text-sm font-semibold text-white", option.accent)}>{option.logo}</div>
                              <div>
                                <div className="font-medium text-[var(--text-primary)]">{variant.providerLabel}</div>
                                <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">Overall score</div>
                              </div>
                            </div>
                            <div className="rounded-full border border-[var(--border)] px-3 py-1 text-sm font-semibold text-[var(--text-primary)]">{variant.overall}</div>
                          </div>
                          <ChartContainer config={radarConfig} className="mt-5 h-[240px] w-full">
                            <RadarChart data={variant.quality}>
                              <PolarGrid />
                              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                              <RadarShape dataKey="value" stroke="var(--color-score)" fill="var(--color-score)" fillOpacity={0.24} />
                            </RadarChart>
                          </ChartContainer>
                          <div className="mt-4 grid gap-3 sm:grid-cols-3">
                            <div className="rounded-[18px] border border-[var(--border)] px-3 py-3 text-center">
                              <div className="text-xs text-[var(--text-secondary)]">Covered</div>
                              <div className="mt-1 font-semibold text-[var(--text-primary)]">{variant.requirementsCovered}/24</div>
                            </div>
                            <div className="rounded-[18px] border border-[var(--border)] px-3 py-3 text-center">
                              <div className="text-xs text-[var(--text-secondary)]">Hazards</div>
                              <div className="mt-1 font-semibold text-[var(--text-primary)]">{variant.hazards}</div>
                            </div>
                            <div className="rounded-[18px] border border-[var(--border)] px-3 py-3 text-center">
                              <div className="text-xs text-[var(--text-secondary)]">Components</div>
                              <div className="mt-1 font-semibold text-[var(--text-primary)]">{variant.components}</div>
                            </div>
                          </div>
                          {diffMode ? (
                            <div className="mt-4 space-y-2">
                              {variant.differences.map((difference) => (
                                <div key={difference} className="rounded-[18px] border border-[var(--border)] bg-[var(--card)]/72 px-3 py-2 text-sm text-[var(--text-primary)]">
                                  {difference}
                                </div>
                              ))}
                            </div>
                          ) : null}
                          <Button className="mt-5 w-full rounded-full" onClick={() => setCurrentVariants([variant])}>
                            Select This Design
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
                  <div className="rounded-[34px] border border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--card)_92%,transparent),color-mix(in_srgb,var(--surface)_82%,transparent))] p-5 shadow-[0_24px_70px_rgba(8,15,29,0.14)]">
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">Design IR viewer</div>
                        <div className="mt-1 text-xl font-semibold text-[var(--text-primary)]">{activeVariant?.providerLabel}</div>
                      </div>
                      <Button variant="outline" className="rounded-full" onClick={() => setEditOpen(true)}>
                        Edit
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {activeVariant?.sections.map((section) => {
                        const open = expandedSections.has(section.key);
                        return (
                          <motion.section key={section.key} layout className={cn("overflow-hidden rounded-[24px] border-l-4 border border-[var(--border)] bg-[var(--card)]/72", section.color)}>
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedSections((current) => {
                                  const next = new Set(current);
                                  if (next.has(section.key)) {
                                    next.delete(section.key);
                                  } else {
                                    next.add(section.key);
                                  }
                                  return next;
                                })
                              }
                              className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
                            >
                              <div className="font-medium text-[var(--text-primary)]">{section.label}</div>
                              {open ? <ChevronDown className="size-4 text-[var(--text-secondary)]" /> : <ChevronRight className="size-4 text-[var(--text-secondary)]" />}
                            </button>
                            <AnimatePresence initial={false}>
                              {open ? (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                  <pre className="overflow-auto border-t border-[var(--border)] px-4 py-4 font-mono text-sm leading-7 text-[var(--text-primary)]">
                                    {JSON.stringify(section.payload, null, 2)}
                                  </pre>
                                </motion.div>
                              ) : null}
                            </AnimatePresence>
                          </motion.section>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-[28px] border border-[var(--border)] bg-[var(--card)]/72 p-4">
                      <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">Metrics</div>
                      <div className="mt-4 grid gap-3">
                        <div className="rounded-[18px] border border-[var(--border)] px-4 py-3">
                          <div className="text-xs text-[var(--text-secondary)]">Requirements covered</div>
                          <div className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">{activeVariant?.requirementsCovered}/24</div>
                        </div>
                        <div className="rounded-[18px] border border-[var(--border)] px-4 py-3">
                          <div className="text-xs text-[var(--text-secondary)]">Hazards identified</div>
                          <div className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">{activeVariant?.hazards}</div>
                        </div>
                        <div className="rounded-[18px] border border-[var(--border)] px-4 py-3">
                          <div className="text-xs text-[var(--text-secondary)]">Components selected</div>
                          <div className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">{activeVariant?.components}</div>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-[28px] border border-[var(--border)] bg-[var(--card)]/72 p-4">
                      <div className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">Promotion</div>
                      <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
                        Promote this design to unlock downstream simulation, compliance, and traceability pages.
                      </p>
                      <Button className="mt-4 w-full rounded-full" onClick={() => setPromotionOpen(true)}>
                        <ShieldCheck className="mr-2 size-4" />
                        Promote to Active Design
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Drawer open={historyOpen} onOpenChange={setHistoryOpen} direction="right">
        <DrawerContent className="ml-auto h-screen w-full max-w-[420px] rounded-none border-l border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--card)_94%,transparent),color-mix(in_srgb,var(--surface)_84%,transparent))]">
          <DrawerHeader className="border-b border-[var(--border)]">
            <DrawerTitle>Version history</DrawerTitle>
            <DrawerDescription>Restore previous generations or pick two versions for comparison.</DrawerDescription>
          </DrawerHeader>
          <div className="space-y-3 overflow-auto p-4">
            {versions.map((version) => (
              <div key={version.id} className="rounded-[24px] border border-[var(--border)] bg-[var(--card)]/72 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-[var(--text-primary)]">{version.label}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">{version.timestamp}</div>
                    <div className="mt-2 text-sm text-[var(--text-secondary)]">{version.providerSummary}</div>
                  </div>
                  <div className="rounded-full border border-[var(--border)] px-3 py-1 text-sm font-semibold text-[var(--text-primary)]">{version.overall}</div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Button size="sm" className="rounded-full" onClick={() => restoreVersion(version.id)}>Restore</Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    onClick={() =>
                      setCompareSelection((current) => {
                        if (current.includes(version.id)) {
                          return current.filter((item) => item !== version.id);
                        }
                        return [...current, version.id].slice(-2);
                      })
                    }
                  >
                    {compareSelection.includes(version.id) ? "Selected" : "Compare"}
                  </Button>
                </div>
              </div>
            ))}
            <Button className="w-full rounded-full" disabled={compareSelection.length !== 2} onClick={() => setCompareOpen(true)}>
              Compare selected versions
            </Button>
          </div>
        </DrawerContent>
      </Drawer>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-4xl rounded-[30px]">
          <DialogHeader>
            <DialogTitle>Raw Design JSON</DialogTitle>
            <DialogDescription>Monaco-style raw editor surface for quick manual adjustments.</DialogDescription>
          </DialogHeader>
          <Textarea className="min-h-[520px] rounded-[24px] bg-[#0b1020] font-mono text-sm leading-7 text-slate-100" defaultValue={JSON.stringify(activeVariant?.sections.reduce<Record<string, unknown>>((accumulator, section) => ({ ...accumulator, [section.key]: section.payload }), {}), null, 2)} />
        </DialogContent>
      </Dialog>

      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="max-w-5xl rounded-[30px]">
          <DialogHeader>
            <DialogTitle>Version comparison</DialogTitle>
            <DialogDescription>Subsystem-level diff with the most important additions and regressions highlighted.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            {compareSelection.map((versionId) => {
              const version = versions.find((entry) => entry.id === versionId);
              return (
                <div key={versionId} className="rounded-[24px] border border-[var(--border)] bg-[var(--card)]/72 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="font-medium text-[var(--text-primary)]">{version?.label}</div>
                    <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">{version?.providerSummary}</div>
                  </div>
                  <div className="space-y-3">
                    <div className="rounded-[18px] border border-emerald-500/20 bg-emerald-500/8 px-4 py-3 text-sm text-[var(--text-primary)]">
                      Added subsystem isolation around alarm relay and therapy kernel.
                    </div>
                    <div className="rounded-[18px] border border-rose-500/20 bg-rose-500/8 px-4 py-3 text-sm text-[var(--text-primary)]">
                      Lower coverage for network sync requirements remains unresolved in this version.
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={promotionOpen} onOpenChange={setPromotionOpen}>
        <DialogContent className="max-w-xl rounded-[30px]">
          <DialogHeader>
            <DialogTitle>Promote to Active Design</DialogTitle>
            <DialogDescription>Promoting this baseline unlocks additional engineering surfaces.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {["Simulation page access", "Compliance evidence mapping", "Traceability graph activation"].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-[20px] border border-[var(--border)] px-4 py-3">
                <Check className="size-4 text-emerald-500" />
                <span>{item}</span>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setPromotionOpen(false)}>Cancel</Button>
            <Button className="rounded-full" onClick={() => setPromotionOpen(false)}>Confirm Promotion</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
