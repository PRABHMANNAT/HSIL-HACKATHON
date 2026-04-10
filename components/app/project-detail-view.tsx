"use client";

import Link from "next/link";
import { ArrowLeft, ClipboardList, FileCheck2, FlaskConical, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/ui/med/progress-ring";
import { RiskScore } from "@/components/ui/med/risk-score";
import { StatusBadge } from "@/components/ui/med/status-badge";
import { projectRecords } from "@/lib/projects-data";

function titleFromSlug(slug: string) {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function ProjectDetailView({ projectId }: { projectId: string }) {
  const project = projectRecords.find((item) => item.slug === projectId);
  const name = project?.name ?? titleFromSlug(projectId);
  const phase = project?.phase ?? "Requirements";
  const risk = project?.riskScore ?? 4;
  const coverage = project?.coverage ?? 32;

  return (
    <div className="space-y-6">
      <div className="rounded-[30px] border border-[var(--border)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--card)_94%,transparent),color-mix(in_srgb,var(--surface)_82%,transparent))] p-6">
        <Button asChild variant="secondary" className="rounded-full">
          <Link href="/projects">
            <ArrowLeft className="mr-2 size-4" />
            Back to Projects
          </Link>
        </Button>
        <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">
              Project Workspace
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
              {name}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--text-secondary)]">
              Starter project surface for requirements, design controls, simulations, and evidence.
              The creation wizard routes here after scaffold generation.
            </p>
          </div>
          <StatusBadge state={phase} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <ProgressRing percentage={coverage} label="Coverage" color="var(--primary)" />
        <ProgressRing percentage={61} label="Design" color="var(--accent)" />
        <ProgressRing percentage={38} label="Simulation" color="var(--warning)" />
        <RiskScore label="Program Risk" score={risk} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-[28px] border border-[var(--border)] bg-[var(--card)]/78 p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
            <ClipboardList className="size-4 text-[var(--primary)]" />
            Requirements
          </div>
          <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
            AI-seeded starter requirements, risk-linked controls, and trace placeholders can be
            expanded from the Requirements workspace.
          </p>
        </div>
        <div className="rounded-[28px] border border-[var(--border)] bg-[var(--card)]/78 p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
            <FlaskConical className="size-4 text-[var(--warning)]" />
            Simulation
          </div>
          <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
            Launch thermal, alarm, and battery what-if scenarios once the architecture baseline is
            ready.
          </p>
        </div>
        <div className="rounded-[28px] border border-[var(--border)] bg-[var(--card)]/78 p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
            <FileCheck2 className="size-4 text-[var(--accent)]" />
            Evidence
          </div>
          <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
            Audit packets, signed approvals, and submission exports will aggregate in the Evidence
            workspace as the program matures.
          </p>
        </div>
      </div>

      <div className="rounded-[28px] border border-[var(--border)] bg-[var(--card)]/78 p-5">
        <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
          <ShieldAlert className="size-4 text-[var(--danger)]" />
          Next Recommended Actions
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Button asChild variant="secondary" className="justify-start rounded-2xl">
            <Link href="/requirements">Review seeded requirements</Link>
          </Button>
          <Button asChild variant="secondary" className="justify-start rounded-2xl">
            <Link href="/architecture">Open architecture workspace</Link>
          </Button>
          <Button asChild variant="secondary" className="justify-start rounded-2xl">
            <Link href="/risk">Start initial risk review</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

