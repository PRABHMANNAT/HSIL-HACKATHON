"use client";

import "@xyflow/react/dist/style.css";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
} from "@xyflow/react";
import { useDrag, useDrop } from "react-dnd";
import { Network, ShieldCheck } from "lucide-react";

import { StatusBadge } from "@/components/ui/med/status-badge";
import {
  architectureEdges,
  architectureNodes,
  architectureProjects,
  standardsPalette,
} from "@/lib/mock-data";

const DRAG_TYPE = "STANDARD_CHIP";

function DeviceNode({ data }: { data: { label: string; subtitle: string } }) {
  return (
    <div className="min-w-[170px] rounded-[24px] border border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--card)_92%,transparent),color-mix(in_srgb,var(--surface)_74%,transparent))] px-4 py-3 shadow-[0_18px_40px_rgba(7,12,24,0.18)] backdrop-blur-xl">
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !border-0 !bg-[var(--primary)]"
      />
      <div className="text-sm font-medium text-[var(--text-primary)]">{data.label}</div>
      <div className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">
        {data.subtitle}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !border-0 !bg-[var(--accent)]"
      />
    </div>
  );
}

function DraggableStandard({ label }: { label: string }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: DRAG_TYPE,
    item: { label },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));
  const ref = React.useRef<HTMLButtonElement>(null);

  drag(ref);

  return (
    <button
      ref={ref}
      type="button"
      className="rounded-full border border-[var(--border)] px-3 py-2 text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)] transition hover:border-[var(--primary)] hover:text-[var(--text-primary)]"
      style={{ opacity: isDragging ? 0.5 : 1 }}
      aria-label={`Drag ${label}`}
    >
      {label}
    </button>
  );
}

export function ArchitectureCanvas() {
  const [pinnedStandards, setPinnedStandards] = React.useState<string[]>(["IEC 62304"]);
  const [, drop] = useDrop(() => ({
    accept: DRAG_TYPE,
    drop: (item: { label: string }) => {
      setPinnedStandards((current) =>
        current.includes(item.label) ? current : [...current, item.label],
      );
    },
  }));
  const dropRef = React.useRef<HTMLDivElement>(null);

  drop(dropRef);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24 }}
      className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]"
    >
      <div className="overflow-hidden rounded-[30px] border border-[var(--border)] bg-[var(--card)]/72">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
              <Network className="size-4 text-[var(--primary)]" />
              Architecture Canvas
            </div>
            <div className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">
              Safety core, telemetry bus, clinical cloud
            </div>
          </div>
          <div className="rounded-full border border-[var(--border)] px-3 py-1 text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">
            React Flow
          </div>
        </div>
        <div className="h-[400px]">
          <ReactFlow
            fitView
            nodes={architectureNodes}
            edges={architectureEdges}
            nodeTypes={{ deviceNode: DeviceNode }}
            proOptions={{ hideAttribution: true }}
            defaultEdgeOptions={{
              style: { stroke: "rgba(10, 132, 255, 0.38)", strokeWidth: 2 },
            }}
          >
            <Background color="rgba(255,255,255,0.06)" gap={24} />
            <MiniMap
              pannable
              zoomable
              nodeColor={() => "rgba(48, 209, 88, 0.55)"}
              maskColor="rgba(4, 9, 20, 0.55)"
            />
            <Controls />
          </ReactFlow>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-[30px] border border-[var(--border)] bg-[var(--card)]/72 p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
            <ShieldCheck className="size-4 text-[var(--accent)]" />
            Pinned Standards
          </div>
          <div
            ref={dropRef}
            className="mt-4 min-h-[118px] rounded-[24px] border border-dashed border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_72%,transparent)] p-4"
            aria-label="Pinned standards drop zone"
          >
            <div className="flex flex-wrap gap-2">
              {pinnedStandards.map((standard) => (
                <span
                  key={standard}
                  className="rounded-full bg-[color:color-mix(in_srgb,var(--accent)_16%,transparent)] px-3 py-2 text-xs uppercase tracking-[0.16em] text-[var(--accent)]"
                >
                  {standard}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {standardsPalette.map((standard) => (
              <DraggableStandard key={standard} label={standard} />
            ))}
          </div>
        </div>

        <div className="rounded-[30px] border border-[var(--border)] bg-[var(--card)]/72 p-5">
          <div className="text-sm font-medium text-[var(--text-primary)]">Active Programs</div>
          <div className="mt-4 space-y-3">
            {architectureProjects.map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between rounded-[22px] border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_74%,transparent)] px-4 py-3"
              >
                <div className="text-sm text-[var(--text-primary)]">{project.name}</div>
                <StatusBadge state={project.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
