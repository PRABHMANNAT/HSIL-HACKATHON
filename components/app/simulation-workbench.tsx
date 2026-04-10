"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  BatteryCharging,
  ChevronRight,
  Download,
  Eye,
  EyeOff,
  Gauge,
  HeartPulse,
  Pause,
  Play,
  ShieldAlert,
  ShieldCheck,
  Square,
  Waves,
  Zap,
} from "lucide-react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  LineChart,
  Line as RechartsLine,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  XAxis,
  YAxis,
} from "recharts";

import { SimulationHeartScene } from "@/components/app/simulation-heart-scene";
import {
  defaultDeviceParameters,
  defaultPatientParameters,
  defaultScenario,
  emptySimulationSnapshot,
  scenarioPresets,
  type AlertSeverity,
  type ConductionStatus,
  type DeviceParameters,
  type PacingMode,
  type PatientParameters,
  type ScenarioKey,
  type SignalPoint,
  type SimulationConfig,
  type SimulationSnapshot,
  type SimulationWorkerSnapshotMessage,
} from "@/components/app/simulation-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const TRACE_WINDOW_MS = 8_000;
const panelClass =
  "rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,16,30,0.94),rgba(4,8,18,0.9))] shadow-[0_30px_80px_rgba(0,0,0,0.32)] backdrop-blur-2xl";
const gridStyle: CSSProperties = {
  backgroundImage: [
    "linear-gradient(rgba(248,113,113,0.06) 1px, transparent 1px)",
    "linear-gradient(90deg, rgba(248,113,113,0.06) 1px, transparent 1px)",
    "linear-gradient(rgba(248,113,113,0.12) 1px, transparent 1px)",
    "linear-gradient(90deg, rgba(248,113,113,0.12) 1px, transparent 1px)",
  ].join(","),
  backgroundSize: "20px 20px, 20px 20px, 100px 100px, 100px 100px",
};

const pacingModes: PacingMode[] = ["DDD", "VVI", "AAI", "VOO", "AOO", "DDI", "VDD"];
const conductionStatuses: ConductionStatus[] = [
  "Normal",
  "Complete AV Block",
  "2nd Degree Type I",
  "2nd Degree Type II",
  "Bundle Branch Block",
];
const speedOptions = [0.5, 1, 2, 5];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function formatClock(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatAlertTime(timestamp: number) {
  const totalSeconds = Math.floor(timestamp / 1_000);
  return `${Math.floor(totalSeconds / 60)}:${(totalSeconds % 60).toString().padStart(2, "0")}`;
}

function pulseAmount(currentTime: number, eventTime: number | null, windowMs = 280) {
  if (eventTime == null) {
    return 0;
  }

  const age = currentTime - eventTime;
  if (age < 0 || age > windowMs) {
    return 0;
  }

  return Math.sin((1 - age / windowMs) * Math.PI);
}

function severityStyles(severity: AlertSeverity) {
  switch (severity) {
    case "critical":
      return { chip: "border-red-400/40 bg-red-500/15 text-red-100", icon: "text-red-300" };
    case "warning":
      return { chip: "border-rose-400/35 bg-rose-500/12 text-rose-100", icon: "text-rose-300" };
    case "caution":
      return { chip: "border-amber-400/35 bg-amber-500/12 text-amber-100", icon: "text-amber-200" };
    default:
      return { chip: "border-sky-400/35 bg-sky-500/12 text-sky-100", icon: "text-sky-200" };
  }
}

function downloadText(contents: string, filename: string, mimeType: string) {
  const blob = new Blob([contents], { type: mimeType });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function NumericSlider({
  label,
  value,
  min,
  max,
  step,
  unit,
  accent = "bg-sky-400",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  accent?: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{label}</div>
        <div className="text-sm font-medium text-slate-100">
          {value.toFixed(step < 1 ? 2 : 0).replace(/\.00$/, "")}
          {unit}
        </div>
      </div>
      <div className="relative">
        <div className={cn("absolute inset-y-0 left-0 w-16 rounded-full blur-lg opacity-30", accent)} />
        <Slider
          min={min}
          max={max}
          step={step}
          value={[value]}
          className="[&_[data-slot=slider-range]]:bg-gradient-to-r [&_[data-slot=slider-track]]:bg-white/10"
          onValueChange={([nextValue]) => onChange(nextValue ?? value)}
        />
      </div>
    </div>
  );
}

function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
}) {
  return (
    <label className="space-y-2">
      <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="h-10 w-full rounded-2xl border border-white/10 bg-white/5 px-3 text-sm text-slate-100 outline-none transition focus:border-sky-400/50 focus:bg-white/8"
      >
        {options.map((option) => (
          <option key={option} value={option} className="bg-slate-950 text-slate-100">
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function PanelSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 border-b border-white/8 pb-5 last:border-b-0 last:pb-0">
      <div>
        <div className="text-sm font-semibold text-slate-100">{title}</div>
        <p className="mt-1 text-xs leading-5 text-slate-400">{description}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function SignalTrace({
  title,
  subtitle,
  dataKey,
  data,
  domain,
  yDomain,
  color,
  bpm,
}: {
  title: string;
  subtitle: string;
  dataKey: keyof Pick<SignalPoint, "aeg" | "veg" | "ecg">;
  data: SignalPoint[];
  domain: [number, number];
  yDomain: [number, number];
  color: string;
  bpm: number;
}) {
  return (
    <div className="relative min-h-0 overflow-hidden rounded-[24px] border border-white/8 bg-[#070d18]">
      <div className="absolute inset-0 opacity-80" style={gridStyle} />
      <div className="relative flex items-center justify-between px-4 pt-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">{title}</div>
          <div className="mt-1 text-xs text-slate-400">{subtitle}</div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
          <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
          {Math.max(0, Math.round(bpm))} BPM
        </div>
      </div>
      <div className="h-[calc(100%-56px)] px-2 pb-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="rgba(148,163,184,0.08)" />
            <XAxis type="number" dataKey="time" domain={domain} hide />
            <YAxis type="number" domain={yDomain} hide />
            <ReferenceLine y={0} stroke="rgba(148,163,184,0.16)" />
            <RechartsLine type="linear" dataKey={dataKey} stroke={color} strokeWidth={2.15} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function TriangleShape({ cx = 0, cy = 0, fill = "#4ade80" }: { cx?: number; cy?: number; fill?: string }) {
  return <path d={`M ${cx} ${cy - 7} L ${cx - 6} ${cy + 5} L ${cx + 6} ${cy + 5} Z`} fill={fill} opacity={0.95} />;
}

function SquareShape({ cx = 0, cy = 0, fill = "#ef4444" }: { cx?: number; cy?: number; fill?: string }) {
  return <rect x={cx - 4.5} y={cy - 4.5} width={9} height={9} rx={2.5} fill={fill} opacity={0.95} />;
}

function DeviceMarkerLane({ data, domain }: { data: SignalPoint[]; domain: [number, number] }) {
  const atrialSense = data.filter((point) => point.aSense != null).map((point) => ({ time: point.time, value: point.aSense ?? 0 }));
  const ventricularSense = data.filter((point) => point.vSense != null).map((point) => ({ time: point.time, value: point.vSense ?? 0 }));
  const modeSwitch = data.filter((point) => point.modeSwitch > 0).map((point) => ({ time: point.time, value: point.modeSwitch }));

  return (
    <div className="relative overflow-hidden rounded-[24px] border border-white/8 bg-[#070d18]">
      <div className="absolute inset-0 opacity-70" style={gridStyle} />
      <div className="relative flex flex-wrap items-center justify-between gap-3 px-4 pt-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Device Markers</div>
          <div className="mt-1 text-xs text-slate-400">A-pace, V-pace, senses, and mode switch markers.</div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-slate-400">
          <div className="flex items-center gap-2"><span className="h-2.5 w-3 rounded-sm bg-sky-400" />A-Pace</div>
          <div className="flex items-center gap-2"><span className="h-2.5 w-3 rounded-sm bg-orange-400" />V-Pace</div>
          <div className="flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 14 14"><TriangleShape cx={7} cy={7} fill="#4ade80" /></svg>A-Sense</div>
          <div className="flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 14 14"><TriangleShape cx={7} cy={7} fill="#c084fc" /></svg>V-Sense</div>
          <div className="flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 14 14"><SquareShape cx={7} cy={7} fill="#ef4444" /></svg>Mode</div>
        </div>
      </div>
      <div className="h-[calc(100%-64px)] px-2 pb-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="rgba(148,163,184,0.08)" />
            <XAxis type="number" dataKey="time" domain={domain} hide />
            <YAxis type="number" domain={[0, 1.5]} hide />
            <Bar dataKey="aPace" fill="#38bdf8" barSize={2} radius={[2, 2, 0, 0]} isAnimationActive={false} />
            <Bar dataKey="vPace" fill="#fb923c" barSize={2} radius={[2, 2, 0, 0]} isAnimationActive={false} />
            <Scatter
              data={atrialSense}
              dataKey="value"
              shape={(props) => {
                const rest = { ...(props ?? {}) } as { fill?: string };
                delete rest.fill;
                return <TriangleShape {...rest} fill="#4ade80" />;
              }}
            />
            <Scatter
              data={ventricularSense}
              dataKey="value"
              shape={(props) => {
                const rest = { ...(props ?? {}) } as { fill?: string };
                delete rest.fill;
                return <TriangleShape {...rest} fill="#c084fc" />;
              }}
            />
            <Scatter
              data={modeSwitch}
              dataKey="value"
              shape={(props) => {
                const rest = { ...(props ?? {}) } as { fill?: string };
                delete rest.fill;
                return <SquareShape {...rest} fill="#ef4444" />;
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function AlertCard({
  severity,
  title,
  timestamp,
  parameter,
  action,
}: {
  severity: AlertSeverity;
  title: string;
  timestamp: number;
  parameter: string;
  action: string;
}) {
  const styles = severityStyles(severity);

  return (
    <div className="rounded-[22px] border border-white/8 bg-white/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className={cn("size-4", styles.icon)} />
            <span className={cn("rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.2em]", styles.chip)}>
              {severity}
            </span>
          </div>
          <div className="text-sm font-medium text-slate-100">{title}</div>
        </div>
        <div className="text-xs tabular-nums text-slate-500">{formatAlertTime(timestamp)}</div>
      </div>
      <div className="mt-3 grid gap-3 text-xs text-slate-400">
        <div><span className="text-slate-500">Affected:</span> {parameter}</div>
        <div className="leading-5">{action}</div>
      </div>
    </div>
  );
}

function WaveformTabContent({
  deviceParams,
  patientParams,
  scenario,
  simulationSpeed,
  runDurationSec,
  snapshot,
  mounted,
  domain,
  zoomRange,
  selectionPixels,
  currentAlerts,
  hasCriticalAlert,
  chartAreaRef,
  onUpdateDevice,
  onUpdatePatient,
  onLoadScenario,
  onSetSpeed,
  onSetRunDuration,
  onStart,
  onPause,
  onStop,
  onResetZoom,
  onBeginZoom,
  onMoveZoom,
  onFinishZoom,
  onExportAlertLog,
}: {
  deviceParams: DeviceParameters;
  patientParams: PatientParameters;
  scenario: ScenarioKey;
  simulationSpeed: number;
  runDurationSec: number;
  snapshot: SimulationSnapshot;
  mounted: boolean;
  domain: [number, number];
  zoomRange: { start: number; end: number } | null;
  selectionPixels: { start: number; end: number } | null;
  currentAlerts: SimulationSnapshot["currentAlerts"];
  hasCriticalAlert: boolean;
  chartAreaRef: RefObject<HTMLDivElement>;
  onUpdateDevice: <K extends keyof DeviceParameters>(key: K, value: DeviceParameters[K]) => void;
  onUpdatePatient: <K extends keyof PatientParameters>(key: K, value: PatientParameters[K]) => void;
  onLoadScenario: (scenario: ScenarioKey) => void;
  onSetSpeed: (speed: number) => void;
  onSetRunDuration: (seconds: number) => void;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  onResetZoom: () => void;
  onBeginZoom: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onMoveZoom: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onFinishZoom: () => void;
  onExportAlertLog: () => void;
}) {
  return (
    <div className="grid h-full gap-4 xl:grid-cols-[320px_minmax(0,1fr)_280px]">
      <div className={cn(panelClass, "h-full overflow-hidden")}>
        <div className="h-full space-y-5 overflow-y-auto px-5 py-5">
          <PanelSection title="Device Parameters" description="Timing cycles, output reserve, and sensing thresholds for the implant.">
            <NumericSlider label="Lower Rate Limit" value={deviceParams.lowerRateLimit} min={30} max={100} step={1} unit=" BPM" onChange={(value) => onUpdateDevice("lowerRateLimit", value)} />
            <NumericSlider label="Upper Rate Limit" value={deviceParams.upperRateLimit} min={100} max={200} step={1} unit=" BPM" onChange={(value) => onUpdateDevice("upperRateLimit", value)} />
            <NumericSlider label="AV Delay" value={deviceParams.avDelay} min={50} max={300} step={5} unit=" ms" accent="bg-fuchsia-400" onChange={(value) => onUpdateDevice("avDelay", value)} />
            <NumericSlider label="Output Voltage" value={deviceParams.outputVoltage} min={0.5} max={7.5} step={0.1} unit=" V" accent="bg-orange-400" onChange={(value) => onUpdateDevice("outputVoltage", value)} />
            <NumericSlider label="Pulse Width" value={deviceParams.pulseWidth} min={0.05} max={1.5} step={0.05} unit=" ms" accent="bg-cyan-400" onChange={(value) => onUpdateDevice("pulseWidth", Number(value.toFixed(2)))} />
            <NumericSlider label="Sensitivity (Atrial)" value={deviceParams.sensitivityAtrial} min={0.1} max={5} step={0.1} unit=" mV" accent="bg-emerald-400" onChange={(value) => onUpdateDevice("sensitivityAtrial", Number(value.toFixed(1)))} />
            <NumericSlider label="Sensitivity (Ventricular)" value={deviceParams.sensitivityVentricular} min={0.1} max={5} step={0.1} unit=" mV" accent="bg-violet-400" onChange={(value) => onUpdateDevice("sensitivityVentricular", Number(value.toFixed(1)))} />
            <SelectField label="Pacing Mode" value={deviceParams.pacingMode} options={pacingModes} onChange={(value) => onUpdateDevice("pacingMode", value)} />
            <div className="flex items-center justify-between rounded-[20px] border border-white/10 bg-white/5 px-4 py-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Rate Response</div>
                <div className="mt-1 text-xs text-slate-500">Activity-adaptive lower rate behavior.</div>
              </div>
              <Switch checked={deviceParams.rateResponse} onCheckedChange={(checked) => onUpdateDevice("rateResponse", checked)} />
            </div>
          </PanelSection>
          <PanelSection title="Patient Parameters" description="Intrinsic rhythm, signal amplitudes, and conduction path assumptions.">
            <NumericSlider label="Intrinsic Heart Rate" value={patientParams.intrinsicHeartRate} min={0} max={100} step={1} unit=" BPM" accent="bg-rose-400" onChange={(value) => onUpdatePatient("intrinsicHeartRate", value)} />
            <NumericSlider label="P-wave Amplitude" value={patientParams.pWaveAmplitude} min={0} max={3} step={0.1} unit=" mV" accent="bg-emerald-400" onChange={(value) => onUpdatePatient("pWaveAmplitude", Number(value.toFixed(1)))} />
            <NumericSlider label="R-wave Amplitude" value={patientParams.rWaveAmplitude} min={0} max={15} step={0.1} unit=" mV" accent="bg-sky-400" onChange={(value) => onUpdatePatient("rWaveAmplitude", Number(value.toFixed(1)))} />
            <SelectField label="Conduction Status" value={patientParams.conductionStatus} options={conductionStatuses} onChange={(value) => onUpdatePatient("conductionStatus", value)} />
            <NumericSlider label="Activity Level" value={patientParams.activityLevel} min={0} max={100} step={1} unit="%" accent="bg-cyan-400" onChange={(value) => onUpdatePatient("activityLevel", value)} />
          </PanelSection>
          <PanelSection title="Scenarios" description="Quick-load clinically meaningful rhythm and device stress cases.">
            <div className="grid gap-2">
              {Object.entries(scenarioPresets).map(([key, preset]) => (
                <button key={key} type="button" onClick={() => onLoadScenario(key as ScenarioKey)} className={cn("rounded-[20px] border px-4 py-3 text-left transition", scenario === key ? "border-sky-400/40 bg-sky-400/12 text-white" : "border-white/10 bg-white/5 text-slate-200 hover:border-white/20 hover:bg-white/8")}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium">{preset.label}</div>
                      <div className="mt-1 text-xs leading-5 text-slate-400">{preset.summary}</div>
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-slate-500" />
                  </div>
                </button>
              ))}
            </div>
          </PanelSection>
          <PanelSection title="Run Controls" description="Operate the worker-backed simulator and adjust playback speed.">
            <div className="grid grid-cols-3 gap-2">
              <Button variant="secondary" className="h-11 rounded-2xl border border-emerald-400/25 bg-emerald-500/12 text-emerald-100 hover:bg-emerald-500/18" onClick={onStart}><Play className="size-4" />Start</Button>
              <Button variant="secondary" className="h-11 rounded-2xl border border-amber-400/25 bg-amber-500/12 text-amber-100 hover:bg-amber-500/18" onClick={onPause}><Pause className="size-4" />Pause</Button>
              <Button variant="secondary" className="h-11 rounded-2xl border border-rose-400/25 bg-rose-500/12 text-rose-100 hover:bg-rose-500/18" onClick={onStop}><Square className="size-4" />Stop</Button>
            </div>
            <div className="space-y-3">
              <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Simulation Speed</div>
              <div className="grid grid-cols-4 gap-2">
                {speedOptions.map((speed) => (
                  <button key={speed} type="button" onClick={() => onSetSpeed(speed)} className={cn("rounded-2xl border px-3 py-2 text-sm transition", simulationSpeed === speed ? "border-sky-400/40 bg-sky-400/12 text-white" : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/8")}>{speed}x</button>
                ))}
              </div>
            </div>
            <label className="space-y-2">
              <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Run for duration</div>
              <Input type="number" min={1} max={300} value={runDurationSec} onChange={(event) => onSetRunDuration(clamp(Number(event.target.value) || 0, 1, 300))} className="h-10 rounded-2xl border-white/10 bg-white/5 text-slate-100" />
            </label>
          </PanelSection>
        </div>
      </div>
      <div className={cn(panelClass, "flex h-full min-w-0 flex-col overflow-hidden")}>
        <div className="border-b border-white/8 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-white">Realtime Metrics</div>
              <div className="mt-1 text-xs text-slate-400">Current pacing burden, electrical reserve, and lead behavior from the live worker stream.</div>
            </div>
            <div className="flex items-center gap-2">
              {zoomRange ? <Button variant="secondary" size="sm" className="rounded-full border border-white/10 bg-white/5 text-slate-100" onClick={onResetZoom}>Reset zoom</Button> : null}
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">Window {(domain[1] - domain[0]) / 1000}s</div>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-7">
            {[{ icon: Activity, label: "Paced Rate", value: `${Math.round(snapshot.metrics.pacedRate)} BPM` }, { icon: HeartPulse, label: "Sensed Rate", value: `${Math.round(snapshot.metrics.sensedRate)} BPM` }, { icon: Zap, label: "% Paced (A)", value: `${Math.round(snapshot.metrics.pacedPercentA)}%` }, { icon: Zap, label: "% Paced (V)", value: `${Math.round(snapshot.metrics.pacedPercentV)}%` }, { icon: BatteryCharging, label: "Battery Voltage", value: `${snapshot.metrics.batteryVoltage.toFixed(2)} V` }, { icon: Gauge, label: "Impedance", value: `${Math.round(snapshot.metrics.impedance)} Ω` }, { icon: ShieldCheck, label: "Threshold Margin", value: `${snapshot.metrics.thresholdMargin.toFixed(2)}×` }].map((metric) => (
              <div key={metric.label} className="rounded-[22px] border border-white/8 bg-white/5 px-4 py-3">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-500"><metric.icon className="size-3.5" />{metric.label}</div>
                <div className="mt-2 text-lg font-semibold text-white">{metric.value}</div>
              </div>
            ))}
          </div>
        </div>
        <div ref={chartAreaRef} className="relative flex-1 overflow-hidden px-5 py-4" onPointerDown={onBeginZoom} onPointerMove={onMoveZoom} onPointerUp={onFinishZoom} onPointerLeave={onFinishZoom}>
          {mounted ? (
            <div className="grid h-full min-h-0 gap-3 [grid-template-rows:repeat(3,minmax(0,1fr))_116px]">
              <SignalTrace title="Atrial Electrogram" subtitle="Intrinsic P-waves and atrial pacing spikes" dataKey="aeg" data={snapshot.points} domain={domain} yDomain={[-3.5, 3.5]} color="#4ade80" bpm={Math.max(snapshot.metrics.pacedRate, snapshot.metrics.sensedRate)} />
              <SignalTrace title="Ventricular Electrogram" subtitle="QRS complexes and ventricular pacing spikes" dataKey="veg" data={snapshot.points} domain={domain} yDomain={[-6.5, 6.5]} color="#60a5fa" bpm={snapshot.metrics.currentRate} />
              <SignalTrace title="Surface ECG (Lead II)" subtitle="Combined surface rhythm with pacing artifact visibility" dataKey="ecg" data={snapshot.points} domain={domain} yDomain={[-2.2, 2.6]} color="#fde68a" bpm={snapshot.metrics.currentRate} />
              <DeviceMarkerLane data={snapshot.points} domain={domain} />
            </div>
          ) : (
            <div className="grid h-full min-h-0 gap-3 [grid-template-rows:repeat(3,minmax(0,1fr))_116px]">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="rounded-[24px] border border-white/8 bg-[#070d18]/90" />
              ))}
            </div>
          )}
          {selectionPixels ? <div className="pointer-events-none absolute inset-y-4 rounded-[22px] border border-sky-300/30 bg-sky-400/10" style={{ left: `${Math.min(selectionPixels.start, selectionPixels.end) + 20}px`, width: `${Math.abs(selectionPixels.end - selectionPixels.start)}px` }} /> : null}
        </div>
      </div>
      <motion.div animate={hasCriticalAlert ? { boxShadow: ["0 0 0 rgba(239,68,68,0.18)", "0 0 60px rgba(239,68,68,0.24)", "0 0 0 rgba(239,68,68,0.18)"] } : { boxShadow: "0 30px 80px rgba(0,0,0,0.32)" }} transition={hasCriticalAlert ? { repeat: Number.POSITIVE_INFINITY, duration: 1.1 } : { duration: 0.2 }} className={cn(panelClass, "h-full overflow-hidden", hasCriticalAlert ? "border-red-400/30" : "")}>
        <div className="flex h-full flex-col">
          <div className="border-b border-white/8 px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-white">Clinical Alerts</div>
                <div className="mt-1 text-xs text-slate-400">Severity-graded events with suggested actions and history.</div>
              </div>
              <Button variant="secondary" size="sm" className="rounded-full border border-white/10 bg-white/5 text-slate-100" onClick={onExportAlertLog}><Download className="size-3.5" />Export</Button>
            </div>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
            <AnimatePresence mode="popLayout">
              {currentAlerts.length > 0 ? currentAlerts.map((alert) => (
                <motion.div key={alert.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <AlertCard severity={alert.severity} title={alert.message} timestamp={alert.timestamp} parameter={alert.parameter} action={alert.action} />
                </motion.div>
              )) : <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-[24px] border border-emerald-400/20 bg-emerald-500/10 px-4 py-5 text-sm text-emerald-100">Stable rhythm window. No active alerts at the current operating point.</motion.div>}
            </AnimatePresence>
            <div className="rounded-[24px] border border-white/8 bg-white/5 p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-500"><Waves className="size-3.5" />Alert log</div>
              <div className="mt-3 space-y-3">
                {snapshot.alertLog.length > 0 ? snapshot.alertLog.map((alert) => {
                  const styles = severityStyles(alert.severity);
                  return (
                    <div key={alert.id} className="rounded-[18px] border border-white/8 bg-slate-950/45 px-3 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className={cn("rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.18em]", styles.chip)}>{alert.severity}</span>
                        <span className="text-xs text-slate-500">{formatAlertTime(alert.timestamp)}</span>
                      </div>
                      <div className="mt-2 text-sm text-slate-100">{alert.message}</div>
                      <div className="mt-1 text-xs text-slate-500">{alert.parameter}</div>
                    </div>
                  );
                }) : <div className="text-sm text-slate-400">Alert history will appear here after the first event.</div>}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function HeartTabContent({
  deviceParams,
  patientParams,
  snapshot,
  heartExploded,
  heartAnnotations,
  currentAlerts,
  onToggleExploded,
  onToggleAnnotations,
}: {
  deviceParams: DeviceParameters;
  patientParams: PatientParameters;
  snapshot: SimulationSnapshot;
  heartExploded: boolean;
  heartAnnotations: boolean;
  currentAlerts: SimulationSnapshot["currentAlerts"];
  onToggleExploded: () => void;
  onToggleAnnotations: () => void;
}) {
  const atrialStatus = snapshot.lastAtrialCapture ? snapshot.lastAtrialMarker ?? "Awaiting A event" : "Atrial no-capture";
  const ventricularStatus = snapshot.lastVentricularCapture ? snapshot.lastVentricularMarker ?? "Awaiting V event" : "Ventricular no-capture";

  return (
    <div className="grid h-full gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className={cn(panelClass, "relative h-full overflow-hidden")}>
        <div className="absolute left-5 top-5 z-10 flex flex-wrap items-center gap-2">
          <Button variant="secondary" className="rounded-full border border-white/10 bg-white/6 text-slate-100" onClick={onToggleExploded}>
            {heartExploded ? "Reassemble" : "Exploded View"}
          </Button>
          <Button variant="secondary" className="rounded-full border border-white/10 bg-white/6 text-slate-100" onClick={onToggleAnnotations}>
            {heartAnnotations ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            {heartAnnotations ? "Hide labels" : "Show labels"}
          </Button>
        </div>
        <div className="absolute bottom-5 left-5 z-10 flex items-center gap-3 rounded-[22px] border border-white/10 bg-slate-950/55 px-4 py-3 text-xs text-slate-300 backdrop-blur-xl">
          <span className="inline-flex items-center gap-2"><span className="size-2 rounded-full bg-sky-400" />Atrial status {atrialStatus}</span>
          <span className="inline-flex items-center gap-2"><span className="size-2 rounded-full bg-orange-400" />Ventricular status {ventricularStatus}</span>
        </div>
        <SimulationHeartScene snapshot={snapshot} exploded={heartExploded} annotations={heartAnnotations} />
      </div>
      <div className={cn(panelClass, "h-full overflow-hidden")}>
        <div className="h-full space-y-5 overflow-y-auto px-5 py-5">
          <PanelSection title="Anatomical Sync" description="Electrical events from the waveform engine drive chamber contraction, lead illumination, and device state.">
            <div className="rounded-[22px] border border-white/8 bg-white/5 px-4 py-4">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-500"><HeartPulse className="size-3.5" />Device annotation</div>
              <div className="mt-3 grid gap-3 text-sm text-slate-200">
                <div className="flex items-center justify-between"><span className="text-slate-400">Mode</span><span className="font-medium">{snapshot.mode}</span></div>
                <div className="flex items-center justify-between"><span className="text-slate-400">Battery</span><span className="font-medium">{snapshot.metrics.batteryVoltage.toFixed(2)} V</span></div>
                <div className="flex items-center justify-between"><span className="text-slate-400">Lead impedance</span><span className="font-medium">{Math.round(snapshot.metrics.impedance)} Ω</span></div>
                <div className="flex items-center justify-between"><span className="text-slate-400">Threshold reserve</span><span className="font-medium">{snapshot.metrics.thresholdMargin.toFixed(2)}×</span></div>
              </div>
            </div>
            <div className="grid gap-3">
              {[{ label: "Right Atrium", status: atrialStatus, accent: snapshot.lastAtrialCapture ? "bg-sky-400" : "bg-amber-400", amplitude: `${patientParams.pWaveAmplitude.toFixed(1)} mV` }, { label: "Left Atrium", status: atrialStatus, accent: snapshot.lastAtrialCapture ? "bg-cyan-400" : "bg-amber-400", amplitude: `${patientParams.pWaveAmplitude.toFixed(1)} mV` }, { label: "Right Ventricle", status: ventricularStatus, accent: snapshot.lastVentricularCapture ? "bg-orange-400" : "bg-amber-400", amplitude: `${patientParams.rWaveAmplitude.toFixed(1)} mV` }, { label: "Left Ventricle", status: ventricularStatus, accent: snapshot.lastVentricularCapture ? "bg-rose-400" : "bg-amber-400", amplitude: `${patientParams.rWaveAmplitude.toFixed(1)} mV` }].map((item) => (
                <div key={item.label} className="rounded-[22px] border border-white/8 bg-white/5 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3"><span className={cn("size-2.5 rounded-full", item.accent)} /><div><div className="text-sm font-medium text-white">{item.label}</div><div className="mt-1 text-xs text-slate-400">{item.status}</div></div></div>
                    <div className="text-xs text-slate-500">{item.amplitude}</div>
                  </div>
                </div>
              ))}
            </div>
          </PanelSection>
          <PanelSection title="Lead and Capture" description="Implant path annotations stay synchronized with the same event timeline as the waveform view.">
            <div className="rounded-[22px] border border-white/8 bg-white/5 px-4 py-4">
              <div className="flex items-center justify-between text-sm"><span className="text-slate-400">Atrial lead</span><span className="font-medium text-slate-100">{Math.round(snapshot.metrics.impedance)} Ω / threshold {snapshot.metrics.atrialOutputThreshold.toFixed(1)} V</span></div>
              <div className="mt-3 h-2 rounded-full bg-white/8"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-sky-400" style={{ width: `${clamp((snapshot.metrics.thresholdMargin / 3) * 100, 18, 100)}%` }} /></div>
            </div>
            <div className="rounded-[22px] border border-white/8 bg-white/5 px-4 py-4">
              <div className="flex items-center justify-between text-sm"><span className="text-slate-400">Ventricular lead</span><span className="font-medium text-slate-100">output {deviceParams.outputVoltage.toFixed(1)} V / threshold {snapshot.metrics.ventricularOutputThreshold.toFixed(1)} V</span></div>
              <div className="mt-3 h-2 rounded-full bg-white/8"><div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-rose-400" style={{ width: `${clamp((snapshot.metrics.thresholdMargin / 3) * 100, 18, 100)}%` }} /></div>
            </div>
            <div className="rounded-[22px] border border-white/8 bg-white/5 px-4 py-4 text-sm text-slate-300">Exploded state <span className="ml-1 font-medium text-white">{heartExploded ? "enabled" : "off"}</span><div className="mt-2 text-xs leading-5 text-slate-500">Device, leads, and heart separate to make subcutaneous placement and chamber targeting legible.</div></div>
          </PanelSection>
          <PanelSection title="Realtime Interpretation" description="Current electrical picture for the anatomy view.">
            <div className="space-y-3">
              <div className="rounded-[22px] border border-white/8 bg-white/5 px-4 py-4">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-500">{snapshot.lastVentricularCapture ? <ShieldCheck className="size-3.5 text-emerald-300" /> : <ShieldAlert className="size-3.5 text-amber-300" />}Capture state</div>
                <div className="mt-2 text-sm text-slate-200">{snapshot.lastVentricularCapture ? "Ventricular contraction follows the latest electrical event." : "Latest ventricular pace did not capture. Chamber turns amber in the scene."}</div>
              </div>
              <div className="rounded-[22px] border border-white/8 bg-white/5 px-4 py-4">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-500"><Gauge className="size-3.5" />Spatial readout</div>
                <div className="mt-2 grid gap-2 text-sm text-slate-200">
                  <div className="flex items-center justify-between"><span className="text-slate-400">Atrial pulse</span><span>{Math.round(pulseAmount(snapshot.currentTime, snapshot.lastAtrialContractionTime) * 100)}%</span></div>
                  <div className="flex items-center justify-between"><span className="text-slate-400">Ventricular pulse</span><span>{Math.round(pulseAmount(snapshot.currentTime, snapshot.lastVentricularContractionTime) * 100)}%</span></div>
                  <div className="flex items-center justify-between"><span className="text-slate-400">Noise envelope</span><span>{Math.round(snapshot.noiseLevel * 100)}%</span></div>
                </div>
              </div>
              <div className="space-y-2">
                {currentAlerts.length > 0 ? currentAlerts.map((alert) => (
                  <div key={alert.id} className="rounded-[20px] border border-white/8 bg-slate-950/45 px-4 py-3 text-sm">
                    <div className="flex items-center gap-2 text-slate-100"><AlertTriangle className={cn("size-4", severityStyles(alert.severity).icon)} />{alert.message}</div>
                    <div className="mt-1 text-xs text-slate-500">{alert.action}</div>
                  </div>
                )) : <div className="rounded-[20px] border border-emerald-400/20 bg-emerald-500/10 px-4 py-4 text-sm text-emerald-100">Chamber animations and lead flashes are synchronized without active safety issues.</div>}
              </div>
            </div>
          </PanelSection>
        </div>
      </div>
    </div>
  );
}

export function SimulationWorkbench() {
  const [activeTab, setActiveTab] = useState<"waveform" | "heart">("waveform");
  const [deviceParams, setDeviceParams] = useState<DeviceParameters>(defaultDeviceParameters);
  const [patientParams, setPatientParams] = useState<PatientParameters>(defaultPatientParameters);
  const [scenario, setScenario] = useState<ScenarioKey>(defaultScenario);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [runDurationSec, setRunDurationSec] = useState(30);
  const [snapshot, setSnapshot] = useState<SimulationSnapshot>(emptySimulationSnapshot);
  const [mounted, setMounted] = useState(false);
  const [zoomRange, setZoomRange] = useState<{ start: number; end: number } | null>(null);
  const [selectionPixels, setSelectionPixels] = useState<{ start: number; end: number } | null>(null);
  const [heartExploded, setHeartExploded] = useState(false);
  const [heartAnnotations, setHeartAnnotations] = useState(true);

  const workerRef = useRef<Worker | null>(null);
  const frameRef = useRef<number | null>(null);
  const latestSnapshotRef = useRef(snapshot);
  const pendingRestartRef = useRef(false);
  const playedCriticalRef = useRef<Set<string>>(new Set());
  const audioContextRef = useRef<AudioContext | null>(null);
  const chartAreaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const worker = new Worker(new URL("./simulation-engine.worker.ts", import.meta.url), { type: "module" });
    workerRef.current = worker;
    worker.onmessage = (event: MessageEvent<SimulationWorkerSnapshotMessage>) => {
      latestSnapshotRef.current = event.data.snapshot;
      if (frameRef.current == null) {
        frameRef.current = window.requestAnimationFrame(() => {
          setSnapshot(latestSnapshotRef.current);
          frameRef.current = null;
        });
      }
    };
    worker.postMessage({
      type: "configure",
      config: {
        device: defaultDeviceParameters,
        patient: defaultPatientParameters,
        speed: 1,
        runDurationSec: 30,
        scenario: defaultScenario,
      } satisfies SimulationConfig,
    });
    worker.postMessage({ type: "start" });
    return () => {
      if (frameRef.current != null) {
        window.cancelAnimationFrame(frameRef.current);
      }
      worker.terminate();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!workerRef.current) {
      return;
    }
    workerRef.current.postMessage({
      type: "configure",
      config: {
        device: deviceParams,
        patient: patientParams,
        speed: simulationSpeed,
        runDurationSec,
        scenario,
      },
    });
    if (pendingRestartRef.current) {
      workerRef.current.postMessage({ type: "start" });
      pendingRestartRef.current = false;
    }
  }, [deviceParams, patientParams, simulationSpeed, runDurationSec, scenario]);

  useEffect(() => {
    for (const alert of snapshot.alertLog.filter((entry) => entry.severity === "critical")) {
      if (playedCriticalRef.current.has(alert.id)) {
        continue;
      }
      playedCriticalRef.current.add(alert.id);
      try {
        const AudioCtor = window.AudioContext || ((window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext ?? null);
        if (!AudioCtor) {
          break;
        }
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioCtor();
        }
        const audioContext = audioContextRef.current;
        if (audioContext.state === "suspended") {
          void audioContext.resume();
        }
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.type = "square";
        oscillator.frequency.value = 880;
        gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.08, audioContext.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.22);
        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.24);
      } catch {
        break;
      }
    }
  }, [snapshot.alertLog]);

  const domainEnd = snapshot.currentTime || TRACE_WINDOW_MS;
  const defaultDomainStart = Math.max(0, domainEnd - TRACE_WINDOW_MS);
  const domain: [number, number] = zoomRange ? [zoomRange.start, zoomRange.end] : [defaultDomainStart, domainEnd];
  const activeScenario = scenarioPresets[scenario];
  const currentAlerts = snapshot.currentAlerts.slice(0, 4);
  const hasCriticalAlert = currentAlerts.some((alert) => alert.severity === "critical");

  function updateDevice<K extends keyof DeviceParameters>(key: K, value: DeviceParameters[K]) {
    setDeviceParams((current) => ({ ...current, [key]: value }));
  }

  function updatePatient<K extends keyof PatientParameters>(key: K, value: PatientParameters[K]) {
    setPatientParams((current) => ({ ...current, [key]: value }));
  }

  function loadScenario(nextScenario: ScenarioKey) {
    const preset = scenarioPresets[nextScenario];
    setScenario(nextScenario);
    setZoomRange(null);
    pendingRestartRef.current = true;
    workerRef.current?.postMessage({ type: "stop" });
    setDeviceParams((current) => ({ ...current, ...(preset.device ?? {}) }));
    setPatientParams((current) => ({ ...current, ...(preset.patient ?? {}) }));
    if (preset.runDurationSec) {
      setRunDurationSec(preset.runDurationSec);
    }
  }

  function exportAlertLog() {
    const header = "severity,timestamp,parameter,message,action";
    const rows = snapshot.alertLog.map((alert) =>
      [alert.severity, formatAlertTime(alert.timestamp), `"${alert.parameter}"`, `"${alert.message.replace(/"/g, '""')}"`, `"${alert.action.replace(/"/g, '""')}"`].join(","),
    );
    downloadText([header, ...rows].join("\n"), "pacemaker-alert-log.csv", "text/csv;charset=utf-8");
  }

  function beginZoom(event: ReactPointerEvent<HTMLDivElement>) {
    if (!chartAreaRef.current || activeTab !== "waveform") {
      return;
    }
    const rect = chartAreaRef.current.getBoundingClientRect();
    const offsetX = clamp(event.clientX - rect.left, 0, rect.width);
    setSelectionPixels({ start: offsetX, end: offsetX });
  }

  function moveZoom(event: ReactPointerEvent<HTMLDivElement>) {
    if (!chartAreaRef.current || !selectionPixels) {
      return;
    }
    const rect = chartAreaRef.current.getBoundingClientRect();
    const offsetX = clamp(event.clientX - rect.left, 0, rect.width);
    setSelectionPixels((current) => (current ? { ...current, end: offsetX } : current));
  }

  function finishZoom() {
    if (!chartAreaRef.current || !selectionPixels) {
      return;
    }
    const rect = chartAreaRef.current.getBoundingClientRect();
    const width = Math.abs(selectionPixels.end - selectionPixels.start);
    if (width > 24) {
      const span = domain[1] - domain[0];
      const left = Math.min(selectionPixels.start, selectionPixels.end);
      const right = Math.max(selectionPixels.start, selectionPixels.end);
      setZoomRange({
        start: domain[0] + (left / rect.width) * span,
        end: domain[0] + (right / rect.width) * span,
      });
    }
    setSelectionPixels(null);
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as "waveform" | "heart")}
      className="-m-4 flex h-[calc(100svh-5.6rem)] min-h-[920px] flex-col overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.18),transparent_28%),linear-gradient(180deg,#050815_0%,#09111f_100%)] text-slate-100 sm:-m-6"
    >
      <div className="relative border-b border-white/10 px-6 py-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(248,113,113,0.12),transparent_28%)]" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/25 bg-sky-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-sky-100">
              <HeartPulse className="size-3.5" />
              Digital Twin Simulator
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Pacemaker pacing logic and cardiac response in one live surface</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Stream electrograms, validate timing cycles, and inspect anatomical contraction against the same worker-driven rhythm engine.</p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <TabsList variant="line" className="rounded-full border border-white/10 bg-white/5 p-1">
              <TabsTrigger value="waveform" className="rounded-full px-5 data-[state=active]:bg-white/10 data-[state=active]:text-white">Waveform Simulator</TabsTrigger>
              <TabsTrigger value="heart" className="rounded-full px-5 data-[state=active]:bg-white/10 data-[state=active]:text-white">3D Heart View</TabsTrigger>
            </TabsList>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">Mode <span className="ml-1 font-medium text-white">{snapshot.mode}</span></div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">Scenario <span className="ml-1 font-medium text-white">{activeScenario.label}</span></div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">Updated <span className="ml-1 font-medium text-white">{formatClock(snapshot.lastUpdated)}</span></div>
              <div className={cn("rounded-full border px-3 py-1.5 text-xs font-medium", snapshot.status === "running" ? "border-emerald-400/30 bg-emerald-500/12 text-emerald-100" : snapshot.status === "paused" ? "border-amber-400/30 bg-amber-500/12 text-amber-100" : "border-slate-400/20 bg-white/5 text-slate-300")}>{snapshot.status.toUpperCase()}</div>
            </div>
          </div>
        </div>
      </div>
      <TabsContent value="waveform" className="mt-0 flex-1 overflow-hidden p-4">
        <WaveformTabContent
          deviceParams={deviceParams}
          patientParams={patientParams}
          scenario={scenario}
          simulationSpeed={simulationSpeed}
          runDurationSec={runDurationSec}
          snapshot={snapshot}
          mounted={mounted}
          domain={domain}
          zoomRange={zoomRange}
          selectionPixels={selectionPixels}
          currentAlerts={currentAlerts}
          hasCriticalAlert={hasCriticalAlert}
          chartAreaRef={chartAreaRef}
          onUpdateDevice={updateDevice}
          onUpdatePatient={updatePatient}
          onLoadScenario={loadScenario}
          onSetSpeed={setSimulationSpeed}
          onSetRunDuration={setRunDurationSec}
          onStart={() => workerRef.current?.postMessage({ type: "start" })}
          onPause={() => workerRef.current?.postMessage({ type: "pause" })}
          onStop={() => {
            setZoomRange(null);
            workerRef.current?.postMessage({ type: "stop" });
          }}
          onResetZoom={() => setZoomRange(null)}
          onBeginZoom={beginZoom}
          onMoveZoom={moveZoom}
          onFinishZoom={finishZoom}
          onExportAlertLog={exportAlertLog}
        />
      </TabsContent>
      <TabsContent value="heart" className="mt-0 flex-1 overflow-hidden p-4">
        <HeartTabContent
          deviceParams={deviceParams}
          patientParams={patientParams}
          snapshot={snapshot}
          heartExploded={heartExploded}
          heartAnnotations={heartAnnotations}
          currentAlerts={currentAlerts}
          onToggleExploded={() => setHeartExploded((current) => !current)}
          onToggleAnnotations={() => setHeartAnnotations((current) => !current)}
        />
      </TabsContent>
    </Tabs>
  );
}
