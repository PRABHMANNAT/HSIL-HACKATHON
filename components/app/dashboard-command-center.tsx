"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  BadgePlus,
  CheckCircle2,
  ChevronRight,
  Droplets,
  EllipsisVertical,
  FileUp,
  FlaskConical,
  HeartPulse,
  Pill,
  Scissors,
  ShieldCheck,
  Wind,
} from "lucide-react";
import {
  Cell,
  Pie,
  PieChart,
  Tooltip as RechartsTooltip,
} from "recharts";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/med/empty-state";
import { RiskScore } from "@/components/ui/med/risk-score";
import { StatusBadge } from "@/components/ui/med/status-badge";
import { VitalCard } from "@/components/ui/med/vital-card";
import {
  dashboardActivities,
  dashboardQuickActions,
  dashboardSimulationBreakdown,
  dashboardVitalMetrics,
  portfolioProjects,
  regionFlagMap,
  smartAlerts,
  weeklySimulationSummary,
  type DeviceType,
} from "@/lib/dashboard-data";
import { cn } from "@/lib/utils";

const severityOrder = ["critical", "warning", "info"] as const;

const severityConfig = {
  critical: {
    icon: AlertCircle,
    border: "border-l-[var(--danger)]",
    text: "text-[var(--danger)]",
    label: "Critical",
  },
  warning: {
    icon: AlertTriangle,
    border: "border-l-[var(--warning)]",
    text: "text-[var(--warning)]",
    label: "Warning",
  },
  info: {
    icon: CheckCircle2,
    border: "border-l-[var(--primary)]",
    text: "text-[var(--primary)]",
    label: "Info",
  },
};

const deviceTypeIcons: Record<DeviceType, typeof HeartPulse> = {
  Pacemaker: HeartPulse,
  Ventilator: Wind,
  "Infusion Pump": Droplets,
  "ECG Monitor": Activity,
  "Insulin Pump": Pill,
  "Surgical Tool": Scissors,
};

const quickActionIcons = {
  "new-project": BadgePlus,
  "import-requirements": FileUp,
  "run-simulation": FlaskConical,
  "export-evidence": ShieldCheck,
};

function CoverageBar({ value }: { value: number }) {
  return (
    <div className="w-[150px] space-y-1.5">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-[var(--text-secondary)]">
        <span>Coverage</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/8">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="h-full rounded-full bg-[linear-gradient(90deg,var(--primary),var(--accent))]"
        />
      </div>
    </div>
  );
}

function SimulationFooter() {
  const total =
    dashboardSimulationBreakdown.pass +
    dashboardSimulationBreakdown.fail +
    dashboardSimulationBreakdown.pending;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-[var(--text-secondary)]">
        <span>Pass / Fail / Pending</span>
        <span>{total} runs</span>
      </div>
      <div className="flex h-2 overflow-hidden rounded-full bg-white/6">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(dashboardSimulationBreakdown.pass / total) * 100}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="bg-[var(--accent)]"
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(dashboardSimulationBreakdown.fail / total) * 100}%` }}
          transition={{ duration: 0.85, ease: "easeOut" }}
          className="bg-[var(--danger)]"
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(dashboardSimulationBreakdown.pending / total) * 100}%` }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="bg-[var(--warning)]"
        />
      </div>
      <div className="flex items-center gap-3 text-[11px] text-[var(--text-secondary)]">
        <span className="inline-flex items-center gap-1">
          <span className="size-2 rounded-full bg-[var(--accent)]" />
          Pass {dashboardSimulationBreakdown.pass}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="size-2 rounded-full bg-[var(--danger)]" />
          Fail {dashboardSimulationBreakdown.fail}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="size-2 rounded-full bg-[var(--warning)]" />
          Pending {dashboardSimulationBreakdown.pending}
        </span>
      </div>
    </div>
  );
}

function DashboardHeader() {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 rounded-[30px] border border-[var(--border)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--card)_94%,transparent),color-mix(in_srgb,var(--surface)_80%,transparent))] px-6 py-5">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-3 py-1 text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">
          Command Center
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
            MedDevice Suite Pro
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--text-secondary)]">
            Live portfolio telemetry across pacemaker, ventilator, infusion, and monitoring
            programs. Track readiness, react to alerts, and launch new work from a single
            regulated control surface.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-full border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--card)_82%,transparent)] px-4 py-2.5 text-sm">
        <motion.span
          animate={{ opacity: [0.45, 1, 0.45], scale: [1, 1.2, 1] }}
          transition={{ duration: 1.8, repeat: Number.POSITIVE_INFINITY }}
          className="size-2.5 rounded-full bg-[var(--accent)]"
        />
        <span className="text-[var(--text-primary)]">Last synced 2 min ago</span>
      </div>
    </div>
  );
}

function ProjectPortfolioTable() {
  const router = useRouter();

  if (!portfolioProjects.length) {
    return (
      <EmptyState
        title="No projects in the portfolio yet"
        description="Create a project or import an existing device program to populate the command center."
        action={
          <Button asChild className="rounded-full bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)]">
            <Link href="/projects">Create project</Link>
          </Button>
        }
      />
    );
  }

  return (
    <section className="overflow-hidden rounded-[30px] border border-[var(--border)] bg-[var(--card)]/76">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
        <div>
          <h2 className="text-lg font-medium text-[var(--text-primary)]">Project Portfolio</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Regional readiness, coverage, and risk across active programs.
          </p>
        </div>
        <Button asChild variant="secondary" className="rounded-full">
          <Link href="/projects">Open projects</Link>
        </Button>
      </div>
      <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-10 bg-[color:color-mix(in_srgb,var(--surface)_88%,transparent)] backdrop-blur-xl">
            <tr className="text-left text-[11px] uppercase tracking-[0.18em] text-[var(--text-secondary)]">
              <th className="px-5 py-3 font-medium">Project</th>
              <th className="px-5 py-3 font-medium">Device Class</th>
              <th className="px-5 py-3 font-medium">Regions</th>
              <th className="px-5 py-3 font-medium">Phase</th>
              <th className="px-5 py-3 font-medium">Coverage</th>
              <th className="px-5 py-3 font-medium">Risk</th>
              <th className="px-5 py-3 font-medium">Last Modified</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {portfolioProjects.map((project) => {
              const Icon = deviceTypeIcons[project.deviceType];
              return (
                <tr
                  key={project.id}
                  className="group border-t border-[var(--border)] transition-colors hover:bg-[color:color-mix(in_srgb,var(--primary)_4%,transparent)]"
                >
                  <td className="px-5 py-4 align-top">
                    <div className="flex items-start gap-3">
                      <div className="flex size-10 items-center justify-center rounded-2xl bg-[color:color-mix(in_srgb,var(--primary)_16%,transparent)] text-[var(--primary)]">
                        <Icon className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-[var(--text-primary)]">{project.name}</div>
                        <div className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                          {project.deviceType}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 align-top">
                    <span className="inline-flex rounded-full border border-[var(--border)] px-3 py-1 text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                      {project.deviceClass}
                    </span>
                  </td>
                  <td className="px-5 py-4 align-top">
                    <div className="flex items-center gap-2 text-xl">
                      {project.regions.map((region) => (
                        <span key={`${project.id}-${region}`} aria-label={region}>
                          {regionFlagMap[region]}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4 align-top">
                    <StatusBadge state={project.phase} />
                  </td>
                  <td className="px-5 py-4 align-top">
                    <CoverageBar value={project.coverage} />
                  </td>
                  <td className="px-5 py-4 align-top">
                    <RiskScore
                      compact
                      label="Risk"
                      score={project.riskScore}
                      className="shadow-none"
                    />
                  </td>
                  <td className="px-5 py-4 align-top">
                    <div className="space-y-1">
                      <div className="text-[var(--text-primary)]">{project.lastModified}</div>
                      <div className="text-xs text-[var(--text-secondary)]">{project.modifiedBy}</div>
                    </div>
                  </td>
                  <td className="px-5 py-4 align-top">
                    <div className="relative flex items-center justify-end">
                      <div className="pointer-events-none absolute right-10 flex translate-x-4 items-center gap-2 opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:translate-x-0 group-hover:opacity-100">
                        <Button
                          type="button"
                          size="sm"
                          className="rounded-full bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)]"
                          onClick={() => router.push(`/projects/${project.slug}`)}
                        >
                          Open
                        </Button>
                        <Button type="button" size="sm" variant="secondary" className="rounded-full">
                          Clone
                        </Button>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button type="button" variant="ghost" size="icon-sm" className="rounded-full">
                            <EllipsisVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/projects/${project.slug}`)}>
                            Open project
                          </DropdownMenuItem>
                          <DropdownMenuItem>Export snapshot</DropdownMenuItem>
                          <DropdownMenuItem>Assign reviewer</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SmartAlertsFeed() {
  const grouped = severityOrder.map((severity) => ({
    severity,
    items: smartAlerts.filter((alert) => alert.severity === severity),
  }));

  if (!smartAlerts.length) {
    return (
      <EmptyState
        title="No smart alerts right now"
        description="Critical, warning, and info alerts will appear here as the command center ingests new evidence and simulation results."
      />
    );
  }

  return (
    <section className="overflow-hidden rounded-[30px] border border-[var(--border)] bg-[var(--card)]/76">
      <div className="border-b border-[var(--border)] px-5 py-4">
        <h2 className="text-lg font-medium text-[var(--text-primary)]">Smart Alerts Feed</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Severity-ranked issues and system notices for the current release window.
        </p>
      </div>
      <div className="max-h-[500px] space-y-5 overflow-y-auto px-5 py-5">
        {grouped.map((group) => {
          if (!group.items.length) {
            return null;
          }

          const config = severityConfig[group.severity];
          const Icon = config.icon;

          return (
            <div key={group.severity} className="space-y-3">
              <div className={cn("text-xs uppercase tracking-[0.2em]", config.text)}>
                {config.label}
              </div>
              {group.items.map((alert) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22 }}
                  className={cn(
                    "rounded-[24px] border border-[var(--border)] border-l-4 bg-[color:color-mix(in_srgb,var(--card)_82%,transparent)] px-4 py-4",
                    config.border,
                  )}
                >
                  <div className="flex items-start gap-3">
                    <motion.div
                      animate={
                        group.severity === "critical"
                          ? { opacity: [0.7, 1, 0.7], scale: [1, 1.08, 1] }
                          : {}
                      }
                      transition={
                        group.severity === "critical"
                          ? { duration: 1.6, repeat: Number.POSITIVE_INFINITY }
                          : {}
                      }
                      className={cn(
                        "mt-0.5 flex size-9 items-center justify-center rounded-2xl bg-black/10",
                        config.text,
                      )}
                    >
                      <Icon className="size-4.5" />
                    </motion.div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-[var(--text-primary)]">{alert.title}</div>
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <span className="text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                          {alert.age}
                        </span>
                        <Button asChild size="sm" variant="secondary" className="rounded-full">
                          <Link href={alert.actionHref}>
                            View
                            <ChevronRight className="ml-1 size-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function RecentActivityTimeline() {
  if (!dashboardActivities.length) {
    return (
      <EmptyState
        title="No recent activity"
        description="Approvals, exports, and design-control changes will collect here."
      />
    );
  }

  return (
    <section className="rounded-[30px] border border-[var(--border)] bg-[var(--card)]/76 p-5">
      <h2 className="text-lg font-medium text-[var(--text-primary)]">Recent Activity Timeline</h2>
      <div className="mt-5 space-y-5">
        {dashboardActivities.map((activity, index) => (
          <div key={activity.id} className="relative pl-8">
            {index < dashboardActivities.length - 1 ? (
              <div className="absolute left-[15px] top-10 h-[calc(100%+12px)] w-px bg-[var(--border)]" />
            ) : null}
            <div className="absolute left-0 top-1 flex size-8 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--primary)_16%,transparent)] text-xs font-semibold text-[var(--primary)]">
              {activity.avatar}
            </div>
            <div className="rounded-[24px] border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_76%,transparent)] px-4 py-3">
              <div className="text-sm leading-6 text-[var(--text-primary)]">
                <span className="font-medium">{activity.actor}</span> {activity.action}{" "}
                <Link href={activity.projectHref} className="text-[var(--primary)] hover:underline">
                  {activity.projectName}
                </Link>
              </div>
              <div className="mt-2 text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                {activity.timestamp}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function WeeklySimulationCard() {
  return (
    <section className="rounded-[30px] border border-[var(--border)] bg-[var(--card)]/76 p-5">
      <h2 className="text-lg font-medium text-[var(--text-primary)]">Weekly Simulation Summary</h2>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">
        Outcome mix for the last seven days of scenario runs.
      </p>
      <div className="mt-4 flex justify-center">
        <PieChart width={280} height={220}>
          <Pie
            data={weeklySimulationSummary}
            dataKey="value"
            nameKey="name"
            innerRadius={54}
            outerRadius={84}
            paddingAngle={3}
            stroke="transparent"
            cx="50%"
            cy="50%"
          >
            {weeklySimulationSummary.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <RechartsTooltip
            formatter={(value, name) => [`${Number(value ?? 0)}%`, String(name)]}
            contentStyle={{
              borderRadius: 18,
              border: "1px solid var(--border)",
              background: "var(--card)",
              color: "var(--text-primary)",
            }}
          />
        </PieChart>
      </div>
      <div className="grid gap-3">
        {weeklySimulationSummary.map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between rounded-[20px] border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_76%,transparent)] px-4 py-3"
          >
            <div className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
              <span className="size-2.5 rounded-full" style={{ background: item.color }} />
              {item.name}
            </div>
            <div className="text-sm text-[var(--text-secondary)]">
              {item.count} runs / {item.value}%
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function QuickActionsCard() {
  const router = useRouter();

  if (!dashboardQuickActions.length) {
    return (
      <EmptyState
        title="No quick actions configured"
        description="Shortcuts for project creation, import, simulation, and export will appear here."
      />
    );
  }

  return (
    <section className="rounded-[30px] border border-[var(--border)] bg-[var(--card)]/76 p-5">
      <h2 className="text-lg font-medium text-[var(--text-primary)]">Quick Actions</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        {dashboardQuickActions.map((action, index) => {
          const Icon = quickActionIcons[action.id as keyof typeof quickActionIcons];
          return (
            <motion.button
              key={action.id}
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: index * 0.05 }}
              whileHover={{ y: -2 }}
              className="flex items-start gap-3 rounded-[24px] border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_76%,transparent)] px-4 py-4 text-left transition hover:border-[var(--primary)]"
              onClick={() =>
                router.push(
                  action.id === "new-project"
                    ? "/projects"
                    : action.id === "run-simulation"
                      ? "/what-if-lab"
                      : action.id === "export-evidence"
                        ? "/evidence"
                        : "/requirements",
                )
              }
            >
              <div className="flex size-11 items-center justify-center rounded-2xl bg-[color:color-mix(in_srgb,var(--primary)_16%,transparent)] text-[var(--primary)]">
                <Icon className="size-5" />
              </div>
              <div>
                <div className="font-medium text-[var(--text-primary)]">{action.label}</div>
                <div className="mt-1 text-sm text-[var(--text-secondary)]">{action.description}</div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}

export function DashboardCommandCenter() {
  return (
    <div className="space-y-6">
      <DashboardHeader />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {dashboardVitalMetrics.map((metric, index) => (
          <VitalCard
            key={metric.id}
            label={metric.label}
            value={metric.value}
            unit={metric.unit}
            trend={metric.trend}
            color={metric.color}
            sparklineData={metric.sparklineData}
            animationDelay={index * 0.05}
            footer={metric.id === "simulations" ? <SimulationFooter /> : undefined}
          />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)]">
        <ProjectPortfolioTable />
        <SmartAlertsFeed />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.95fr)_minmax(260px,0.72fr)]">
        <RecentActivityTimeline />
        <WeeklySimulationCard />
        <QuickActionsCard />
      </div>
    </div>
  );
}
