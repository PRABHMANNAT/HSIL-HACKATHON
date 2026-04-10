import {
  defaultSimulationConfig,
  emptySimulationSnapshot,
  type DeviceMarkerType,
  type SimulationAlert,
  type SimulationConfig,
  type SimulationMetrics,
  type SimulationSnapshot,
  type SimulationStatus,
  type SimulationWorkerMessage,
  type SimulationWorkerSnapshotMessage,
  type SignalPoint,
} from "@/components/app/simulation-types";

declare const self: DedicatedWorkerGlobalScope;

export {};

const workerScope = self as unknown as {
  postMessage: (message: SimulationWorkerSnapshotMessage) => void;
  onmessage: ((event: MessageEvent<SimulationWorkerMessage>) => void) | null;
};

const WINDOW_MS = 8_000;
const SAMPLE_MS = 10;
const TICK_MS = 50;
const ALERT_LOG_LIMIT = 80;

type InternalEventKind = "atrial" | "ventricular" | "mode-switch";
type InternalEventSource = "intrinsic" | "pace" | "noise";

interface InternalEvent {
  id: number;
  time: number;
  kind: InternalEventKind;
  source: InternalEventSource;
  marker: DeviceMarkerType | null;
  captured: boolean;
  falseSense: boolean;
  amplitude: number;
  wideQrs: boolean;
}

interface PendingVentricularEvent {
  time: number;
  wideQrs: boolean;
}

let config = cloneConfig(defaultSimulationConfig);
let status: SimulationStatus = "idle";
let timer: ReturnType<typeof setInterval> | null = null;

let currentTime = 0;
let signalPoints: SignalPoint[] = [];
let events: InternalEvent[] = [];
let pendingIntrinsicVEvents: PendingVentricularEvent[] = [];
let currentAlerts: SimulationAlert[] = [];
let alertLog: SimulationAlert[] = [];
let activeAlerts = new Map<string, string>();

let batteryVoltage = emptySimulationSnapshot.metrics.batteryVoltage;
let lastMetrics: SimulationMetrics = { ...emptySimulationSnapshot.metrics };

let eventCounter = 0;
let conductionBeatCounter = 0;

let nextIntrinsicATime = Number.POSITIVE_INFINITY;
let nextAtrialPaceDue = Number.POSITIVE_INFINITY;
let nextTrackedVPaceDue = Number.POSITIVE_INFINITY;
let nextBackupVPaceDue = Number.POSITIVE_INFINITY;

let lastNoiseSenseTime = Number.NEGATIVE_INFINITY;
let lastModeSwitchTime = Number.NEGATIVE_INFINITY;

let pacedAtrialBeats = 0;
let pacedVentricularBeats = 0;
let sensedAtrialBeats = 0;
let sensedVentricularBeats = 0;

let lastAtrialContractionTime: number | null = null;
let lastVentricularContractionTime: number | null = null;
let lastAtrialMarker: DeviceMarkerType | null = null;
let lastVentricularMarker: DeviceMarkerType | null = null;
let lastAtrialCapture = true;
let lastVentricularCapture = true;
let lastWideQrs = false;

function cloneConfig(source: SimulationConfig): SimulationConfig {
  return {
    ...source,
    device: { ...source.device },
    patient: { ...source.patient },
  };
}

function shouldPaceAtrium() {
  return ["DDD", "AAI", "AOO", "DDI"].includes(config.device.pacingMode);
}

function shouldSenseAtrium() {
  return ["DDD", "AAI", "DDI", "VDD"].includes(config.device.pacingMode);
}

function shouldPaceVentricle() {
  return ["DDD", "VVI", "VOO", "DDI", "VDD"].includes(config.device.pacingMode);
}

function shouldSenseVentricle() {
  return ["DDD", "VVI", "DDI", "VDD"].includes(config.device.pacingMode);
}

function shouldTrackAtriumToVentricle() {
  return ["DDD", "VDD"].includes(config.device.pacingMode);
}

function effectiveLowerRate() {
  if (!config.device.rateResponse) {
    return config.device.lowerRateLimit;
  }

  const headroom = config.device.upperRateLimit - config.device.lowerRateLimit;
  const requested = config.device.lowerRateLimit + headroom * (config.patient.activityLevel / 100) * 0.56;
  return Math.min(config.device.upperRateLimit - 4, requested);
}

function atrialEscapeInterval() {
  return 60_000 / Math.max(30, effectiveLowerRate());
}

function ventricularEscapeInterval() {
  return 60_000 / Math.max(30, effectiveLowerRate());
}

function intrinsicAtrialInterval() {
  if (config.patient.intrinsicHeartRate <= 0 || config.patient.pWaveAmplitude <= 0) {
    return Number.POSITIVE_INFINITY;
  }

  return 60_000 / Math.max(1, config.patient.intrinsicHeartRate);
}

function jitter() {
  return (Math.random() - 0.5) * 10;
}

function currentNoiseLevel(atTime: number) {
  if (config.scenario === "emi") {
    const burst = atTime % 3_400;
    return burst > 2_100 && burst < 2_650 ? 0.96 : 0.18;
  }

  if (config.scenario === "lead-dislodgement") {
    return 0.22;
  }

  return 0.08;
}

function currentImpedance(atTime: number) {
  const base =
    config.scenario === "lead-dislodgement"
      ? 920
      : config.scenario === "battery-depletion"
        ? 640
        : 560;

  const drift = Math.sin(atTime / 740) * 18 + Math.cos(atTime / 1_900) * 9;
  return Math.max(320, Math.min(1_120, base + drift));
}

function captureThreshold(chamber: "A" | "V", atTime: number) {
  const base = chamber === "A" ? 0.82 : 1.15;
  const impedancePenalty = Math.max(0, currentImpedance(atTime) - 700) / 280;
  const batteryPenalty = Math.max(0, 2.62 - batteryVoltage) * 1.05;
  const pulseWidthPenalty = config.device.pulseWidth < 0.2 ? 0.32 : config.device.pulseWidth < 0.35 ? 0.12 : 0;
  const scenarioPenalty =
    config.scenario === "battery-depletion"
      ? 0.42
      : config.scenario === "lead-dislodgement"
        ? 0.84
        : 0;

  return base + impedancePenalty + batteryPenalty + pulseWidthPenalty + scenarioPenalty;
}

function hasCapture(chamber: "A" | "V", atTime: number) {
  return config.device.outputVoltage >= captureThreshold(chamber, atTime);
}

function consumeBattery() {
  const drainMultiplier =
    config.scenario === "battery-depletion" ? 2.7 : config.scenario === "high-activity" ? 1.4 : 1;
  batteryVoltage = Math.max(2.04, batteryVoltage - 0.0001 * drainMultiplier);
}

function registerAlert(
  key: string,
  severity: SimulationAlert["severity"],
  message: string,
  parameter: string,
  action: string,
  condition: boolean,
  timestamp: number,
) {
  if (condition) {
    if (!activeAlerts.has(key)) {
      const alert: SimulationAlert = {
        id: `${key}-${Math.round(timestamp)}`,
        severity,
        message,
        timestamp,
        parameter,
        action,
      };

      activeAlerts.set(key, alert.id);
      alertLog = [alert, ...alertLog].slice(0, ALERT_LOG_LIMIT);
    }
  } else {
    activeAlerts.delete(key);
  }

  currentAlerts = Array.from(activeAlerts.values())
    .map((id) => alertLog.find((alert) => alert.id === id))
    .filter((alert): alert is SimulationAlert => Boolean(alert))
    .sort((left, right) => right.timestamp - left.timestamp);
}

function createEvent(partial: Omit<InternalEvent, "id">) {
  const event: InternalEvent = {
    id: ++eventCounter,
    ...partial,
  };

  events.push(event);
  events = events.filter((item) => currentTime - item.time <= WINDOW_MS + 1_000);
  return event;
}

function scheduleConductionFromAtrialEvent(atTime: number) {
  conductionBeatCounter += 1;

  let conductionDelay: number | null = null;
  let wideQrs = false;

  switch (config.patient.conductionStatus) {
    case "Normal":
      conductionDelay = 148 + Math.sin(conductionBeatCounter) * 10;
      break;
    case "Complete AV Block":
      conductionDelay = null;
      break;
    case "2nd Degree Type I": {
      const cycle = conductionBeatCounter % 4;
      if (cycle === 0) {
        conductionDelay = null;
      } else {
        conductionDelay = [150, 190, 230][cycle - 1];
      }
      break;
    }
    case "2nd Degree Type II":
      conductionDelay = conductionBeatCounter % 5 === 0 ? null : 165;
      break;
    case "Bundle Branch Block":
      conductionDelay = 182;
      wideQrs = true;
      break;
  }

  if (conductionDelay == null) {
    return;
  }

  pendingIntrinsicVEvents.push({
    time: atTime + conductionDelay,
    wideQrs,
  });
  pendingIntrinsicVEvents.sort((left, right) => left.time - right.time);
}

function onAtrialPhysiology(atTime: number, source: InternalEventSource, sensed: boolean, captured: boolean) {
  const marker = source === "pace" ? "A-Pace" : sensed ? "A-Sense" : null;

  createEvent({
    time: atTime,
    kind: "atrial",
    source,
    marker,
    captured,
    falseSense: false,
    amplitude: config.patient.pWaveAmplitude,
    wideQrs: false,
  });

  if (source === "pace") {
    pacedAtrialBeats += 1;
    consumeBattery();
  } else if (sensed) {
    sensedAtrialBeats += 1;
  }

  lastAtrialMarker = marker;
  lastAtrialCapture = captured;

  if (captured) {
    lastAtrialContractionTime = atTime;
    scheduleConductionFromAtrialEvent(atTime);
  }

  if (source === "pace" || sensed) {
    nextAtrialPaceDue = atTime + atrialEscapeInterval();
    if (shouldTrackAtriumToVentricle()) {
      nextTrackedVPaceDue = atTime + config.device.avDelay;
    }
  }
}

function onVentricularPhysiology(
  atTime: number,
  source: InternalEventSource,
  sensed: boolean,
  captured: boolean,
  wideQrs: boolean,
) {
  const marker = source === "pace" ? "V-Pace" : sensed ? "V-Sense" : null;

  createEvent({
    time: atTime,
    kind: "ventricular",
    source,
    marker,
    captured,
    falseSense: false,
    amplitude: config.patient.rWaveAmplitude,
    wideQrs,
  });

  if (source === "pace") {
    pacedVentricularBeats += 1;
    consumeBattery();
  } else if (sensed) {
    sensedVentricularBeats += 1;
  }

  lastVentricularMarker = marker;
  lastVentricularCapture = captured;
  lastWideQrs = wideQrs;

  if (captured) {
    lastVentricularContractionTime = atTime;
  }

  if (source === "pace" || sensed) {
    nextBackupVPaceDue = atTime + ventricularEscapeInterval();
    nextTrackedVPaceDue = Number.POSITIVE_INFINITY;
  }
}

function onNoiseSense(atTime: number, chamber: "A" | "V") {
  const marker = chamber === "A" ? "A-Sense" : "V-Sense";

  createEvent({
    time: atTime,
    kind: chamber === "A" ? "atrial" : "ventricular",
    source: "noise",
    marker,
    captured: false,
    falseSense: true,
    amplitude: 0,
    wideQrs: false,
  });

  if (chamber === "A" && shouldSenseAtrium()) {
    lastAtrialMarker = marker;
    lastAtrialCapture = false;
    nextAtrialPaceDue = atTime + atrialEscapeInterval();
  }

  if (chamber === "V" && shouldSenseVentricle()) {
    lastVentricularMarker = marker;
    lastVentricularCapture = false;
    nextBackupVPaceDue = atTime + ventricularEscapeInterval();
    nextTrackedVPaceDue = Number.POSITIVE_INFINITY;
  }
}

function onModeSwitch(atTime: number) {
  createEvent({
    time: atTime,
    kind: "mode-switch",
    source: "noise",
    marker: "Mode Switch",
    captured: false,
    falseSense: true,
    amplitude: 0,
    wideQrs: false,
  });
}

function paceAtrium(atTime: number) {
  const captured = hasCapture("A", atTime);
  onAtrialPhysiology(atTime, "pace", false, captured);
}

function paceVentricle(atTime: number) {
  const captured = hasCapture("V", atTime);
  onVentricularPhysiology(atTime, "pace", false, captured, false);
}

function intrinsicAtrialBeat(atTime: number) {
  const sensed = shouldSenseAtrium() && config.patient.pWaveAmplitude >= config.device.sensitivityAtrial;
  onAtrialPhysiology(atTime, "intrinsic", sensed, true);
}

function intrinsicVentricularBeat(atTime: number, wideQrs: boolean) {
  const sensed =
    shouldSenseVentricle() && config.patient.rWaveAmplitude >= config.device.sensitivityVentricular;
  onVentricularPhysiology(atTime, "intrinsic", sensed, true, wideQrs);
}

function gaussian(delta: number, sigma: number, amplitude: number) {
  return amplitude * Math.exp(-(delta * delta) / (2 * sigma * sigma));
}

function pWave(delta: number, amplitude: number) {
  if (Math.abs(delta) > 150) {
    return 0;
  }

  return gaussian(delta, 20, amplitude * 0.52) - gaussian(delta + 18, 11, amplitude * 0.08);
}

function qrsComplex(delta: number, amplitude: number, wide: boolean) {
  if (Math.abs(delta) > 250) {
    return 0;
  }

  const width = wide ? 22 : 14;
  return (
    -gaussian(delta + 22, width * 0.8, amplitude * 0.18) +
    gaussian(delta, width * 0.55, amplitude) -
    gaussian(delta - 20, width * 0.95, amplitude * 0.34) +
    gaussian(delta - 180, 56, amplitude * 0.22)
  );
}

function pacingSpike(delta: number, amplitude: number) {
  if (Math.abs(delta) > 12) {
    return 0;
  }

  return amplitude * (1 - Math.abs(delta) / 12);
}

function noiseSample(atTime: number, factor: number, phase: number) {
  return (
    Math.sin((atTime + phase) / 170) * factor +
    Math.sin((atTime + phase) / 37) * factor * 0.35 +
    Math.cos((atTime + phase) / 81) * factor * 0.24
  );
}

function generateSignalPoint(atTime: number) {
  let aeg = noiseSample(atTime, 0.018 + currentNoiseLevel(atTime) * 0.012, 0);
  let veg = noiseSample(atTime, 0.024 + currentNoiseLevel(atTime) * 0.014, 120);
  let ecg = noiseSample(atTime, 0.014 + currentNoiseLevel(atTime) * 0.022, 240);

  let aPace = 0;
  let vPace = 0;
  let aSense: number | null = null;
  let vSense: number | null = null;
  let modeSwitch = 0;

  for (const event of events) {
    const delta = atTime - event.time;

    if (event.kind === "atrial") {
      if (event.captured && !event.falseSense) {
        aeg += pWave(delta, config.patient.pWaveAmplitude * 0.74);
        ecg += pWave(delta, config.patient.pWaveAmplitude * 0.26);
      }

      if (event.marker === "A-Pace") {
        aeg += pacingSpike(delta, 3.4 * (currentImpedance(atTime) / 560));
        ecg += pacingSpike(delta, 1.2);
        if (Math.abs(delta) <= SAMPLE_MS) {
          aPace = 0.55;
        }
      }

      if (event.marker === "A-Sense" && Math.abs(delta) <= SAMPLE_MS) {
        aSense = 0.38;
      }
    }

    if (event.kind === "ventricular") {
      if (event.captured && !event.falseSense) {
        veg += qrsComplex(delta, config.patient.rWaveAmplitude * 0.4, event.wideQrs);
        ecg += qrsComplex(delta, 1.45, event.wideQrs);
      }

      if (event.marker === "V-Pace") {
        veg += pacingSpike(delta, 4.5 * (currentImpedance(atTime) / 560));
        ecg += pacingSpike(delta, 1.5);
        if (Math.abs(delta) <= SAMPLE_MS) {
          vPace = 0.95;
        }
      }

      if (event.marker === "V-Sense" && Math.abs(delta) <= SAMPLE_MS) {
        vSense = 0.72;
      }
    }

    if (event.kind === "mode-switch" && Math.abs(delta) <= SAMPLE_MS) {
      modeSwitch = 1.25;
    }
  }

  if (config.scenario === "emi") {
    ecg += noiseSample(atTime, currentNoiseLevel(atTime) * 0.08, 340);
  }

  signalPoints.push({
    time: atTime,
    aeg,
    veg,
    ecg,
    aPace,
    vPace,
    aSense,
    vSense,
    modeSwitch,
  });

  signalPoints = signalPoints.filter((point) => currentTime - point.time <= WINDOW_MS);
}

function updateAlerts() {
  const lowRate = lastMetrics.currentRate < effectiveLowerRate() - 5 && currentTime > 1_800;
  const recentUncapturedVPace = events.some(
    (event) =>
      event.marker === "V-Pace" &&
      !event.captured &&
      currentTime - event.time < 1_200,
  );
  const recentUncapturedAPace = events.some(
    (event) =>
      event.marker === "A-Pace" &&
      !event.captured &&
      currentTime - event.time < 1_200,
  );
  const recentModeSwitch = events.some(
    (event) => event.marker === "Mode Switch" && currentTime - event.time < 1_800,
  );
  const recentFalseVSenseCount = events.filter(
    (event) =>
      event.marker === "V-Sense" &&
      event.falseSense &&
      currentTime - event.time < 900,
  ).length;
  const highImpedance = lastMetrics.impedance > 900;
  const lowBattery = batteryVoltage < 2.4;

  registerAlert(
    "low-rate",
    "caution",
    "Rate below lower limit — verify connection",
    "Lower Rate Limit",
    "Review sensing, lead integrity, and temporary backup pacing if symptomatic.",
    lowRate,
    currentTime,
  );
  registerAlert(
    "loss-capture-v",
    "warning",
    "Loss of capture detected — increase output voltage",
    "Output Voltage",
    "Increase ventricular output, reassess threshold, and inspect lead seating.",
    recentUncapturedVPace,
    currentTime,
  );
  registerAlert(
    "loss-capture-a",
    "warning",
    "Atrial capture instability detected — review threshold reserve",
    "Pulse Width",
    "Increase atrial safety margin or stabilize lead contact before continuing.",
    recentUncapturedAPace,
    currentTime,
  );
  registerAlert(
    "mode-switch",
    "info",
    "Mode switch event: tracking inhibited (PMT protection)",
    "Pacing Mode",
    "Inspect atrial sensing quality and remove the interference source.",
    recentModeSwitch,
    currentTime,
  );
  registerAlert(
    "vf-pattern",
    "critical",
    "Ventricular fibrillation pattern detected — emergency",
    "EMI",
    "Terminate the noise source immediately and switch to emergency rhythm review.",
    config.scenario === "emi" && recentFalseVSenseCount >= 5,
    currentTime,
  );
  registerAlert(
    "impedance-high",
    "caution",
    "Lead impedance elevated — suspect dislodgement or fracture",
    "Impedance",
    "Confirm lead position and repeat impedance checks before discharge.",
    highImpedance,
    currentTime,
  );
  registerAlert(
    "battery-low",
    "caution",
    "Battery reserve narrowing — plan generator follow-up",
    "Battery Voltage",
    "Review pacing burden and schedule replacement planning.",
    lowBattery,
    currentTime,
  );
}

function computeRateFromEvents(eventsInWindow: InternalEvent[]) {
  if (eventsInWindow.length === 0) {
    return 0;
  }

  const first = eventsInWindow[0]?.time ?? 0;
  const last = eventsInWindow[eventsInWindow.length - 1]?.time ?? first;
  const duration = Math.max(1_000, last - first);

  return (eventsInWindow.length * 60_000) / duration;
}

function updateMetrics() {
  const recentWindow = events.filter((event) => currentTime - event.time <= 6_000);
  const recentPacedV = recentWindow.filter((event) => event.marker === "V-Pace");
  const recentSensedV = recentWindow.filter(
    (event) => event.marker === "V-Sense" && !event.falseSense,
  );
  const recentCapturedV = recentWindow.filter(
    (event) => event.kind === "ventricular" && event.captured && !event.falseSense,
  );
  const totalA = pacedAtrialBeats + sensedAtrialBeats;
  const totalV = pacedVentricularBeats + sensedVentricularBeats;
  const ventricularThreshold = captureThreshold("V", currentTime);
  const atrialThreshold = captureThreshold("A", currentTime);

  lastMetrics = {
    pacedRate: computeRateFromEvents(recentPacedV),
    sensedRate: computeRateFromEvents(recentSensedV),
    pacedPercentA: totalA === 0 ? 0 : (pacedAtrialBeats / totalA) * 100,
    pacedPercentV: totalV === 0 ? 0 : (pacedVentricularBeats / totalV) * 100,
    batteryVoltage,
    impedance: currentImpedance(currentTime),
    thresholdMargin: config.device.outputVoltage / Math.max(0.1, ventricularThreshold),
    currentRate: computeRateFromEvents(recentCapturedV),
    atrialOutputThreshold: atrialThreshold,
    ventricularOutputThreshold: ventricularThreshold,
  };
}

function createSnapshot(): SimulationSnapshot {
  return {
    status,
    currentTime,
    points: [...signalPoints],
    currentAlerts: [...currentAlerts],
    alertLog: [...alertLog],
    metrics: { ...lastMetrics },
    lastUpdated: Date.now(),
    mode: config.device.pacingMode,
    scenario: config.scenario,
    lastAtrialContractionTime,
    lastVentricularContractionTime,
    lastAtrialMarker,
    lastVentricularMarker,
    lastAtrialCapture,
    lastVentricularCapture,
    wideQrs: lastWideQrs,
    noiseLevel: currentNoiseLevel(currentTime),
  };
}

function postSnapshot() {
  const message: SimulationWorkerSnapshotMessage = {
    type: "snapshot",
    snapshot: createSnapshot(),
  };

  workerScope.postMessage(message);
}

function resetEngine(nextStatus: SimulationStatus) {
  currentTime = 0;
  signalPoints = [];
  events = [];
  pendingIntrinsicVEvents = [];
  currentAlerts = [];
  alertLog = [];
  activeAlerts = new Map<string, string>();

  eventCounter = 0;
  conductionBeatCounter = 0;

  pacedAtrialBeats = 0;
  pacedVentricularBeats = 0;
  sensedAtrialBeats = 0;
  sensedVentricularBeats = 0;

  lastAtrialContractionTime = null;
  lastVentricularContractionTime = null;
  lastAtrialMarker = null;
  lastVentricularMarker = null;
  lastAtrialCapture = true;
  lastVentricularCapture = true;
  lastWideQrs = false;

  batteryVoltage = config.scenario === "battery-depletion" ? 2.38 : 2.82;

  nextIntrinsicATime = intrinsicAtrialInterval() + jitter();
  nextAtrialPaceDue = atrialEscapeInterval();
  nextTrackedVPaceDue = Number.POSITIVE_INFINITY;
  nextBackupVPaceDue = ventricularEscapeInterval();

  lastNoiseSenseTime = Number.NEGATIVE_INFINITY;
  lastModeSwitchTime = Number.NEGATIVE_INFINITY;

  status = nextStatus;
  lastMetrics = { ...emptySimulationSnapshot.metrics, batteryVoltage };
}

function tickSimulation() {
  if (status !== "running") {
    return;
  }

  const targetTime = currentTime + TICK_MS * config.speed;

  for (let atTime = currentTime + SAMPLE_MS; atTime <= targetTime; atTime += SAMPLE_MS) {
    currentTime = atTime;

    while (nextIntrinsicATime <= currentTime) {
      intrinsicAtrialBeat(nextIntrinsicATime);
      nextIntrinsicATime += intrinsicAtrialInterval() + jitter();
    }

    while (pendingIntrinsicVEvents.length > 0 && pendingIntrinsicVEvents[0].time <= currentTime) {
      const pending = pendingIntrinsicVEvents.shift();
      if (pending) {
        intrinsicVentricularBeat(pending.time, pending.wideQrs);
      }
    }

    if (config.scenario === "emi") {
      const noiseLevel = currentNoiseLevel(currentTime);
      if (noiseLevel > 0.7 && currentTime - lastNoiseSenseTime >= 110) {
        const chamber = Math.floor(currentTime / 110) % 2 === 0 ? "V" : "A";
        onNoiseSense(currentTime, chamber);
        lastNoiseSenseTime = currentTime;
      }
      if (noiseLevel > 0.7 && currentTime - lastModeSwitchTime >= 420) {
        onModeSwitch(currentTime);
        lastModeSwitchTime = currentTime;
      }
    }

    if (shouldPaceAtrium() && currentTime >= nextAtrialPaceDue) {
      paceAtrium(nextAtrialPaceDue);
    }

    const nextVentricularDue = Math.min(nextTrackedVPaceDue, nextBackupVPaceDue);
    if (shouldPaceVentricle() && currentTime >= nextVentricularDue) {
      paceVentricle(nextVentricularDue);
    }

    generateSignalPoint(currentTime);
  }

  updateMetrics();
  updateAlerts();
  postSnapshot();

  if (currentTime >= config.runDurationSec * 1_000) {
    status = "stopped";
    clearTimer();
    postSnapshot();
  }
}

function clearTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

function ensureTimer() {
  clearTimer();
  timer = setInterval(() => {
    tickSimulation();
  }, TICK_MS);
}

function applyConfiguration(nextConfig: SimulationConfig) {
  config = cloneConfig(nextConfig);

  if (status === "idle" || status === "stopped") {
    resetEngine(status);
    postSnapshot();
  }
}

workerScope.onmessage = (event: MessageEvent<SimulationWorkerMessage>) => {
  const message = event.data;

  switch (message.type) {
    case "configure":
      applyConfiguration(message.config);
      break;
    case "start":
      if (status === "paused") {
        status = "running";
      } else {
        resetEngine("running");
      }
      ensureTimer();
      postSnapshot();
      break;
    case "pause":
      status = "paused";
      clearTimer();
      postSnapshot();
      break;
    case "stop":
      clearTimer();
      resetEngine("stopped");
      postSnapshot();
      break;
  }
};

resetEngine("idle");
postSnapshot();
