"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  CalendarDays,
  Droplets,
  HeartPulse,
  Pill,
  Plus,
  Scissors,
  UserPlus,
  Wind,
  X,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/ui/med/status-badge";
import {
  deviceTypeOptions,
  memberRoleOptions,
  regionOptions,
  teamDirectory,
  type ProjectRecord,
} from "@/lib/projects-data";
import { cn } from "@/lib/utils";

type MemberRole = (typeof memberRoleOptions)[number];
type DeviceLabel = (typeof deviceTypeOptions)[number]["label"];

interface ProjectCreationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateProject: (project: ProjectRecord) => void;
}

type FormState = {
  projectName: string;
  deviceType: DeviceLabel | "";
  deviceClass: "I" | "II" | "III" | "";
  regulatoryTrack: "FDA" | "MDR";
  regions: Array<(typeof regionOptions)[number]["code"]>;
  startFromTemplate: boolean;
  standards: string[];
  intendedUse: string;
  submissionDate: string;
  teamSearch: string;
  teamMembers: Array<{ name: string; role: MemberRole }>;
  initializeWithAI: boolean;
};

type ValidationErrors = Partial<Record<string, string>>;

const deviceIcons = {
  Pacemaker: HeartPulse,
  Ventilator: Wind,
  "Infusion Pump": Droplets,
  "ECG Monitor": Activity,
  "Insulin Pump": Pill,
  "Surgical Tool": Scissors,
  Custom: Plus,
};

const initialFormState: FormState = {
  projectName: "",
  deviceType: "",
  deviceClass: "",
  regulatoryTrack: "FDA",
  regions: [],
  startFromTemplate: true,
  standards: [],
  intendedUse: "",
  submissionDate: "",
  teamSearch: "",
  teamMembers: [{ name: "Priya Shah", role: "Owner" }],
  initializeWithAI: true,
};

const wizardSteps = [
  { id: 1, title: "Project Basics" },
  { id: 2, title: "Standards & Team" },
  { id: 3, title: "Review & Create" },
];

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function ProjectCreationModal({
  open,
  onOpenChange,
  onCreateProject,
}: ProjectCreationModalProps) {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [form, setForm] = React.useState<FormState>(initialFormState);
  const [errors, setErrors] = React.useState<ValidationErrors>({});
  const [createProgress, setCreateProgress] = React.useState(0);
  const [isCreating, setIsCreating] = React.useState(false);

  const availableMembers = React.useMemo(
    () =>
      teamDirectory.filter(
        (member) =>
          !form.teamMembers.some((teamMember) => teamMember.name === member) &&
          member.toLowerCase().includes(form.teamSearch.toLowerCase()),
      ),
    [form.teamMembers, form.teamSearch],
  );

  React.useEffect(() => {
    if (!open) {
      setStep(1);
      setErrors({});
      setCreateProgress(0);
      setIsCreating(false);
      setForm(initialFormState);
    }
  }, [open]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function handleDeviceTypeSelect(deviceType: DeviceLabel) {
    const match = deviceTypeOptions.find((option) => option.label === deviceType);
    setForm((current) => ({
      ...current,
      deviceType,
      standards: match?.standards ?? [],
    }));
    setErrors((current) => ({ ...current, deviceType: undefined }));
  }

  function validateCurrentStep() {
    const nextErrors: ValidationErrors = {};

    if (step === 1) {
      if (!form.projectName.trim()) {
        nextErrors.projectName = "Project name is required.";
      }
      if (!form.deviceType) {
        nextErrors.deviceType = "Select a device type.";
      }
      if (!form.deviceClass) {
        nextErrors.deviceClass = "Choose a device class.";
      }
      if (!form.regions.length) {
        nextErrors.regions = "Select at least one region.";
      }
    }

    if (step === 2) {
      if (form.intendedUse.trim().length < 40) {
        nextErrors.intendedUse = "Add a fuller intended use statement (40+ characters).";
      }
      if (!form.submissionDate) {
        nextErrors.submissionDate = "Pick a target submission date.";
      }
      if (!form.teamMembers.length) {
        nextErrors.teamMembers = "Invite at least one team member.";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function addTeamMember(name: string) {
    setForm((current) => ({
      ...current,
      teamSearch: "",
      teamMembers: [...current.teamMembers, { name, role: "Engineer" }],
    }));
    setErrors((current) => ({ ...current, teamMembers: undefined }));
  }

  async function handleCreate() {
    if (isCreating) {
      return;
    }

    setIsCreating(true);

    for (const value of [16, 33, 56, 74, 92, 100]) {
      setCreateProgress(value);
      await delay(180);
    }

    const slug = slugify(form.projectName);
    const coverage = form.initializeWithAI ? 36 : 14;
    const progressSeed = form.initializeWithAI ? 28 : 12;
    const ownerNames = form.teamMembers.map((member) => member.name);
    const ownerInitials = form.teamMembers.map((member) =>
      member.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2),
    );

    const createdProject: ProjectRecord = {
      id: `created-${slug}`,
      slug,
      name: form.projectName.trim(),
      deviceType: form.deviceType || "Custom",
      deviceClass: form.deviceClass || "II",
      regulatoryTrack: form.regulatoryTrack,
      regions: form.regions,
      phase: form.startFromTemplate ? "Requirements" : "Draft",
      ownerNames,
      ownerInitials,
      lastModified: "Just now",
      updatedAt: new Date().toISOString().slice(0, 10),
      riskScore: form.initializeWithAI ? 4 : 6,
      coverage,
      progress: {
        requirements: progressSeed + 18,
        design: progressSeed,
        simulation: form.initializeWithAI ? 12 : 4,
        compliance: form.initializeWithAI ? 10 : 3,
      },
    };

    onCreateProject(createdProject);
    onOpenChange(false);
    router.push(`/projects/${slug}`);
  }

  function nextStep() {
    if (!validateCurrentStep()) {
      return;
    }

    setStep((current) => Math.min(3, current + 1));
  }

  function removeStandard(standard: string) {
    setField(
      "standards",
      form.standards.filter((item) => item !== standard),
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[calc(100vh-24px)] max-w-[980px] overflow-hidden rounded-[34px] border border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--card)_94%,transparent),color-mix(in_srgb,var(--surface)_84%,transparent))] p-0 shadow-[0_40px_120px_rgba(7,12,24,0.3)]"
      >
        <div className="border-b border-[var(--border)] px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                New Project
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm text-[var(--text-secondary)]">
                Create a regulated workspace with device context, standards, and team ownership.
              </DialogDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="rounded-full"
              onClick={() => onOpenChange(false)}
              aria-label="Close project creation modal"
            >
              <X className="size-4" />
            </Button>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {wizardSteps.map((wizardStep) => {
              const active = step === wizardStep.id;
              const complete = step > wizardStep.id;

              return (
                <div key={wizardStep.id} className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex size-10 items-center justify-center rounded-full border text-sm font-semibold",
                      complete
                        ? "border-[var(--accent)] bg-[color:color-mix(in_srgb,var(--accent)_16%,transparent)] text-[var(--accent)]"
                        : active
                          ? "border-[var(--primary)] bg-[color:color-mix(in_srgb,var(--primary)_16%,transparent)] text-[var(--primary)]"
                          : "border-[var(--border)] text-[var(--text-secondary)]",
                    )}
                  >
                    {wizardStep.id}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[var(--text-primary)]">
                      {wizardStep.title}
                    </div>
                    <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                      Step {wizardStep.id}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="max-h-[calc(100vh-280px)] overflow-y-auto px-6 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.24 }}
            >
              {step === 1 ? (
                <div className="space-y-6">
                  <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
                    <div className="space-y-5">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                          Project Name
                        </label>
                        <Input
                          value={form.projectName}
                          onChange={(event) => setField("projectName", event.target.value)}
                          placeholder="Atria VX-8 Pacemaker"
                          aria-invalid={Boolean(errors.projectName)}
                          className="h-11 rounded-2xl"
                        />
                        {errors.projectName ? (
                          <p className="mt-2 text-sm text-[var(--danger)]">{errors.projectName}</p>
                        ) : null}
                      </div>

                      <div>
                        <div className="mb-2 text-sm font-medium text-[var(--text-primary)]">
                          Device Type
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                          {deviceTypeOptions.map((option) => {
                            const Icon = deviceIcons[option.label];
                            const selected = form.deviceType === option.label;

                            return (
                              <button
                                key={option.id}
                                type="button"
                                onClick={() => handleDeviceTypeSelect(option.label)}
                                className={cn(
                                  "relative overflow-hidden rounded-[24px] border bg-[color:color-mix(in_srgb,var(--card)_78%,transparent)] p-4 text-left transition",
                                  selected
                                    ? "border-[var(--primary)]"
                                    : "border-[var(--border)] hover:border-[var(--primary)]/40",
                                )}
                              >
                                {selected ? (
                                  <motion.div
                                    layoutId="device-type-highlight"
                                    className="absolute inset-0 rounded-[24px] border-2 border-[var(--primary)]"
                                  />
                                ) : null}
                                <div className="relative flex items-start gap-3">
                                  <div className="flex size-11 items-center justify-center rounded-2xl bg-[color:color-mix(in_srgb,var(--primary)_16%,transparent)] text-[var(--primary)]">
                                    <Icon className="size-5" />
                                  </div>
                                  <div>
                                    <div className="font-medium text-[var(--text-primary)]">
                                      {option.label}
                                    </div>
                                    <div className="mt-1 text-sm text-[var(--text-secondary)]">
                                      {option.description}
                                    </div>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        {errors.deviceType ? (
                          <p className="mt-2 text-sm text-[var(--danger)]">{errors.deviceType}</p>
                        ) : null}
                      </div>
                    </div>

                    <div className="space-y-5 rounded-[28px] border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_72%,transparent)] p-5">
                      <div>
                        <div className="mb-2 text-sm font-medium text-[var(--text-primary)]">
                          Regulatory Track
                        </div>
                        <div className="flex rounded-full border border-[var(--border)] p-1">
                          {(["FDA", "MDR"] as const).map((track) => (
                            <button
                              key={track}
                              type="button"
                              onClick={() => setField("regulatoryTrack", track)}
                              className={cn(
                                "flex-1 rounded-full px-4 py-2 text-sm transition",
                                form.regulatoryTrack === track
                                  ? "bg-[var(--primary)] text-white"
                                  : "text-[var(--text-secondary)]",
                              )}
                            >
                              {track}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="mb-2 text-sm font-medium text-[var(--text-primary)]">
                          Device Class
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {(["I", "II", "III"] as const).map((deviceClass) => (
                            <button
                              key={deviceClass}
                              type="button"
                              onClick={() => setField("deviceClass", deviceClass)}
                              className={cn(
                                "rounded-2xl border px-3 py-3 text-sm font-medium transition",
                                form.deviceClass === deviceClass
                                  ? "border-[var(--primary)] bg-[color:color-mix(in_srgb,var(--primary)_16%,transparent)] text-[var(--primary)]"
                                  : "border-[var(--border)] text-[var(--text-secondary)]",
                              )}
                            >
                              Class {deviceClass}
                            </button>
                          ))}
                        </div>
                        {errors.deviceClass ? (
                          <p className="mt-2 text-sm text-[var(--danger)]">{errors.deviceClass}</p>
                        ) : null}
                      </div>

                      <div>
                        <div className="mb-2 text-sm font-medium text-[var(--text-primary)]">
                          Regions
                        </div>
                        <div className="grid gap-2">
                          {regionOptions.map((region) => (
                            <label
                              key={region.code}
                              className="flex items-center gap-3 rounded-2xl border border-[var(--border)] px-4 py-3 text-sm text-[var(--text-primary)]"
                            >
                              <Checkbox
                                checked={form.regions.includes(region.code)}
                                onCheckedChange={() =>
                                  setField(
                                    "regions",
                                    form.regions.includes(region.code)
                                      ? form.regions.filter((code) => code !== region.code)
                                      : [...form.regions, region.code],
                                  )
                                }
                              />
                              <span className="text-lg">{region.flag}</span>
                              <span>{region.label}</span>
                            </label>
                          ))}
                        </div>
                        {errors.regions ? (
                          <p className="mt-2 text-sm text-[var(--danger)]">{errors.regions}</p>
                        ) : null}
                      </div>

                      <div className="flex items-center justify-between rounded-[22px] border border-[var(--border)] px-4 py-3">
                        <div>
                          <div className="text-sm font-medium text-[var(--text-primary)]">
                            Start from template
                          </div>
                          <div className="text-sm text-[var(--text-secondary)]">
                            Preload controls and starter requirements
                          </div>
                        </div>
                        <Switch
                          checked={form.startFromTemplate}
                          onCheckedChange={(checked) => setField("startFromTemplate", checked)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="space-y-6">
                    <div>
                      <div className="mb-2 text-sm font-medium text-[var(--text-primary)]">
                        Applicable Standards
                      </div>
                      <div className="rounded-[24px] border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--card)_78%,transparent)] p-4">
                        <div className="flex flex-wrap gap-2">
                          {form.standards.map((standard) => (
                            <button
                              key={standard}
                              type="button"
                              onClick={() => removeStandard(standard)}
                              className="inline-flex items-center gap-2 rounded-full bg-[color:color-mix(in_srgb,var(--primary)_14%,transparent)] px-3 py-2 text-sm text-[var(--primary)]"
                            >
                              {standard}
                              <X className="size-3.5" />
                            </button>
                          ))}
                        </div>
                        <div className="mt-3 text-sm text-[var(--text-secondary)]">
                          Auto-suggested from the selected device type. Click a chip to remove it.
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 text-sm font-medium text-[var(--text-primary)]">
                        Intended Use Statement
                      </div>
                      <Textarea
                        value={form.intendedUse}
                        onChange={(event) => setField("intendedUse", event.target.value)}
                        placeholder="Describe the target clinical workflow, primary users, patient population, and operating environment..."
                        aria-invalid={Boolean(errors.intendedUse)}
                        className="min-h-[180px] rounded-[24px] px-4 py-3"
                      />
                      <div className="mt-2 flex items-center justify-between">
                        {errors.intendedUse ? (
                          <p className="text-sm text-[var(--danger)]">{errors.intendedUse}</p>
                        ) : (
                          <span className="text-sm text-[var(--text-secondary)]">
                            Keep this concise but clinically precise.
                          </span>
                        )}
                        <span className="text-sm text-[var(--text-secondary)]">
                          {form.intendedUse.length} chars
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="rounded-[28px] border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_72%,transparent)] p-5">
                      <div className="mb-2 text-sm font-medium text-[var(--text-primary)]">
                        Target Submission Date
                      </div>
                      <div className="relative">
                        <CalendarDays className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--text-secondary)]" />
                        <Input
                          type="date"
                          value={form.submissionDate}
                          onChange={(event) => setField("submissionDate", event.target.value)}
                          aria-invalid={Boolean(errors.submissionDate)}
                          className="h-11 rounded-2xl pl-11"
                        />
                      </div>
                      {errors.submissionDate ? (
                        <p className="mt-2 text-sm text-[var(--danger)]">{errors.submissionDate}</p>
                      ) : null}
                    </div>

                    <div className="rounded-[28px] border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_72%,transparent)] p-5">
                      <div className="mb-2 text-sm font-medium text-[var(--text-primary)]">
                        Team Members
                      </div>
                      <div className="flex gap-2">
                        <Input
                          value={form.teamSearch}
                          onChange={(event) => setField("teamSearch", event.target.value)}
                          placeholder="Search and invite"
                          className="h-11 rounded-2xl"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          className="h-11 rounded-2xl"
                          onClick={() => availableMembers[0] && addTeamMember(availableMembers[0])}
                        >
                          <UserPlus className="mr-2 size-4" />
                          Invite
                        </Button>
                      </div>
                      {availableMembers.length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {availableMembers.slice(0, 4).map((member) => (
                            <button
                              key={member}
                              type="button"
                              onClick={() => addTeamMember(member)}
                              className="rounded-full border border-[var(--border)] px-3 py-2 text-sm text-[var(--text-secondary)] transition hover:border-[var(--primary)] hover:text-[var(--text-primary)]"
                            >
                              {member}
                            </button>
                          ))}
                        </div>
                      ) : null}
                      <div className="mt-4 space-y-3">
                        {form.teamMembers.map((member) => (
                          <div
                            key={member.name}
                            className="flex flex-wrap items-center gap-3 rounded-[22px] border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--card)_78%,transparent)] px-3 py-3"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="size-9">
                                <AvatarFallback>
                                  {member.name
                                    .split(" ")
                                    .map((part) => part[0])
                                    .join("")
                                    .slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="text-sm font-medium text-[var(--text-primary)]">
                                  {member.name}
                                </div>
                                <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                                  Team member
                                </div>
                              </div>
                            </div>
                            <div className="ml-auto flex items-center gap-2">
                              <Select
                                value={member.role}
                                onValueChange={(value) =>
                                  setField(
                                    "teamMembers",
                                    form.teamMembers.map((teamMember) =>
                                      teamMember.name === member.name
                                        ? { ...teamMember, role: value as MemberRole }
                                        : teamMember,
                                    ),
                                  )
                                }
                              >
                                <SelectTrigger className="w-[150px] rounded-2xl">
                                  <SelectValue placeholder="Role" />
                                </SelectTrigger>
                                <SelectContent>
                                  {memberRoleOptions.map((role) => (
                                    <SelectItem key={role} value={role}>
                                      {role}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                className="rounded-full"
                                onClick={() =>
                                  setField(
                                    "teamMembers",
                                    form.teamMembers.filter((teamMember) => teamMember.name !== member.name),
                                  )
                                }
                              >
                                <X className="size-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      {errors.teamMembers ? (
                        <p className="mt-2 text-sm text-[var(--danger)]">{errors.teamMembers}</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}
              {step === 3 ? (
                <div className="space-y-6">
                  <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_320px]">
                    <div className="rounded-[28px] border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--card)_78%,transparent)] p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                            Review Summary
                          </div>
                          <h3 className="mt-1 text-xl font-semibold text-[var(--text-primary)]">
                            {form.projectName || "Untitled Project"}
                          </h3>
                        </div>
                        {form.deviceType ? <StatusBadge state="Requirements" /> : null}
                      </div>
                      <div className="mt-5 grid gap-4 md:grid-cols-2">
                        <div className="rounded-[22px] border border-[var(--border)] px-4 py-3">
                          <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                            Device Type
                          </div>
                          <div className="mt-1 text-sm text-[var(--text-primary)]">
                            {form.deviceType || "Not selected"}
                          </div>
                        </div>
                        <div className="rounded-[22px] border border-[var(--border)] px-4 py-3">
                          <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                            Class / Track
                          </div>
                          <div className="mt-1 text-sm text-[var(--text-primary)]">
                            {form.deviceClass || "?"} / {form.regulatoryTrack}
                          </div>
                        </div>
                        <div className="rounded-[22px] border border-[var(--border)] px-4 py-3">
                          <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                            Regions
                          </div>
                          <div className="mt-1 text-sm text-[var(--text-primary)]">
                            {form.regions.length
                              ? regionOptions
                                  .filter((region) => form.regions.includes(region.code))
                                  .map((region) => `${region.flag} ${region.code}`)
                                  .join("  ")
                              : "None selected"}
                          </div>
                        </div>
                        <div className="rounded-[22px] border border-[var(--border)] px-4 py-3">
                          <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                            Submission
                          </div>
                          <div className="mt-1 text-sm text-[var(--text-primary)]">
                            {form.submissionDate || "Not scheduled"}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 rounded-[22px] border border-[var(--border)] px-4 py-4">
                        <div className="text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                          Intended Use
                        </div>
                        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                          {form.intendedUse || "No intended use statement yet."}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-[28px] border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_72%,transparent)] p-5">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <div className="text-sm font-medium text-[var(--text-primary)]">
                              Initialize with AI
                            </div>
                            <div className="mt-1 text-sm text-[var(--text-secondary)]">
                              Generate starter requirements, trace links, and safety placeholders.
                            </div>
                          </div>
                          <Switch
                            checked={form.initializeWithAI}
                            onCheckedChange={(checked) => setField("initializeWithAI", checked)}
                          />
                        </div>
                      </div>

                      <div className="rounded-[28px] border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_72%,transparent)] p-5">
                        <div className="text-sm font-medium text-[var(--text-primary)]">
                          Standards Preview
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {form.standards.map((standard) => (
                            <span
                              key={standard}
                              className="rounded-full bg-[color:color-mix(in_srgb,var(--accent)_14%,transparent)] px-3 py-2 text-sm text-[var(--accent)]"
                            >
                              {standard}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {isCreating ? (
                    <div className="rounded-[24px] border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--card)_78%,transparent)] p-4">
                      <div className="flex items-center justify-between text-sm text-[var(--text-primary)]">
                        <span>Creating project workspace</span>
                        <span>{createProgress}%</span>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/8">
                        <motion.div
                          animate={{ width: `${createProgress}%` }}
                          className="h-full rounded-full bg-[linear-gradient(90deg,var(--primary),var(--accent))]"
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between border-t border-[var(--border)] px-6 py-4">
          <Button
            type="button"
            variant="secondary"
            className="rounded-full"
            disabled={step === 1 || isCreating}
            onClick={() => setStep((current) => Math.max(1, current - 1))}
          >
            Back
          </Button>
          {step < 3 ? (
            <Button
              type="button"
              className="rounded-full bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)]"
              onClick={nextStep}
            >
              Next step
            </Button>
          ) : (
            <Button
              type="button"
              className="rounded-full bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)]"
              disabled={isCreating}
              onClick={handleCreate}
            >
              Create Project
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
