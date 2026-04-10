export type PacingMode = "DDD" | "VVI" | "AAI" | "VOO" | "AOO" | "DDI" | "VDD";

export type ConductionStatus =
  | "Normal"
  | "Complete AV Block"
  | "2nd Degree Type I"
  | "2nd Degree Type II"
  | "Bundle Branch Block";

export type ScenarioKey =
  | "complete-av-block"
  | "sick-sinus"
  | "dependency-test"
  | "high-activity"
  | "battery-depletion"
  | "lead-dislodgement"
  | "emi";

export type SimulationStatus = "idle" | "running" | "paused" | "stopped";

export type AlertSeverity = "info" | "caution" | "warning" | "critical";

export type DeviceMarkerType =
  | "A-Pace"
  | "V-Pace"
  | "A-Sense"
  | "V-Sense"
  | "Mode Switch";

export interface DeviceParameters {
  lowerRateLimit: number;
  upperRateLimit: number;
  avDelay: number;
  outputVoltage: number;
  pulseWidth: number;
  sensitivityAtrial: number;
  sensitivityVentricular: number;
  pacingMode: PacingMode;
  rateResponse: boolean;
}

export interface PatientParameters {
  intrinsicHeartRate: number;
  pWaveAmplitude: number;
  rWaveAmplitude: number;
  conductionStatus: ConductionStatus;
  activityLevel: number;
}

export interface ScenarioPreset {
  label: string;
  summary: string;
  device?: Partial<DeviceParameters>;
  patient?: Partial<PatientParameters>;
  runDurationSec?: number;
}

export interface SimulationConfig {
  device: DeviceParameters;
  patient: PatientParameters;
  speed: number;
  runDurationSec: number;
  scenario: ScenarioKey;
}

export interface SignalPoint {
  time: number;
  aeg: number;
  veg: number;
  ecg: number;
  aPace: number;
  vPace: number;
  aSense: number | null;
  vSense: number | null;
  modeSwitch: number;
}

export interface SimulationAlert {
  id: string;
  severity: AlertSeverity;
  message: string;
  timestamp: number;
  parameter: string;
  action: string;
}

export interface SimulationMetrics {
  pacedRate: number;
  sensedRate: number;
  pacedPercentA: number;
  pacedPercentV: number;
  batteryVoltage: number;
  impedance: number;
  thresholdMargin: number;
  currentRate: number;
  atrialOutputThreshold: number;
  ventricularOutputThreshold: number;
}

export interface SimulationSnapshot {
  status: SimulationStatus;
  currentTime: number;
  points: SignalPoint[];
  currentAlerts: SimulationAlert[];
  alertLog: SimulationAlert[];
  metrics: SimulationMetrics;
  lastUpdated: number;
  mode: PacingMode;
  scenario: ScenarioKey;
  lastAtrialContractionTime: number | null;
  lastVentricularContractionTime: number | null;
  lastAtrialMarker: DeviceMarkerType | null;
  lastVentricularMarker: DeviceMarkerType | null;
  lastAtrialCapture: boolean;
  lastVentricularCapture: boolean;
  wideQrs: boolean;
  noiseLevel: number;
}

export type SimulationWorkerMessage =
  | {
      type: "configure";
      config: SimulationConfig;
    }
  | {
      type: "start";
    }
  | {
      type: "pause";
    }
  | {
      type: "stop";
    };

export interface SimulationWorkerSnapshotMessage {
  type: "snapshot";
  snapshot: SimulationSnapshot;
}

export const defaultDeviceParameters: DeviceParameters = {
  lowerRateLimit: 60,
  upperRateLimit: 130,
  avDelay: 150,
  outputVoltage: 2.5,
  pulseWidth: 0.4,
  sensitivityAtrial: 0.5,
  sensitivityVentricular: 2.0,
  pacingMode: "DDD",
  rateResponse: false,
};

export const defaultPatientParameters: PatientParameters = {
  intrinsicHeartRate: 45,
  pWaveAmplitude: 1.2,
  rWaveAmplitude: 9,
  conductionStatus: "Complete AV Block",
  activityLevel: 20,
};

export const defaultScenario: ScenarioKey = "complete-av-block";

export const scenarioPresets: Record<ScenarioKey, ScenarioPreset> = {
  "complete-av-block": {
    label: "Complete AV Block",
    summary: "Atrial activity persists while ventricular conduction is absent. Classic pacing indication.",
    patient: {
      intrinsicHeartRate: 45,
      conductionStatus: "Complete AV Block",
      pWaveAmplitude: 1.1,
      rWaveAmplitude: 8.7,
      activityLevel: 18,
    },
  },
  "sick-sinus": {
    label: "Sick Sinus Syndrome",
    summary: "Atrial initiation is slow and intermittent, favoring atrial support with ventricular backup.",
    device: {
      pacingMode: "DDD",
      lowerRateLimit: 65,
    },
    patient: {
      intrinsicHeartRate: 32,
      conductionStatus: "Normal",
      pWaveAmplitude: 0.8,
      rWaveAmplitude: 10.2,
      activityLevel: 16,
    },
  },
  "dependency-test": {
    label: "Pacemaker Dependency Test",
    summary: "Intrinsic escape is absent. Every organized contraction depends on device output.",
    device: {
      lowerRateLimit: 70,
      outputVoltage: 3.0,
    },
    patient: {
      intrinsicHeartRate: 0,
      conductionStatus: "Complete AV Block",
      pWaveAmplitude: 0,
      rWaveAmplitude: 0,
      activityLevel: 10,
    },
    runDurationSec: 20,
  },
  "high-activity": {
    label: "High Activity",
    summary: "Rate response drives the lower rate upward to match exertion and maintain perfusion.",
    device: {
      rateResponse: true,
      lowerRateLimit: 70,
      upperRateLimit: 150,
    },
    patient: {
      intrinsicHeartRate: 55,
      conductionStatus: "Normal",
      activityLevel: 86,
    },
  },
  "battery-depletion": {
    label: "Battery Depletion Simulation",
    summary: "Output reserve narrows as battery voltage decays and capture threshold margin erodes.",
    device: {
      outputVoltage: 2.1,
      lowerRateLimit: 60,
    },
    patient: {
      intrinsicHeartRate: 40,
      conductionStatus: "Complete AV Block",
      activityLevel: 12,
    },
    runDurationSec: 45,
  },
  "lead-dislodgement": {
    label: "Lead Dislodgement",
    summary: "Sensing weakens, impedance rises, and capture margin becomes unstable.",
    device: {
      outputVoltage: 2.4,
      sensitivityAtrial: 1.2,
      sensitivityVentricular: 3.4,
    },
    patient: {
      intrinsicHeartRate: 42,
      conductionStatus: "Complete AV Block",
      pWaveAmplitude: 0.35,
      rWaveAmplitude: 2.9,
      activityLevel: 14,
    },
    runDurationSec: 25,
  },
  emi: {
    label: "Electromagnetic Interference",
    summary: "Noise bursts create oversensing, mode switches, and potentially dangerous inhibition.",
    device: {
      pacingMode: "DDD",
      lowerRateLimit: 60,
      outputVoltage: 2.7,
    },
    patient: {
      intrinsicHeartRate: 48,
      conductionStatus: "Normal",
      activityLevel: 30,
    },
    runDurationSec: 18,
  },
};

export const defaultSimulationConfig: SimulationConfig = {
  device: defaultDeviceParameters,
  patient: defaultPatientParameters,
  speed: 1,
  runDurationSec: 30,
  scenario: defaultScenario,
};

export const emptySimulationSnapshot: SimulationSnapshot = {
  status: "idle",
  currentTime: 0,
  points: [],
  currentAlerts: [],
  alertLog: [],
  metrics: {
    pacedRate: 0,
    sensedRate: 0,
    pacedPercentA: 0,
    pacedPercentV: 0,
    batteryVoltage: 2.8,
    impedance: 560,
    thresholdMargin: 2.1,
    currentRate: 0,
    atrialOutputThreshold: 1,
    ventricularOutputThreshold: 1.2,
  },
  lastUpdated: Date.now(),
  mode: defaultDeviceParameters.pacingMode,
  scenario: defaultScenario,
  lastAtrialContractionTime: null,
  lastVentricularContractionTime: null,
  lastAtrialMarker: null,
  lastVentricularMarker: null,
  lastAtrialCapture: true,
  lastVentricularCapture: true,
  wideQrs: false,
  noiseLevel: 0,
};
