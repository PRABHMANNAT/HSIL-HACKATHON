"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ArrowUpDown,
  CalendarRange,
  Copy,
  Droplets,
  EllipsisVertical,
  Filter,
  HeartPulse,
  LayoutGrid,
  List,
  Pill,
  Plus,
  Scissors,
  Search,
  ShieldCheck,
  TableProperties,
  Wind,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/med/empty-state";
import { RiskScore } from "@/components/ui/med/risk-score";
import { StatusBadge } from "@/components/ui/med/status-badge";
import { ProjectCreationModal } from "@/components/app/project-creation-modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { regionFlagMap } from "@/lib/dashboard-data";
import {
  projectPhaseOptions,
  projectRecords,
  projectTemplates,
  regionOptions,
  type ProjectRecord,
} from "@/lib/projects-data";
import { cn } from "@/lib/utils";

type ViewMode = "grid" | "list" | "table";
type TabMode = "projects" | "templates";
type SortMode = "updated" | "name" | "risk" | "coverage";

const deviceIcons = {
  Pacemaker: HeartPulse,
  Ventilator: Wind,
  "Infusion Pump": Droplets,
  "ECG Monitor": Activity,
  "Insulin Pump": Pill,
  "Surgical Tool": Scissors,
  Custom: Plus,
};

const deviceTone = {
  Pacemaker: "text-[var(--primary)] bg-[color:color-mix(in_srgb,var(--primary)_16%,transparent)]",
  Ventilator: "text-cyan-300 bg-cyan-500/12",
  "Infusion Pump": "text-[var(--warning)] bg-[color:color-mix(in_srgb,var(--warning)_16%,transparent)]",
  "ECG Monitor": "text-emerald-300 bg-emerald-500/12",
  "Insulin Pump": "text-fuchsia-300 bg-fuchsia-500/12",
  "Surgical Tool": "text-amber-200 bg-amber-500/12",
  Custom: "text-[var(--text-primary)] bg-white/8",
};

const viewButtons: Array<{ id: ViewMode; label: string; icon: typeof LayoutGrid }> = [
  { id: "grid", label: "Grid", icon: LayoutGrid },
  { id: "list", label: "List", icon: List },
  { id: "table", label: "Table", icon: TableProperties },
];

function MiniProgress({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.14em] text-[var(--text-secondary)]">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
    </div>
  );
}

function Owners({ initials }: { initials: string[] }) {
  return (
    <div className="flex -space-x-2">
      {initials.map((initial) => (
        <Avatar key={initial} className="size-8 ring-2 ring-[var(--card)]">
          <AvatarFallback>{initial}</AvatarFallback>
        </Avatar>
      ))}
    </div>
  );
}

function TemplateIllustration({
  deviceType,
}: {
  deviceType: keyof typeof deviceIcons;
}) {
  const Icon = deviceIcons[deviceType];

  return (
    <div className="relative overflow-hidden rounded-[24px] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_14%,transparent),color-mix(in_srgb,var(--accent)_12%,transparent))] p-5">
      <div className="absolute -right-6 -top-6 size-24 rounded-full bg-white/8 blur-2xl" />
      <div className={cn("flex size-16 items-center justify-center rounded-3xl", deviceTone[deviceType])}>
        <Icon className="size-8" />
      </div>
      <svg
        viewBox="0 0 180 84"
        className="mt-4 h-[84px] w-full text-white/40"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M12 52C34 40 42 34 61 34C79 34 89 52 106 52C124 52 134 22 155 22C165 22 171 24 176 28"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <circle cx="42" cy="36" r="6" fill="rgba(255,255,255,0.18)" />
        <circle cx="108" cy="52" r="6" fill="rgba(255,255,255,0.18)" />
      </svg>
    </div>
  );
}

function ProjectCard({
  project,
  onOpen,
  onClone,
}: {
  project: ProjectRecord;
  onOpen: () => void;
  onClone: () => void;
}) {
  const Icon = deviceIcons[project.deviceType];

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="group rounded-[30px] border border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--card)_94%,transparent),color-mix(in_srgb,var(--surface)_80%,transparent))] p-5 transition hover:border-[var(--primary)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className={cn("flex size-12 items-center justify-center rounded-2xl", deviceTone[project.deviceType])}>
          <Icon className="size-5" />
        </div>
        <StatusBadge state={project.phase} />
      </div>

      <div className="mt-4">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">{project.name}</h3>
        <div className="mt-1 text-sm text-[var(--text-secondary)]">
          Class {project.deviceClass} / {project.regions.map((region) => regionFlagMap[region]).join(" ")}
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        <MiniProgress label="Requirements" value={project.progress.requirements} color="var(--primary)" />
        <MiniProgress label="Design" value={project.progress.design} color="#7dd3fc" />
        <MiniProgress label="Simulation" value={project.progress.simulation} color="var(--warning)" />
        <MiniProgress label="Compliance" value={project.progress.compliance} color="var(--accent)" />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-[color:color-mix(in_srgb,var(--danger)_14%,transparent)] px-3 py-1.5 text-sm text-[var(--danger)]">
          Risk {project.riskScore}/10
        </span>
        <span className="rounded-full bg-[color:color-mix(in_srgb,var(--primary)_14%,transparent)] px-3 py-1.5 text-sm text-[var(--primary)]">
          Coverage {project.coverage}%
        </span>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm text-[var(--text-primary)]">{project.lastModified}</div>
          <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">
            {project.ownerNames[0]}
          </div>
        </div>
        <Owners initials={project.ownerInitials} />
      </div>

      <div className="mt-5 flex items-center gap-2">
        <Button
          type="button"
          className="flex-1 rounded-full bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)]"
          onClick={onOpen}
        >
          Open
        </Button>
        <Button type="button" variant="secondary" className="rounded-full" onClick={onClone}>
          Clone
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="icon-sm" className="rounded-full">
              <EllipsisVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onOpen}>Open</DropdownMenuItem>
            <DropdownMenuItem onClick={onClone}>Clone</DropdownMenuItem>
            <DropdownMenuItem>Archive</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.article>
  );
}

function ProjectListItem({
  project,
  onOpen,
  onClone,
}: {
  project: ProjectRecord;
  onOpen: () => void;
  onClone: () => void;
}) {
  const Icon = deviceIcons[project.deviceType];

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[28px] border border-[var(--border)] bg-[var(--card)]/76 p-4"
    >
      <div className="flex flex-wrap items-center gap-4">
        <div className={cn("flex size-12 items-center justify-center rounded-2xl", deviceTone[project.deviceType])}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-[220px] flex-1">
          <div className="font-medium text-[var(--text-primary)]">{project.name}</div>
          <div className="mt-1 text-sm text-[var(--text-secondary)]">
            Class {project.deviceClass} / {project.deviceType} /{" "}
            {project.regions.map((region) => regionFlagMap[region]).join(" ")}
          </div>
        </div>
        <StatusBadge state={project.phase} />
        <div className="min-w-[180px] flex-1">
          <MiniProgress label="Coverage" value={project.coverage} color="var(--primary)" />
        </div>
        <RiskScore compact label="Risk" score={project.riskScore} className="shadow-none" />
        <Owners initials={project.ownerInitials} />
        <div className="flex items-center gap-2">
          <Button type="button" variant="secondary" className="rounded-full" onClick={onOpen}>
            Open
          </Button>
          <Button type="button" variant="ghost" className="rounded-full" onClick={onClone}>
            <Copy className="mr-2 size-4" />
            Clone
          </Button>
        </div>
      </div>
    </motion.article>
  );
}

function ProjectTableView({
  projects,
  onOpen,
  onClone,
}: {
  projects: ProjectRecord[];
  onOpen: (project: ProjectRecord) => void;
  onClone: (project: ProjectRecord) => void;
}) {
  if (!projects.length) {
    return (
      <EmptyState
        title="No projects match these filters"
        description="Adjust class, region, phase, or owner filters to bring programs back into view."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-[30px] border border-[var(--border)] bg-[var(--card)]/76">
      <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-[color:color-mix(in_srgb,var(--surface)_88%,transparent)] text-[11px] uppercase tracking-[0.18em] text-[var(--text-secondary)]">
            <tr>
              <th className="px-5 py-3 text-left font-medium">Project</th>
              <th className="px-5 py-3 text-left font-medium">Phase</th>
              <th className="px-5 py-3 text-left font-medium">Coverage</th>
              <th className="px-5 py-3 text-left font-medium">Risk</th>
              <th className="px-5 py-3 text-left font-medium">Owners</th>
              <th className="px-5 py-3 text-left font-medium">Modified</th>
              <th className="px-5 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr
                key={project.id}
                className="border-t border-[var(--border)] hover:bg-[color:color-mix(in_srgb,var(--primary)_4%,transparent)]"
              >
                <td className="px-5 py-4">
                  <div className="font-medium text-[var(--text-primary)]">{project.name}</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                    {project.deviceType}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <StatusBadge state={project.phase} />
                </td>
                <td className="px-5 py-4">
                  <MiniProgress label="Coverage" value={project.coverage} color="var(--primary)" />
                </td>
                <td className="px-5 py-4">
                  <RiskScore compact label="Risk" score={project.riskScore} className="shadow-none" />
                </td>
                <td className="px-5 py-4">
                  <Owners initials={project.ownerInitials} />
                </td>
                <td className="px-5 py-4 text-[var(--text-secondary)]">{project.lastModified}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Button type="button" size="sm" variant="secondary" className="rounded-full" onClick={() => onOpen(project)}>
                      Open
                    </Button>
                    <Button type="button" size="sm" variant="ghost" className="rounded-full" onClick={() => onClone(project)}>
                      Clone
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ProjectsHub() {
  const router = useRouter();
  const [projects, setProjects] = React.useState<ProjectRecord[]>(projectRecords);
  const [activeTab, setActiveTab] = React.useState<TabMode>("projects");
  const [viewMode, setViewMode] = React.useState<ViewMode>("grid");
  const [deviceClassFilter, setDeviceClassFilter] = React.useState<"all" | "I" | "II" | "III">("all");
  const [phaseFilter, setPhaseFilter] = React.useState<"all" | ProjectRecord["phase"]>("all");
  const [regionFilter, setRegionFilter] = React.useState<Array<(typeof regionOptions)[number]["code"]>>([]);
  const [ownerSearch, setOwnerSearch] = React.useState("");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [sortMode, setSortMode] = React.useState<SortMode>("updated");
  const [modalOpen, setModalOpen] = React.useState(false);

  const filteredProjects = React.useMemo(() => {
    const rows = projects.filter((project) => {
      if (deviceClassFilter !== "all" && project.deviceClass !== deviceClassFilter) {
        return false;
      }

      if (phaseFilter !== "all" && project.phase !== phaseFilter) {
        return false;
      }

      if (regionFilter.length && !regionFilter.every((region) => project.regions.includes(region))) {
        return false;
      }

      if (
        ownerSearch.trim() &&
        !project.ownerNames.some((owner) =>
          owner.toLowerCase().includes(ownerSearch.trim().toLowerCase()),
        )
      ) {
        return false;
      }

      if (dateFrom && project.updatedAt < dateFrom) {
        return false;
      }

      if (dateTo && project.updatedAt > dateTo) {
        return false;
      }

      return true;
    });

    return [...rows].sort((left, right) => {
      if (sortMode === "name") {
        return left.name.localeCompare(right.name);
      }

      if (sortMode === "risk") {
        return right.riskScore - left.riskScore;
      }

      if (sortMode === "coverage") {
        return right.coverage - left.coverage;
      }

      return right.updatedAt.localeCompare(left.updatedAt);
    });
  }, [projects, deviceClassFilter, phaseFilter, regionFilter, ownerSearch, dateFrom, dateTo, sortMode]);

  function openProject(project: ProjectRecord) {
    router.push(`/projects/${project.slug}`);
  }

  function cloneProject(project: ProjectRecord) {
    const clone: ProjectRecord = {
      ...project,
      id: `${project.id}-copy-${Date.now()}`,
      slug: `${project.slug}-copy`,
      name: `${project.name} Copy`,
      lastModified: "Just now",
      updatedAt: new Date().toISOString().slice(0, 10),
      phase: "Draft",
    };

    setProjects((current) => [clone, ...current]);
  }

  function renderProjectsView() {
    if (!filteredProjects.length) {
      return (
        <EmptyState
          title="No projects match these filters"
          description="Reset the device class, region, phase, or owner filters to see more programs."
          action={
            <Button
              type="button"
              variant="secondary"
              className="rounded-full"
              onClick={() => {
                setDeviceClassFilter("all");
                setPhaseFilter("all");
                setRegionFilter([]);
                setOwnerSearch("");
                setDateFrom("");
                setDateTo("");
              }}
            >
              Clear filters
            </Button>
          }
        />
      );
    }

    if (viewMode === "grid") {
      return (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onOpen={() => openProject(project)}
              onClone={() => cloneProject(project)}
            />
          ))}
        </div>
      );
    }

    if (viewMode === "list") {
      return (
        <div className="space-y-3">
          {filteredProjects.map((project) => (
            <ProjectListItem
              key={project.id}
              project={project}
              onOpen={() => openProject(project)}
              onClone={() => cloneProject(project)}
            />
          ))}
        </div>
      );
    }

    return (
      <ProjectTableView
        projects={filteredProjects}
        onOpen={openProject}
        onClone={cloneProject}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--card)_92%,transparent),color-mix(in_srgb,var(--surface)_82%,transparent))] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
                Projects
              </h1>
              <span className="rounded-full bg-[color:color-mix(in_srgb,var(--primary)_14%,transparent)] px-3 py-1 text-sm text-[var(--primary)]">
                {projects.length}
              </span>
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--text-secondary)]">
              Create and manage regulated device programs, switch between visual layouts, and
              launch new workspaces with standards-aware templates.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeTab === "projects" ? (
              <div className="flex rounded-full border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--card)_78%,transparent)] p-1">
                {viewButtons.map((button) => {
                  const Icon = button.icon;
                  return (
                    <button
                      key={button.id}
                      type="button"
                      onClick={() => setViewMode(button.id)}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm transition",
                        viewMode === button.id
                          ? "bg-[var(--primary)] text-white"
                          : "text-[var(--text-secondary)]",
                      )}
                    >
                      <Icon className="size-4" />
                      {button.label}
                    </button>
                  );
                })}
              </div>
            ) : null}

            <Button
              type="button"
              className="rounded-full bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)]"
              onClick={() => setModalOpen(true)}
            >
              <Plus className="mr-2 size-4" />
              New Project
            </Button>
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as TabMode)}
          className="mt-6"
        >
          <TabsList variant="line" className="rounded-full border border-[var(--border)] p-1">
            <TabsTrigger value="projects" className="rounded-full px-4">
              Projects
            </TabsTrigger>
            <TabsTrigger value="templates" className="rounded-full px-4">
              Templates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="mt-5 space-y-5">
            <div className="rounded-[28px] border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--card)_78%,transparent)] p-4">
              <div className="mb-4 flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
                <Filter className="size-4 text-[var(--primary)]" />
                Filter Bar
              </div>
              <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-6">
                <Select
                  value={deviceClassFilter}
                  onValueChange={(value) => setDeviceClassFilter(value as typeof deviceClassFilter)}
                >
                  <SelectTrigger className="w-full rounded-2xl">
                    <SelectValue placeholder="Device Class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    <SelectItem value="I">Class I</SelectItem>
                    <SelectItem value="II">Class II</SelectItem>
                    <SelectItem value="III">Class III</SelectItem>
                  </SelectContent>
                </Select>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" className="justify-between rounded-2xl">
                      Regions
                      <span className="ml-2 text-[var(--text-secondary)]">
                        {regionFilter.length ? regionFilter.length : "All"}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64">
                    <DropdownMenuLabel>Select Regions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {regionOptions.map((region) => (
                      <DropdownMenuCheckboxItem
                        key={region.code}
                        checked={regionFilter.includes(region.code)}
                        onCheckedChange={() =>
                          setRegionFilter((current) =>
                            current.includes(region.code)
                              ? current.filter((code) => code !== region.code)
                              : [...current, region.code],
                          )
                        }
                      >
                        {region.flag} {region.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Select
                  value={phaseFilter}
                  onValueChange={(value) => setPhaseFilter(value as typeof phaseFilter)}
                >
                  <SelectTrigger className="w-full rounded-2xl">
                    <SelectValue placeholder="Phase" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Phases</SelectItem>
                    {projectPhaseOptions.map((phase) => (
                      <SelectItem key={phase} value={phase}>
                        {phase}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--text-secondary)]" />
                  <Input
                    value={ownerSearch}
                    onChange={(event) => setOwnerSearch(event.target.value)}
                    placeholder="Owner search"
                    className="h-10 rounded-2xl pl-11"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <CalendarRange className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--text-secondary)]" />
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(event) => setDateFrom(event.target.value)}
                      className="h-10 rounded-2xl pl-10"
                    />
                  </div>
                  <div className="relative">
                    <CalendarRange className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--text-secondary)]" />
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(event) => setDateTo(event.target.value)}
                      className="h-10 rounded-2xl pl-10"
                    />
                  </div>
                </div>

                <Select
                  value={sortMode}
                  onValueChange={(value) => setSortMode(value as SortMode)}
                >
                  <SelectTrigger className="w-full rounded-2xl">
                    <ArrowUpDown className="mr-2 size-4 text-[var(--text-secondary)]" />
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="updated">Last Modified</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="risk">Risk Score</SelectItem>
                    <SelectItem value="coverage">Coverage %</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={viewMode}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22 }}
              >
                {renderProjectsView()}
              </motion.div>
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="templates" className="mt-5">
            {projectTemplates.length ? (
              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {projectTemplates.map((template) => (
                  <motion.article
                    key={template.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-[30px] border border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--card)_94%,transparent),color-mix(in_srgb,var(--surface)_82%,transparent))] p-5"
                  >
                    <TemplateIllustration deviceType={template.deviceType} />
                    <div className="mt-4">
                      <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                        {template.name}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                        {template.caption}
                      </p>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {template.standards.map((standard) => (
                        <span
                          key={standard}
                          className="rounded-full bg-[color:color-mix(in_srgb,var(--accent)_14%,transparent)] px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-[var(--accent)]"
                        >
                          {standard}
                        </span>
                      ))}
                    </div>
                    <div className="mt-5 flex items-center justify-between text-sm text-[var(--text-secondary)]">
                      <span>{template.requirementsCount} requirements</span>
                      <span>{template.estimatedTimeline}</span>
                    </div>
                    <Button
                      type="button"
                      className="mt-5 w-full rounded-full bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)]"
                      onClick={() => setModalOpen(true)}
                    >
                      <ShieldCheck className="mr-2 size-4" />
                      Use Template
                    </Button>
                  </motion.article>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No templates available"
                description="Device-specific project starters will appear here once templates are configured."
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      <ProjectCreationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreateProject={(project) => setProjects((current) => [project, ...current])}
      />
    </div>
  );
}
