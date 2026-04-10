"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRightLeft,
  BrainCircuit,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  Copy,
  Download,
  FileSpreadsheet,
  FileText,
  Minus,
  MoreHorizontal,
  PackageSearch,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type RiskLevel = "High" | "Medium" | "Low";
type LifecycleState = "Active" | "NRND" | "Obsolete" | "EOL";
type PriceStatus = "LIVE" | "Cached";
type CertKey = "RoHS" | "REACH" | "CE" | "FDA" | "UL";

type AlternativeOption = {
  id: string;
  partNumber: string;
  manufacturer: string;
  description: string;
  specMatch: number;
  costDeltaPct: number;
  availability: string;
  recommendation: string;
  scores: {
    specMatch: number;
    regulatory: number;
    availability: number;
    cost: number;
    risk: number;
  };
};

type BomItem = {
  id: string;
  reqIds: string[];
  partNumber: string;
  description: string;
  specs: string;
  quantity: number;
  unitCost: number;
  priceStatus: PriceStatus;
  lastPriceUpdate: string;
  leadTimeWeeks: number;
  lifecycle: LifecycleState;
  supplyRisk: {
    level: RiskLevel;
    score: number;
    factors: {
      label: string;
      score: number;
      note: string;
    }[];
  };
  certs: Record<CertKey, boolean>;
  datasheetUrl: string;
  fullSpecs: Array<{ label: string; value: string }>;
  alternatives: AlternativeOption[];
  supplierStock: Array<{ supplier: string; units: number }>;
  priceHistory: Array<{ label: string; value: number }>;
};

type AiFinding = {
  componentId: string;
  componentName: string;
  alternative: AlternativeOption;
};

const referenceNow = new Date("2026-04-07T11:45:00Z");
const projectBuildDate = new Date("2026-08-18T00:00:00Z");
const certLabels: CertKey[] = ["RoHS", "REACH", "CE", "FDA", "UL"];

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`;
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatShortDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(value);
}

function makePriceHistory(base: number, variance: number) {
  return Array.from({ length: 30 }).map((_, index) => {
    const wave = Math.sin(index / 4.2) * variance;
    const slope = ((index % 5) - 2) * variance * 0.08;
    const value = Number((base + wave + slope).toFixed(2));

    return {
      label: `${index + 1}`,
      value,
    };
  });
}

const initialBomItems: BomItem[] = [
  {
    id: "mcu",
    reqIds: ["REQ-PACE-001", "REQ-SW-011", "REQ-TRACE-031"],
    partNumber: "STM32L476RG",
    description: "Main MCU",
    specs: "80MHz Cortex-M4F, 1MB Flash, 128KB SRAM",
    quantity: 1,
    unitCost: 8.74,
    priceStatus: "LIVE",
    lastPriceUpdate: "2026-04-07T10:32:00Z",
    leadTimeWeeks: 6,
    lifecycle: "Active",
    supplyRisk: {
      level: "Medium",
      score: 63,
      factors: [
        { label: "Availability", score: 58, note: "Broadline stock is healthy but uneven across regions." },
        { label: "Sole Source", score: 64, note: "Single silicon family for current firmware baseline." },
        { label: "Lifecycle", score: 28, note: "Active lifecycle with strong industrial demand." },
        { label: "Geopolitical", score: 67, note: "Assembly concentration in Southeast Asia." },
        { label: "Compliance", score: 22, note: "No open compliance exceptions." },
      ],
    },
    certs: { RoHS: true, REACH: true, CE: true, FDA: true, UL: true },
    datasheetUrl: "#",
    fullSpecs: [
      { label: "Core", value: "ARM Cortex-M4F with DSP/FPU" },
      { label: "Operating Voltage", value: "1.71V to 3.6V" },
      { label: "Low Power Mode", value: "100 nA shutdown, multiple stop modes" },
      { label: "Interfaces", value: "SPI, I2C, UART, USB FS, ADC, CAN" },
    ],
    alternatives: [
      {
        id: "alt-mcu-1",
        partNumber: "STM32L4R5ZI",
        manufacturer: "STMicroelectronics",
        description: "Pin-compatible higher-memory MCU for trace-heavy builds",
        specMatch: 97,
        costDeltaPct: 8,
        availability: "10.4k in channel",
        recommendation: "Best drop-in upgrade when firmware headroom and longer flash retention matter.",
        scores: { specMatch: 97, regulatory: 93, availability: 82, cost: 71, risk: 78 },
      },
      {
        id: "alt-mcu-2",
        partNumber: "EFM32GG11B820",
        manufacturer: "Silicon Labs",
        description: "Low-power Cortex-M4 alternative with comparable I/O footprint",
        specMatch: 91,
        costDeltaPct: -4,
        availability: "7.1k in channel",
        recommendation: "Viable second source if BSP and security stack requalification is acceptable.",
        scores: { specMatch: 91, regulatory: 88, availability: 74, cost: 83, risk: 69 },
      },
    ],
    supplierStock: [
      { supplier: "DigiKey", units: 5800 },
      { supplier: "Mouser", units: 4100 },
      { supplier: "Arrow", units: 3200 },
    ],
    priceHistory: makePriceHistory(8.74, 0.22),
  },
  {
    id: "safety-monitor",
    reqIds: ["REQ-PACE-004", "REQ-SAFE-009"],
    partNumber: "TPS3851H33-Q1",
    description: "Safety Monitor IC",
    specs: "Window watchdog, voltage supervisor, fail-safe reset",
    quantity: 1,
    unitCost: 1.92,
    priceStatus: "LIVE",
    lastPriceUpdate: "2026-04-07T09:58:00Z",
    leadTimeWeeks: 12,
    lifecycle: "Active",
    supplyRisk: {
      level: "Low",
      score: 31,
      factors: [
        { label: "Availability", score: 24, note: "Ample automotive-qualified stock in distribution." },
        { label: "Sole Source", score: 39, note: "Comparable supervisors available with minor validation work." },
        { label: "Lifecycle", score: 18, note: "Active and broadly adopted." },
        { label: "Geopolitical", score: 35, note: "Fab diversification lowers regional risk." },
        { label: "Compliance", score: 21, note: "No active material declarations gaps." },
      ],
    },
    certs: { RoHS: true, REACH: true, CE: true, FDA: true, UL: true },
    datasheetUrl: "#",
    fullSpecs: [
      { label: "Watchdog", value: "Windowed watchdog with independent timeout" },
      { label: "Threshold", value: "3.3V fixed supervisor threshold" },
      { label: "Package", value: "SOT-23-6" },
      { label: "Temperature", value: "-40C to 125C" },
    ],
    alternatives: [
      {
        id: "alt-safe-1",
        partNumber: "MAX6755UKLD3",
        manufacturer: "Analog Devices",
        description: "Low-power watchdog supervisor with reset generator",
        specMatch: 94,
        costDeltaPct: 11,
        availability: "3.4k in channel",
        recommendation: "Good functional match but cost premium is hard to justify for baseline builds.",
        scores: { specMatch: 94, regulatory: 89, availability: 67, cost: 58, risk: 79 },
      },
      {
        id: "alt-safe-2",
        partNumber: "TPS3431-Q1",
        manufacturer: "Texas Instruments",
        description: "Configurable watchdog timer for safety supervision",
        specMatch: 88,
        costDeltaPct: -6,
        availability: "11.2k in channel",
        recommendation: "Cost-efficient fallback if external supervisor thresholding is acceptable.",
        scores: { specMatch: 88, regulatory: 86, availability: 84, cost: 90, risk: 83 },
      },
    ],
    supplierStock: [
      { supplier: "DigiKey", units: 8400 },
      { supplier: "Mouser", units: 9700 },
      { supplier: "Arrow", units: 4200 },
    ],
    priceHistory: makePriceHistory(1.92, 0.08),
  },
  {
    id: "battery",
    reqIds: ["REQ-POWER-012", "REQ-LIFE-018"],
    partNumber: "TL-5903/S",
    description: "Ti-Li Battery",
    specs: "3.6V Lithium thionyl chloride, 2.4Ah, implant reserve pack",
    quantity: 1,
    unitCost: 29.8,
    priceStatus: "Cached",
    lastPriceUpdate: "2026-04-06T16:12:00Z",
    leadTimeWeeks: 18,
    lifecycle: "NRND",
    supplyRisk: {
      level: "High",
      score: 84,
      factors: [
        { label: "Availability", score: 86, note: "Distributor stock is thin relative to forecast demand." },
        { label: "Sole Source", score: 93, note: "Battery pack tooling is currently specific to this chemistry envelope." },
        { label: "Lifecycle", score: 74, note: "Supplier pushing next-gen pack migration." },
        { label: "Geopolitical", score: 69, note: "Freight qualification adds regional delay exposure." },
        { label: "Compliance", score: 52, note: "Transportation paperwork refresh required each lot." },
      ],
    },
    certs: { RoHS: true, REACH: true, CE: true, FDA: true, UL: false },
    datasheetUrl: "#",
    fullSpecs: [
      { label: "Chemistry", value: "Lithium thionyl chloride" },
      { label: "Nominal Capacity", value: "2.4 Ah" },
      { label: "Pulse Capability", value: "Supports high-current pacing bursts with capacitor assist" },
      { label: "Service Model", value: "7-year design target with recharge fallback" },
    ],
    alternatives: [
      {
        id: "alt-bat-1",
        partNumber: "QHRL-18650-PM",
        manufacturer: "Quallion",
        description: "Rechargeable implantable cell with matched discharge curve",
        specMatch: 89,
        costDeltaPct: 14,
        availability: "Limited pilot lots",
        recommendation: "Strong long-term platform option but not ready for the current build gate.",
        scores: { specMatch: 89, regulatory: 81, availability: 42, cost: 54, risk: 47 },
      },
      {
        id: "alt-bat-2",
        partNumber: "LTC-ER18505M",
        manufacturer: "EVE",
        description: "Primary Li-SOCl2 cell for low-drain medical telemetry",
        specMatch: 84,
        costDeltaPct: -9,
        availability: "6.0k in channel",
        recommendation: "Cost relief candidate, but pulse current derating needs capacitor stack revalidation.",
        scores: { specMatch: 84, regulatory: 79, availability: 73, cost: 88, risk: 63 },
      },
    ],
    supplierStock: [
      { supplier: "DigiKey", units: 760 },
      { supplier: "Mouser", units: 420 },
      { supplier: "Arrow", units: 1800 },
    ],
    priceHistory: makePriceHistory(29.8, 0.55),
  },
  {
    id: "ble",
    reqIds: ["REQ-RF-021", "REQ-USER-024"],
    partNumber: "nRF52840-QIAA",
    description: "BLE SoC",
    specs: "2.4GHz BLE 5.3, Cortex-M4, USB, crypto accelerator",
    quantity: 1,
    unitCost: 4.38,
    priceStatus: "LIVE",
    lastPriceUpdate: "2026-04-07T10:05:00Z",
    leadTimeWeeks: 9,
    lifecycle: "Active",
    supplyRisk: {
      level: "Medium",
      score: 56,
      factors: [
        { label: "Availability", score: 52, note: "Reasonable stock but telecom programs compete for lots." },
        { label: "Sole Source", score: 61, note: "BLE stack and antenna tuning tied to Nordic baseline." },
        { label: "Lifecycle", score: 18, note: "Still active and broadly supported." },
        { label: "Geopolitical", score: 63, note: "RF module assembly concentrated in one region." },
        { label: "Compliance", score: 28, note: "FCC/CE evidence reusable with current antenna." },
      ],
    },
    certs: { RoHS: true, REACH: true, CE: true, FDA: true, UL: true },
    datasheetUrl: "#",
    fullSpecs: [
      { label: "Radio", value: "BLE 5.3, 802.15.4, 2.4GHz proprietary" },
      { label: "Memory", value: "1MB Flash / 256KB RAM" },
      { label: "Security", value: "AES, ARM CryptoCell-310" },
      { label: "Packaging", value: "73-pin aQFN" },
    ],
    alternatives: [
      {
        id: "alt-ble-1",
        partNumber: "nRF5340-QKAA",
        manufacturer: "Nordic Semiconductor",
        description: "Dual-core BLE SoC with stronger telemetry headroom",
        specMatch: 96,
        costDeltaPct: 19,
        availability: "8.6k in channel",
        recommendation: "Best forward-compatible swap if extra telemetry and security isolation are worth the premium.",
        scores: { specMatch: 96, regulatory: 92, availability: 79, cost: 58, risk: 76 },
      },
      {
        id: "alt-ble-2",
        partNumber: "CC2652R7",
        manufacturer: "Texas Instruments",
        description: "Multi-protocol 2.4GHz wireless MCU with medical telemetry fit",
        specMatch: 87,
        costDeltaPct: -2,
        availability: "5.4k in channel",
        recommendation: "Technically sound, but stack migration burden remains material.",
        scores: { specMatch: 87, regulatory: 84, availability: 72, cost: 82, risk: 68 },
      },
    ],
    supplierStock: [
      { supplier: "DigiKey", units: 2900 },
      { supplier: "Mouser", units: 3600 },
      { supplier: "Arrow", units: 2700 },
    ],
    priceHistory: makePriceHistory(4.38, 0.14),
  },
  {
    id: "hvps",
    reqIds: ["REQ-THER-016", "REQ-PULSE-020"],
    partNumber: "LT3484EDD",
    description: "HVPS IC",
    specs: "Boost converter, 40V switch, pulse capacitor charging",
    quantity: 1,
    unitCost: 3.26,
    priceStatus: "Cached",
    lastPriceUpdate: "2026-04-06T20:18:00Z",
    leadTimeWeeks: 20,
    lifecycle: "EOL",
    supplyRisk: {
      level: "High",
      score: 91,
      factors: [
        { label: "Availability", score: 90, note: "Inventory mostly from brokers and buffer stock." },
        { label: "Sole Source", score: 88, note: "Therapy charge design tuned to this boost topology." },
        { label: "Lifecycle", score: 98, note: "Supplier indicates end-of-life migration path." },
        { label: "Geopolitical", score: 57, note: "Multiple channel hops before delivery." },
        { label: "Compliance", score: 41, note: "Current evidence set still acceptable." },
      ],
    },
    certs: { RoHS: true, REACH: true, CE: true, FDA: true, UL: true },
    datasheetUrl: "#",
    fullSpecs: [
      { label: "Topology", value: "Current-mode step-up converter" },
      { label: "Switch Current", value: "2A internal switch" },
      { label: "Charge Output", value: "Supports 25V to 40V pulse rails" },
      { label: "Package", value: "DFN-10" },
    ],
    alternatives: [
      {
        id: "alt-hv-1",
        partNumber: "MAX1523ETB",
        manufacturer: "Analog Devices",
        description: "Pulse-capacitor charging controller with medical use precedent",
        specMatch: 93,
        costDeltaPct: 7,
        availability: "1.8k in channel",
        recommendation: "Most practical migration target, but control-loop retuning is mandatory.",
        scores: { specMatch: 93, regulatory: 87, availability: 54, cost: 69, risk: 71 },
      },
      {
        id: "alt-hv-2",
        partNumber: "TPS61088",
        manufacturer: "Texas Instruments",
        description: "High-current boost regulator for programmable charge rails",
        specMatch: 85,
        costDeltaPct: -3,
        availability: "12.6k in channel",
        recommendation: "Supply improves materially, but therapy waveform validation effort is higher.",
        scores: { specMatch: 85, regulatory: 78, availability: 91, cost: 83, risk: 79 },
      },
    ],
    supplierStock: [
      { supplier: "DigiKey", units: 120 },
      { supplier: "Mouser", units: 0 },
      { supplier: "Arrow", units: 640 },
    ],
    priceHistory: makePriceHistory(3.26, 0.18),
  },
  {
    id: "caps",
    reqIds: ["REQ-PULSE-020"],
    partNumber: "T598D336M035ATE110",
    description: "Output Capacitor Bank",
    specs: "33uF medical pulse reservoir, 35V polymer tantalum",
    quantity: 2,
    unitCost: 1.48,
    priceStatus: "LIVE",
    lastPriceUpdate: "2026-04-07T08:44:00Z",
    leadTimeWeeks: 5,
    lifecycle: "Active",
    supplyRisk: {
      level: "Low",
      score: 26,
      factors: [
        { label: "Availability", score: 22, note: "Multiple distributors hold buffer inventory." },
        { label: "Sole Source", score: 28, note: "Several qualified form-factor equivalents exist." },
        { label: "Lifecycle", score: 12, note: "Active portfolio with steady medical demand." },
        { label: "Geopolitical", score: 31, note: "Passive component sourcing remains diversified." },
        { label: "Compliance", score: 19, note: "Material declarations are current." },
      ],
    },
    certs: { RoHS: true, REACH: true, CE: true, FDA: false, UL: true },
    datasheetUrl: "#",
    fullSpecs: [
      { label: "Capacitance", value: "33 uF each, 66 uF banked" },
      { label: "Voltage", value: "35V" },
      { label: "ESR", value: "110 mOhm" },
      { label: "Package", value: "7343 D case" },
    ],
    alternatives: [
      {
        id: "alt-cap-1",
        partNumber: "TCJB336M035R0100",
        manufacturer: "Kyocera AVX",
        description: "Low-ESR medical-grade polymer capacitor",
        specMatch: 95,
        costDeltaPct: 4,
        availability: "22k in channel",
        recommendation: "Best alternate if ESR margin is the main criterion.",
        scores: { specMatch: 95, regulatory: 92, availability: 88, cost: 72, risk: 87 },
      },
      {
        id: "alt-cap-2",
        partNumber: "6TPE33M",
        manufacturer: "Panasonic",
        description: "Compact conductive polymer capacitor with strong pulse characteristics",
        specMatch: 90,
        costDeltaPct: -6,
        availability: "14k in channel",
        recommendation: "Lower cost option if package stack-up remains acceptable.",
        scores: { specMatch: 90, regulatory: 90, availability: 81, cost: 86, risk: 83 },
      },
    ],
    supplierStock: [
      { supplier: "DigiKey", units: 12400 },
      { supplier: "Mouser", units: 9100 },
      { supplier: "Arrow", units: 6200 },
    ],
    priceHistory: makePriceHistory(1.48, 0.05),
  },
  {
    id: "rf-module",
    reqIds: ["REQ-RF-021", "REQ-TELEM-026"],
    partNumber: "ZL70323BGA1",
    description: "MICS RF Module",
    specs: "402-405MHz implant telemetry transceiver, medical band",
    quantity: 1,
    unitCost: 18.4,
    priceStatus: "Cached",
    lastPriceUpdate: "2026-04-05T19:14:00Z",
    leadTimeWeeks: 14,
    lifecycle: "NRND",
    supplyRisk: {
      level: "Medium",
      score: 74,
      factors: [
        { label: "Availability", score: 71, note: "Medical-band inventory is limited and reserved." },
        { label: "Sole Source", score: 78, note: "RF stack and antenna match are supplier-specific." },
        { label: "Lifecycle", score: 64, note: "Long lifecycle but slower portfolio investment." },
        { label: "Geopolitical", score: 59, note: "Assembly and test funnel through one region." },
        { label: "Compliance", score: 44, note: "Regional filings are reusable but not universal." },
      ],
    },
    certs: { RoHS: true, REACH: true, CE: true, FDA: true, UL: false },
    datasheetUrl: "#",
    fullSpecs: [
      { label: "Band", value: "402MHz to 405MHz MICS" },
      { label: "Modulation", value: "2-FSK / 4-FSK telemetry" },
      { label: "Power", value: "Optimized for implant duty cycles" },
      { label: "Security", value: "Supports session encryption wrapper in host stack" },
    ],
    alternatives: [
      {
        id: "alt-rf-1",
        partNumber: "ZL70103",
        manufacturer: "Microchip",
        description: "Legacy implant telemetry transceiver with wider field history",
        specMatch: 92,
        costDeltaPct: 5,
        availability: "2.3k in channel",
        recommendation: "Operationally safer than brokers, but migration needs RF coexistence retest.",
        scores: { specMatch: 92, regulatory: 88, availability: 51, cost: 68, risk: 72 },
      },
      {
        id: "alt-rf-2",
        partNumber: "MICS-CUSTOM-SIP",
        manufacturer: "Murata",
        description: "Custom SiP proposal for medical telemetry roadmaps",
        specMatch: 86,
        costDeltaPct: 12,
        availability: "NRE required",
        recommendation: "Strategic long-term path, not a near-term swap candidate.",
        scores: { specMatch: 86, regulatory: 75, availability: 32, cost: 49, risk: 58 },
      },
    ],
    supplierStock: [
      { supplier: "DigiKey", units: 320 },
      { supplier: "Mouser", units: 140 },
      { supplier: "Arrow", units: 980 },
    ],
    priceHistory: makePriceHistory(18.4, 0.42),
  },
  {
    id: "accelerometer",
    reqIds: ["REQ-PACE-001", "REQ-MOTION-015"],
    partNumber: "BMA400",
    description: "Accelerometer",
    specs: "3-axis ultra-low-power MEMS, 14-bit output",
    quantity: 1,
    unitCost: 1.12,
    priceStatus: "LIVE",
    lastPriceUpdate: "2026-04-07T10:11:00Z",
    leadTimeWeeks: 4,
    lifecycle: "Active",
    supplyRisk: {
      level: "Low",
      score: 24,
      factors: [
        { label: "Availability", score: 22, note: "Very strong broadline inventory." },
        { label: "Sole Source", score: 33, note: "Many MEMS options with modest algorithm work." },
        { label: "Lifecycle", score: 12, note: "Active sensor platform." },
        { label: "Geopolitical", score: 26, note: "Packaging and test diversified." },
        { label: "Compliance", score: 15, note: "No current substance concerns." },
      ],
    },
    certs: { RoHS: true, REACH: true, CE: true, FDA: true, UL: true },
    datasheetUrl: "#",
    fullSpecs: [
      { label: "Axes", value: "3-axis" },
      { label: "Noise", value: "Low-noise activity monitoring" },
      { label: "Current", value: "Ultra-low-power duty cycle modes" },
      { label: "Interface", value: "I2C / SPI" },
    ],
    alternatives: [
      {
        id: "alt-acc-1",
        partNumber: "LIS2DW12",
        manufacturer: "STMicroelectronics",
        description: "Ultra-low-power MEMS accelerometer with medical wearables fit",
        specMatch: 94,
        costDeltaPct: 3,
        availability: "19k in channel",
        recommendation: "Strong cross-qualified option with minor driver adjustments.",
        scores: { specMatch: 94, regulatory: 91, availability: 89, cost: 74, risk: 90 },
      },
      {
        id: "alt-acc-2",
        partNumber: "ADXL362BCCZ",
        manufacturer: "Analog Devices",
        description: "Micropower accelerometer with high-quality activity thresholds",
        specMatch: 90,
        costDeltaPct: 17,
        availability: "4.8k in channel",
        recommendation: "Excellent power behavior but materially higher cost.",
        scores: { specMatch: 90, regulatory: 89, availability: 68, cost: 52, risk: 79 },
      },
    ],
    supplierStock: [
      { supplier: "DigiKey", units: 18400 },
      { supplier: "Mouser", units: 9600 },
      { supplier: "Arrow", units: 5400 },
    ],
    priceHistory: makePriceHistory(1.12, 0.04),
  },
  {
    id: "output-switch",
    reqIds: ["REQ-THER-016", "REQ-SAFE-009"],
    partNumber: "FDMC8030",
    description: "Output Protection FET",
    specs: "30V N-channel MOSFET, low Rds(on), pulse discharge isolation",
    quantity: 2,
    unitCost: 0.68,
    priceStatus: "LIVE",
    lastPriceUpdate: "2026-04-07T08:51:00Z",
    leadTimeWeeks: 7,
    lifecycle: "Active",
    supplyRisk: {
      level: "Low",
      score: 37,
      factors: [
        { label: "Availability", score: 29, note: "Healthy channel inventory." },
        { label: "Sole Source", score: 46, note: "Many pin-similar power FETs available." },
        { label: "Lifecycle", score: 19, note: "Active product line." },
        { label: "Geopolitical", score: 48, note: "Fab concentration mildly elevated." },
        { label: "Compliance", score: 23, note: "No declared issues." },
      ],
    },
    certs: { RoHS: true, REACH: true, CE: true, FDA: false, UL: true },
    datasheetUrl: "#",
    fullSpecs: [
      { label: "Drain-Source Voltage", value: "30V" },
      { label: "Rds(on)", value: "9.2 mOhm max" },
      { label: "Package", value: "Power56" },
      { label: "Use", value: "Patient path isolation and discharge gating" },
    ],
    alternatives: [
      {
        id: "alt-fet-1",
        partNumber: "SiRA80DP",
        manufacturer: "Vishay",
        description: "Low-loss power MOSFET for pulse isolation paths",
        specMatch: 92,
        costDeltaPct: 6,
        availability: "13k in channel",
        recommendation: "Best substitute when thermal rise margin is the priority.",
        scores: { specMatch: 92, regulatory: 90, availability: 82, cost: 69, risk: 84 },
      },
      {
        id: "alt-fet-2",
        partNumber: "BSC340N08NS3",
        manufacturer: "Infineon",
        description: "Logic-level MOSFET with strong pulse capability",
        specMatch: 88,
        costDeltaPct: -5,
        availability: "21k in channel",
        recommendation: "Good commodity option if package footprint is accepted.",
        scores: { specMatch: 88, regulatory: 88, availability: 91, cost: 86, risk: 82 },
      },
    ],
    supplierStock: [
      { supplier: "DigiKey", units: 22400 },
      { supplier: "Mouser", units: 15400 },
      { supplier: "Arrow", units: 9800 },
    ],
    priceHistory: makePriceHistory(0.68, 0.03),
  },
];

function getLifecycleTone(lifecycle: LifecycleState) {
  if (lifecycle === "Active") {
    return "border-emerald-300/30 bg-emerald-400/12 text-emerald-100";
  }

  if (lifecycle === "NRND") {
    return "border-amber-300/30 bg-amber-400/12 text-amber-100";
  }

  return "border-rose-300/30 bg-rose-400/12 text-rose-100";
}

function getLeadTimeTone(weeks: number) {
  if (weeks < 4) {
    return "border-emerald-300/30 bg-emerald-400/12 text-emerald-100";
  }

  if (weeks <= 16) {
    return "border-amber-300/30 bg-amber-400/12 text-amber-100";
  }

  return "border-rose-300/30 bg-rose-400/12 text-rose-100";
}

function stopRowToggle(event: React.SyntheticEvent) {
  event.stopPropagation();
}

function exportRows(format: "csv" | "excel" | "pdf", rows: BomItem[]) {
  const headings = [
    "REQ-ID",
    "Part Number",
    "Description",
    "Specs",
    "Qty",
    "Unit Cost",
    "Extended Cost",
    "Lead Time (wk)",
    "Lifecycle",
    "Risk",
  ];
  const body = rows.map((row) => [
    row.reqIds.join(" | "),
    row.partNumber,
    row.description,
    row.specs,
    String(row.quantity),
    row.unitCost.toFixed(2),
    (row.quantity * row.unitCost).toFixed(2),
    String(row.leadTimeWeeks),
    row.lifecycle,
    row.supplyRisk.level,
  ]);

  if (format === "pdf") {
    const printWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!printWindow) {
      return;
    }

    const tableRows = body
      .map(
        (cells) =>
          `<tr>${cells
            .map((cell) => `<td style="padding:8px 10px;border:1px solid #d0d7de;">${cell}</td>`)
            .join("")}</tr>`,
      )
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Pacemaker BOM Export</title>
        </head>
        <body style="font-family: Inter, Arial, sans-serif; padding: 24px;">
          <h1>Pacemaker BOM</h1>
          <table style="border-collapse: collapse; width: 100%;">
            <thead>
              <tr>${headings
                .map(
                  (heading) =>
                    `<th style="padding:8px 10px;border:1px solid #d0d7de;background:#f8fafc;text-align:left;">${heading}</th>`,
                )
                .join("")}</tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    return;
  }

  const separator = format === "excel" ? "\t" : ",";
  const fileExtension = format === "excel" ? "xls" : "csv";
  const mimeType =
    format === "excel"
      ? "application/vnd.ms-excel;charset=utf-8"
      : "text/csv;charset=utf-8";
  const blob = new Blob(
    [[headings.join(separator), ...body.map((row) => row.join(separator))].join("\n")],
    { type: mimeType },
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `pacemaker-bom.${fileExtension}`;
  link.click();
  URL.revokeObjectURL(url);
}

function MiniLineChart({ values }: { values: Array<{ label: string; value: number }> }) {
  const min = Math.min(...values.map((point) => point.value));
  const max = Math.max(...values.map((point) => point.value));
  const points = values
    .map((point, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 260;
      const y = 80 - ((point.value - min) / Math.max(max - min, 0.01)) * 60;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="rounded-[20px] border border-white/10 bg-slate-950/70 p-4">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-slate-400">
        <span>Price History</span>
        <span>30 days</span>
      </div>
      <svg viewBox="0 0 260 96" className="mt-3 h-28 w-full overflow-visible">
        <defs>
          <linearGradient id="price-line" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#14b8a6" />
          </linearGradient>
        </defs>
        <path d="M0 82 H260" stroke="rgba(148,163,184,0.2)" strokeWidth="1" />
        <polyline
          fill="none"
          stroke="url(#price-line)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
      <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
        <span>Day 1</span>
        <span>{formatCurrency(values.at(-1)?.value ?? 0)}</span>
      </div>
    </div>
  );
}

function SupplierStockBars({ stock }: { stock: BomItem["supplierStock"] }) {
  const max = Math.max(...stock.map((entry) => entry.units), 1);

  return (
    <div className="rounded-[20px] border border-white/10 bg-slate-950/70 p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Supplier Stock Levels</div>
      <div className="mt-4 space-y-3">
        {stock.map((entry) => (
          <div key={entry.supplier}>
            <div className="flex items-center justify-between text-sm text-slate-200">
              <span>{entry.supplier}</span>
              <span>{entry.units.toLocaleString()} pcs</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-white/8">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#38bdf8,#22c55e)]"
                style={{ width: `${(entry.units / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm text-slate-200">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-white/8">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#38bdf8,#34d399)]"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function AiAlternativesPanel({
  open,
  findings,
  lines,
  onClose,
}: {
  open: boolean;
  findings: AiFinding[];
  lines: string[];
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.aside
          initial={{ x: 420, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 420, opacity: 0 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
          className="absolute inset-y-0 right-0 z-20 w-[360px] overflow-hidden rounded-[30px] border border-white/10 bg-slate-950/92 shadow-[0_30px_90px_rgba(2,6,23,0.5)] backdrop-blur-xl"
        >
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <BrainCircuit className="size-4 text-sky-300" />
                AI Alternatives Engine
              </div>
              <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                Streaming supplier and fit analysis
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="rounded-full text-slate-300 hover:bg-white/10 hover:text-white"
              onClick={onClose}
            >
              <Minus className="size-4" />
            </Button>
          </div>
          <div className="h-[calc(100%-73px)] space-y-4 overflow-y-auto px-5 py-4">
            <div className="rounded-[22px] border border-sky-300/20 bg-sky-400/8 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-sky-200">Streaming Analysis</div>
              <div className="mt-3 space-y-2 font-mono text-xs leading-5 text-slate-200">
                {lines.map((line, index) => (
                  <motion.div
                    key={`${line}-${index}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {line}
                  </motion.div>
                ))}
              </div>
            </div>

            {findings.map((finding) => (
              <motion.div
                key={`${finding.componentId}-${finding.alternative.id}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[24px] border border-white/10 bg-white/5 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      {finding.componentName}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-white">
                      {finding.alternative.partNumber}
                    </div>
                    <div className="mt-1 text-sm text-slate-300">
                      {finding.alternative.description}
                    </div>
                  </div>
                  <Badge className="border border-emerald-300/30 bg-emerald-400/12 text-emerald-100">
                    {finding.alternative.specMatch}% match
                  </Badge>
                </div>
                <div className="mt-4 space-y-3">
                  <ScoreBar label="Spec match" value={finding.alternative.scores.specMatch} />
                  <ScoreBar label="Regulatory" value={finding.alternative.scores.regulatory} />
                  <ScoreBar label="Availability" value={finding.alternative.scores.availability} />
                  <ScoreBar label="Cost" value={finding.alternative.scores.cost} />
                  <ScoreBar label="Risk" value={finding.alternative.scores.risk} />
                </div>
                <div className="mt-4 rounded-[18px] border border-white/10 bg-slate-950/70 p-3 text-sm leading-6 text-slate-200">
                  {finding.alternative.recommendation}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}

function GanttStatus({ weeks }: { weeks: number }) {
  const eta = new Date(referenceNow);
  eta.setDate(eta.getDate() + weeks * 7);
  const delta = eta.getTime() - projectBuildDate.getTime();
  const status =
    delta > 0 ? "Delayed" : delta > -14 * 24 * 60 * 60 * 1000 ? "At Risk" : "On Track";

  return (
    <Badge
      className={cn(
        "border",
        status === "On Track"
          ? "border-emerald-300/30 bg-emerald-400/12 text-emerald-100"
          : status === "At Risk"
            ? "border-amber-300/30 bg-amber-400/12 text-amber-100"
            : "border-rose-300/30 bg-rose-400/12 text-rose-100",
      )}
    >
      {status}
    </Badge>
  );
}

export function ComponentsBomPage() {
  const [items, setItems] = React.useState(initialBomItems);
  const [expandedRows, setExpandedRows] = React.useState<string[]>(["mcu"]);
  const [selectedRows, setSelectedRows] = React.useState<string[]>([]);
  const [copiedPart, setCopiedPart] = React.useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = React.useState(referenceNow.toISOString());
  const [aiPanelOpen, setAiPanelOpen] = React.useState(false);
  const [aiTargetIds, setAiTargetIds] = React.useState<string[]>([]);
  const [aiLines, setAiLines] = React.useState<string[]>([]);
  const [aiFindings, setAiFindings] = React.useState<AiFinding[]>([]);
  const [refreshTick, setRefreshTick] = React.useState(0);

  const totalCost = items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
  const riskSummary = {
    High: items.filter((item) => item.supplyRisk.level === "High").length,
    Medium: items.filter((item) => item.supplyRisk.level === "Medium").length,
    Low: items.filter((item) => item.supplyRisk.level === "Low").length,
  };

  React.useEffect(() => {
    if (!copiedPart) {
      return;
    }

    const timeout = window.setTimeout(() => setCopiedPart(null), 1200);
    return () => window.clearTimeout(timeout);
  }, [copiedPart]);

  React.useEffect(() => {
    if (!aiPanelOpen || aiTargetIds.length === 0) {
      return;
    }

    const targetItems = items.filter((item) => aiTargetIds.includes(item.id));
    const events: Array<{ type: "line" | "finding"; payload: string | AiFinding }> = [];

    targetItems.forEach((item) => {
      events.push({
        type: "line",
        payload: `> Scanning ${item.partNumber} against regulatory, stock, and lifecycle constraints...`,
      });

      item.alternatives.slice(0, 2).forEach((alternative) => {
        events.push({
          type: "line",
          payload: `  • ${alternative.partNumber}: ${alternative.specMatch}% fit, ${alternative.availability}, ${alternative.costDeltaPct > 0 ? "+" : ""}${alternative.costDeltaPct}% cost delta`,
        });
        events.push({
          type: "finding",
          payload: {
            componentId: item.id,
            componentName: item.description,
            alternative,
          },
        });
      });
    });

    setAiLines([]);
    setAiFindings([]);

    let cursor = 0;
    const interval = window.setInterval(() => {
      const event = events[cursor];
      cursor += 1;

      if (!event) {
        window.clearInterval(interval);
        return;
      }

      if (event.type === "line") {
        setAiLines((current) => [...current, event.payload as string]);
        return;
      }

      setAiFindings((current) => [...current, event.payload as AiFinding]);
    }, 320);

    return () => window.clearInterval(interval);
  }, [aiPanelOpen, aiTargetIds, items]);

  function toggleExpanded(id: string) {
    setExpandedRows((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  }

  function openAiScan(targetIds: string[]) {
    setAiTargetIds(targetIds);
    setAiPanelOpen(true);
  }

  function refreshPrices() {
    const deltas = [0.024, -0.012, 0.018, -0.009, 0.031, -0.015, 0.011, -0.006, 0.02];
    const stamp = new Date(referenceNow.getTime() + (refreshTick + 1) * 32 * 60 * 1000).toISOString();

    setItems((current) =>
      current.map((item, index) => ({
        ...item,
        unitCost: Number((item.unitCost * (1 + deltas[(index + refreshTick) % deltas.length])).toFixed(2)),
        priceStatus: index % 3 === 0 ? "Cached" : "LIVE",
        lastPriceUpdate: stamp,
      })),
    );
    setRefreshTick((current) => current + 1);
    setLastUpdated(stamp);
  }

  async function copyPartNumber(partNumber: string) {
    await navigator.clipboard.writeText(partNumber);
    setCopiedPart(partNumber);
  }

  const allSelected = selectedRows.length === items.length;

  return (
    <TooltipProvider delayDuration={100}>
      <div className="relative min-h-[calc(100svh-11rem)]">
        <motion.div layout className={cn("space-y-6", aiPanelOpen && "xl:pr-[384px]")}>
          <section className="overflow-hidden rounded-[34px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.08),transparent_28%),#020617]">
            <div className="grid gap-4 px-6 py-5 xl:grid-cols-[1.2fr_0.8fr]">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-300">
                  <PackageSearch className="size-3.5 text-sky-300" />
                  AI-generated BOM
                </div>
                <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">
                  Pacemaker Bill of Materials with live supplier intelligence
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
                  Inline quantity edits, live pricing posture, lifecycle risk, alternative scans, and build-date lead time visibility in one controlled workspace.
                </p>
              </div>

              <div className="flex flex-wrap justify-start gap-2 xl:justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" className="rounded-full bg-sky-400 text-slate-950 hover:bg-sky-300">
                      <Download className="mr-2 size-4" />
                      Export BOM
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem onClick={() => exportRows("csv", items)}>
                      <FileText className="mr-2 size-4" />
                      CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportRows("excel", items)}>
                      <FileSpreadsheet className="mr-2 size-4" />
                      Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportRows("pdf", items)}>
                      <FileText className="mr-2 size-4" />
                      PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  type="button"
                  variant="secondary"
                  className="rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10"
                  onClick={refreshPrices}
                >
                  <RefreshCcw className="mr-2 size-4" />
                  Refresh Prices
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10"
                  onClick={() => openAiScan(selectedRows.length > 0 ? selectedRows : items.map((item) => item.id))}
                >
                  <Sparkles className="mr-2 size-4 text-amber-200" />
                  AI Alternatives Scan
                </Button>
              </div>
            </div>

            <div className="grid gap-4 border-t border-white/10 px-6 py-5 lg:grid-cols-4">
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Total BOM Cost</div>
                <div className="mt-3 text-3xl font-semibold text-white">{formatCurrency(totalCost)}</div>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Total Components</div>
                <div className="mt-3 text-3xl font-semibold text-white">{items.length}</div>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Risk Summary</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge className="border border-rose-300/30 bg-rose-400/12 text-rose-100">{riskSummary.High} High</Badge>
                  <Badge className="border border-amber-300/30 bg-amber-400/12 text-amber-100">{riskSummary.Medium} Medium</Badge>
                  <Badge className="border border-emerald-300/30 bg-emerald-400/12 text-emerald-100">{riskSummary.Low} Low</Badge>
                </div>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Last Updated</div>
                <div className="mt-3 flex items-center gap-2 text-xl font-semibold text-white">
                  <Clock3 className="size-5 text-sky-300" />
                  {formatTimestamp(lastUpdated)}
                </div>
              </div>
            </div>
          </section>

          <Tabs defaultValue="bom" className="space-y-5">
            <TabsList variant="line" className="rounded-full border border-white/10 bg-slate-950/75 p-1">
              <TabsTrigger value="bom" className="rounded-full px-4 py-2 data-active:bg-white data-active:text-slate-950">
                BOM Table
              </TabsTrigger>
              <TabsTrigger value="gantt" className="rounded-full px-4 py-2 data-active:bg-white data-active:text-slate-950">
                Lead Time Gantt
              </TabsTrigger>
            </TabsList>

            <TabsContent value="bom" className="space-y-4">
              <div className="rounded-[30px] border border-white/10 bg-slate-950/80">
                <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
                  <div>
                    <div className="text-sm font-semibold text-white">Pacemaker BOM</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                      Live pricing, lifecycle, and supplier risk posture
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                    <ShieldCheck className="size-3.5 text-emerald-300" />
                    {selectedRows.length} selected
                  </div>
                </div>

                <div className="overflow-auto">
                  <table className="min-w-[1560px] w-full border-separate border-spacing-0 text-sm">
                    <thead className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur-xl">
                      <tr className="text-left text-[11px] uppercase tracking-[0.18em] text-slate-400">
                        <th className="px-4 py-3">
                          <Checkbox
                            checked={allSelected}
                            onCheckedChange={() => setSelectedRows(allSelected ? [] : items.map((item) => item.id))}
                            aria-label="Select all components"
                          />
                        </th>
                        <th className="px-3 py-3">REQ-ID</th>
                        <th className="px-3 py-3">Part Number</th>
                        <th className="px-3 py-3">Description + Key Specs</th>
                        <th className="px-3 py-3">Qty</th>
                        <th className="px-3 py-3">Unit Cost</th>
                        <th className="px-3 py-3">Extended Cost</th>
                        <th className="px-3 py-3">Lead Time</th>
                        <th className="px-3 py-3">Lifecycle</th>
                        <th className="px-3 py-3">Supply Risk</th>
                        <th className="px-3 py-3">Certs</th>
                        <th className="px-3 py-3">Alternatives</th>
                        <th className="px-3 py-3">Datasheet</th>
                        <th className="px-3 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => {
                        const expanded = expandedRows.includes(item.id);
                        return (
                          <React.Fragment key={item.id}>
                            <tr
                              id={item.id}
                              onClick={() => toggleExpanded(item.id)}
                              className="cursor-pointer text-slate-100 transition hover:bg-white/5"
                            >
                              <td className="border-t border-white/10 px-4 py-4 align-top" onClick={stopRowToggle}>
                                <Checkbox
                                  checked={selectedRows.includes(item.id)}
                                  onCheckedChange={() =>
                                    setSelectedRows((current) =>
                                      current.includes(item.id)
                                        ? current.filter((value) => value !== item.id)
                                        : [...current, item.id],
                                    )
                                  }
                                  aria-label={`Select ${item.partNumber}`}
                                />
                              </td>
                              <td className="border-t border-white/10 px-3 py-4 align-top">
                                <div className="flex flex-wrap gap-2">
                                  {item.reqIds.map((reqId) => (
                                    <Link
                                      key={reqId}
                                      href={`/requirements#${reqId}`}
                                      onClick={stopRowToggle}
                                      className="rounded-full border border-sky-300/20 bg-sky-400/10 px-2 py-1 text-[11px] font-medium text-sky-100"
                                    >
                                      {reqId}
                                    </Link>
                                  ))}
                                </div>
                              </td>
                              <td className="border-t border-white/10 px-3 py-4 align-top">
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    stopRowToggle(event);
                                    copyPartNumber(item.partNumber);
                                  }}
                                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-xs text-slate-100"
                                >
                                  <Copy className="size-3.5" />
                                  {copiedPart === item.partNumber ? "Copied" : item.partNumber}
                                </button>
                              </td>
                              <td className="border-t border-white/10 px-3 py-4 align-top">
                                <div className="flex items-start gap-3">
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      stopRowToggle(event);
                                      toggleExpanded(item.id);
                                    }}
                                    className="mt-0.5 rounded-full border border-white/10 p-1 text-slate-300"
                                  >
                                    {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                                  </button>
                                  <div>
                                    <div className="font-medium text-white">{item.description}</div>
                                    <div className="mt-1 text-sm text-slate-300">{item.specs}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="border-t border-white/10 px-3 py-4 align-top" onClick={stopRowToggle}>
                                <Input
                                  type="number"
                                  min={1}
                                  value={item.quantity}
                                  onChange={(event) =>
                                    setItems((current) =>
                                      current.map((entry) =>
                                        entry.id === item.id
                                          ? { ...entry, quantity: Number(event.target.value || 1) }
                                          : entry,
                                      ),
                                    )
                                  }
                                  className="w-20 border-white/10 bg-white/5 text-white"
                                />
                              </td>
                              <td className="border-t border-white/10 px-3 py-4 align-top">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="inline-flex flex-col gap-2 rounded-[18px] border border-white/10 bg-white/5 px-3 py-2">
                                      <div className="font-medium text-white">{formatCurrency(item.unitCost)}</div>
                                      <Badge className={cn("border", item.priceStatus === "LIVE" ? "border-emerald-300/30 bg-emerald-400/12 text-emerald-100" : "border-amber-300/30 bg-amber-400/12 text-amber-100")}>
                                        {item.priceStatus}
                                      </Badge>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent sideOffset={10} className="max-w-[220px]">
                                    Last supplier sync: {formatTimestamp(item.lastPriceUpdate)}
                                  </TooltipContent>
                                </Tooltip>
                              </td>
                              <td className="border-t border-white/10 px-3 py-4 align-top text-base font-semibold text-white">
                                {formatCurrency(item.quantity * item.unitCost)}
                              </td>
                              <td className="border-t border-white/10 px-3 py-4 align-top">
                                <Badge className={cn("border", getLeadTimeTone(item.leadTimeWeeks))}>
                                  {item.leadTimeWeeks} wk
                                </Badge>
                              </td>
                              <td className="border-t border-white/10 px-3 py-4 align-top">
                                <Badge className={cn("border", getLifecycleTone(item.lifecycle), item.lifecycle === "EOL" && "animate-pulse")}>
                                  {item.lifecycle}
                                </Badge>
                              </td>
                              <td className="border-t border-white/10 px-3 py-4 align-top">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                                      <span className={cn("h-2.5 w-2.5 rounded-full", item.supplyRisk.level === "High" ? "bg-rose-400" : item.supplyRisk.level === "Medium" ? "bg-amber-400" : "bg-emerald-400")} />
                                      <span className="text-xs font-medium text-slate-100">{item.supplyRisk.score}/100</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent sideOffset={8} className="max-w-[260px]">
                                    <div className="space-y-2">
                                      {item.supplyRisk.factors.map((factor) => (
                                        <div key={factor.label}>
                                          <div className="flex items-center justify-between gap-4">
                                            <span>{factor.label}</span>
                                            <span>{factor.score}</span>
                                          </div>
                                          <div className="text-[11px] opacity-80">{factor.note}</div>
                                        </div>
                                      ))}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </td>
                              <td className="border-t border-white/10 px-3 py-4 align-top">
                                <div className="grid grid-cols-3 gap-1.5">
                                  {certLabels.map((cert) => (
                                    <div
                                      key={cert}
                                      className={cn(
                                        "flex h-8 items-center justify-center rounded-xl border text-[11px] font-medium",
                                        item.certs[cert]
                                          ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-100"
                                          : "border-white/10 bg-white/5 text-slate-500",
                                      )}
                                    >
                                      {item.certs[cert] ? <Check className="mr-1 size-3.5" /> : <Minus className="mr-1 size-3.5" />}
                                      {cert}
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td className="border-t border-white/10 px-3 py-4 align-top">
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    stopRowToggle(event);
                                    toggleExpanded(item.id);
                                  }}
                                  className="rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1.5 text-xs font-medium text-sky-100"
                                >
                                  {item.alternatives.length} avail.
                                </button>
                              </td>
                              <td className="border-t border-white/10 px-3 py-4 align-top">
                                <a
                                  href={item.datasheetUrl}
                                  onClick={stopRowToggle}
                                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-100"
                                >
                                  <FileText className="size-3.5" />
                                  PDF
                                </a>
                              </td>
                              <td className="border-t border-white/10 px-3 py-4 align-top text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button type="button" variant="ghost" size="icon-sm" onClick={stopRowToggle} className="rounded-full text-slate-300 hover:bg-white/10 hover:text-white">
                                      <MoreHorizontal className="size-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem onClick={() => openAiScan([item.id])}>
                                      <Sparkles className="mr-2 size-4" />
                                      Find Alternatives
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => copyPartNumber(item.partNumber)}>
                                      <Copy className="mr-2 size-4" />
                                      Copy Part Number
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                      <Link href={`/requirements#${item.reqIds[0]}`}>
                                        <ArrowRightLeft className="mr-2 size-4" />
                                        Jump to Requirement
                                      </Link>
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>

                            {expanded ? (
                              <tr className="bg-white/[0.03]">
                                <td colSpan={14} className="border-t border-white/10 px-6 py-5">
                                  <div className="grid gap-5 xl:grid-cols-[0.88fr_1.12fr]">
                                    <div className="space-y-5">
                                      <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                                        <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Full Specs</div>
                                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                          {item.fullSpecs.map((spec) => (
                                            <div key={spec.label} className="rounded-[18px] border border-white/10 bg-slate-950/70 p-3">
                                              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{spec.label}</div>
                                              <div className="mt-2 text-sm text-slate-100">{spec.value}</div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                      <div className="grid gap-4 lg:grid-cols-2">
                                        <MiniLineChart values={item.priceHistory} />
                                        <SupplierStockBars stock={item.supplierStock} />
                                      </div>
                                    </div>

                                    <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                                      <div className="flex items-center justify-between gap-3">
                                        <div>
                                          <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Alternatives Panel</div>
                                          <div className="mt-1 text-sm text-slate-300">
                                            Drop-in and near-drop alternatives with impact previews
                                          </div>
                                        </div>
                                        <Button
                                          type="button"
                                          variant="secondary"
                                          className="rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10"
                                          onClick={() => openAiScan([item.id])}
                                        >
                                          <Sparkles className="mr-2 size-4 text-amber-200" />
                                          Scan row
                                        </Button>
                                      </div>

                                      <div className="mt-4 overflow-hidden rounded-[20px] border border-white/10">
                                        <table className="w-full text-sm">
                                          <thead className="bg-slate-950/80 text-left text-[11px] uppercase tracking-[0.16em] text-slate-400">
                                            <tr>
                                              <th className="px-3 py-3">Alternative</th>
                                              <th className="px-3 py-3">Match</th>
                                              <th className="px-3 py-3">Cost Delta</th>
                                              <th className="px-3 py-3">Availability</th>
                                              <th className="px-3 py-3">Swap</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {item.alternatives.map((alternative) => (
                                              <tr key={alternative.id} className="border-t border-white/10">
                                                <td className="px-3 py-3 align-top">
                                                  <div className="font-medium text-white">{alternative.partNumber}</div>
                                                  <div className="mt-1 text-sm text-slate-300">{alternative.description}</div>
                                                </td>
                                                <td className="px-3 py-3 align-top">
                                                  <Badge className="border border-emerald-300/30 bg-emerald-400/12 text-emerald-100">
                                                    {alternative.specMatch}%
                                                  </Badge>
                                                </td>
                                                <td className="px-3 py-3 align-top text-slate-100">
                                                  {alternative.costDeltaPct > 0 ? "+" : ""}
                                                  {alternative.costDeltaPct}%
                                                </td>
                                                <td className="px-3 py-3 align-top text-slate-300">
                                                  {alternative.availability}
                                                </td>
                                                <td className="px-3 py-3 align-top">
                                                  <Tooltip>
                                                    <TooltipTrigger asChild>
                                                      <Button
                                                        type="button"
                                                        variant="secondary"
                                                        size="sm"
                                                        className="rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10"
                                                      >
                                                        Swap
                                                      </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent sideOffset={8} className="max-w-[240px]">
                                                      {alternative.recommendation}
                                                    </TooltipContent>
                                                  </Tooltip>
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            ) : null}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="gantt">
              <div className="rounded-[30px] border border-white/10 bg-slate-950/80">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
                  <div>
                    <div className="text-sm font-semibold text-white">Lead Time Gantt</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                      Build date target {formatShortDate(projectBuildDate)}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="border border-emerald-300/30 bg-emerald-400/12 text-emerald-100">On Track</Badge>
                    <Badge className="border border-amber-300/30 bg-amber-400/12 text-amber-100">At Risk</Badge>
                    <Badge className="border border-rose-300/30 bg-rose-400/12 text-rose-100">Delayed</Badge>
                  </div>
                </div>

                <div className="space-y-3 px-5 py-5">
                  {items.map((item) => {
                    const width = Math.min((item.leadTimeWeeks / 24) * 100, 100);
                    const critical = item.supplyRisk.level === "High" || item.leadTimeWeeks > 16;

                    return (
                      <div
                        key={`gantt-${item.id}`}
                        className={cn(
                          "rounded-[24px] border p-4",
                          critical
                            ? "border-rose-300/20 bg-rose-400/[0.06]"
                            : "border-white/10 bg-white/[0.04]",
                        )}
                      >
                        <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)_140px] lg:items-center">
                          <div>
                            <div className="text-sm font-semibold text-white">{item.description}</div>
                            <div className="mt-1 font-mono text-xs text-slate-400">{item.partNumber}</div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-slate-400">
                              <span>{formatShortDate(referenceNow)}</span>
                              <span>{formatShortDate(projectBuildDate)}</span>
                            </div>
                            <div className="mt-3 h-6 rounded-full bg-white/8 p-1">
                              <div
                                className={cn(
                                  "flex h-full items-center justify-end rounded-full pr-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-950",
                                  item.leadTimeWeeks < 4
                                    ? "bg-emerald-400"
                                    : item.leadTimeWeeks <= 16
                                      ? "bg-amber-400"
                                      : "bg-rose-400",
                                )}
                                style={{ width: `${Math.max(width, 14)}%` }}
                              >
                                {item.leadTimeWeeks} wk
                              </div>
                            </div>
                            {critical ? (
                              <div className="mt-2 inline-flex items-center gap-2 text-xs text-rose-200">
                                <TriangleAlert className="size-3.5" />
                                Critical path component
                              </div>
                            ) : null}
                          </div>

                          <div className="flex items-center justify-start lg:justify-end">
                            <GanttStatus weeks={item.leadTimeWeeks} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>

        <AiAlternativesPanel
          open={aiPanelOpen}
          findings={aiFindings}
          lines={aiLines}
          onClose={() => setAiPanelOpen(false)}
        />
      </div>
    </TooltipProvider>
  );
}
