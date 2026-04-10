import { getPageDefinitionFromPath } from "@/lib/page-registry";

export type CopilotArtifact = {
  id: string;
  title: string;
  type: "project" | "requirements" | "design" | "simulation" | "compliance" | "evidence" | "standard";
  summary: string;
  content: string;
  tokens: number;
};

export type CopilotModelOption = {
  id: "claude-sonnet-4-20250514" | "claude-opus-4-20250514";
  label: string;
  detail: string;
};

export const copilotModelOptions: CopilotModelOption[] = [
  {
    id: "claude-sonnet-4-20250514",
    label: "Claude Sonnet 4",
    detail: "Default for day-to-day design, regulatory, and systems guidance.",
  },
  {
    id: "claude-opus-4-20250514",
    label: "Claude Opus 4",
    detail: "Use for deeper failure analysis, standards comparison, and strategy work.",
  },
];

export const copilotArtifacts: CopilotArtifact[] = [
  {
    id: "current-project",
    title: "Current Project details",
    type: "project",
    summary: "Dual-chamber pacemaker release candidate with titanium can, BLE service mode, and MedRadio telemetry.",
    tokens: 2400,
    content:
      "Project HSIL-PM-24 is a dual-chamber pacemaker platform intended for bradyarrhythmia management. The current baseline includes DDD/VVI pacing, adaptive capture management, BLE service mode isolation, MedRadio telemetry, lead integrity trending, and a hermetic titanium housing. Key open workstreams include EMC margin expansion, labeling package completion, and evidence pack automation for 510(k), CE technical file, and CDSCO submission variants.",
  },
  {
    id: "requirements-baseline",
    title: "Active requirements baseline",
    type: "requirements",
    summary: "Safety-critical requirements covering lower rate support, lead impedance alerts, capture margin, and audit logging.",
    tokens: 1900,
    content:
      "Active baseline requirements include: maintain ventricular support pacing above the programmed lower rate limit in complete AV block, detect lead impedance excursions within one interrogation cycle, preserve a 2.5x ventricular capture safety margin for dependency profiles, maintain EMC immunity in handheld RF and MedRadio environments, log all programmer changes with operator attribution, and isolate service connectivity from therapy timing. Requirement types span functional, non-functional, and regulatory controls.",
  },
  {
    id: "design-version",
    title: "Active design version",
    type: "design",
    summary: "Design v3.4 includes timing scheduler, adaptive capture manager, EMC feedthrough filter stack, and telemetry isolation gateway.",
    tokens: 2100,
    content:
      "Design v3.4 consists of a timing engine scheduler, adaptive capture manager, lead integrity monitor, EMC feedthrough filter stack, programmer audit ledger, service mode isolation gateway, and submission artifact composer. Internal pacemaker components include the battery module, main PCB, STM32 MCU, HVPS block, output capacitor, BLE module, 402MHz RF telemetry module, accelerometer, reed switch, feedthrough pins, and IS-1 lead connector header. Known engineering concerns center on EMI robustness, packaging validation, and evidence automation completeness.",
  },
  {
    id: "simulation-results",
    title: "Current simulation results",
    type: "simulation",
    summary: "Waveform and 3D heart views show stable DDD pacing at 60 BPM lower rate with intermittent EMI sensitivity warnings.",
    tokens: 2000,
    content:
      "Digital twin results show stable atrial and ventricular pacing in DDD mode with a lower rate limit of 60 BPM, upper rate limit of 130 BPM, and AV delay of 150 ms. Capture margin remains acceptable in nominal conditions, but EMI challenge scenarios generate transient pacing inhibition risk and telemetry quality degradation. Lead impedance remains within expected bands, battery depletion trend is nominal, and high-activity scenarios show acceptable rate response behavior.",
  },
  {
    id: "risk-register",
    title: "Current risk register",
    type: "compliance",
    summary: "FMEA highlights lead dislodgement, battery depletion, EMI inhibition, inappropriate high-rate pacing, loss of capture, and seal breach.",
    tokens: 1400,
    content:
      "Top hazards in the active risk register are atrial lead dislodgement, earlier-than-predicted battery depletion, EMI-driven pacing inhibition, rapid ventricular tracking from inappropriate atrial sensing, loss of ventricular capture after threshold rise, and hermetic seal breach with moisture ingress. Existing mitigations include capture management, telemetry trend monitoring, EMC shielding, implant checklist controls, programmer limits, and helium leak validation.",
  },
  {
    id: "evidence-status",
    title: "Evidence pack status",
    type: "evidence",
    summary: "510(k), CE, and CDSCO evidence views show strong software and risk coverage but open labeling, sterilization, and agent-appointment gaps.",
    tokens: 1100,
    content:
      "Evidence tracking indicates the device description, risk management file, software verification summary, GSPR mapping, and cybersecurity package are largely in place. Open gaps remain in sterilization and packaging validation, UDI and labeling package assembly, and India authorized agent appointment documentation. Completeness is currently weighted into the low seventies depending on submission path.",
  },
  {
    id: "standards-map",
    title: "Standards and clause map",
    type: "standard",
    summary: "Clause references focus on IEC 60601-1, ISO 14971, IEC 62304, and submission expectations for implantable cardiac devices.",
    tokens: 900,
    content:
      "The active standards map emphasizes IEC 60601-1 electrical safety and essential performance expectations, ISO 14971 risk management traceability, IEC 62304 software lifecycle evidence, and submission-oriented trace links for FDA 510(k), EU technical documentation, and CDSCO readiness. When relevant, responses should connect design observations to clause-level reasoning and explicit patient-safety implications.",
  },
];

export const defaultCopilotContextIds = [
  "current-project",
  "requirements-baseline",
  "design-version",
  "simulation-results",
];

export function getCopilotArtifacts(ids: string[]) {
  return ids
    .map((id) => copilotArtifacts.find((artifact) => artifact.id === id))
    .filter((artifact): artifact is CopilotArtifact => Boolean(artifact));
}

export function getCopilotTokenEstimate(ids: string[]) {
  return getCopilotArtifacts(ids).reduce((sum, artifact) => sum + artifact.tokens, 0);
}

export function getCopilotQuickPrompts(pathname: string) {
  const page = getPageDefinitionFromPath(pathname);

  switch (page.slug) {
    case "requirements":
      return [
        "Find missing verification intent in the current requirements baseline.",
        "Generate test cases for the most safety-critical requirement on this page.",
        "Compare these requirements against IEC 60601-1 essential performance expectations.",
      ];
    case "design":
    case "3d-design":
      return [
        "Generate FMEA for the current pacemaker design layout.",
        "Explain the risk associated with single-supply voltage design.",
        "Recommend component swaps to improve EMC margin without increasing device volume.",
      ];
    case "simulation":
      return [
        "Explain what the latest simulation says about loss of capture risk.",
        "Summarize the pacemaker-heart interaction under AV block conditions.",
        "Recommend parameter changes to reduce EMI-related pacing inhibition.",
      ];
    case "compliance":
    case "traceability":
    case "evidence":
      return [
        "Find gaps in my requirements against IEC 60601-1.",
        "Draft a biocompatibility rationale for titanium housing.",
        "Summarize the strongest remaining submission gaps across this project.",
      ];
    default:
      return [
        "Generate FMEA for current design",
        "Find gaps in my requirements against IEC 60601-1",
        "Draft a biocompatibility rationale for titanium housing",
      ];
  }
}
