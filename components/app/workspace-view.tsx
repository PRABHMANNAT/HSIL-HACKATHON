"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { BrainCircuit, FlaskConical, ShieldCheck, Users } from "lucide-react";

import { ArchitectureCanvas } from "@/components/app/architecture-canvas";
import { DeviceTwinPanel } from "@/components/app/device-twin-panel";
import { Button } from "@/components/ui/button";
import { AIStreamOutput } from "@/components/ui/med/ai-stream-output";
import { AlertBanner } from "@/components/ui/med/alert-banner";
import { CollapsibleSection } from "@/components/ui/med/collapsible-section";
import { DataTable, type DataTableColumn } from "@/components/ui/med/data-table";
import { ProgressRing } from "@/components/ui/med/progress-ring";
import { RiskScore } from "@/components/ui/med/risk-score";
import { StatusBadge } from "@/components/ui/med/status-badge";
import { TimelineItem } from "@/components/ui/med/timeline-item";
import { VitalCard } from "@/components/ui/med/vital-card";
import {
  activityFeed,
  aiStreamText,
  alertBanners,
  projectRows,
  readinessRings,
  riskPanels,
  vitalMetrics,
} from "@/lib/mock-data";
import { getPageDefinition } from "@/lib/page-registry";

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

const projectColumns: Array<
  DataTableColumn<(typeof projectRows)[number]>
> = [
  {
    id: "program",
    header: "Program",
    accessor: "program",
    sortable: true,
  },
  {
    id: "owner",
    header: "Owner",
    accessor: "owner",
    sortable: true,
    filterOptions: Array.from(new Set(projectRows.map((row) => row.owner))),
  },
  {
    id: "state",
    header: "State",
    accessor: "state",
    sortable: true,
    filterOptions: Array.from(new Set(projectRows.map((row) => row.state))),
    cell: (row) => <StatusBadge state={row.state} />,
  },
  {
    id: "risk",
    header: "Risk",
    accessor: "risk",
    sortable: true,
  },
  {
    id: "verification",
    header: "Verification",
    accessor: "verification",
  },
  {
    id: "region",
    header: "Region",
    accessor: "region",
    filterOptions: Array.from(new Set(projectRows.map((row) => row.region))),
  },
];

function ActivityColumn() {
  return (
    <div className="space-y-3">
      {activityFeed.map((item) => (
        <TimelineItem key={item.id} {...item} />
      ))}
    </div>
  );
}

function ReadinessCluster() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {readinessRings.map((ring) => (
        <ProgressRing
          key={ring.label}
          percentage={ring.percentage}
          label={ring.label}
          color={ring.color}
        />
      ))}
    </div>
  );
}

function RiskCluster() {
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {riskPanels.map((risk) => (
        <RiskScore
          key={risk.label}
          label={risk.label}
          score={risk.score}
          breakdown={risk.breakdown}
        />
      ))}
    </div>
  );
}

function DashboardLayout() {
  return (
    <div className="space-y-6">
      {alertBanners.map((alert) => (
        <AlertBanner
          key={alert.id}
          type={alert.type}
          title={alert.title}
          description={alert.description}
          actionLabel={alert.actionLabel}
          actionHref={alert.actionHref}
        />
      ))}

      <div className="grid gap-4 xl:grid-cols-4">
        {vitalMetrics.map((metric) => (
          <VitalCard key={metric.label} {...metric} />
        ))}
      </div>

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.9fr)]">
        <ArchitectureCanvas />
        <div className="space-y-4">
          <AIStreamOutput text={aiStreamText} />
          <ReadinessCluster />
          <RiskCluster />
        </div>
      </div>

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.8fr)]">
        <CollapsibleSection
          title="Program Readiness Matrix"
          summary="Current lifecycle, owner, and verification posture across active programs."
          stats={["5 Programs", "84% Verified", "3 Regions"]}
        >
          <DataTable
            ariaLabel="Program readiness table"
            caption="Portfolio view"
            columns={projectColumns}
            data={projectRows}
          />
        </CollapsibleSection>
        <CollapsibleSection
          title="Clinical Activity Feed"
          summary="Recent approvals, mitigation work, and evidence ingestion."
          stats={["Live", "Traceable"]}
        >
          <ActivityColumn />
        </CollapsibleSection>
      </div>

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
        <DeviceTwinPanel />
        <CollapsibleSection
          title="What-if Lab"
          summary="Scenario probes across thermal, alarm, and battery edge cases."
          stats={["3 Active", "2 Critical"]}
        >
          <div className="space-y-3">
            <div className="rounded-[24px] border border-[var(--border)] bg-[var(--card)]/72 p-4">
              <div className="text-sm font-medium text-[var(--text-primary)]">
                ICU alarm storm
              </div>
              <div className="mt-2 text-sm text-[var(--text-secondary)]">
                Worst-case concurrency increases alert latency to 151ms. Recommendation: reserve
                dedicated watchdog cycle and de-prioritize non-critical sync traffic.
              </div>
            </div>
            <div className="rounded-[24px] border border-[var(--border)] bg-[var(--card)]/72 p-4">
              <div className="text-sm font-medium text-[var(--text-primary)]">
                Battery cold-start
              </div>
              <div className="mt-2 text-sm text-[var(--text-secondary)]">
                Capacity floor remains within transport tolerance, but heater boot should move
                earlier in the recovery sequence.
              </div>
            </div>
          </div>
        </CollapsibleSection>
      </div>
    </div>
  );
}

function SectionTemplate({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof BrainCircuit;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-[30px] border border-[var(--border)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--card)_92%,transparent),color-mix(in_srgb,var(--surface)_78%,transparent))] p-6">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-3 py-1 text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">
            <Icon className="size-3.5 text-[var(--primary)]" />
            MedDevice Workspace
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
              {title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
              {description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge state="Validation" />
          <Button className="rounded-full bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)]">
            Review workspace
          </Button>
        </div>
      </div>
      {children}
    </div>
  );
}

function DesignLayout() {
  return (
    <SectionTemplate
      icon={BrainCircuit}
      title="Design Control Surfaces"
      description="Trace requirements into system architecture, manage interfaces, and keep review artifacts visible without dropping engineering density."
    >
      <ArchitectureCanvas />
      <CollapsibleSection
        title="Design Inputs"
        summary="Structured requirements mapped to verification intent."
        stats={["142 Inputs", "11 Pending"]}
      >
        <DataTable
          ariaLabel="Design input table"
          caption="Requirement portfolio"
          columns={projectColumns}
          data={projectRows}
        />
      </CollapsibleSection>
    </SectionTemplate>
  );
}

function SimulationLayout() {
  return (
    <SectionTemplate
      icon={FlaskConical}
      title="Simulation + Digital Twin"
      description="Probe edge conditions with a high-fidelity twin, surface the right controls, and keep scenario reasoning visible to design and quality teams."
    >
      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <DeviceTwinPanel />
        <div className="space-y-4">
          <AIStreamOutput text={aiStreamText} />
          <RiskCluster />
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-4">
        {vitalMetrics.map((metric) => (
          <VitalCard key={metric.label} {...metric} />
        ))}
      </div>
    </SectionTemplate>
  );
}

function ComplianceLayout() {
  return (
    <SectionTemplate
      icon={ShieldCheck}
      title="Compliance Evidence Control"
      description="Maintain traceability, residual risk, and audit packet completeness across every device release window."
    >
      {alertBanners.map((alert) => (
        <AlertBanner
          key={alert.id}
          type={alert.type}
          title={alert.title}
          description={alert.description}
          actionLabel={alert.actionLabel}
          actionHref={alert.actionHref}
        />
      ))}
      <RiskCluster />
      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
        <CollapsibleSection
          title="Evidence Matrix"
          summary="Live view of verification completion and document maturity."
          stats={["FDA Packet", "EU MDR"]}
        >
          <DataTable
            ariaLabel="Compliance evidence table"
            caption="Evidence overview"
            columns={projectColumns}
            data={projectRows}
          />
        </CollapsibleSection>
        <CollapsibleSection
          title="Review Activity"
          summary="Approvals, mitigations, and evidence imports."
          stats={["Signed", "Timed"]}
        >
          <ActivityColumn />
        </CollapsibleSection>
      </div>
    </SectionTemplate>
  );
}

function IntelligenceLayout() {
  return (
    <SectionTemplate
      icon={BrainCircuit}
      title="Intelligence Workbench"
      description="Compare model guidance, stream grounded design reasoning, and keep research retrieval visible for regulated decision-making."
    >
      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)]">
        <AIStreamOutput text={aiStreamText} />
        <CollapsibleSection
          title="Readiness Signals"
          summary="Cross-functional confidence bars for release decisions."
          stats={["Grounded", "Live"]}
        >
          <ReadinessCluster />
        </CollapsibleSection>
      </div>
      <ArchitectureCanvas />
    </SectionTemplate>
  );
}

function TeamLayout() {
  return (
    <SectionTemplate
      icon={Users}
      title="Team Coordination Surface"
      description="Track ownership, changes, and standards alignment without losing the operational feel of an engineering control room."
    >
      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <CollapsibleSection
          title="Ownership Board"
          summary="Programs, owners, and release status."
          stats={["Cross-functional", "Versioned"]}
        >
          <DataTable
            ariaLabel="Team ownership table"
            caption="Program ownership"
            columns={projectColumns}
            data={projectRows}
          />
        </CollapsibleSection>
        <CollapsibleSection
          title="Recent Activity"
          summary="Design, quality, and systems collaboration in one feed."
          stats={["Synced", "Auditable"]}
        >
          <ActivityColumn />
        </CollapsibleSection>
      </div>
    </SectionTemplate>
  );
}

export function WorkspaceView({ slug = "" }: { slug?: string }) {
  const page = getPageDefinition(slug);
  const { isLoading } = useQuery({
    queryKey: ["workspace", page.slug],
    queryFn: async () => {
      await delay(180);
      return true;
    },
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={`skeleton-${index}`}
            className="h-36 animate-pulse rounded-[30px] border border-[var(--border)] bg-[var(--card)]/60"
          />
        ))}
      </div>
    );
  }

  if (page.slug === "dashboard") {
    return <DashboardLayout />;
  }

  if (page.section === "DESIGN") {
    return <DesignLayout />;
  }

  if (page.section === "SIMULATION") {
    return <SimulationLayout />;
  }

  if (page.section === "COMPLIANCE") {
    return <ComplianceLayout />;
  }

  if (page.section === "INTELLIGENCE") {
    return <IntelligenceLayout />;
  }

  return <TeamLayout />;
}
