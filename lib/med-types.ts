export type ProjectLifecycleState =
  | "Draft"
  | "Requirements"
  | "Design"
  | "Validation"
  | "Freeze"
  | "Submission-Ready"
  | "Archived";

export type AlertSeverity = "warning" | "error" | "info" | "success";

export type RiskBreakdown = {
  low: number;
  medium: number;
  high: number;
};

