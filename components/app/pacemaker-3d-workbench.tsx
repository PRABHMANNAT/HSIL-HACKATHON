"use client";

import * as React from "react";
import { useDrag } from "@use-gesture/react";
import { Billboard, ContactShadows, Environment, Html, Line, OrbitControls, Outlines, Sparkles } from "@react-three/drei";
import { Canvas, type ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Battery,
  Bluetooth,
  Cable,
  ChevronDown,
  Component,
  Cpu,
  Download,
  ExternalLink,
  Eye,
  Focus,
  HelpCircle,
  Layers3,
  Radio,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles as SparklesIcon,
  Trash2,
  ScanLine,
} from "lucide-react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type Vec3 = [number, number, number];
type ReplaceableCategory = "MCU" | "Battery" | "BLE" | "HVPS" | "RF";
type DisplayMode = "solid" | "wireframe" | "xray";

type PaletteOption = {
  id: string;
  category: ReplaceableCategory;
  name: string;
  partNumber: string;
  summary: string;
  dimensions: Vec3;
  weightG: number;
  powerUw: number;
  operatingTemp: string;
  keySpec: string;
  color: string;
};

type PacemakerComponent = {
  id:
    | "battery"
    | "main_pcb"
    | "mcu"
    | "hvps"
    | "capacitor"
    | "ble_module"
    | "rf_telemetry"
    | "accelerometer"
    | "reed_switch"
    | "feedthrough"
    | "lead_connector";
  name: string;
  label: string;
  partNumber: string;
  category: "Battery" | "PCB" | "MCU" | "HVPS" | "Capacitor" | "BLE" | "RF" | "Sensor" | "Switch" | "Connector";
  replaceableCategory?: ReplaceableCategory;
  color: string;
  position: Vec3;
  defaultPosition: Vec3;
  dimensions: Vec3;
  explodedOffset: Vec3;
  weightG: number;
  powerUw: number;
  operatingTemp: string;
  keySpec: string;
  specSummary: string;
  bomRowId: string;
  icon: keyof typeof iconMap;
  critical?: boolean;
  visible: boolean;
  narration: string;
};

type ValidationIssue = {
  id: string;
  componentIds: string[];
  severity: "error" | "warning";
  title: string;
  detail: string;
};

type ReplacementPreview = {
  componentName: string;
  previousPart: string;
  nextPart: string;
  sizeDelta: string;
  summary: string;
};

type SceneApi = {
  resetCamera: () => void;
  focusOn: (componentId: string) => void;
  screenshot: () => void;
  projectToPlane: (clientX: number, clientY: number, planeZ: number) => THREE.Vector3 | null;
};

const shellBounds = {
  x: 1.18,
  y: 1.68,
  z: 0.34,
};

const gridStep = 0.05;

const iconMap = {
  battery: Battery,
  board: Component,
  cpu: Cpu,
  hvps: Activity,
  capacitor: Layers3,
  ble: Bluetooth,
  rf: Radio,
  sensor: Activity,
  switch: ShieldAlert,
  connector: Cable,
};

const paletteCatalog: Record<ReplaceableCategory, PaletteOption[]> = {
  MCU: [
    {
      id: "mcu-stm32l476",
      category: "MCU",
      name: "STM32L476",
      partNumber: "STM32L476RG",
      summary: "Current low-power control MCU",
      dimensions: [0.28, 0.28, 0.1],
      weightG: 0.4,
      powerUw: 240,
      operatingTemp: "-40C to 85C",
      keySpec: "80MHz Cortex-M4F",
      color: "#7dd3fc",
    },
    {
      id: "mcu-stm32h7",
      category: "MCU",
      name: "STM32H7",
      partNumber: "STM32H743ZI",
      summary: "High-performance alternative with more thermal load",
      dimensions: [0.34, 0.34, 0.11],
      weightG: 0.46,
      powerUw: 420,
      operatingTemp: "-40C to 105C",
      keySpec: "480MHz Cortex-M7",
      color: "#38bdf8",
    },
    {
      id: "mcu-nrf9151",
      category: "MCU",
      name: "Nordic nRF9151",
      partNumber: "nRF9151",
      summary: "Cellular-capable secure MCU option",
      dimensions: [0.31, 0.31, 0.11],
      weightG: 0.42,
      powerUw: 360,
      operatingTemp: "-40C to 85C",
      keySpec: "Arm Cortex-M33 + modem",
      color: "#60a5fa",
    },
  ],
  Battery: [
    {
      id: "battery-lii-12",
      category: "Battery",
      name: "Li-I 1.2Ah",
      partNumber: "PM-LI-1200",
      summary: "Current implant battery pack",
      dimensions: [1.08, 1.46, 0.32],
      weightG: 24.3,
      powerUw: 0,
      operatingTemp: "0C to 45C",
      keySpec: "1.2Ah titanium-can pack",
      color: "#64748b",
    },
    {
      id: "battery-lii-08",
      category: "Battery",
      name: "Li-I 0.8Ah",
      partNumber: "PM-LI-0800",
      summary: "Compact pack with shorter service life",
      dimensions: [0.92, 1.22, 0.28],
      weightG: 18.8,
      powerUw: 0,
      operatingTemp: "0C to 45C",
      keySpec: "0.8Ah compact pack",
      color: "#94a3b8",
    },
    {
      id: "battery-lii-20",
      category: "Battery",
      name: "Li-I 2.0Ah",
      partNumber: "PM-LI-2000",
      summary: "Extended-life option that crowds the shell",
      dimensions: [1.22, 1.58, 0.36],
      weightG: 29.9,
      powerUw: 0,
      operatingTemp: "0C to 45C",
      keySpec: "2.0Ah extended service pack",
      color: "#475569",
    },
  ],
  BLE: [
    {
      id: "ble-nrf52840",
      category: "BLE",
      name: "nRF52840",
      partNumber: "nRF52840-QIAA",
      summary: "Current BLE module",
      dimensions: [0.42, 0.48, 0.08],
      weightG: 0.9,
      powerUw: 140,
      operatingTemp: "-40C to 85C",
      keySpec: "BLE 5.3 secure radio",
      color: "#38bdf8",
    },
    {
      id: "ble-nrf5340",
      category: "BLE",
      name: "nRF5340",
      partNumber: "nRF5340-QKAA",
      summary: "Next-gen dual-core BLE option",
      dimensions: [0.45, 0.5, 0.08],
      weightG: 1.1,
      powerUw: 172,
      operatingTemp: "-40C to 85C",
      keySpec: "Dual-core BLE / 802.15.4",
      color: "#0ea5e9",
    },
    {
      id: "ble-cc2640r2",
      category: "BLE",
      name: "CC2640R2",
      partNumber: "CC2640R2F128",
      summary: "TI low-power BLE fallback",
      dimensions: [0.38, 0.44, 0.08],
      weightG: 0.82,
      powerUw: 132,
      operatingTemp: "-40C to 85C",
      keySpec: "BLE low-power SoC",
      color: "#22d3ee",
    },
  ],
  HVPS: [
    {
      id: "hvps-custom",
      category: "HVPS",
      name: "Custom HVPS",
      partNumber: "HVPS-UNIT-A",
      summary: "Current custom charging block",
      dimensions: [0.54, 0.42, 0.18],
      weightG: 2.1,
      powerUw: 380,
      operatingTemp: "-10C to 60C",
      keySpec: "40V pulse charge path",
      color: "#f59e0b",
    },
    {
      id: "hvps-max17852",
      category: "HVPS",
      name: "MAX17852",
      partNumber: "MAX17852",
      summary: "Alternative monitored HV module",
      dimensions: [0.58, 0.46, 0.19],
      weightG: 2.3,
      powerUw: 410,
      operatingTemp: "-40C to 85C",
      keySpec: "Monitored HV driver",
      color: "#fb923c",
    },
  ],
  RF: [
    {
      id: "rf-402",
      category: "RF",
      name: "402MHz",
      partNumber: "MICS-402-A",
      summary: "Current telemetry module",
      dimensions: [0.38, 0.56, 0.09],
      weightG: 1.2,
      powerUw: 120,
      operatingTemp: "-20C to 70C",
      keySpec: "402MHz medical telemetry",
      color: "#a78bfa",
    },
    {
      id: "rf-415",
      category: "RF",
      name: "415MHz Option",
      partNumber: "MED-415-B",
      summary: "Regional option with shifted tuning",
      dimensions: [0.4, 0.58, 0.09],
      weightG: 1.24,
      powerUw: 132,
      operatingTemp: "-20C to 70C",
      keySpec: "415MHz tuned telemetry",
      color: "#c084fc",
    },
    {
      id: "rf-medradio",
      category: "RF",
      name: "MedRadio 401-406MHz",
      partNumber: "MEDRAD-401",
      summary: "Wide-band MedRadio module",
      dimensions: [0.43, 0.62, 0.1],
      weightG: 1.36,
      powerUw: 146,
      operatingTemp: "-20C to 70C",
      keySpec: "MedRadio 401-406MHz",
      color: "#8b5cf6",
    },
  ],
};

const initialComponents: PacemakerComponent[] = [
  {
    id: "battery",
    name: "battery",
    label: "Li-I Battery 1.2Ah",
    partNumber: "PM-LI-1200",
    category: "Battery",
    replaceableCategory: "Battery",
    color: "#64748b",
    position: [-0.08, -0.08, 0.02],
    defaultPosition: [-0.08, -0.08, 0.02],
    dimensions: [1.08, 1.46, 0.32],
    explodedOffset: [-1.6, -0.55, 0.82],
    weightG: 24.3,
    powerUw: 0,
    operatingTemp: "0C to 45C",
    keySpec: "1.2Ah pack",
    specSummary: "Primary implant power source",
    bomRowId: "battery",
    icon: "battery",
    critical: true,
    visible: true,
    narration: "Battery seats into the lower cradle to balance center of mass and reserve energy density.",
  },
  {
    id: "main_pcb",
    name: "main_pcb",
    label: "Main PCB",
    partNumber: "PCB-6L-CORE",
    category: "PCB",
    color: "#0f7a5c",
    position: [0.03, 0.12, -0.16],
    defaultPosition: [0.03, 0.12, -0.16],
    dimensions: [1.62, 1.84, 0.07],
    explodedOffset: [0, -1.85, -0.45],
    weightG: 4.8,
    powerUw: 0,
    operatingTemp: "-40C to 85C",
    keySpec: "6-layer HDI board",
    specSummary: "Backbone routing, sensing, and telemetry interconnect",
    bomRowId: "mcu",
    icon: "board",
    critical: true,
    visible: true,
    narration: "The six-layer PCB establishes signal integrity between therapy, telemetry, and sensing zones.",
  },
  {
    id: "mcu",
    name: "mcu",
    label: "STM32L476",
    partNumber: "STM32L476RG",
    category: "MCU",
    replaceableCategory: "MCU",
    color: "#7dd3fc",
    position: [0.22, 0.34, -0.08],
    defaultPosition: [0.22, 0.34, -0.08],
    dimensions: [0.28, 0.28, 0.1],
    explodedOffset: [0.88, 1.36, 0.9],
    weightG: 0.4,
    powerUw: 240,
    operatingTemp: "-40C to 85C",
    keySpec: "80MHz Cortex-M4F",
    specSummary: "Primary pacing control and diagnostics MCU",
    bomRowId: "mcu",
    icon: "cpu",
    critical: true,
    visible: true,
    narration: "The control MCU anchors timing-critical pacing logic and safety interlocks.",
  },
  {
    id: "hvps",
    name: "hvps",
    label: "HVPS Unit",
    partNumber: "HVPS-UNIT-A",
    category: "HVPS",
    replaceableCategory: "HVPS",
    color: "#f59e0b",
    position: [-0.36, 0.48, -0.04],
    defaultPosition: [-0.36, 0.48, -0.04],
    dimensions: [0.54, 0.42, 0.18],
    explodedOffset: [-1.28, 1.18, 0.68],
    weightG: 2.1,
    powerUw: 380,
    operatingTemp: "-10C to 60C",
    keySpec: "40V pulse charging",
    specSummary: "High-voltage charge pump for therapy path",
    bomRowId: "hvps",
    icon: "hvps",
    critical: true,
    visible: true,
    narration: "The HVPS sits away from radio components to preserve EMC margins while charging the therapy capacitor.",
  },
  {
    id: "capacitor",
    name: "capacitor",
    label: "Output Capacitor 10µF",
    partNumber: "CAP-10UF-HV",
    category: "Capacitor",
    color: "#f8fafc",
    position: [0.72, -0.08, -0.01],
    defaultPosition: [0.72, -0.08, -0.01],
    dimensions: [0.24, 0.24, 0.44],
    explodedOffset: [1.66, -0.22, 0.82],
    weightG: 1.7,
    powerUw: 0,
    operatingTemp: "-20C to 70C",
    keySpec: "10µF high-voltage pulse cap",
    specSummary: "Therapy pulse energy reservoir",
    bomRowId: "caps",
    icon: "capacitor",
    critical: true,
    visible: true,
    narration: "The pulse capacitor is kept near the output path to minimize discharge loop inductance.",
  },
  {
    id: "ble_module",
    name: "ble_module",
    label: "nRF52840 BLE",
    partNumber: "nRF52840-QIAA",
    category: "BLE",
    replaceableCategory: "BLE",
    color: "#38bdf8",
    position: [0.54, 0.55, -0.05],
    defaultPosition: [0.54, 0.55, -0.05],
    dimensions: [0.42, 0.48, 0.08],
    explodedOffset: [1.46, 0.98, 0.64],
    weightG: 0.9,
    powerUw: 140,
    operatingTemp: "-40C to 85C",
    keySpec: "BLE 5.3",
    specSummary: "Short-range telemetry and provisioning radio",
    bomRowId: "ble",
    icon: "ble",
    critical: false,
    visible: true,
    narration: "BLE stays in the upper radio zone for service proximity communication and secure commissioning.",
  },
  {
    id: "rf_telemetry",
    name: "rf_telemetry",
    label: "402MHz Telemetry",
    partNumber: "MICS-402-A",
    category: "RF",
    replaceableCategory: "RF",
    color: "#a78bfa",
    position: [0.82, 0.12, -0.02],
    defaultPosition: [0.82, 0.12, -0.02],
    dimensions: [0.38, 0.56, 0.09],
    explodedOffset: [1.82, 0.22, 0.76],
    weightG: 1.2,
    powerUw: 120,
    operatingTemp: "-20C to 70C",
    keySpec: "402MHz MICS link",
    specSummary: "Implant telemetry radio module",
    bomRowId: "rf-module",
    icon: "rf",
    critical: false,
    visible: true,
    narration: "The MedRadio telemetry block sits closest to feedthrough routing for tuned output stability.",
  },
  {
    id: "accelerometer",
    name: "accelerometer",
    label: "MEMS Accelerometer",
    partNumber: "BMA400",
    category: "Sensor",
    color: "#10b981",
    position: [0.12, -0.44, -0.08],
    defaultPosition: [0.12, -0.44, -0.08],
    dimensions: [0.16, 0.16, 0.12],
    explodedOffset: [0.96, -1.18, 0.68],
    weightG: 0.12,
    powerUw: 32,
    operatingTemp: "-40C to 85C",
    keySpec: "3-axis motion sensing",
    specSummary: "Activity-adaptive pacing input",
    bomRowId: "accelerometer",
    icon: "sensor",
    critical: false,
    visible: true,
    narration: "The accelerometer is isolated from high-voltage routing to keep motion sensing clean.",
  },
  {
    id: "reed_switch",
    name: "reed_switch",
    label: "Reed Switch",
    partNumber: "RS-MAG-02",
    category: "Switch",
    color: "#cbd5e1",
    position: [-0.82, -0.72, 0.04],
    defaultPosition: [-0.82, -0.72, 0.04],
    dimensions: [0.42, 0.08, 0.08],
    explodedOffset: [-1.42, -1.52, 0.42],
    weightG: 0.38,
    powerUw: 0,
    operatingTemp: "-20C to 70C",
    keySpec: "Magnet detect input",
    specSummary: "Enables service-triggered magnet mode",
    bomRowId: "output-switch",
    icon: "switch",
    critical: true,
    visible: true,
    narration: "The reed switch stays near the edge for reliable magnetic actuation during service workflows.",
  },
  {
    id: "feedthrough",
    name: "feedthrough",
    label: "Feedthrough Connector",
    partNumber: "FT-TRI-PIN",
    category: "Connector",
    color: "#e2e8f0",
    position: [0.9, 1.2, 0.06],
    defaultPosition: [0.9, 1.2, 0.06],
    dimensions: [0.42, 0.22, 0.16],
    explodedOffset: [1.44, 1.32, 0.72],
    weightG: 1.1,
    powerUw: 0,
    operatingTemp: "-20C to 70C",
    keySpec: "Tri-pin hermetic feedthrough",
    specSummary: "Hermetic transition from electronics to lead port",
    bomRowId: "output-switch",
    icon: "connector",
    critical: true,
    visible: true,
    narration: "Feedthrough pins bridge the sealed titanium shell to the external lead connector while keeping the hermetic barrier intact.",
  },
  {
    id: "lead_connector",
    name: "lead_connector",
    label: "IS-1 Lead Port",
    partNumber: "IS1-HEADER-A",
    category: "Connector",
    color: "#d5dee8",
    position: [0.96, 1.84, 0.12],
    defaultPosition: [0.96, 1.84, 0.12],
    dimensions: [0.44, 0.46, 0.24],
    explodedOffset: [1.88, 2.04, 0.56],
    weightG: 2.8,
    powerUw: 0,
    operatingTemp: "-20C to 70C",
    keySpec: "IS-1 compliant lead header",
    specSummary: "External connector interface for pacing leads",
    bomRowId: "output-switch",
    icon: "connector",
    critical: true,
    visible: true,
    narration: "The IS-1 header remains the outermost assembly step, capturing the final feedthrough alignment into the lead path.",
  },
];

function snapValue(value: number) {
  return Math.round(value / gridStep) * gridStep;
}

function clampPosition(position: Vec3, dimensions: Vec3): Vec3 {
  const [width, height, depth] = dimensions;
  return [
    THREE.MathUtils.clamp(position[0], -shellBounds.x + width / 2, shellBounds.x - width / 2),
    THREE.MathUtils.clamp(position[1], -shellBounds.y + height / 2, shellBounds.y - height / 2),
    THREE.MathUtils.clamp(position[2], -shellBounds.z + depth / 2, shellBounds.z - depth / 2),
  ];
}

function getPaletteAlternatives(component: PacemakerComponent) {
  if (!component.replaceableCategory) {
    return [];
  }

  return paletteCatalog[component.replaceableCategory];
}

function buildPcbTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext("2d");

  if (!context) {
    return null;
  }

  context.fillStyle = "#0d5d48";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = "#f5c95e";
  context.lineWidth = 6;

  for (let index = 0; index < 16; index += 1) {
    const y = 26 + index * 28;
    context.beginPath();
    context.moveTo(24, y);
    context.lineTo(188 + (index % 3) * 34, y);
    context.lineTo(250 + (index % 2) * 42, y + 16);
    context.lineTo(468, y + 16);
    context.stroke();
  }

  context.fillStyle = "#d4af37";
  for (let index = 0; index < 30; index += 1) {
    context.beginPath();
    context.arc(30 + (index % 10) * 46, 40 + Math.floor(index / 10) * 160, 7, 0, Math.PI * 2);
    context.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.5, 1.5);
  texture.anisotropy = 8;
  return texture;
}

function getDistance(a: Vec3, b: Vec3) {
  return Math.sqrt(
    (a[0] - b[0]) ** 2 +
      (a[1] - b[1]) ** 2 +
      (a[2] - b[2]) ** 2,
  );
}

function computeIssues(components: PacemakerComponent[]) {
  const visibleComponents = components.filter((component) => component.visible);
  const issues: ValidationIssue[] = [];
  const requiredIds = [
    "battery",
    "main_pcb",
    "mcu",
    "hvps",
    "capacitor",
    "ble_module",
    "rf_telemetry",
    "accelerometer",
    "feedthrough",
    "lead_connector",
  ];

  requiredIds.forEach((requiredId) => {
    if (!visibleComponents.find((component) => component.id === requiredId)) {
      issues.push({
        id: `missing-${requiredId}`,
        componentIds: [requiredId],
        severity: "error",
        title: "Required component missing",
        detail: `${requiredId.replace(/_/g, " ")} is missing from the current device layout.`,
      });
    }
  });

  visibleComponents.forEach((component) => {
    const [x, y, z] = component.position;
    const [width, height, depth] = component.dimensions;
    if (
      Math.abs(x) + width / 2 > shellBounds.x ||
      Math.abs(y) + height / 2 > shellBounds.y ||
      Math.abs(z) + depth / 2 > shellBounds.z
    ) {
      issues.push({
        id: `bounds-${component.id}`,
        componentIds: [component.id],
        severity: "error",
        title: "Exceeds shell envelope",
        detail: `${component.label} breaks the housing boundary envelope.`,
      });
    }
  });

  for (let leftIndex = 0; leftIndex < visibleComponents.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < visibleComponents.length; rightIndex += 1) {
      const left = visibleComponents[leftIndex];
      const right = visibleComponents[rightIndex];

      const overlapX = Math.abs(left.position[0] - right.position[0]) < (left.dimensions[0] + right.dimensions[0]) / 2 - 0.02;
      const overlapY = Math.abs(left.position[1] - right.position[1]) < (left.dimensions[1] + right.dimensions[1]) / 2 - 0.02;
      const overlapZ = Math.abs(left.position[2] - right.position[2]) < (left.dimensions[2] + right.dimensions[2]) / 2 - 0.02;

      if (overlapX && overlapY && overlapZ) {
        issues.push({
          id: `overlap-${left.id}-${right.id}`,
          componentIds: [left.id, right.id],
          severity: "error",
          title: "Unsafe component overlap",
          detail: `${left.label} overlaps ${right.label}.`,
        });
      }
    }
  }

  const hvps = visibleComponents.find((component) => component.id === "hvps");
  const rf = visibleComponents.find((component) => component.id === "rf_telemetry");
  const ble = visibleComponents.find((component) => component.id === "ble_module");

  if (hvps && rf && getDistance(hvps.position, rf.position) < 0.92) {
    issues.push({
      id: "emc-hvps-rf",
      componentIds: ["hvps", "rf_telemetry"],
      severity: "warning",
      title: "EMC separation margin low",
      detail: "HVPS and 402MHz telemetry module are closer than the recommended EMC separation envelope.",
    });
  }

  if (hvps && ble && getDistance(hvps.position, ble.position) < 0.78) {
    issues.push({
      id: "emc-hvps-ble",
      componentIds: ["hvps", "ble_module"],
      severity: "warning",
      title: "BLE isolation margin low",
      detail: "HVPS and BLE module should be spaced farther apart to protect radio stability.",
    });
  }

  return issues;
}

function getIssuesByComponent(issues: ValidationIssue[]) {
  return issues.reduce<Record<string, ValidationIssue[]>>((accumulator, issue) => {
    issue.componentIds.forEach((componentId) => {
      accumulator[componentId] = [...(accumulator[componentId] ?? []), issue];
    });
    return accumulator;
  }, {});
}

function getLabelPosition(component: PacemakerComponent) {
  const [x, y, z] = component.explodedOffset;
  const offset = new THREE.Vector3(x, y, z).normalize().multiplyScalar(0.52);
  return [offset.x, offset.y + 0.22, offset.z + 0.08] as Vec3;
}

function formatDimension(dimensions: Vec3) {
  return `${(dimensions[0] * 10).toFixed(1)} × ${(dimensions[1] * 10).toFixed(1)} × ${(dimensions[2] * 10).toFixed(1)} mm`;
}

function formatPower(powerUw: number) {
  return `${powerUw.toFixed(0)} µW`;
}

function formatDimensionText(dimensions: Vec3) {
  void formatDimension;
  return `${(dimensions[0] * 10).toFixed(1)} x ${(dimensions[1] * 10).toFixed(1)} x ${(dimensions[2] * 10).toFixed(1)} mm`;
}

function formatPowerText(powerUw: number) {
  void formatPower;
  return `${powerUw.toFixed(0)} uW`;
}

function TitaniumShell({ displayMode }: { displayMode: DisplayMode }) {
  const transparent = displayMode === "xray";
  const wireframe = displayMode === "wireframe";

  return (
    <group name="outer_shell">
      <mesh position={[0.08, 0.08, -0.02]} rotation={[0, 0, -0.08]} scale={[1.5, 1.88, 0.42]} castShadow receiveShadow>
        <capsuleGeometry args={[0.96, 1.48, 18, 36]} />
        <meshStandardMaterial
          color="#8B9BAD"
          metalness={0.82}
          roughness={0.3}
          envMapIntensity={1.35}
          transparent={transparent}
          opacity={transparent ? 0.22 : 1}
          wireframe={wireframe}
        />
      </mesh>

      <mesh position={[-0.18, -1.18, 0.12]} rotation={[0, 0, 0.03]} scale={[1.22, 0.74, 0.38]} castShadow receiveShadow>
        <capsuleGeometry args={[0.86, 0.62, 16, 28]} />
        <meshStandardMaterial
          color="#6e7e90"
          metalness={0.88}
          roughness={0.24}
          transparent={transparent}
          opacity={transparent ? 0.28 : 1}
          wireframe={wireframe}
        />
      </mesh>

      {[
        [-1.06, 1.12, 0.15],
        [0.88, 1.22, 0.15],
        [-1.12, -1.22, 0.14],
        [0.98, -1.34, 0.14],
      ].map((position, index) => (
        <mesh key={`suture-${index}`} position={position as Vec3} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.12, 0.03, 12, 36]} />
          <meshStandardMaterial
            color="#9aabba"
            metalness={0.9}
            roughness={0.22}
            transparent={transparent}
            opacity={transparent ? 0.34 : 1}
            wireframe={wireframe}
          />
        </mesh>
      ))}

      <mesh position={[0.08, 0.04, 0.23]} rotation={[0, 0, -0.08]} scale={[1.44, 1.68, 0.06]}>
        <capsuleGeometry args={[0.92, 1.34, 18, 32]} />
        <meshStandardMaterial
          color="#c3cfdb"
          metalness={0.94}
          roughness={0.16}
          envMapIntensity={1.55}
          transparent={transparent}
          opacity={transparent ? 0.1 : 0.28}
          wireframe={wireframe}
        />
      </mesh>

      <mesh position={[-0.28, -0.5, 0.19]} rotation={[0, 0, -0.06]} scale={[1.04, 0.05, 0.05]}>
        <boxGeometry args={[1.55, 0.12, 0.14]} />
        <meshStandardMaterial
          color="#d7e1eb"
          metalness={0.92}
          roughness={0.14}
          transparent={transparent}
          opacity={transparent ? 0.12 : 0.24}
          wireframe={wireframe}
        />
      </mesh>
    </group>
  );
}

function ConnectorHeader({ displayMode }: { displayMode: DisplayMode }) {
  const transparent = displayMode === "xray";
  const wireframe = displayMode === "wireframe";

  return (
    <group position={[1.18, 1.78, 0.16]} rotation={[0, 0, -0.06]} name="connector_header">
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.72, 0.56, 0.36]} />
        <meshStandardMaterial
          color="#cad7e5"
          metalness={0.42}
          roughness={0.12}
          envMapIntensity={1.45}
          transparent
          opacity={displayMode === "xray" ? 0.18 : 0.68}
          wireframe={wireframe}
        />
      </mesh>
      <mesh position={[-0.06, -0.2, 0]}>
        <boxGeometry args={[0.46, 0.08, 0.3]} />
        <meshStandardMaterial
          color="#6a7788"
          metalness={0.84}
          roughness={0.28}
          transparent={transparent}
          opacity={transparent ? 0.28 : 1}
          wireframe={wireframe}
        />
      </mesh>
      {[-0.14, 0.14].map((x) => (
        <group key={`lead-ring-${x}`} position={[x, 0.06, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.072, 0.072, 0.32, 32]} />
            <meshStandardMaterial color="#edf2f7" metalness={0.94} roughness={0.14} wireframe={wireframe} />
          </mesh>
          <mesh position={[0, 0, 0.11]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.092, 0.018, 12, 36]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} wireframe={wireframe} />
          </mesh>
          <mesh position={[0, 0, -0.11]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.092, 0.018, 12, 36]} />
            <meshStandardMaterial color="#64748b" metalness={0.88} roughness={0.22} wireframe={wireframe} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function ValidationBadge({
  status,
}: {
  status: "ok" | "issue";
}) {
  return (
    <Html distanceFactor={10} position={[0, 0.22, 0]} center>
      <div
        className={cn(
          "rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] shadow-[0_8px_24px_rgba(2,6,23,0.35)]",
          status === "ok"
            ? "border-emerald-300/30 bg-emerald-400/12 text-emerald-100"
            : "border-rose-300/30 bg-rose-400/12 text-rose-100",
        )}
      >
        {status === "ok" ? "OK" : "Issue"}
      </div>
    </Html>
  );
}

function FloatingLabel({
  component,
  highlighted,
}: {
  component: PacemakerComponent;
  highlighted: boolean;
}) {
  const Icon = iconMap[component.icon];
  const labelPosition = getLabelPosition(component);

  return (
    <>
      <Line
        points={[
          [0, 0, 0],
          labelPosition,
        ]}
        color="rgba(148,163,184,0.6)"
        lineWidth={1}
        transparent
      />
      <Billboard position={labelPosition}>
        <Html distanceFactor={8} transform>
          <div
            className={cn(
              "min-w-[190px] rounded-[18px] border px-3 py-2.5 text-white shadow-[0_18px_42px_rgba(2,6,23,0.38)] backdrop-blur-xl transition",
              highlighted ? "border-sky-300/40 bg-slate-950/96" : "border-white/10 bg-slate-950/88",
            )}
          >
            <div className="flex items-start gap-2">
              <div
                className={cn(
                  "rounded-xl border p-2",
                  highlighted ? "border-sky-300/30 bg-sky-400/12 text-sky-200" : "border-white/10 bg-white/8 text-sky-300",
                )}
              >
                <Icon className="size-3.5" />
              </div>
              <div className="min-w-0">
                <div className={cn("text-xs uppercase tracking-[0.18em]", highlighted ? "text-sky-200" : "text-slate-400")}>
                  {component.name}
                </div>
                <div className="mt-1 text-sm font-semibold">{component.label}</div>
                <div className="mt-1 text-xs text-slate-300">{component.keySpec}</div>
              </div>
            </div>
          </div>
        </Html>
      </Billboard>
    </>
  );
}

function ComponentPrimitive({
  component,
  selected,
  displayMode,
  annotations,
  validate,
  hasIssues,
  explodeFactor,
  hovered,
  onSelect,
  onHoverChange,
  onDragStart,
  pcbTexture,
}: {
  component: PacemakerComponent;
  selected: boolean;
  displayMode: DisplayMode;
  annotations: boolean;
  validate: boolean;
  hasIssues: boolean;
  explodeFactor: number;
  hovered: boolean;
  onSelect: (componentId: string) => void;
  onHoverChange: (componentId: string | null) => void;
  onDragStart: (componentId: string) => void;
  pcbTexture: THREE.CanvasTexture | null;
}) {
  const groupRef = React.useRef<THREE.Group>(null);
  const materialRef = React.useRef<THREE.MeshStandardMaterial>(null);
  const helperMaterialRef = React.useRef<THREE.MeshStandardMaterial>(null);
  const target = React.useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    const group = groupRef.current;
    if (!group) {
      return;
    }

    target.set(
      component.position[0] + component.explodedOffset[0] * explodeFactor,
      component.position[1] + component.explodedOffset[1] * explodeFactor,
      component.position[2] + component.explodedOffset[2] * explodeFactor,
    );
    group.position.lerp(target, 0.14);

    const pulse = selected ? 0.35 + Math.sin(state.clock.elapsedTime * 4.2) * 0.2 : 0;
    if (materialRef.current) {
      materialRef.current.emissive.set(hasIssues && validate ? "#ef4444" : "#60a5fa");
      materialRef.current.emissiveIntensity = hasIssues && validate ? 0.22 : pulse;
      materialRef.current.wireframe = displayMode === "wireframe";
    }
    if (helperMaterialRef.current) {
      helperMaterialRef.current.emissive.set(hasIssues && validate ? "#ef4444" : "#60a5fa");
      helperMaterialRef.current.emissiveIntensity = selected ? pulse * 0.5 : 0;
      helperMaterialRef.current.wireframe = displayMode === "wireframe";
    }
  });

  const baseMaterialProps = {
    transparent: displayMode === "xray",
    opacity: displayMode === "xray" ? 0.72 : 1,
    wireframe: displayMode === "wireframe",
  };

  const sharedHandlers = {
    onClick: (event: ThreeEvent<MouseEvent>) => {
      event.stopPropagation();
      onSelect(component.id);
    },
    onPointerOver: (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation();
      onHoverChange(component.id);
    },
    onPointerOut: (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation();
      onHoverChange(null);
    },
    onPointerDown: (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation();
      onSelect(component.id);
      onDragStart(component.id);
    },
    userData: { componentId: component.id },
  };

  const body = (() => {
    switch (component.id) {
      case "battery":
        return (
          <mesh castShadow receiveShadow {...sharedHandlers}>
            <boxGeometry args={component.dimensions} />
            <meshStandardMaterial ref={materialRef} color="#3c4954" metalness={0.72} roughness={0.35} {...baseMaterialProps} />
            {selected ? <Outlines color="#60a5fa" thickness={0.08} /> : null}
          </mesh>
        );
      case "main_pcb":
        return (
          <mesh castShadow receiveShadow {...sharedHandlers}>
            <boxGeometry args={component.dimensions} />
            <meshStandardMaterial
              ref={materialRef}
              color="#0f7a5c"
              metalness={0.18}
              roughness={0.62}
              map={pcbTexture ?? undefined}
              {...baseMaterialProps}
            />
            {selected ? <Outlines color="#60a5fa" thickness={0.05} /> : null}
          </mesh>
        );
      case "mcu":
        return (
          <mesh castShadow {...sharedHandlers}>
            <boxGeometry args={component.dimensions} />
            <meshStandardMaterial ref={materialRef} color={component.color} metalness={0.46} roughness={0.26} {...baseMaterialProps} />
            {selected ? <Outlines color="#60a5fa" thickness={0.09} /> : null}
          </mesh>
        );
      case "hvps":
        return (
          <group {...sharedHandlers}>
            <mesh castShadow>
              <boxGeometry args={component.dimensions} />
              <meshStandardMaterial ref={materialRef} color={component.color} metalness={0.42} roughness={0.3} {...baseMaterialProps} />
              {selected ? <Outlines color="#60a5fa" thickness={0.07} /> : null}
            </mesh>
            <mesh position={[0.12, 0.12, component.dimensions[2] / 2 + 0.02]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.09, 0.025, 12, 24]} />
              <meshStandardMaterial ref={helperMaterialRef} color="#fbbf24" metalness={0.6} roughness={0.28} {...baseMaterialProps} />
            </mesh>
          </group>
        );
      case "capacitor":
        return (
          <mesh castShadow rotation={[Math.PI / 2, 0, 0]} {...sharedHandlers}>
            <cylinderGeometry args={[component.dimensions[0] / 2, component.dimensions[0] / 2, component.dimensions[2], 32]} />
            <meshStandardMaterial ref={materialRef} color="#e2e8f0" metalness={0.58} roughness={0.2} {...baseMaterialProps} />
            {selected ? <Outlines color="#60a5fa" thickness={0.09} /> : null}
          </mesh>
        );
      case "ble_module":
      case "rf_telemetry":
        return (
          <group {...sharedHandlers}>
            <mesh castShadow>
              <boxGeometry args={component.dimensions} />
              <meshStandardMaterial ref={materialRef} color={component.color} metalness={0.18} roughness={0.56} {...baseMaterialProps} />
              {selected ? <Outlines color="#60a5fa" thickness={0.06} /> : null}
            </mesh>
            <mesh position={[0.15, 0.12, component.dimensions[2] / 2 + 0.015]}>
              <boxGeometry args={[0.08, 0.12, 0.03]} />
              <meshStandardMaterial ref={helperMaterialRef} color="#eab308" metalness={0.5} roughness={0.25} {...baseMaterialProps} />
            </mesh>
          </group>
        );
      case "accelerometer":
        return (
          <mesh castShadow {...sharedHandlers}>
            <boxGeometry args={component.dimensions} />
            <meshStandardMaterial ref={materialRef} color={component.color} metalness={0.28} roughness={0.42} {...baseMaterialProps} />
            {selected ? <Outlines color="#60a5fa" thickness={0.08} /> : null}
          </mesh>
        );
      case "reed_switch":
        return (
          <mesh castShadow rotation={[0, 0, Math.PI / 2]} {...sharedHandlers}>
            <capsuleGeometry args={[0.04, 0.26, 6, 16]} />
            <meshStandardMaterial ref={materialRef} color="#cbd5e1" metalness={0.64} roughness={0.18} {...baseMaterialProps} />
            {selected ? <Outlines color="#60a5fa" thickness={0.08} /> : null}
          </mesh>
        );
      case "feedthrough":
        return (
          <group {...sharedHandlers}>
            <mesh>
              <boxGeometry args={component.dimensions} />
              <meshStandardMaterial ref={materialRef} color="#94a3b8" metalness={0.68} roughness={0.24} {...baseMaterialProps} />
              {selected ? <Outlines color="#60a5fa" thickness={0.06} /> : null}
            </mesh>
            {[-0.1, 0, 0.1].map((x) => (
              <mesh key={`pin-${x}`} position={[x, 0.04, component.dimensions[2] / 2 + 0.06]}>
                <cylinderGeometry args={[0.02, 0.02, 0.14, 16]} />
                <meshStandardMaterial ref={helperMaterialRef} color="#f8fafc" metalness={0.82} roughness={0.16} {...baseMaterialProps} />
              </mesh>
            ))}
          </group>
        );
      case "lead_connector":
        return (
          <group {...sharedHandlers}>
            <mesh>
              <boxGeometry args={component.dimensions} />
              <meshStandardMaterial ref={materialRef} color="#d6dde6" metalness={0.9} roughness={0.2} {...baseMaterialProps} />
              {selected ? <Outlines color="#60a5fa" thickness={0.06} /> : null}
            </mesh>
            {[-0.12, 0, 0.12].map((x) => (
              <mesh key={`ring-${x}`} position={[x, 0.02, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.05, 0.014, 8, 24]} />
                <meshStandardMaterial ref={helperMaterialRef} color="#475569" metalness={0.78} roughness={0.22} {...baseMaterialProps} />
              </mesh>
            ))}
          </group>
        );
      default:
        return null;
    }
  })();

  if (!component.visible) {
    return null;
  }

  return (
    <group ref={groupRef} name={component.name}>
      {body}
      {annotations || hovered || selected || explodeFactor > 0.45 ? (
        <FloatingLabel component={component} highlighted={hovered || selected} />
      ) : null}
      {validate ? <ValidationBadge status={hasIssues ? "issue" : "ok"} /> : null}
    </group>
  );
}

function SceneBridge({
  apiRef,
  components,
  selectedId,
  displayMode,
  annotations,
  validate,
  exploded,
  stepMode,
  stepIndex,
  dragging,
  hoveredId,
  issuesByComponent,
  onSelect,
  onHoverChange,
  onDragStart,
  backgroundAccent,
}: {
  apiRef: React.MutableRefObject<SceneApi | null>;
  components: PacemakerComponent[];
  selectedId: string | null;
  displayMode: DisplayMode;
  annotations: boolean;
  validate: boolean;
  exploded: boolean;
  stepMode: boolean;
  stepIndex: number;
  dragging: boolean;
  hoveredId: string | null;
  issuesByComponent: Record<string, ValidationIssue[]>;
  onSelect: (componentId: string | null) => void;
  onHoverChange: (componentId: string | null) => void;
  onDragStart: (componentId: string) => void;
  backgroundAccent: string;
}) {
  const controlsRef = React.useRef<OrbitControlsImpl | null>(null);
  const { camera, gl } = useThree();
  const pcbTexture = React.useMemo(() => buildPcbTexture(), []);

  React.useEffect(() => {
    camera.position.set(0, 0.8, 7.2);
    camera.lookAt(0, 0.1, 0);
  }, [camera]);

  React.useEffect(() => {
    apiRef.current = {
      resetCamera: () => {
        camera.position.set(0, 0.8, 7.2);
        if (controlsRef.current) {
          controlsRef.current.target.set(0, 0.1, 0);
          controlsRef.current.update();
        }
      },
      focusOn: (componentId: string) => {
        const component = components.find((entry) => entry.id === componentId && entry.visible);
        if (!component) {
          return;
        }
        const factor = stepMode ? (components.findIndex((entry) => entry.id === componentId) < stepIndex ? 0 : 1) : exploded ? 1 : 0;
        const focus = new THREE.Vector3(
          component.position[0] + component.explodedOffset[0] * factor,
          component.position[1] + component.explodedOffset[1] * factor,
          component.position[2] + component.explodedOffset[2] * factor,
        );
        camera.position.set(focus.x + 1.8, focus.y + 1.1, focus.z + 3.4);
        if (controlsRef.current) {
          controlsRef.current.target.copy(focus);
          controlsRef.current.update();
        }
      },
      screenshot: () => {
        const dataUrl = gl.domElement.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = "pacemaker-3d-design.png";
        link.click();
      },
      projectToPlane: (clientX: number, clientY: number, planeZ: number) => {
        const rect = gl.domElement.getBoundingClientRect();
        const normalized = new THREE.Vector2(
          ((clientX - rect.left) / rect.width) * 2 - 1,
          -((clientY - rect.top) / rect.height) * 2 + 1,
        );
        const raycaster = new THREE.Raycaster();
        const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -planeZ);
        const intersection = new THREE.Vector3();
        raycaster.setFromCamera(normalized, camera);
        return raycaster.ray.intersectPlane(plane, intersection) ? intersection : null;
      },
    };
  }, [apiRef, camera, components, exploded, gl, stepIndex, stepMode]);

  React.useEffect(() => {
    return () => {
      pcbTexture?.dispose();
    };
  }, [pcbTexture]);

  return (
    <>
      <fog attach="fog" args={["#0d1117", 8, 18]} />
      <ambientLight intensity={0.6} color="#dbe7ff" />
      <directionalLight position={[4, 6, 6]} intensity={2.8} color="#f8fbff" castShadow />
      <spotLight position={[-2.5, 4.8, 6]} intensity={3.4} angle={0.38} penumbra={0.7} color={backgroundAccent} />
      <Environment preset="studio" blur={0.72} />
      <Sparkles count={40} scale={[10, 7, 10]} size={1.2} speed={0.12} opacity={0.35} color="#6b8cff" />

      <group
        position={[0, 0.1, 0]}
        onPointerMissed={() => {
          onSelect(null);
          onHoverChange(null);
        }}
      >
        <TitaniumShell displayMode={displayMode} />
        <ConnectorHeader displayMode={displayMode} />
        {components.map((component, index) => {
          const explodeFactor = stepMode ? (index < stepIndex ? 0 : 1) : exploded ? 1 : 0;
          return (
            <ComponentPrimitive
              key={component.id}
              component={component}
              selected={selectedId === component.id}
              displayMode={displayMode}
              annotations={annotations}
              validate={validate}
              hasIssues={(issuesByComponent[component.id] ?? []).length > 0}
              explodeFactor={explodeFactor}
              hovered={hoveredId === component.id}
              onSelect={onSelect}
              onHoverChange={onHoverChange}
              onDragStart={onDragStart}
              pcbTexture={pcbTexture}
            />
          );
        })}
      </group>

      <ContactShadows position={[0, -2.55, 0]} opacity={0.45} scale={8} blur={2.6} far={6} />
      <OrbitControls ref={controlsRef} enablePan enableZoom enableRotate enableDamping dampingFactor={0.08} enabled={!dragging} minDistance={4.2} maxDistance={10.5} />
    </>
  );
}

function PaletteSidebar({
  selectedComponent,
  onPaletteDragStart,
}: {
  selectedComponent: PacemakerComponent | null;
  onPaletteDragStart: (option: PaletteOption) => void;
}) {
  const categories = (Object.keys(paletteCatalog) as ReplaceableCategory[]).map((category) => ({
    category,
    items: paletteCatalog[category],
  }));

  return (
    <aside className="pointer-events-auto absolute left-4 top-20 z-20 w-[280px] overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.82),rgba(2,6,23,0.78))] shadow-[0_28px_80px_rgba(2,6,23,0.45)] backdrop-blur-2xl">
      <div className="border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Layers3 className="size-4 text-sky-300" />
          Component Palette
        </div>
        <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
          Drag cards onto the scene to replace compatible modules
        </div>
      </div>
      <div className="max-h-[calc(100vh-13rem)] space-y-5 overflow-y-auto px-4 py-4">
        {categories.map(({ category, items }) => (
          <section key={category} className="space-y-2">
            <div className="px-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              {category}
            </div>
            <div className="space-y-2">
              {items.map((item) => {
                const compatible =
                  selectedComponent?.replaceableCategory === item.category;
                const Icon = iconMap[
                  item.category === "Battery"
                    ? "battery"
                    : item.category === "MCU"
                      ? "cpu"
                      : item.category === "BLE"
                        ? "ble"
                        : item.category === "HVPS"
                          ? "hvps"
                          : "rf"
                ];

                return (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = "copyMove";
                      event.dataTransfer.setData("application/pacemaker-component", item.id);
                      onPaletteDragStart(item);
                    }}
                    className={cn(
                      "rounded-[22px] border border-white/10 bg-white/5 p-4 text-slate-200 transition hover:border-sky-300/30 hover:bg-white/8",
                      compatible && "border-emerald-300/30 bg-emerald-400/10",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-2xl border border-white/10 bg-white/8 p-2.5 text-sky-200">
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white">{item.name}</div>
                        <div className="mt-1 font-mono text-[11px] text-slate-400">{item.partNumber}</div>
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-slate-300">{item.summary}</div>
                    <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-300">
                      <span className="rounded-full border border-white/10 bg-white/6 px-2 py-1">
                        {formatDimensionText(item.dimensions)}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/6 px-2 py-1">
                        {formatPowerText(item.powerUw)}
                      </span>
                    </div>
                    {compatible && selectedComponent ? (
                      <div className="mt-3 rounded-[16px] border border-emerald-300/20 bg-emerald-400/10 p-3 text-[11px] text-emerald-100">
                        Size delta {((item.dimensions[0] - selectedComponent.dimensions[0]) * 10).toFixed(1)} / {((item.dimensions[1] - selectedComponent.dimensions[1]) * 10).toFixed(1)} / {((item.dimensions[2] - selectedComponent.dimensions[2]) * 10).toFixed(1)} mm
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </aside>
  );
}

function Toolbar({
  displayMode,
  exploded,
  annotations,
  validate,
  onDisplayModeChange,
  onExplodeToggle,
  onAnnotationsToggle,
  onValidateToggle,
  onScreenshot,
  onResetCamera,
  onHelp,
  onReassemble,
  onStepThrough,
}: {
  displayMode: DisplayMode;
  exploded: boolean;
  annotations: boolean;
  validate: boolean;
  onDisplayModeChange: (mode: DisplayMode) => void;
  onExplodeToggle: () => void;
  onAnnotationsToggle: () => void;
  onValidateToggle: () => void;
  onScreenshot: () => void;
  onResetCamera: () => void;
  onHelp: () => void;
  onReassemble: () => void;
  onStepThrough: () => void;
}) {
  return (
    <div className="pointer-events-auto absolute left-1/2 top-4 z-20 flex -translate-x-1/2 flex-wrap items-center gap-2 rounded-full border border-white/10 bg-slate-950/78 px-3 py-2 shadow-[0_20px_56px_rgba(2,6,23,0.4)] backdrop-blur-2xl">
      <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
        {(["solid", "wireframe", "xray"] as DisplayMode[]).map((mode) => (
          <Button
            key={mode}
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "rounded-full px-3 text-xs uppercase tracking-[0.18em]",
              displayMode === mode && "bg-white text-slate-950 hover:bg-white/90",
              displayMode !== mode && "text-slate-200 hover:bg-white/10",
            )}
            onClick={() => onDisplayModeChange(mode)}
          >
            {mode === "solid" ? <Eye className="mr-2 size-3.5" /> : mode === "wireframe" ? <ScanLine className="mr-2 size-3.5" /> : <Layers3 className="mr-2 size-3.5" />}
            {mode}
          </Button>
        ))}
      </div>
      <Button type="button" variant="ghost" size="sm" className="rounded-full text-slate-200 hover:bg-white/10" onClick={onExplodeToggle}>
        <Layers3 className="mr-2 size-4 text-sky-300" />
        {exploded ? "Exploded" : "Explode"}
      </Button>
      {exploded ? (
        <>
          <Button type="button" variant="ghost" size="sm" className="rounded-full text-slate-200 hover:bg-white/10" onClick={onReassemble}>
            <RefreshCcw className="mr-2 size-4 text-emerald-300" />
            Reassemble
          </Button>
          <Button type="button" variant="ghost" size="sm" className="rounded-full text-slate-200 hover:bg-white/10" onClick={onStepThrough}>
            <ChevronDown className="mr-2 size-4 text-amber-200" />
            Step Through
          </Button>
        </>
      ) : null}
      <Button type="button" variant="ghost" size="sm" className={cn("rounded-full hover:bg-white/10", annotations ? "text-white" : "text-slate-300")} onClick={onAnnotationsToggle}>
        <Component className="mr-2 size-4 text-sky-300" />
        Annotations
      </Button>
      <Button type="button" variant="ghost" size="sm" className={cn("rounded-full hover:bg-white/10", validate ? "text-white" : "text-slate-300")} onClick={onValidateToggle}>
        <ShieldCheck className="mr-2 size-4 text-emerald-300" />
        Validate Design
      </Button>
      <Button type="button" variant="ghost" size="sm" className="rounded-full text-slate-200 hover:bg-white/10" onClick={onScreenshot}>
        <Download className="mr-2 size-4 text-slate-300" />
        Screenshot
      </Button>
      <Button type="button" variant="ghost" size="sm" className="rounded-full text-slate-200 hover:bg-white/10" onClick={onResetCamera}>
        <Focus className="mr-2 size-4 text-slate-300" />
        Reset Camera
      </Button>
      <Button type="button" variant="ghost" size="icon-sm" className="rounded-full text-slate-200 hover:bg-white/10" onClick={onHelp}>
        <HelpCircle className="size-4" />
      </Button>
    </div>
  );
}

function PropertiesPanel({
  component,
  issues,
  validate,
  alternativesOpen,
  onAlternativesOpenChange,
  onPositionChange,
  onHighlight,
  onRemove,
  onSwap,
}: {
  component: PacemakerComponent | null;
  issues: ValidationIssue[];
  validate: boolean;
  alternativesOpen: boolean;
  onAlternativesOpenChange: (open: boolean) => void;
  onPositionChange: (axis: 0 | 1 | 2, value: number) => void;
  onHighlight: () => void;
  onRemove: () => void;
  onSwap: (option: PaletteOption) => void;
}) {
  const alternatives = component ? getPaletteAlternatives(component) : [];

  return (
    <aside className="pointer-events-auto absolute right-4 top-20 z-20 w-[340px] overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.82),rgba(2,6,23,0.8))] shadow-[0_28px_80px_rgba(2,6,23,0.45)] backdrop-blur-2xl">
      <div className="border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Component className="size-4 text-sky-300" />
          Component Properties
        </div>
        <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
          {component ? component.label : "Select a component in the scene"}
        </div>
      </div>

      <div className="max-h-[calc(100vh-13rem)] space-y-4 overflow-y-auto px-5 py-4">
        {component ? (
          <>
            <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold text-white">{component.label}</div>
                  <div className="mt-1 font-mono text-xs text-slate-400">{component.partNumber}</div>
                </div>
                {component.critical ? (
                  <Badge className="border border-rose-300/30 bg-rose-400/12 text-rose-100">Safety-Critical</Badge>
                ) : (
                  <Badge className="border border-slate-300/20 bg-white/6 text-slate-200">Support</Badge>
                )}
              </div>
              <div className="mt-3 text-sm leading-6 text-slate-300">{component.specSummary}</div>
            </div>

            <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">3D Position</div>
              <div className="mt-3 grid grid-cols-3 gap-3">
                {(["X", "Y", "Z"] as const).map((axis, index) => (
                  <div key={axis} className="space-y-2">
                    <Label className="text-xs uppercase tracking-[0.18em] text-slate-400">{axis}</Label>
                    <Input
                      type="number"
                      step="0.05"
                      value={component.position[index]}
                      onChange={(event) => onPositionChange(index as 0 | 1 | 2, Number(event.target.value || 0))}
                      className="border-white/10 bg-white/5 text-white"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Specs</div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[16px] border border-white/10 bg-slate-950/70 p-3">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Dimensions</div>
                  <div className="mt-2 text-sm text-slate-100">{formatDimensionText(component.dimensions)}</div>
                </div>
                <div className="rounded-[16px] border border-white/10 bg-slate-950/70 p-3">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Weight</div>
                  <div className="mt-2 text-sm text-slate-100">{component.weightG.toFixed(1)} g</div>
                </div>
                <div className="rounded-[16px] border border-white/10 bg-slate-950/70 p-3">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Power Draw</div>
                  <div className="mt-2 text-sm text-slate-100">{formatPowerText(component.powerUw)}</div>
                </div>
                <div className="rounded-[16px] border border-white/10 bg-slate-950/70 p-3">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Operating Temp</div>
                  <div className="mt-2 text-sm text-slate-100">{component.operatingTemp}</div>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Dialog open={alternativesOpen} onOpenChange={onAlternativesOpenChange}>
                <Button type="button" variant="secondary" className="justify-start rounded-2xl border border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => onAlternativesOpenChange(true)}>
                  <SparklesIcon className="mr-2 size-4 text-amber-200" />
                  Alternative components
                </Button>
                <DialogContent className="max-w-3xl border border-white/10 bg-slate-950 text-white">
                  <DialogHeader>
                    <DialogTitle>{component.label} alternatives</DialogTitle>
                    <DialogDescription className="text-slate-400">
                      Side-by-side fit for qualified alternative modules and part options.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Current</div>
                      <div className="mt-2 text-lg font-semibold">{component.partNumber}</div>
                      <div className="mt-1 text-sm text-slate-300">{component.keySpec}</div>
                      <div className="mt-3 space-y-2 text-sm text-slate-200">
                        <div>{formatDimensionText(component.dimensions)}</div>
                        <div>{component.weightG.toFixed(1)} g</div>
                        <div>{formatPowerText(component.powerUw)}</div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {alternatives.length > 0 ? (
                        alternatives.map((option) => (
                          <div key={option.id} className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-semibold text-white">{option.partNumber}</div>
                                <div className="mt-1 text-sm text-slate-300">{option.keySpec}</div>
                              </div>
                              <Badge className="border border-sky-300/20 bg-sky-400/10 text-sky-100">
                                {Math.max(72, 100 - Math.abs(option.dimensions[0] - component.dimensions[0]) * 100).toFixed(0)}% fit
                              </Badge>
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-200">
                              <div>{formatDimensionText(option.dimensions)}</div>
                              <div>{option.weightG.toFixed(1)} g</div>
                              <div>{formatPowerText(option.powerUw)}</div>
                              <div>{option.operatingTemp}</div>
                            </div>
                            <div className="mt-3 flex justify-end">
                              <Button type="button" variant="secondary" className="rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => onSwap(option)}>
                                Swap in
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-[20px] border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                          No curated alternatives are attached to this component yet.
                        </div>
                      )}
                    </div>
                  </div>
                  <DialogFooter showCloseButton />
                </DialogContent>
              </Dialog>

              <Button type="button" variant="secondary" className="justify-start rounded-2xl border border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={onHighlight}>
                <Focus className="mr-2 size-4 text-sky-300" />
                Highlight in scene
              </Button>

              <Button type="button" variant="secondary" className="justify-start rounded-2xl border border-white/10 bg-white/5 text-white hover:bg-white/10" asChild>
                <a href={`/components#${component.bomRowId}`}>
                  <ExternalLink className="mr-2 size-4 text-emerald-300" />
                  Link to BOM row
                </a>
              </Button>

              <Button type="button" variant="destructive" className="justify-start rounded-2xl" onClick={onRemove}>
                <Trash2 className="mr-2 size-4" />
                Remove component
              </Button>
            </div>
          </>
        ) : (
          <div className="rounded-[22px] border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300">
            Select any component mesh to inspect its coordinates, swap alternatives, or push focus back into the scene.
          </div>
        )}

        {validate ? (
          <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
              <ShieldCheck className="size-3.5 text-emerald-300" />
              Validation Issues
            </div>
            <div className="mt-4 space-y-3">
              {issues.length > 0 ? (
                issues.map((issue) => (
                  <div
                    key={issue.id}
                    className={cn(
                      "rounded-[18px] border p-3",
                      issue.severity === "error"
                        ? "border-rose-300/20 bg-rose-400/10 text-rose-100"
                        : "border-amber-300/20 bg-amber-400/10 text-amber-100",
                    )}
                  >
                    <div className="text-sm font-semibold">{issue.title}</div>
                    <div className="mt-1 text-sm opacity-90">{issue.detail}</div>
                  </div>
                ))
              ) : (
                <div className="rounded-[18px] border border-emerald-300/20 bg-emerald-400/10 p-3 text-sm text-emerald-100">
                  All required components are present, non-overlapping, and inside the housing envelope.
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  );
}

export function Pacemaker3DWorkbench() {
  const sceneApiRef = React.useRef<SceneApi | null>(null);
  const dragComponentIdRef = React.useRef<string | null>(null);
  const dragPaletteItemRef = React.useRef<PaletteOption | null>(null);

  const [components, setComponents] = React.useState(initialComponents);
  const [selectedId, setSelectedId] = React.useState<string | null>("main_pcb");
  const [displayMode, setDisplayMode] = React.useState<DisplayMode>("solid");
  const [annotations, setAnnotations] = React.useState(true);
  const [validate, setValidate] = React.useState(false);
  const [exploded, setExploded] = React.useState(false);
  const [stepMode, setStepMode] = React.useState(false);
  const [stepIndex, setStepIndex] = React.useState(components.length);
  const [dragging, setDragging] = React.useState(false);
  const [helpOpen, setHelpOpen] = React.useState(false);
  const [alternativesOpen, setAlternativesOpen] = React.useState(false);
  const [replacementPreview, setReplacementPreview] = React.useState<ReplacementPreview | null>(null);
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);

  const selectedComponent =
    components.find((component) => component.id === selectedId) ?? null;
  const validationIssues = React.useMemo(() => computeIssues(components), [components]);
  const issuesByComponent = React.useMemo(() => getIssuesByComponent(validationIssues), [validationIssues]);
  const selectedIssues = selectedComponent ? issuesByComponent[selectedComponent.id] ?? [] : validationIssues;
  const narrationSource = React.useMemo(
    () => components.filter((component) => component.visible),
    [components],
  );

  React.useEffect(() => {
    if (!stepMode) {
      return;
    }

    setExploded(true);
    setStepIndex(0);

    const interval = window.setInterval(() => {
      setStepIndex((current) => {
        if (current >= narrationSource.length) {
          window.clearInterval(interval);
          setStepMode(false);
          setExploded(false);
          return narrationSource.length;
        }
        return current + 1;
      });
    }, 850);

    return () => window.clearInterval(interval);
  }, [narrationSource.length, stepMode]);

  React.useEffect(() => {
    if (!replacementPreview) {
      return;
    }

    const timeout = window.setTimeout(() => setReplacementPreview(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [replacementPreview]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement | null)?.tagName === "INPUT") {
        return;
      }

      switch (event.key.toLowerCase()) {
        case "v":
          setDisplayMode((current) =>
            current === "solid" ? "wireframe" : current === "wireframe" ? "xray" : "solid",
          );
          break;
        case "e":
          setExploded((current) => !current);
          break;
        case "a":
          setAnnotations((current) => !current);
          break;
        case "r":
          sceneApiRef.current?.resetCamera();
          break;
        case "escape":
          setSelectedId(null);
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const bindDrag = useDrag(({ active, last, xy: [x, y] }) => {
    const componentId = dragComponentIdRef.current;
    if (!componentId) {
      return;
    }

    const component = components.find((entry) => entry.id === componentId);
    if (!component || !sceneApiRef.current) {
      return;
    }

    setDragging(active);
    const intersection = sceneApiRef.current.projectToPlane(x, y, component.position[2]);
    if (intersection) {
      const nextPosition = clampPosition(
        [
          snapValue(intersection.x),
          snapValue(intersection.y),
          component.position[2],
        ],
        component.dimensions,
      );
      setComponents((current) =>
        current.map((entry) =>
          entry.id === component.id
            ? {
                ...entry,
                position: nextPosition,
              }
            : entry,
        ),
      );
    }

    if (last) {
      dragComponentIdRef.current = null;
      setDragging(false);
    }
  });

  function replaceComponent(targetComponent: PacemakerComponent, option: PaletteOption) {
    setComponents((current) =>
      current.map((entry) =>
        entry.id === targetComponent.id
          ? {
              ...entry,
              label: option.name,
              partNumber: option.partNumber,
              dimensions: option.dimensions,
              color: option.color,
              weightG: option.weightG,
              powerUw: option.powerUw,
              operatingTemp: option.operatingTemp,
              keySpec: option.keySpec,
              specSummary: option.summary,
              position: clampPosition(entry.position, option.dimensions),
            }
          : entry,
      ),
    );

    setReplacementPreview({
      componentName: targetComponent.label,
      previousPart: targetComponent.partNumber,
      nextPart: option.partNumber,
      sizeDelta: `${((option.dimensions[0] - targetComponent.dimensions[0]) * 10).toFixed(1)} / ${((option.dimensions[1] - targetComponent.dimensions[1]) * 10).toFixed(1)} / ${((option.dimensions[2] - targetComponent.dimensions[2]) * 10).toFixed(1)} mm`,
      summary: option.summary,
    });
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const optionId = event.dataTransfer.getData("application/pacemaker-component");
    const option =
      dragPaletteItemRef.current ??
      (Object.values(paletteCatalog).flat().find((entry) => entry.id === optionId) ?? null);
    if (!option) {
      return;
    }

    const target =
      (selectedComponent?.replaceableCategory === option.category && selectedComponent.visible
        ? selectedComponent
        : components.find(
            (component) =>
              component.replaceableCategory === option.category && component.visible,
          )) ?? null;

    if (!target) {
      dragPaletteItemRef.current = null;
      return;
    }

    replaceComponent(target, option);
    setSelectedId(target.id);
    dragPaletteItemRef.current = null;
  }

  function updateSelectedPosition(axis: 0 | 1 | 2, value: number) {
    if (!selectedComponent) {
      return;
    }

    setComponents((current) =>
      current.map((component) => {
        if (component.id !== selectedComponent.id) {
          return component;
        }

        const nextPosition = [...component.position] as Vec3;
        nextPosition[axis] = snapValue(value);

        return {
          ...component,
          position: clampPosition(nextPosition, component.dimensions),
        };
      }),
    );
  }

  function removeSelectedComponent() {
    if (!selectedComponent) {
      return;
    }

    if (
      selectedComponent.critical &&
      !window.confirm("This is a safety-critical component. Remove anyway?")
    ) {
      return;
    }

    setComponents((current) =>
      current.map((component) =>
        component.id === selectedComponent.id
          ? { ...component, visible: false }
          : component,
      ),
    );
    setSelectedId(null);
  }

  return (
    <TooltipProvider delayDuration={120}>
      <div className="h-full min-h-[860px] overflow-hidden">
        <div
          {...bindDrag()}
          onDrop={handleDrop}
          onDragOver={(event) => event.preventDefault()}
          className="relative h-full w-full bg-[radial-gradient(circle_at_top_left,rgba(63,94,251,0.16),transparent_30%),linear-gradient(180deg,#0a0a1a_0%,#0d1117_100%)]"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(148,163,184,0.08),transparent_48%)]" />
          <Canvas
            shadows
            dpr={[1, 2]}
            gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
            camera={{ position: [0, 0.8, 7.2], fov: 35 }}
          >
            <SceneBridge
              apiRef={sceneApiRef}
              components={components}
              selectedId={selectedId}
              displayMode={displayMode}
              annotations={annotations}
              validate={validate}
              exploded={exploded}
              stepMode={stepMode}
              stepIndex={stepIndex}
              dragging={dragging}
              hoveredId={hoveredId}
              issuesByComponent={issuesByComponent}
              onSelect={setSelectedId}
              onHoverChange={setHoveredId}
              onDragStart={(componentId) => {
                dragComponentIdRef.current = componentId;
              }}
              backgroundAccent="#93c5fd"
            />
          </Canvas>

          <Toolbar
            displayMode={displayMode}
            exploded={exploded}
            annotations={annotations}
            validate={validate}
            onDisplayModeChange={setDisplayMode}
            onExplodeToggle={() => setExploded((current) => !current)}
            onAnnotationsToggle={() => setAnnotations((current) => !current)}
            onValidateToggle={() => setValidate((current) => !current)}
            onScreenshot={() => sceneApiRef.current?.screenshot()}
            onResetCamera={() => sceneApiRef.current?.resetCamera()}
            onHelp={() => setHelpOpen(true)}
            onReassemble={() => {
              setStepMode(false);
              setExploded(false);
              setStepIndex(narrationSource.length);
            }}
            onStepThrough={() => setStepMode(true)}
          />

          <PaletteSidebar
            selectedComponent={selectedComponent}
            onPaletteDragStart={(option) => {
              dragPaletteItemRef.current = option;
            }}
          />

          <PropertiesPanel
            component={selectedComponent}
            issues={selectedIssues}
            validate={validate}
            alternativesOpen={alternativesOpen}
            onAlternativesOpenChange={setAlternativesOpen}
            onPositionChange={updateSelectedPosition}
            onHighlight={() => selectedComponent && sceneApiRef.current?.focusOn(selectedComponent.id)}
            onRemove={removeSelectedComponent}
            onSwap={(option) => {
              if (!selectedComponent) {
                return;
              }
              replaceComponent(selectedComponent, option);
              setAlternativesOpen(false);
            }}
          />

          <AnimatePresence>
            {replacementPreview ? (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="pointer-events-none absolute bottom-6 left-1/2 z-20 -translate-x-1/2 rounded-[24px] border border-emerald-300/20 bg-slate-950/84 px-5 py-4 text-white shadow-[0_20px_56px_rgba(2,6,23,0.4)] backdrop-blur-xl"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-200">
                  <ShieldCheck className="size-4" />
                  Replacement preview applied
                </div>
                <div className="mt-2 text-sm text-slate-200">
                  {replacementPreview.componentName}: {replacementPreview.previousPart} → {replacementPreview.nextPart}
                </div>
                <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                  Size delta {replacementPreview.sizeDelta}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {stepMode && narrationSource[stepIndex - 1] ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="pointer-events-none absolute bottom-6 right-1/2 z-20 translate-x-1/2 rounded-[24px] border border-amber-300/20 bg-slate-950/86 px-5 py-4 text-white shadow-[0_20px_56px_rgba(2,6,23,0.4)] backdrop-blur-xl"
            >
              <div className="text-xs uppercase tracking-[0.18em] text-amber-200">Assembly Narration</div>
              <div className="mt-2 text-sm font-semibold">{narrationSource[stepIndex - 1]?.label}</div>
              <div className="mt-1 max-w-md text-sm leading-6 text-slate-300">
                {narrationSource[stepIndex - 1]?.narration}
              </div>
            </motion.div>
          ) : null}

          <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
            <DialogContent className="max-w-xl border border-white/10 bg-slate-950 text-white">
              <DialogHeader>
                <DialogTitle>Keyboard Shortcuts</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Fast controls for the 3D pacemaker design environment.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3">
                {[
                  ["V", "Cycle Solid / Wireframe / X-Ray"],
                  ["E", "Toggle exploded view"],
                  ["A", "Toggle floating annotations"],
                  ["R", "Reset camera"],
                  ["Esc", "Clear selection"],
                ].map(([shortcut, action]) => (
                  <div key={shortcut} className="flex items-center justify-between rounded-[18px] border border-white/10 bg-white/5 px-4 py-3">
                    <Badge className="border border-white/10 bg-slate-950/70 text-slate-100">{shortcut}</Badge>
                    <span className="text-sm text-slate-300">{action}</span>
                  </div>
                ))}
              </div>
              <DialogFooter showCloseButton />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </TooltipProvider>
  );
}
