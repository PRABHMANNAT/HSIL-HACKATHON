"use client";

import "@xyflow/react/dist/style.css";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Battery,
  Bluetooth,
  Bot,
  BrainCircuit,
  Cable,
  ChevronDown,
  Component,
  Cpu,
  DollarSign,
  Download,
  HardDrive,
  HeartPulse,
  Layers3,
  Lock,
  MemoryStick,
  Radio,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Waves,
  Zap,
} from "lucide-react";
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  BackgroundVariant,
  BaseEdge,
  Controls,
  EdgeLabelRenderer,
  getBezierPath,
  Handle,
  MarkerType,
  MiniMap,
  type Connection,
  type Edge,
  type EdgeChange,
  type EdgeProps,
  type Node,
  type NodeChange,
  type NodeProps,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useArchitectureCanvasStore } from "@/store/architecture-canvas-store";

type BlockCategory =
  | "Processing"
  | "Sensing"
  | "Power"
  | "Communication"
  | "Output"
  | "Safety"
  | "Memory";

type SubsystemTone = "MCU" | "Power" | "Sensor" | "RF" | "Display" | "Memory" | "Safety";
type LifecycleState = "Active" | "Preferred" | "Qualified" | "Legacy" | "NRND";
type RedundancyMode = "None" | "Watchdog Partner" | "Active-Passive" | "Dual Channel";
type ProtocolType = "SPI" | "I2C" | "UART" | "CAN" | "USB" | "Analog" | "Power" | "BLE" | "RF";
type ArchitectureNodeKind = "subsystemNode" | "componentNode" | "interfaceNode" | "annotationNode";

type RequirementOption = {
  id: string;
  label: string;
};

type ArchitectureNodeData = {
  kind: ArchitectureNodeKind;
  category: BlockCategory;
  tone: SubsystemTone;
  iconKey: keyof typeof iconMap;
  name: string;
  role: string;
  description: string;
  partNumber?: string;
  manufacturer?: string;
  specsSummary?: string;
  lifecycle?: LifecycleState;
  protocol?: ProtocolType;
  author?: string;
  avatar?: string;
  powerW: number;
  costUSD: number;
  safetyCritical: boolean;
  redundancy: RedundancyMode;
  linkedRequirements: string[];
  notes: string;
  layoutColumn: number;
  layoutRow: number;
};

type ArchitectureEdgeData = {
  protocol: ProtocolType;
  label: string;
  kind: "data" | "power";
};

type ArchitectureNode = Node<ArchitectureNodeData, ArchitectureNodeKind>;
type ArchitectureEdge = Edge<ArchitectureEdgeData, "architectureEdge">;

type BlockTemplate = {
  id: string;
  title: string;
  category: BlockCategory;
  data: Omit<ArchitectureNodeData, "name" | "layoutColumn" | "layoutRow" | "category"> & {
    defaultName: string;
  };
};

const POWER_BUDGET_W = 4.5;
const COST_TARGET_USD = 280;
const LAYOUT_X = 280;
const LAYOUT_Y = 136;

const requirements: RequirementOption[] = [
  { id: "REQ-PACE-001", label: "Pacing pulse timing accuracy" },
  { id: "REQ-PACE-004", label: "Redundant watchdog supervision" },
  { id: "REQ-SAFE-009", label: "Lead fault detection and isolation" },
  { id: "REQ-POWER-012", label: "Battery longevity over service window" },
  { id: "REQ-THER-016", label: "Therapy path discharge protection" },
  { id: "REQ-RF-021", label: "Telemetry coexistence in MICS band" },
  { id: "REQ-USER-024", label: "Programmer interface session security" },
  { id: "REQ-TRACE-031", label: "Trace logging for safety events" },
];

const iconMap = {
  cpu: Cpu,
  battery: Battery,
  sensor: Waves,
  motion: Activity,
  impedance: BrainCircuit,
  shield: ShieldAlert,
  pulse: HeartPulse,
  power: Zap,
  rf: Radio,
  bluetooth: Bluetooth,
  interface: Cable,
  storage: HardDrive,
  memory: MemoryStick,
  note: Sparkles,
  subsystem: Layers3,
  controller: Bot,
  component: Component,
};

const toneClasses: Record<SubsystemTone, string> = {
  MCU: "border-sky-400/40 bg-sky-500/12 text-sky-200",
  Power: "border-amber-400/40 bg-amber-500/12 text-amber-200",
  Sensor: "border-teal-400/40 bg-teal-500/12 text-teal-200",
  RF: "border-violet-400/40 bg-violet-500/12 text-violet-200",
  Display: "border-slate-400/40 bg-slate-500/12 text-slate-200",
  Memory: "border-zinc-400/40 bg-zinc-500/12 text-zinc-100",
  Safety: "border-rose-400/45 bg-rose-500/12 text-rose-200",
};

const toneStroke: Record<SubsystemTone, string> = {
  MCU: "#38bdf8",
  Power: "#f59e0b",
  Sensor: "#14b8a6",
  RF: "#8b5cf6",
  Display: "#94a3b8",
  Memory: "#a1a1aa",
  Safety: "#fb7185",
};

const protocolStroke: Record<ProtocolType, string> = {
  SPI: "#38bdf8",
  I2C: "#14b8a6",
  UART: "#8b5cf6",
  CAN: "#22c55e",
  USB: "#94a3b8",
  Analog: "#f97316",
  Power: "#f59e0b",
  BLE: "#0ea5e9",
  RF: "#c084fc",
};

const blockTemplates: BlockTemplate[] = [
  {
    id: "processing-subsystem",
    title: "Processing Subsystem",
    category: "Processing",
    data: {
      defaultName: "Processing Cluster",
      kind: "subsystemNode",
      tone: "MCU",
      iconKey: "cpu",
      role: "Deterministic control and therapy scheduling",
      description: "Dual-processor control surface for pacing and diagnostics.",
      powerW: 0.18,
      costUSD: 14,
      safetyCritical: true,
      redundancy: "Watchdog Partner",
      linkedRequirements: ["REQ-PACE-001", "REQ-PACE-004"],
      notes: "Align with IEC 62304 software item decomposition.",
    },
  },
  {
    id: "main-mcu",
    title: "Main MCU",
    category: "Processing",
    data: {
      defaultName: "Main MCU",
      kind: "componentNode",
      tone: "MCU",
      iconKey: "controller",
      role: "Primary pacing control loop",
      description: "Executes sensing, pacing, and telemetry orchestration.",
      partNumber: "STM32U585",
      manufacturer: "STMicroelectronics",
      specsSummary: "160 MHz Cortex-M33, TrustZone, ultra-low-power",
      lifecycle: "Active",
      powerW: 0.45,
      costUSD: 9.2,
      safetyCritical: true,
      redundancy: "Watchdog Partner",
      linkedRequirements: ["REQ-PACE-001", "REQ-TRACE-031"],
      notes: "Clock drift model verified in bench simulation.",
    },
  },
  {
    id: "sensing-subsystem",
    title: "Sensing Subsystem",
    category: "Sensing",
    data: {
      defaultName: "Sensing Front End",
      kind: "subsystemNode",
      tone: "Sensor",
      iconKey: "sensor",
      role: "Atrial and ventricular acquisition paths",
      description: "Lead, impedance, and motion feedback into the therapy loop.",
      powerW: 0.12,
      costUSD: 11,
      safetyCritical: true,
      redundancy: "None",
      linkedRequirements: ["REQ-SAFE-009"],
      notes: "Common-mode rejection target remains at 92 dB.",
    },
  },
  {
    id: "accelerometer",
    title: "Accelerometer",
    category: "Sensing",
    data: {
      defaultName: "Accelerometer",
      kind: "componentNode",
      tone: "Sensor",
      iconKey: "motion",
      role: "Rate-adaptive pacing input",
      description: "Tracks activity for pacing profile adjustments.",
      partNumber: "BMA400",
      manufacturer: "Bosch",
      specsSummary: "Low-noise 3-axis accelerometer, 14-bit output",
      lifecycle: "Preferred",
      powerW: 0.06,
      costUSD: 1.8,
      safetyCritical: false,
      redundancy: "None",
      linkedRequirements: ["REQ-PACE-001"],
      notes: "Motion artifact filtering handled on the main MCU.",
    },
  },
  {
    id: "power-subsystem",
    title: "Power Subsystem",
    category: "Power",
    data: {
      defaultName: "Power Domain",
      kind: "subsystemNode",
      tone: "Power",
      iconKey: "battery",
      role: "Charge, conversion, and rail supervision",
      description: "Power budgeting for implant longevity and recharge events.",
      powerW: 0.3,
      costUSD: 24,
      safetyCritical: true,
      redundancy: "Active-Passive",
      linkedRequirements: ["REQ-POWER-012"],
      notes: "Keep amber rails isolated in review mode.",
    },
  },
  {
    id: "pmic",
    title: "Power Management IC",
    category: "Power",
    data: {
      defaultName: "Power Management IC",
      kind: "componentNode",
      tone: "Power",
      iconKey: "power",
      role: "Buck-boost conversion and charging control",
      description: "Generates rails for pacing, telemetry, and diagnostics.",
      partNumber: "MAX77659",
      manufacturer: "Analog Devices / Maxim",
      specsSummary: "High-efficiency buck-boost PMIC with charger path",
      lifecycle: "Active",
      powerW: 0.2,
      costUSD: 5.7,
      safetyCritical: true,
      redundancy: "Active-Passive",
      linkedRequirements: ["REQ-POWER-012"],
      notes: "Thermal margin remains above 12 C at recharge peak.",
    },
  },
  {
    id: "ble-module",
    title: "BLE Telemetry",
    category: "Communication",
    data: {
      defaultName: "Bluetooth BLE",
      kind: "componentNode",
      tone: "RF",
      iconKey: "bluetooth",
      role: "Clinician telemetry and firmware servicing",
      description: "Encrypted short-range link to the programmer dock.",
      partNumber: "nRF52832",
      manufacturer: "Nordic Semiconductor",
      specsSummary: "BLE SoC, secure boot, low-power radio",
      lifecycle: "Active",
      powerW: 0.14,
      costUSD: 3.1,
      safetyCritical: false,
      redundancy: "None",
      linkedRequirements: ["REQ-RF-021", "REQ-USER-024"],
      notes: "Session key rotation occurs every programmer attach.",
    },
  },
  {
    id: "output-protection",
    title: "Output Protection",
    category: "Safety",
    data: {
      defaultName: "Output Protection",
      kind: "componentNode",
      tone: "Safety",
      iconKey: "shield",
      role: "Over-voltage and lead fault isolation",
      description: "Guards patient path from unintended discharge paths.",
      partNumber: "Custom HV FET Gate",
      manufacturer: "Internal",
      specsSummary: "Gate-controlled isolation, therapy fault shunt",
      lifecycle: "Qualified",
      powerW: 0.08,
      costUSD: 8.4,
      safetyCritical: true,
      redundancy: "Dual Channel",
      linkedRequirements: ["REQ-SAFE-009", "REQ-THER-016"],
      notes: "Independent crowbar trigger monitored by the safety MCU.",
    },
  },
  {
    id: "fram-memory",
    title: "FRAM Logger",
    category: "Memory",
    data: {
      defaultName: "FRAM Logger",
      kind: "componentNode",
      tone: "Memory",
      iconKey: "memory",
      role: "Event trace persistence",
      description: "Stores therapy, watchdog, and power anomalies.",
      partNumber: "MB85RS4MT",
      manufacturer: "Fujitsu",
      specsSummary: "4 Mbit SPI FRAM, instant nonvolatile writes",
      lifecycle: "Active",
      powerW: 0.03,
      costUSD: 2.4,
      safetyCritical: true,
      redundancy: "None",
      linkedRequirements: ["REQ-TRACE-031"],
      notes: "Protected by authenticated maintenance mode reads.",
    },
  },
];

function formatMetric(value: number, unit: string, digits = 1) {
  return `${value.toFixed(digits)}${unit}`;
}

function formatCurrency(value: number) {
  return `$${value.toFixed(1)}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function buildNode(
  id: string,
  data: ArchitectureNodeData,
  extras?: Partial<ArchitectureNode>,
): ArchitectureNode {
  return {
    id,
    type: data.kind,
    position: { x: 0, y: 0 },
    draggable: true,
    data,
    style: {
      transition: "transform 420ms cubic-bezier(0.2, 0.65, 0.2, 1), opacity 200ms ease",
    },
    ...extras,
  };
}

function buildEdge(
  id: string,
  source: string,
  target: string,
  protocol: ProtocolType,
  kind: "data" | "power",
  label?: string,
): ArchitectureEdge {
  return {
    id,
    type: "architectureEdge",
    source,
    target,
    animated: kind === "data",
    data: {
      protocol,
      kind,
      label: label ?? protocol,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: protocolStroke[protocol],
      width: kind === "power" ? 18 : 16,
      height: kind === "power" ? 18 : 16,
    },
  };
}

function autoLayoutNodes(nodes: ArchitectureNode[]) {
  const grouped = new Map<number, ArchitectureNode[]>();

  for (const node of nodes) {
    const column = node.data.layoutColumn;
    const bucket = grouped.get(column) ?? [];
    bucket.push(node);
    grouped.set(column, bucket);
  }

  return nodes.map((node) => {
    const columnNodes = grouped.get(node.data.layoutColumn) ?? [];
    const subsystemIndex = columnNodes
      .filter((item) => item.data.kind === "subsystemNode")
      .findIndex((item) => item.id === node.id);
    const componentIndex = columnNodes
      .filter((item) => item.data.kind === "componentNode")
      .findIndex((item) => item.id === node.id);
    const interfaceIndex = columnNodes
      .filter((item) => item.data.kind === "interfaceNode")
      .findIndex((item) => item.id === node.id);
    const annotationIndex = columnNodes
      .filter((item) => item.data.kind === "annotationNode")
      .findIndex((item) => item.id === node.id);

    let x = 80 + node.data.layoutColumn * LAYOUT_X;
    let y = 92;

    if (node.data.kind === "subsystemNode") {
      y = 78 + Math.max(subsystemIndex, 0) * 48;
    } else if (node.data.kind === "componentNode") {
      y = 226 + Math.max(componentIndex, 0) * LAYOUT_Y;
    } else if (node.data.kind === "interfaceNode") {
      y = 176 + Math.max(interfaceIndex, 0) * 124;
      x += 36;
    } else {
      y = 112 + Math.max(annotationIndex, 0) * 238;
      x += 188;
    }

    return {
      ...node,
      position: { x, y },
      style: {
        ...(node.style ?? {}),
        transition: "transform 420ms cubic-bezier(0.2, 0.65, 0.2, 1), opacity 200ms ease",
      },
    };
  });
}

function createInitialGraph() {
  const nodes = autoLayoutNodes([
    buildNode("subsystem-sensing", {
      kind: "subsystemNode",
      category: "Sensing",
      tone: "Sensor",
      iconKey: "sensor",
      name: "Sensing",
      role: "Lead, motion, and impedance acquisition",
      description: "Front-end subsystem that normalizes input from pacing leads and inertial sensing.",
      powerW: 0.14,
      costUSD: 16,
      safetyCritical: true,
      redundancy: "None",
      linkedRequirements: ["REQ-SAFE-009", "REQ-PACE-001"],
      notes: "Sense amplifier gain trimmed per lead impedance profile.",
      layoutColumn: 0,
      layoutRow: 0,
    }),
    buildNode("lead-electrode", {
      kind: "componentNode",
      category: "Sensing",
      tone: "Sensor",
      iconKey: "sensor",
      name: "Lead / Electrode",
      role: "Cardiac signal pickup and pulse delivery path",
      description: "Primary atrial and ventricular interface to myocardium.",
      partNumber: "Model 3830",
      manufacturer: "Medtronic",
      specsSummary: "Bipolar pacing lead with steroid-eluting tip",
      lifecycle: "Qualified",
      powerW: 0.02,
      costUSD: 48,
      safetyCritical: true,
      redundancy: "None",
      linkedRequirements: ["REQ-SAFE-009"],
      notes: "Lead continuity drives therapy inhibit if out of range.",
      layoutColumn: 0,
      layoutRow: 1,
    }),
    buildNode("accelerometer", {
      kind: "componentNode",
      category: "Sensing",
      tone: "Sensor",
      iconKey: "motion",
      name: "Accelerometer",
      role: "Rate-adaptive pacing feedback",
      description: "Activity sensing for physiologic rate response.",
      partNumber: "BMA400",
      manufacturer: "Bosch",
      specsSummary: "14-bit, ultra-low-power 3-axis MEMS",
      lifecycle: "Preferred",
      powerW: 0.06,
      costUSD: 1.8,
      safetyCritical: false,
      redundancy: "None",
      linkedRequirements: ["REQ-PACE-001"],
      notes: "Motion artifacts filtered after QRS detection.",
      layoutColumn: 0,
      layoutRow: 2,
    }),
    buildNode("impedance-sensor", {
      kind: "componentNode",
      category: "Sensing",
      tone: "Sensor",
      iconKey: "impedance",
      name: "Impedance Sensor",
      role: "Lead impedance and capture confirmation",
      description: "Characterizes load changes during therapy delivery.",
      partNumber: "AD5941",
      manufacturer: "Analog Devices",
      specsSummary: "AFE with impedance spectroscopy front end",
      lifecycle: "Active",
      powerW: 0.09,
      costUSD: 6.5,
      safetyCritical: true,
      redundancy: "None",
      linkedRequirements: ["REQ-SAFE-009", "REQ-THER-016"],
      notes: "Used for post-pulse tissue contact validation.",
      layoutColumn: 0,
      layoutRow: 3,
    }),
    buildNode("if-analog", {
      kind: "interfaceNode",
      category: "Sensing",
      tone: "Sensor",
      iconKey: "interface",
      name: "Analog",
      role: "Cardiac signal path",
      description: "Front-end analog sense bus",
      protocol: "Analog",
      powerW: 0,
      costUSD: 0,
      safetyCritical: true,
      redundancy: "None",
      linkedRequirements: ["REQ-SAFE-009"],
      notes: "",
      layoutColumn: 0.5,
      layoutRow: 1,
    }),
    buildNode("if-i2c", {
      kind: "interfaceNode",
      category: "Sensing",
      tone: "Sensor",
      iconKey: "interface",
      name: "I2C",
      role: "Sensor sideband",
      description: "Low-power motion telemetry",
      protocol: "I2C",
      powerW: 0,
      costUSD: 0,
      safetyCritical: false,
      redundancy: "None",
      linkedRequirements: ["REQ-PACE-001"],
      notes: "",
      layoutColumn: 0.5,
      layoutRow: 2,
    }),
    buildNode("subsystem-processing", {
      kind: "subsystemNode",
      category: "Processing",
      tone: "MCU",
      iconKey: "cpu",
      name: "Processing",
      role: "Deterministic pacing and diagnostics control",
      description: "Main compute domain coordinating sensing, therapy, telemetry, and logging.",
      powerW: 0.22,
      costUSD: 21,
      safetyCritical: true,
      redundancy: "Watchdog Partner",
      linkedRequirements: ["REQ-PACE-001", "REQ-PACE-004", "REQ-TRACE-031"],
      notes: "Software partitioning follows Class C / Class B decomposition.",
      layoutColumn: 1,
      layoutRow: 0,
    }),
    buildNode("main-mcu", {
      kind: "componentNode",
      category: "Processing",
      tone: "MCU",
      iconKey: "controller",
      name: "Main MCU STM32",
      role: "Therapy scheduler and telemetry orchestrator",
      description: "Runs pacing algorithms, event classification, and command handling.",
      partNumber: "STM32U585",
      manufacturer: "STMicroelectronics",
      specsSummary: "160 MHz Cortex-M33, TrustZone, secure boot",
      lifecycle: "Active",
      powerW: 0.45,
      costUSD: 9.2,
      safetyCritical: true,
      redundancy: "Watchdog Partner",
      linkedRequirements: ["REQ-PACE-001", "REQ-TRACE-031"],
      notes: "Faults into safe-state if safety heartbeat stalls for 40 ms.",
      layoutColumn: 1,
      layoutRow: 1,
    }),
    buildNode("safety-monitor", {
      kind: "componentNode",
      category: "Processing",
      tone: "Safety",
      iconKey: "shield",
      name: "Safety Monitor MCU",
      role: "Independent watchdog and therapy gatekeeper",
      description: "Monitors main loop timing, pulse charge state, and output interlocks.",
      partNumber: "MSP430FR2433",
      manufacturer: "Texas Instruments",
      specsSummary: "Ultra-low-power MCU with FRAM and timer watchdogs",
      lifecycle: "Active",
      powerW: 0.12,
      costUSD: 2.6,
      safetyCritical: true,
      redundancy: "Active-Passive",
      linkedRequirements: ["REQ-PACE-004", "REQ-THER-016"],
      notes: "Retains final therapy state snapshot across brownouts.",
      layoutColumn: 1,
      layoutRow: 2,
    }),
    buildNode("fram-logger", {
      kind: "componentNode",
      category: "Memory",
      tone: "Memory",
      iconKey: "storage",
      name: "FRAM Logger",
      role: "Non-volatile safety event trace",
      description: "Persists watchdog, battery, and lead anomalies.",
      partNumber: "MB85RS4MT",
      manufacturer: "Fujitsu",
      specsSummary: "SPI FRAM with instant writes and low standby current",
      lifecycle: "Active",
      powerW: 0.03,
      costUSD: 2.4,
      safetyCritical: true,
      redundancy: "None",
      linkedRequirements: ["REQ-TRACE-031"],
      notes: "Service tool reads gated behind authenticated programmer session.",
      layoutColumn: 1,
      layoutRow: 3,
    }),
    buildNode("if-watchdog", {
      kind: "interfaceNode",
      category: "Processing",
      tone: "MCU",
      iconKey: "interface",
      name: "UART",
      role: "Heartbeat and supervisory exchange",
      description: "Main MCU <-> safety monitor heartbeat",
      protocol: "UART",
      powerW: 0,
      costUSD: 0,
      safetyCritical: true,
      redundancy: "None",
      linkedRequirements: ["REQ-PACE-004"],
      notes: "",
      layoutColumn: 1.5,
      layoutRow: 1,
    }),
    buildNode("if-therapy", {
      kind: "interfaceNode",
      category: "Output",
      tone: "Safety",
      iconKey: "interface",
      name: "CAN",
      role: "Therapy command channel",
      description: "Command and state path into pulse delivery domain",
      protocol: "CAN",
      powerW: 0,
      costUSD: 0,
      safetyCritical: true,
      redundancy: "None",
      linkedRequirements: ["REQ-THER-016"],
      notes: "",
      layoutColumn: 1.5,
      layoutRow: 2,
    }),
    buildNode("subsystem-therapy", {
      kind: "subsystemNode",
      category: "Output",
      tone: "Safety",
      iconKey: "pulse",
      name: "Therapy",
      role: "Charge storage, pulse shaping, and path protection",
      description: "Patient-facing therapy chain with independent interlocks.",
      powerW: 0.28,
      costUSD: 31,
      safetyCritical: true,
      redundancy: "Dual Channel",
      linkedRequirements: ["REQ-THER-016", "REQ-SAFE-009"],
      notes: "Output path remains disabled until safety monitor approves charge state.",
      layoutColumn: 2,
      layoutRow: 0,
    }),
    buildNode("hv-capacitor", {
      kind: "componentNode",
      category: "Output",
      tone: "Power",
      iconKey: "power",
      name: "High-Voltage Capacitor",
      role: "Pulse energy reservoir",
      description: "Stores energy prior to pulse discharge.",
      partNumber: "AXP 33uF HV",
      manufacturer: "Cornell Dubilier",
      specsSummary: "33 uF, low ESR, therapy-grade pulse discharge",
      lifecycle: "Qualified",
      powerW: 0.05,
      costUSD: 12.8,
      safetyCritical: true,
      redundancy: "None",
      linkedRequirements: ["REQ-THER-016"],
      notes: "Charge telemetry sampled before each pulse window.",
      layoutColumn: 2,
      layoutRow: 1,
    }),
    buildNode("pulse-generator", {
      kind: "componentNode",
      category: "Output",
      tone: "Safety",
      iconKey: "pulse",
      name: "Pulse Generator",
      role: "Pulse shaping and pacing waveform delivery",
      description: "Converts commanded therapy parameters into patient-safe pulses.",
      partNumber: "Custom ASIC",
      manufacturer: "Internal",
      specsSummary: "Biphasic pulse shaping, capture detect assist",
      lifecycle: "Qualified",
      powerW: 0.18,
      costUSD: 14.6,
      safetyCritical: true,
      redundancy: "Dual Channel",
      linkedRequirements: ["REQ-PACE-001", "REQ-THER-016"],
      notes: "Pulse width bounded in hardware regardless of firmware state.",
      layoutColumn: 2,
      layoutRow: 2,
    }),
    buildNode("output-protection", {
      kind: "componentNode",
      category: "Safety",
      tone: "Safety",
      iconKey: "shield",
      name: "Output Protection",
      role: "Lead fault, discharge, and leakage mitigation",
      description: "Gates patient path with independent isolation controls.",
      partNumber: "Custom HV FET Gate",
      manufacturer: "Internal",
      specsSummary: "Dual-path isolation FET stack with crowbar trigger",
      lifecycle: "Qualified",
      powerW: 0.08,
      costUSD: 8.4,
      safetyCritical: true,
      redundancy: "Dual Channel",
      linkedRequirements: ["REQ-SAFE-009", "REQ-THER-016"],
      notes: "Separate crowbar path verified in fault-injection tests.",
      layoutColumn: 2,
      layoutRow: 3,
    }),
    buildNode("subsystem-power", {
      kind: "subsystemNode",
      category: "Power",
      tone: "Power",
      iconKey: "battery",
      name: "Power",
      role: "Implant battery and rail generation",
      description: "Manages charge acceptance, rail conversion, and service longevity.",
      powerW: 0.34,
      costUSD: 26,
      safetyCritical: true,
      redundancy: "Active-Passive",
      linkedRequirements: ["REQ-POWER-012"],
      notes: "Power budget tracked against 7-year service target.",
      layoutColumn: 3,
      layoutRow: 0,
    }),
    buildNode("battery", {
      kind: "componentNode",
      category: "Power",
      tone: "Power",
      iconKey: "battery",
      name: "Li-Ion Battery",
      role: "Primary implant energy source",
      description: "Rechargeable cell sized for pacing and telemetry duty cycle.",
      partNumber: "QL0003",
      manufacturer: "Quallion",
      specsSummary: "2.8 Ah implant-grade Li-ion chemistry",
      lifecycle: "Qualified",
      powerW: 0.42,
      costUSD: 34,
      safetyCritical: true,
      redundancy: "None",
      linkedRequirements: ["REQ-POWER-012"],
      notes: "Cycle aging model calibrated against 37 C soak data.",
      layoutColumn: 3,
      layoutRow: 1,
    }),
    buildNode("pmic", {
      kind: "componentNode",
      category: "Power",
      tone: "Power",
      iconKey: "power",
      name: "Power Management IC",
      role: "Rail conversion, charge path, and protection",
      description: "Creates regulated rails for compute, therapy, and RF domains.",
      partNumber: "MAX77659",
      manufacturer: "Analog Devices / Maxim",
      specsSummary: "Buck-boost PMIC, charging controller, protection monitors",
      lifecycle: "Active",
      powerW: 0.2,
      costUSD: 5.7,
      safetyCritical: true,
      redundancy: "Active-Passive",
      linkedRequirements: ["REQ-POWER-012"],
      notes: "Amber rails reserve margin for therapy peak current.",
      layoutColumn: 3,
      layoutRow: 2,
    }),
    buildNode("wireless-charging", {
      kind: "componentNode",
      category: "Power",
      tone: "Power",
      iconKey: "power",
      name: "Wireless Charging",
      role: "Transcutaneous charging interface",
      description: "External recharge coupling with temperature-aware duty limiting.",
      partNumber: "bq51013B",
      manufacturer: "Texas Instruments",
      specsSummary: "Wireless power receiver, thermal derating",
      lifecycle: "Active",
      powerW: 0.16,
      costUSD: 3.4,
      safetyCritical: false,
      redundancy: "None",
      linkedRequirements: ["REQ-POWER-012"],
      notes: "Charge current throttles when tissue heating trend exceeds threshold.",
      layoutColumn: 3,
      layoutRow: 3,
    }),
    buildNode("if-power", {
      kind: "interfaceNode",
      category: "Power",
      tone: "Power",
      iconKey: "interface",
      name: "Power",
      role: "Primary regulated rails",
      description: "Shared amber rails out of PMIC domain",
      protocol: "Power",
      powerW: 0,
      costUSD: 0,
      safetyCritical: true,
      redundancy: "None",
      linkedRequirements: ["REQ-POWER-012"],
      notes: "",
      layoutColumn: 3.45,
      layoutRow: 1,
    }),
    buildNode("subsystem-communication", {
      kind: "subsystemNode",
      category: "Communication",
      tone: "RF",
      iconKey: "rf",
      name: "Communication",
      role: "Short-range service and implant telemetry links",
      description: "Wireless interfaces for clinician programming and remote diagnostics.",
      powerW: 0.16,
      costUSD: 14,
      safetyCritical: false,
      redundancy: "None",
      linkedRequirements: ["REQ-RF-021", "REQ-USER-024"],
      notes: "RF links isolate maintenance features from therapy controls.",
      layoutColumn: 4,
      layoutRow: 0,
    }),
    buildNode("ble", {
      kind: "componentNode",
      category: "Communication",
      tone: "RF",
      iconKey: "bluetooth",
      name: "Bluetooth BLE",
      role: "Programmer and field telemetry",
      description: "Secure BLE channel for configuration and log retrieval.",
      partNumber: "nRF52832",
      manufacturer: "Nordic Semiconductor",
      specsSummary: "BLE 5 radio, secure boot, low-power profile",
      lifecycle: "Active",
      powerW: 0.14,
      costUSD: 3.1,
      safetyCritical: false,
      redundancy: "None",
      linkedRequirements: ["REQ-RF-021", "REQ-USER-024"],
      notes: "Maintenance mode requires explicit programmer proximity.",
      layoutColumn: 4,
      layoutRow: 1,
    }),
    buildNode("telemetry-rf", {
      kind: "componentNode",
      category: "Communication",
      tone: "RF",
      iconKey: "rf",
      name: "Telemetry RF 402MHz",
      role: "MICS-band implant telemetry",
      description: "Dedicated implant telemetry path for long-term data pull.",
      partNumber: "ZL70103",
      manufacturer: "Microchip",
      specsSummary: "402-405 MHz medical implant radio transceiver",
      lifecycle: "Qualified",
      powerW: 0.11,
      costUSD: 7.9,
      safetyCritical: false,
      redundancy: "None",
      linkedRequirements: ["REQ-RF-021"],
      notes: "Regional band-plan validation remains in RF review queue.",
      layoutColumn: 4,
      layoutRow: 2,
    }),
    buildNode("if-telemetry", {
      kind: "interfaceNode",
      category: "Communication",
      tone: "RF",
      iconKey: "interface",
      name: "UART",
      role: "Telemetry command bridge",
      description: "Packet bridge between comms and control domains",
      protocol: "UART",
      powerW: 0,
      costUSD: 0,
      safetyCritical: false,
      redundancy: "None",
      linkedRequirements: ["REQ-RF-021"],
      notes: "",
      layoutColumn: 4.45,
      layoutRow: 1,
    }),
    buildNode("subsystem-interface", {
      kind: "subsystemNode",
      category: "Output",
      tone: "Display",
      iconKey: "subsystem",
      name: "Patient Interface",
      role: "Programmer touchpoints and visible status",
      description: "External clinician and patient-facing indicators outside the implant core.",
      powerW: 0.06,
      costUSD: 9,
      safetyCritical: false,
      redundancy: "None",
      linkedRequirements: ["REQ-USER-024"],
      notes: "Patient-visible states intentionally coarse to avoid alarm fatigue.",
      layoutColumn: 5,
      layoutRow: 0,
    }),
    buildNode("programmer-interface", {
      kind: "componentNode",
      category: "Output",
      tone: "Display",
      iconKey: "interface",
      name: "Programmer Interface",
      role: "Clinician configuration surface",
      description: "Dock, wand, and service UI bridge into telemetry stack.",
      partNumber: "Programmer Dock",
      manufacturer: "Internal",
      specsSummary: "USB-C service dock, authenticated session gateway",
      lifecycle: "Preferred",
      powerW: 0.05,
      costUSD: 6.2,
      safetyCritical: false,
      redundancy: "None",
      linkedRequirements: ["REQ-USER-024"],
      notes: "All maintenance commands route through signed session manifests.",
      layoutColumn: 5,
      layoutRow: 1,
    }),
    buildNode("led-indicator", {
      kind: "componentNode",
      category: "Output",
      tone: "Display",
      iconKey: "component",
      name: "LED Indicator",
      role: "External state cue",
      description: "Simple visual status indicator for charge and service state.",
      partNumber: "LTST-C170",
      manufacturer: "Lite-On",
      specsSummary: "Low-current bi-color indicator LED",
      lifecycle: "Active",
      powerW: 0.01,
      costUSD: 0.4,
      safetyCritical: false,
      redundancy: "None",
      linkedRequirements: ["REQ-USER-024"],
      notes: "No therapy-state details exposed on patient-visible channel.",
      layoutColumn: 5,
      layoutRow: 2,
    }),
    buildNode("if-usb", {
      kind: "interfaceNode",
      category: "Output",
      tone: "Display",
      iconKey: "interface",
      name: "USB",
      role: "Programmer service ingress",
      description: "External dock to telemetry gateway",
      protocol: "USB",
      powerW: 0,
      costUSD: 0,
      safetyCritical: false,
      redundancy: "None",
      linkedRequirements: ["REQ-USER-024"],
      notes: "",
      layoutColumn: 5.1,
      layoutRow: 1,
    }),
    buildNode("annotation-qa", {
      kind: "annotationNode",
      category: "Safety",
      tone: "Display",
      iconKey: "note",
      name: "Leakage Review",
      role: "QA pin",
      description: "Reminder",
      author: "QA",
      avatar: "QT",
      powerW: 0,
      costUSD: 0,
      safetyCritical: false,
      redundancy: "None",
      linkedRequirements: ["REQ-SAFE-009"],
      notes: "Confirm IEC 60601 leakage evidence before design freeze.",
      layoutColumn: 2,
      layoutRow: 4,
    }),
    buildNode("annotation-rf", {
      kind: "annotationNode",
      category: "Communication",
      tone: "Display",
      iconKey: "note",
      name: "RF Review",
      role: "RF pin",
      description: "Reminder",
      author: "RF",
      avatar: "AR",
      powerW: 0,
      costUSD: 0,
      safetyCritical: false,
      redundancy: "None",
      linkedRequirements: ["REQ-RF-021"],
      notes: "402 MHz regional band plan review pending for JP and EU test kits.",
      layoutColumn: 4,
      layoutRow: 3,
    }),
  ]);

  const edges: ArchitectureEdge[] = [
    buildEdge("e-lead-analog", "lead-electrode", "if-analog", "Analog", "data", "Cardiac Sense"),
    buildEdge("e-if-analog-main", "if-analog", "main-mcu", "Analog", "data"),
    buildEdge("e-accel-i2c", "accelerometer", "if-i2c", "I2C", "data"),
    buildEdge("e-if-i2c-main", "if-i2c", "main-mcu", "I2C", "data"),
    buildEdge("e-impedance-main", "impedance-sensor", "main-mcu", "SPI", "data", "Impedance SPI"),
    buildEdge("e-main-watchdog", "main-mcu", "if-watchdog", "UART", "data", "Heartbeat"),
    buildEdge("e-watchdog-safety", "if-watchdog", "safety-monitor", "UART", "data"),
    buildEdge("e-main-memory", "main-mcu", "fram-logger", "SPI", "data", "Trace Log"),
    buildEdge("e-main-therapy", "main-mcu", "if-therapy", "CAN", "data", "Therapy Cmd"),
    buildEdge("e-if-therapy-pulse", "if-therapy", "pulse-generator", "CAN", "data"),
    buildEdge("e-safety-output", "safety-monitor", "output-protection", "Analog", "data", "Safety Gate"),
    buildEdge("e-cap-pulse", "hv-capacitor", "pulse-generator", "Power", "power", "Pulse Rail"),
    buildEdge("e-pulse-output", "pulse-generator", "output-protection", "Analog", "data", "Pulse Path"),
    buildEdge("e-battery-pmic", "battery", "pmic", "Power", "power", "Primary Cell"),
    buildEdge("e-wireless-battery", "wireless-charging", "battery", "Power", "power", "Recharge"),
    buildEdge("e-pmic-power", "pmic", "if-power", "Power", "power", "Regulated Rails"),
    buildEdge("e-power-main", "if-power", "main-mcu", "Power", "power", "1V8 / 3V3"),
    buildEdge("e-power-safety", "if-power", "safety-monitor", "Power", "power", "Safe Rail"),
    buildEdge("e-power-cap", "if-power", "hv-capacitor", "Power", "power", "Charge Rail"),
    buildEdge("e-power-ble", "if-power", "ble", "Power", "power", "RF Rail"),
    buildEdge("e-main-ble", "main-mcu", "ble", "UART", "data", "Service Telemetry"),
    buildEdge("e-main-rf", "main-mcu", "telemetry-rf", "RF", "data", "MICS Telemetry"),
    buildEdge("e-ble-telemetry", "ble", "if-telemetry", "BLE", "data"),
    buildEdge("e-telemetry-programmer", "if-telemetry", "programmer-interface", "USB", "data", "Service Session"),
    buildEdge("e-programmer-usb", "programmer-interface", "if-usb", "USB", "data"),
    buildEdge("e-usb-led", "if-usb", "led-indicator", "USB", "data", "Status Trigger"),
  ];

  return { nodes, edges };
}

function downloadBlob(filename: string, blob: Blob) {
  const link = document.createElement("a");
  const href = URL.createObjectURL(blob);
  link.href = href;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(href), 500);
}

function getVisibleNodes(nodes: ArchitectureNode[], collaborationOverlayOpen: boolean) {
  return nodes.filter(
    (node) => collaborationOverlayOpen || node.data.kind !== "annotationNode",
  );
}

function buildSvg(nodes: ArchitectureNode[], edges: ArchitectureEdge[]) {
  const minX = Math.min(...nodes.map((node) => node.position.x)) - 80;
  const minY = Math.min(...nodes.map((node) => node.position.y)) - 80;
  const maxX = Math.max(...nodes.map((node) => node.position.x)) + 320;
  const maxY = Math.max(...nodes.map((node) => node.position.y)) + 220;
  const width = Math.max(1200, maxX - minX);
  const height = Math.max(720, maxY - minY);

  const nodeCenters = new Map(
    nodes.map((node) => [
      node.id,
      {
        x: node.position.x - minX + (node.data.kind === "interfaceNode" ? 46 : 108),
        y: node.position.y - minY + (node.data.kind === "interfaceNode" ? 46 : 58),
      },
    ]),
  );

  const edgeLines = edges
    .map((edge) => {
      const source = nodeCenters.get(edge.source);
      const target = nodeCenters.get(edge.target);
      const edgeData = edge.data ?? {
        protocol: "SPI" as ProtocolType,
        kind: "data" as const,
        label: "SPI",
      };

      if (!source || !target) {
        return "";
      }

      const dash = edgeData.kind === "data" ? `stroke-dasharray="10 8"` : "";
      const stroke = protocolStroke[edgeData.protocol];
      const strokeWidth = edgeData.kind === "power" ? 6 : 3;
      const labelX = (source.x + target.x) / 2;
      const labelY = (source.y + target.y) / 2 - 10;

      return `
        <line x1="${source.x}" y1="${source.y}" x2="${target.x}" y2="${target.y}" stroke="${stroke}" stroke-width="${strokeWidth}" ${dash} stroke-linecap="round" />
        <rect x="${labelX - 54}" y="${labelY - 16}" width="108" height="24" rx="12" fill="rgba(15,23,42,0.92)" stroke="${stroke}" stroke-width="1.5" />
        <text x="${labelX}" y="${labelY}" fill="#e2e8f0" font-size="11" font-family="Inter, sans-serif" text-anchor="middle" dominant-baseline="middle">${edgeData.label}</text>
      `;
    })
    .join("");

  const nodeShapes = nodes
    .map((node) => {
      const x = node.position.x - minX;
      const y = node.position.y - minY;
      const stroke = toneStroke[node.data.tone];
      const title = node.data.name;
      const subtitle =
        node.data.kind === "componentNode"
          ? `${node.data.partNumber ?? ""}${node.data.manufacturer ? ` · ${node.data.manufacturer}` : ""}`
          : node.data.role;

      if (node.data.kind === "interfaceNode") {
        return `
          <polygon points="${x + 46},${y} ${x + 92},${y + 46} ${x + 46},${y + 92} ${x},${y + 46}" fill="rgba(15,23,42,0.92)" stroke="${stroke}" stroke-width="2" />
          <text x="${x + 46}" y="${y + 40}" fill="#f8fafc" font-size="13" font-family="Inter, sans-serif" text-anchor="middle">${node.data.protocol ?? node.data.name}</text>
        `;
      }

      if (node.data.kind === "annotationNode") {
        return `
          <path d="M ${x} ${y + 12} Q ${x} ${y} ${x + 12} ${y} L ${x + 176} ${y} Q ${x + 188} ${y} ${x + 188} ${y + 12} L ${x + 188} ${y + 108} L ${x + 160} ${y + 132} L ${x + 12} ${y + 132} Q ${x} ${y + 132} ${x} ${y + 120} Z" fill="#fde68a" stroke="#f59e0b" stroke-width="2" />
          <text x="${x + 16}" y="${y + 30}" fill="#78350f" font-size="12" font-family="Inter, sans-serif" font-weight="700">${node.data.author ?? "Note"}</text>
          <text x="${x + 16}" y="${y + 54}" fill="#78350f" font-size="12" font-family="Inter, sans-serif">${node.data.notes}</text>
        `;
      }

      const widthRect = node.data.kind === "subsystemNode" ? 236 : 214;
      const heightRect = node.data.kind === "subsystemNode" ? 124 : 120;

      return `
        <rect x="${x}" y="${y}" width="${widthRect}" height="${heightRect}" rx="26" fill="rgba(15,23,42,0.94)" stroke="${stroke}" stroke-width="2" />
        <text x="${x + 18}" y="${y + 32}" fill="#f8fafc" font-size="16" font-family="Inter, sans-serif" font-weight="700">${title}</text>
        <text x="${x + 18}" y="${y + 56}" fill="#94a3b8" font-size="11" font-family="Inter, sans-serif">${subtitle}</text>
        <text x="${x + 18}" y="${y + 82}" fill="#cbd5e1" font-size="11" font-family="Inter, sans-serif">${node.data.description}</text>
      `;
    })
    .join("");

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="100%" height="100%" fill="#020617" />
      <defs>
        <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="rgba(148,163,184,0.18)" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dots)" />
      ${edgeLines}
      ${nodeShapes}
    </svg>
  `;
}

function buildMermaid(nodes: ArchitectureNode[], edges: ArchitectureEdge[]) {
  const sanitized = new Map(
    nodes.map((node) => [node.id, node.id.replace(/[^a-zA-Z0-9_]/g, "_")]),
  );

  const declarations = nodes
    .map((node) => {
      const id = sanitized.get(node.id);
      const label = node.data.name.replace(/"/g, "'");
      if (node.data.kind === "interfaceNode") {
        return `${id}{"${label}"}`;
      }
      if (node.data.kind === "annotationNode") {
        return `${id}[/"${label}"/]`;
      }
      return `${id}["${label}"]`;
    })
    .join("\n");

  const connections = edges
    .map((edge) => {
      const source = sanitized.get(edge.source);
      const target = sanitized.get(edge.target);
      return `${source} -->|${edge.data?.label ?? "Link"}| ${target}`;
    })
    .join("\n");

  return `flowchart LR\n${declarations}\n${connections}\n`;
}

function exportDiagram(
  format: "svg" | "png" | "pdf" | "json" | "mermaid",
  nodes: ArchitectureNode[],
  edges: ArchitectureEdge[],
) {
  if (format === "json") {
    downloadBlob(
      "pacemaker-architecture.json",
      new Blob([JSON.stringify({ nodes, edges }, null, 2)], { type: "application/json" }),
    );
    return;
  }

  if (format === "mermaid") {
    downloadBlob(
      "pacemaker-architecture.mmd",
      new Blob([buildMermaid(nodes, edges)], { type: "text/plain;charset=utf-8" }),
    );
    return;
  }

  const svgMarkup = buildSvg(nodes, edges);

  if (format === "svg") {
    downloadBlob("pacemaker-architecture.svg", new Blob([svgMarkup], { type: "image/svg+xml" }));
    return;
  }

  if (format === "pdf") {
    const previewWindow = window.open("", "_blank", "noopener,noreferrer");

    if (previewWindow) {
      previewWindow.document.write(`
        <html>
          <head><title>Pacemaker Architecture Export</title></head>
          <body style="margin:0;background:#020617;display:flex;align-items:center;justify-content:center;">
            ${svgMarkup}
          </body>
        </html>
      `);
      previewWindow.document.close();
      previewWindow.focus();
      previewWindow.print();
    }

    return;
  }

  const svgBlob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);
  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = image.width * 2;
    canvas.height = image.height * 2;
    const context = canvas.getContext("2d");

    if (!context) {
      URL.revokeObjectURL(svgUrl);
      return;
    }

    context.scale(2, 2);
    context.fillStyle = "#020617";
    context.fillRect(0, 0, image.width, image.height);
    context.drawImage(image, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) {
        downloadBlob("pacemaker-architecture.png", blob);
      }
      URL.revokeObjectURL(svgUrl);
    }, "image/png");
  };
  image.src = svgUrl;
}

function getSummary(nodes: ArchitectureNode[], edges: ArchitectureEdge[]) {
  const blockNodes = nodes.filter(
    (node) => node.data.kind === "subsystemNode" || node.data.kind === "componentNode",
  );
  const componentNodes = nodes.filter((node) => node.data.kind === "componentNode");
  const criticalNodes = blockNodes.filter((node) => node.data.safetyCritical);

  return {
    totalPower: componentNodes.reduce((sum, node) => sum + node.data.powerW, 0),
    totalCost: componentNodes.reduce((sum, node) => sum + node.data.costUSD, 0),
    blockCount: blockNodes.length,
    interfaceCount: nodes.filter((node) => node.data.kind === "interfaceNode").length + edges.length,
    issuesFound: criticalNodes.some((node) => node.data.linkedRequirements.length === 0),
  };
}

function useGraphSnapshot() {
  const nodes = useArchitectureCanvasStore((state) => state.nodes) as ArchitectureNode[];
  const edges = useArchitectureCanvasStore((state) => state.edges) as ArchitectureEdge[];
  const past = useArchitectureCanvasStore((state) => state.past);
  const future = useArchitectureCanvasStore((state) => state.future);

  return {
    nodes,
    edges,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  };
}

function NodeShell({
  selected,
  tone,
  children,
  compact = false,
}: {
  selected: boolean;
  tone: SubsystemTone;
  children: React.ReactNode;
  compact?: boolean;
}) {
  const reviewMode = useArchitectureCanvasStore((state) => state.reviewMode);

  return (
    <motion.div
      layout
      className={cn(
        "relative overflow-hidden rounded-[28px] border bg-slate-950/88 shadow-[0_24px_72px_rgba(2,6,23,0.42)] backdrop-blur",
        compact ? "w-[214px] px-4 py-3" : "w-[236px] px-5 py-4",
        toneClasses[tone],
        selected && "ring-2 ring-sky-300/65",
        reviewMode && "ring-2 ring-amber-300/65 ring-offset-2 ring-offset-slate-950/40",
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_34%)]" />
      <div className="relative">{children}</div>
    </motion.div>
  );
}

function SubsystemNode({ data, selected }: NodeProps<ArchitectureNode>) {
  const Icon = iconMap[data.iconKey] ?? Layers3;

  return (
    <NodeShell selected={selected} tone={data.tone}>
      <Handle type="target" position={Position.Left} className="!h-3 !w-3 !border-0 !bg-slate-200" />
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/8 p-2.5">
            <Icon className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[15px] font-semibold tracking-tight text-white">{data.name}</div>
            <div className="mt-1 text-[11px] uppercase tracking-[0.22em] text-slate-300/80">
              {data.tone}
            </div>
          </div>
        </div>
        {data.safetyCritical ? (
          <div className="rounded-full border border-rose-300/35 bg-rose-400/12 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-rose-200">
            Critical
          </div>
        ) : null}
      </div>
      <div className="mt-4 text-sm font-medium text-slate-100">{data.role}</div>
      <div className="mt-2 text-sm leading-6 text-slate-300">{data.description}</div>
      <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-slate-200/85">
        <span className="rounded-full border border-white/10 bg-white/6 px-2.5 py-1">
          {formatMetric(data.powerW, "W", 2)}
        </span>
        <span className="rounded-full border border-white/10 bg-white/6 px-2.5 py-1">
          {formatCurrency(data.costUSD)}
        </span>
        <span className="rounded-full border border-white/10 bg-white/6 px-2.5 py-1">
          {data.redundancy}
        </span>
      </div>
      <Handle type="source" position={Position.Right} className="!h-3 !w-3 !border-0 !bg-slate-200" />
    </NodeShell>
  );
}

function ComponentNode({ data, selected }: NodeProps<ArchitectureNode>) {
  const Icon = iconMap[data.iconKey] ?? Component;

  return (
    <NodeShell selected={selected} tone={data.tone} compact>
      <Handle type="target" position={Position.Left} className="!h-3 !w-3 !border-0 !bg-slate-200" />
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <div className="rounded-2xl border border-white/10 bg-white/8 p-2">
            <Icon className="size-4.5" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-white">{data.name}</div>
            <div className="mt-1 text-xs text-slate-300">
              {data.partNumber ?? "Template"}
              {data.manufacturer ? ` · ${data.manufacturer}` : ""}
            </div>
          </div>
        </div>
        <div className="rounded-full border border-white/10 bg-white/7 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-slate-200">
          {data.lifecycle ?? "Draft"}
        </div>
      </div>
      <div className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-300/75">{data.role}</div>
      <div className="mt-2 text-sm leading-5 text-slate-200/90">{data.specsSummary}</div>
      <div className="mt-4 flex items-center justify-between text-[11px] text-slate-200/80">
        <span>{formatMetric(data.powerW, "W", 2)}</span>
        <span>{formatCurrency(data.costUSD)}</span>
      </div>
      <Handle type="source" position={Position.Right} className="!h-3 !w-3 !border-0 !bg-slate-200" />
    </NodeShell>
  );
}

function InterfaceNode({ data, selected }: NodeProps<ArchitectureNode>) {
  const reviewMode = useArchitectureCanvasStore((state) => state.reviewMode);

  return (
    <div className="relative h-[92px] w-[92px]">
      <Handle type="target" position={Position.Left} className="!h-3 !w-3 !border-0 !bg-slate-200" />
      <motion.div
        layout
        className={cn(
          "absolute inset-0 flex rotate-45 items-center justify-center rounded-[24px] border bg-slate-950/92 shadow-[0_20px_54px_rgba(2,6,23,0.42)]",
          selected && "ring-2 ring-sky-300/65",
          reviewMode && "ring-2 ring-amber-300/65 ring-offset-2 ring-offset-slate-950/40",
        )}
        style={{
          borderColor: protocolStroke[data.protocol ?? "SPI"],
        }}
      >
        <div className="-rotate-45 text-center">
          <div className="text-[11px] uppercase tracking-[0.22em] text-slate-300">Interface</div>
          <div className="mt-1 text-sm font-semibold text-white">{data.protocol ?? data.name}</div>
        </div>
      </motion.div>
      <Handle type="source" position={Position.Right} className="!h-3 !w-3 !border-0 !bg-slate-200" />
    </div>
  );
}

function AnnotationNode({ data }: NodeProps<ArchitectureNode>) {
  return (
    <motion.div
      layout
      className="w-[188px] rounded-[22px] border border-amber-300/60 bg-amber-200 px-4 py-3 text-amber-950 shadow-[0_18px_48px_rgba(245,158,11,0.25)]"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="rounded-full bg-amber-950/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]">
          {data.author}
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-950/15 text-xs font-semibold">
          {data.avatar ?? "AN"}
        </div>
      </div>
      <div className="mt-3 text-sm font-semibold">{data.name}</div>
      <div className="mt-2 text-sm leading-5">{data.notes}</div>
    </motion.div>
  );
}

function ArchitectureEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps<ArchitectureEdge>) {
  const reviewMode = useArchitectureCanvasStore((state) => state.reviewMode);
  const editingEdgeId = useArchitectureCanvasStore((state) => state.editingEdgeId);
  const setEditingEdgeId = useArchitectureCanvasStore((state) => state.setEditingEdgeId);
  const updateEdgeData = useArchitectureCanvasStore((state) => state.updateEdgeData);
  const edgeData = data ?? {
    protocol: "SPI" as ProtocolType,
    kind: "data" as const,
    label: "SPI",
  };
  const [draft, setDraft] = React.useState(edgeData.label);

  React.useEffect(() => {
    setDraft(edgeData.label);
  }, [edgeData.label]);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const stroke = protocolStroke[edgeData.protocol];
  const isEditing = editingEdgeId === id;

  return (
    <>
      <BaseEdge
        path={edgePath}
        style={{
          stroke,
          strokeWidth: edgeData.kind === "power" ? 5 : 2.75,
          strokeDasharray: edgeData.kind === "data" ? "10 8" : undefined,
          strokeLinecap: "round",
        }}
      />
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan absolute"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
          }}
        >
          {isEditing && !reviewMode ? (
            <form
              className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/95 px-2 py-1 shadow-lg"
              onSubmit={(event) => {
                event.preventDefault();
                updateEdgeData(id, { label: draft });
                setEditingEdgeId(null);
              }}
            >
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                className="w-28 bg-transparent text-xs text-white outline-none"
                autoFocus
              />
              <button
                type="submit"
                className="rounded-full bg-sky-400 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-950"
              >
                Save
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (!reviewMode) {
                  setEditingEdgeId(id);
                }
              }}
              className="rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white shadow-[0_10px_30px_rgba(2,6,23,0.35)]"
              style={{
                background: "rgba(2,6,23,0.92)",
                borderColor: stroke,
              }}
            >
              {edgeData.label}
            </button>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

const nodeTypes = {
  subsystemNode: SubsystemNode,
  componentNode: ComponentNode,
  interfaceNode: InterfaceNode,
  annotationNode: AnnotationNode,
};

const edgeTypes = {
  architectureEdge: ArchitectureEdge,
};

function InspectorPanel({
  node,
}: {
  node: ArchitectureNode | null;
}) {
  const updateNodeData = useArchitectureCanvasStore((state) => state.updateNodeData);
  const [requirementQuery, setRequirementQuery] = React.useState("");

  if (!node) {
    return null;
  }

  const contributionPower = node.data.powerW / POWER_BUDGET_W;
  const contributionCost = node.data.costUSD / COST_TARGET_USD;
  const filteredRequirements = requirements.filter((item) =>
    item.label.toLowerCase().includes(requirementQuery.toLowerCase()) ||
    item.id.toLowerCase().includes(requirementQuery.toLowerCase()),
  );

  return (
    <motion.aside
      layout
      initial={{ x: 320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 320, opacity: 0 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
      className="absolute bottom-4 right-4 top-[104px] z-20 w-[300px] overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/90 shadow-[0_28px_86px_rgba(2,6,23,0.48)] backdrop-blur-xl"
    >
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div>
          <div className="text-sm font-semibold text-white">Block Properties</div>
          <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
            {node.data.kind.replace("Node", "")}
          </div>
        </div>
      </div>
      <div className="h-[calc(100%-72px)] space-y-4 overflow-y-auto px-5 py-4">
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.18em] text-slate-400">Name</label>
          <Input
            value={node.data.name}
            onChange={(event) => updateNodeData(node.id, { name: event.target.value })}
            className="border-white/10 bg-white/5 text-white"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.18em] text-slate-400">Role / Description</label>
          <Textarea
            value={node.data.role}
            onChange={(event) => updateNodeData(node.id, { role: event.target.value })}
            className="min-h-20 border-white/10 bg-white/5 text-white"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.18em] text-slate-400">Power (W)</label>
            <Input
              type="number"
              step="0.01"
              value={node.data.powerW}
              onChange={(event) =>
                updateNodeData(node.id, {
                  powerW: Number(event.target.value || 0),
                })
              }
              className="border-white/10 bg-white/5 text-white"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.18em] text-slate-400">BOM Cost ($)</label>
            <Input
              type="number"
              step="0.1"
              value={node.data.costUSD}
              onChange={(event) =>
                updateNodeData(node.id, {
                  costUSD: Number(event.target.value || 0),
                })
              }
              className="border-white/10 bg-white/5 text-white"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center justify-between rounded-[18px] border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-slate-200">
            <span>Safety-critical</span>
            <input
              type="checkbox"
              checked={node.data.safetyCritical}
              onChange={(event) =>
                updateNodeData(node.id, {
                  safetyCritical: event.target.checked,
                })
              }
              className="h-4 w-4 rounded border-white/10 bg-transparent"
            />
          </label>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-[0.18em] text-slate-400">Redundancy</label>
            <select
              value={node.data.redundancy}
              onChange={(event) =>
                updateNodeData(node.id, {
                  redundancy: event.target.value as RedundancyMode,
                })
              }
              className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none"
            >
              <option className="bg-slate-950">None</option>
              <option className="bg-slate-950">Watchdog Partner</option>
              <option className="bg-slate-950">Active-Passive</option>
              <option className="bg-slate-950">Dual Channel</option>
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.18em] text-slate-400">Linked Requirements</label>
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex min-h-11 w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 text-left text-sm text-white"
              >
                <span className="truncate">
                  {node.data.linkedRequirements.length > 0
                    ? `${node.data.linkedRequirements.length} linked`
                    : "Select requirements"}
                </span>
                <ChevronDown className="size-4 text-slate-400" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] border border-white/10 bg-slate-950/96 text-white">
              <Input
                value={requirementQuery}
                onChange={(event) => setRequirementQuery(event.target.value)}
                placeholder="Search requirements"
                className="border-white/10 bg-white/5 text-white"
              />
              <div className="max-h-56 space-y-1 overflow-y-auto">
                {filteredRequirements.map((requirement) => {
                  const checked = node.data.linkedRequirements.includes(requirement.id);

                  return (
                    <button
                      key={requirement.id}
                      type="button"
                      onClick={() => {
                        updateNodeData(node.id, {
                          linkedRequirements: checked
                            ? node.data.linkedRequirements.filter((item) => item !== requirement.id)
                            : [...node.data.linkedRequirements, requirement.id],
                        });
                      }}
                      className={cn(
                        "flex w-full items-start justify-between rounded-lg px-3 py-2 text-left transition",
                        checked ? "bg-sky-400/16 text-sky-100" : "bg-white/4 text-slate-200",
                      )}
                    >
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.18em]">
                          {requirement.id}
                        </div>
                        <div className="mt-1 text-sm">{requirement.label}</div>
                      </div>
                      {checked ? <ShieldCheck className="mt-1 size-4" /> : null}
                    </button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.18em] text-slate-400">Notes</label>
          <Textarea
            value={node.data.notes}
            onChange={(event) => updateNodeData(node.id, { notes: event.target.value })}
            className="min-h-24 border-white/10 bg-white/5 text-white"
          />
        </div>
        <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
            <DollarSign className="size-3.5" />
            Budget Contribution
          </div>
          <div className="mt-3 space-y-3">
            <div>
              <div className="flex items-center justify-between text-sm text-slate-200">
                <span>Power</span>
                <span>{Math.round(contributionPower * 100)}%</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-white/8">
                <div
                  className="h-full rounded-full bg-sky-400"
                  style={{ width: `${clamp(contributionPower * 100, 0, 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm text-slate-200">
                <span>Cost</span>
                <span>{Math.round(contributionCost * 100)}%</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-white/8">
                <div
                  className="h-full rounded-full bg-emerald-400"
                  style={{ width: `${clamp(contributionCost * 100, 0, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}

function BlockLibrary({
  search,
  onSearchChange,
  onDragStart,
  reviewMode,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  onDragStart: (event: React.DragEvent<HTMLButtonElement>, template: BlockTemplate) => void;
  reviewMode: boolean;
}) {
  const grouped = new Map<BlockCategory, BlockTemplate[]>();

  for (const template of blockTemplates) {
    const matches =
      template.title.toLowerCase().includes(search.toLowerCase()) ||
      template.data.role.toLowerCase().includes(search.toLowerCase());

    if (!matches) {
      continue;
    }

    const bucket = grouped.get(template.category) ?? [];
    bucket.push(template);
    grouped.set(template.category, bucket);
  }

  return (
    <motion.aside
      layout
      className="absolute bottom-4 left-4 top-[104px] z-20 flex w-[280px] flex-col overflow-hidden rounded-[30px] border border-white/10 bg-slate-950/88 shadow-[0_28px_86px_rgba(2,6,23,0.48)] backdrop-blur-xl"
    >
      <div className="border-b border-white/10 px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-white">Block Library</div>
            <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
              Drag templates to canvas
            </div>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-300">
            {blockTemplates.length} presets
          </div>
        </div>
        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search blocks"
            className="border-white/10 bg-white/5 pl-9 text-white placeholder:text-slate-500"
          />
        </div>
      </div>
      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
        {Array.from(grouped.entries()).map(([category, templates]) => (
          <section key={category} className="space-y-2">
            <div className="px-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              {category}
            </div>
            <div className="space-y-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  draggable={!reviewMode}
                  onDragStart={(event) => onDragStart(event, template)}
                  className={cn(
                    "w-full rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:border-sky-300/30 hover:bg-sky-400/8",
                    reviewMode && "cursor-not-allowed opacity-50",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-white">{template.title}</div>
                      <div className="mt-1 text-sm leading-5 text-slate-300">
                        {template.data.role}
                      </div>
                    </div>
                    <div className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-300">
                      {template.data.kind.replace("Node", "")}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </motion.aside>
  );
}

function ArchitectureWorkbenchInner() {
  const { fitView, screenToFlowPosition } = useReactFlow<ArchitectureNode, ArchitectureEdge>();
  const initializeCanvas = useArchitectureCanvasStore((state) => state.initializeCanvas);
  const setGraph = useArchitectureCanvasStore((state) => state.setGraph);
  const setSelectedNodeId = useArchitectureCanvasStore((state) => state.setSelectedNodeId);
  const selectedNodeId = useArchitectureCanvasStore((state) => state.selectedNodeId);
  const reviewMode = useArchitectureCanvasStore((state) => state.reviewMode);
  const setReviewMode = useArchitectureCanvasStore((state) => state.setReviewMode);
  const collaborationOverlayOpen = useArchitectureCanvasStore((state) => state.collaborationOverlayOpen);
  const setCollaborationOverlayOpen = useArchitectureCanvasStore(
    (state) => state.setCollaborationOverlayOpen,
  );
  const undo = useArchitectureCanvasStore((state) => state.undo);
  const redo = useArchitectureCanvasStore((state) => state.redo);
  const { nodes, edges, canUndo, canRedo } = useGraphSnapshot();

  const [toolbarSearch, setToolbarSearch] = React.useState("");
  const [infoCollapsed, setInfoCollapsed] = React.useState(false);
  const dragSnapshot = React.useRef<{ nodes: ArchitectureNode[]; edges: ArchitectureEdge[] } | null>(
    null,
  );

  React.useEffect(() => {
    initializeCanvas(createInitialGraph());
  }, [initializeCanvas]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) {
        return;
      }

      const isUndo = event.key.toLowerCase() === "z" && !event.shiftKey;
      const isRedo =
        event.key.toLowerCase() === "y" ||
        (event.key.toLowerCase() === "z" && event.shiftKey);

      if (isUndo) {
        event.preventDefault();
        undo();
      }

      if (isRedo) {
        event.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [redo, undo]);

  React.useEffect(() => {
    window.setTimeout(() => {
      fitView({ padding: 0.18 });
    }, 40);
  }, [fitView]);

  const renderedNodes = nodes.map((node) =>
    node.data.kind === "annotationNode"
      ? {
          ...node,
          hidden: !collaborationOverlayOpen,
        }
      : node,
  );
  const selectedNode =
    nodes.find((node) => node.id === selectedNodeId && node.data.kind !== "annotationNode") ?? null;
  const summary = getSummary(nodes, edges);

  const onNodesChange = (changes: NodeChange<ArchitectureNode>[]) => {
    const shouldRecordHistory = changes.some((change) => change.type === "remove");

    setGraph(
      (current) => ({
        ...current,
        nodes: applyNodeChanges(changes, current.nodes as ArchitectureNode[]),
      }),
      { recordHistory: shouldRecordHistory },
    );
  };

  const onEdgesChange = (changes: EdgeChange<ArchitectureEdge>[]) => {
    const shouldRecordHistory = changes.some((change) => change.type === "remove");

    setGraph(
      (current) => ({
        ...current,
        edges: applyEdgeChanges(changes, current.edges as ArchitectureEdge[]),
      }),
      { recordHistory: shouldRecordHistory },
    );
  };

  const onConnect = (connection: Connection) => {
    if (reviewMode || !connection.source || !connection.target) {
      return;
    }

    const newEdge = buildEdge(
      `edge-${crypto.randomUUID()}`,
      connection.source,
      connection.target,
      "SPI",
      "data",
    );

    setGraph((current) => ({
      ...current,
      edges: addEdge(newEdge, current.edges as ArchitectureEdge[]) as ArchitectureEdge[],
    }));
  };

  const handleAutoLayout = () => {
    setGraph((current) => ({
      ...current,
      nodes: autoLayoutNodes(current.nodes as ArchitectureNode[]),
    }));
    window.setTimeout(() => fitView({ padding: 0.18 }), 80);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    if (reviewMode) {
      return;
    }

    const templateId = event.dataTransfer.getData("application/architecture-template");
    const template = blockTemplates.find((item) => item.id === templateId);

    if (!template) {
      return;
    }

    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    const layoutColumn = Math.max(0, Math.round((position.x - 80) / LAYOUT_X));
    const existingInColumn = nodes.filter((node) => node.data.layoutColumn === layoutColumn).length;
    const newNode = buildNode(`node-${crypto.randomUUID()}`, {
      ...template.data,
      category: template.category,
      name: template.data.defaultName,
      layoutColumn,
      layoutRow: existingInColumn + 1,
    });

    setGraph((current) => ({
      ...current,
      nodes: [
        ...current.nodes,
        {
          ...newNode,
          position,
        },
      ],
    }));
  };

  const handleDragStart = (event: React.DragEvent<HTMLButtonElement>, template: BlockTemplate) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("application/architecture-template", template.id);
  };

  return (
    <div className="h-[calc(100svh-11rem)] min-h-[720px]">
      <motion.section
        layout
        className="relative h-full overflow-hidden rounded-[34px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.08),transparent_32%),#020617]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(148,163,184,0.08),transparent_54%)]" />

        <motion.div
          layout
          className="absolute left-[312px] right-4 top-4 z-20 overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/84 shadow-[0_24px_72px_rgba(2,6,23,0.38)] backdrop-blur-xl"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Layers3 className="size-4 text-sky-300" />
                Pacemaker System Architecture
              </div>
              <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                Interactive safety and signal-flow canvas
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                className="rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10"
                onClick={() => setInfoCollapsed((current) => !current)}
              >
                {infoCollapsed ? "Expand metrics" : "Collapse"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10"
                onClick={handleAutoLayout}
              >
                <Sparkles className="mr-2 size-4 text-sky-300" />
                Auto-layout
              </Button>
              <Button
                type="button"
                variant="secondary"
                className={cn(
                  "rounded-full border border-white/10 text-white hover:bg-white/10",
                  collaborationOverlayOpen ? "bg-amber-400/16" : "bg-white/5",
                )}
                onClick={() => setCollaborationOverlayOpen(!collaborationOverlayOpen)}
              >
                <Activity className="mr-2 size-4 text-amber-200" />
                Collaboration
              </Button>
              <Button
                type="button"
                variant="secondary"
                className={cn(
                  "rounded-full border border-white/10 text-white hover:bg-white/10",
                  reviewMode ? "bg-amber-400/16" : "bg-white/5",
                )}
                onClick={() => setReviewMode(!reviewMode)}
              >
                <Lock className="mr-2 size-4 text-amber-200" />
                {reviewMode ? "Review mode on" : "Review mode off"}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" className="rounded-full bg-sky-400 text-slate-950 hover:bg-sky-300">
                    <Download className="mr-2 size-4" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem onClick={() => exportDiagram("svg", getVisibleNodes(nodes, collaborationOverlayOpen), edges)}>SVG</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportDiagram("png", getVisibleNodes(nodes, collaborationOverlayOpen), edges)}>PNG</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportDiagram("pdf", getVisibleNodes(nodes, collaborationOverlayOpen), edges)}>PDF</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportDiagram("json", getVisibleNodes(nodes, collaborationOverlayOpen), edges)}>JSON</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportDiagram("mermaid", getVisibleNodes(nodes, collaborationOverlayOpen), edges)}>Mermaid</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <AnimatePresence initial={false}>
            {!infoCollapsed ? (
              <motion.div
                layout
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-white/10"
              >
                <div className="grid gap-4 px-5 py-4 lg:grid-cols-4">
                  <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                      <Zap className="size-3.5 text-sky-300" />
                      System Power Budget
                    </div>
                    <div className="mt-3 flex items-end justify-between gap-3">
                      <div className="text-2xl font-semibold text-white">{summary.totalPower.toFixed(2)}W</div>
                      <div className="text-sm text-slate-400">/ {POWER_BUDGET_W.toFixed(1)}W</div>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-white/8">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          summary.totalPower > POWER_BUDGET_W
                            ? "bg-rose-400"
                            : summary.totalPower > POWER_BUDGET_W * 0.8
                              ? "bg-amber-400"
                              : "bg-emerald-400",
                        )}
                        style={{ width: `${clamp((summary.totalPower / POWER_BUDGET_W) * 100, 0, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                      <DollarSign className="size-3.5 text-emerald-300" />
                      System Cost Proxy
                    </div>
                    <div className="mt-3 flex items-end justify-between gap-3">
                      <div className="text-2xl font-semibold text-white">{formatCurrency(summary.totalCost)}</div>
                      <div className="text-sm text-slate-400">/ {formatCurrency(COST_TARGET_USD)}</div>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-white/8">
                      <div
                        className="h-full rounded-full bg-emerald-400"
                        style={{ width: `${clamp((summary.totalCost / COST_TARGET_USD) * 100, 0, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Topology Density</div>
                    <div className="mt-3 flex items-center gap-6">
                      <div>
                        <div className="text-2xl font-semibold text-white">{summary.blockCount}</div>
                        <div className="text-sm text-slate-400">Blocks</div>
                      </div>
                      <div>
                        <div className="text-2xl font-semibold text-white">{summary.interfaceCount}</div>
                        <div className="text-sm text-slate-400">Interfaces</div>
                      </div>
                    </div>
                  </div>
                  <div className={cn("rounded-[22px] border p-4", summary.issuesFound ? "border-rose-300/25 bg-rose-400/8" : "border-emerald-300/25 bg-emerald-400/8")}>
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-300">
                      <ShieldCheck className="size-3.5" />
                      Safety Integrity
                    </div>
                    <div className="mt-3 text-lg font-semibold text-white">
                      {summary.issuesFound ? "Issues Found" : "All Critical Functions Covered"}
                    </div>
                    <div className="mt-2 text-sm text-slate-300">
                      {summary.issuesFound
                        ? "At least one safety-critical block is missing linked requirements."
                        : "Safety-critical blocks remain tied to pacing, power, and output requirements."}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>

        <BlockLibrary search={toolbarSearch} onSearchChange={setToolbarSearch} onDragStart={handleDragStart} reviewMode={reviewMode} />

        <div className="absolute inset-0" onDrop={handleDrop} onDragOver={(event) => event.preventDefault()}>
          <ReactFlow<ArchitectureNode, ArchitectureEdge>
            fitView
            minZoom={0.25}
            maxZoom={1.8}
            nodes={renderedNodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            proOptions={{ hideAttribution: true }}
            nodesDraggable={!reviewMode}
            nodesConnectable={!reviewMode}
            elementsSelectable
            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
            onPaneClick={() => setSelectedNodeId(null)}
            onConnect={onConnect}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeDragStart={() => {
              dragSnapshot.current = { nodes, edges };
            }}
            onNodeDragStop={() => {
              if (!dragSnapshot.current) {
                return;
              }

              setGraph({ nodes, edges }, { previous: dragSnapshot.current });
              dragSnapshot.current = null;
            }}
            defaultEdgeOptions={{ type: "architectureEdge" }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1.3} color="rgba(148,163,184,0.24)" />
            <MiniMap
              pannable
              zoomable
              nodeColor={(node) => toneStroke[((node.data as ArchitectureNodeData | undefined)?.tone ?? "Display") as SubsystemTone]}
              maskColor="rgba(2,6,23,0.72)"
              className="!bottom-4 !right-[326px] !border !border-white/10 !bg-slate-950/85"
            />
            <Controls className="!left-[312px] !top-[160px]" />
          </ReactFlow>
        </div>

        {collaborationOverlayOpen ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 left-[312px] z-20 flex items-center gap-3 rounded-full border border-amber-300/25 bg-slate-950/86 px-4 py-2 text-sm text-slate-200 shadow-[0_18px_48px_rgba(2,6,23,0.42)] backdrop-blur-xl"
          >
            <div className="flex items-center gap-2 text-amber-200">
              <Sparkles className="size-4" />
              Annotation pins visible
            </div>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-2 text-slate-300">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-200/20 text-[10px] font-semibold text-amber-100">QT</span>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-200/20 text-[10px] font-semibold text-amber-100">AR</span>
            </div>
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
              Review lock adds amber outlines and freezes edits
            </div>
          </motion.div>
        ) : null}

        <div className="absolute bottom-4 right-[20px] z-20 flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/84 px-3 py-2 text-xs uppercase tracking-[0.18em] text-slate-300 shadow-[0_18px_48px_rgba(2,6,23,0.42)] backdrop-blur-xl">
          <button type="button" onClick={undo} disabled={!canUndo} className="rounded-full border border-white/10 px-3 py-1 disabled:opacity-40">
            Ctrl+Z
          </button>
          <button type="button" onClick={redo} disabled={!canRedo} className="rounded-full border border-white/10 px-3 py-1 disabled:opacity-40">
            Ctrl+Y
          </button>
        </div>

        <AnimatePresence>{selectedNode ? <InspectorPanel node={selectedNode} /> : null}</AnimatePresence>
      </motion.section>
    </div>
  );
}

export function ArchitectureWorkbench() {
  return (
    <ReactFlowProvider>
      <ArchitectureWorkbenchInner />
    </ReactFlowProvider>
  );
}
