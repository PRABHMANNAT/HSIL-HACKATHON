"use client";

import { type Edge, type Node } from "@xyflow/react";
import { create } from "zustand";

type GraphSnapshot = {
  nodes: Node[];
  edges: Edge[];
};

type GraphUpdater = GraphSnapshot | ((current: GraphSnapshot) => GraphSnapshot);

type ArchitectureCanvasState = GraphSnapshot & {
  past: GraphSnapshot[];
  future: GraphSnapshot[];
  selectedNodeId: string | null;
  editingEdgeId: string | null;
  collaborationOverlayOpen: boolean;
  reviewMode: boolean;
  initializeCanvas: (snapshot: GraphSnapshot) => void;
  setGraph: (next: GraphUpdater, options?: { recordHistory?: boolean; previous?: GraphSnapshot }) => void;
  updateNodeData: (nodeId: string, patch: Record<string, unknown>, options?: { recordHistory?: boolean }) => void;
  updateEdgeData: (edgeId: string, patch: Record<string, unknown>, options?: { recordHistory?: boolean }) => void;
  setSelectedNodeId: (nodeId: string | null) => void;
  setEditingEdgeId: (edgeId: string | null) => void;
  setCollaborationOverlayOpen: (open: boolean) => void;
  setReviewMode: (locked: boolean) => void;
  undo: () => void;
  redo: () => void;
};

function cloneSnapshot(snapshot: GraphSnapshot): GraphSnapshot {
  return {
    nodes: snapshot.nodes.map((node) => ({
      ...node,
      data: { ...(node.data ?? {}) },
      position: { ...node.position },
      style: node.style ? { ...node.style } : undefined,
    })),
    edges: snapshot.edges.map((edge) => ({
      ...edge,
      data: { ...(edge.data ?? {}) },
      style: edge.style ? { ...edge.style } : undefined,
      markerEnd:
        edge.markerEnd && typeof edge.markerEnd === "object"
          ? { ...edge.markerEnd }
          : edge.markerEnd,
    })),
  };
}

function snapshotsEqual(a: GraphSnapshot, b: GraphSnapshot) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export const useArchitectureCanvasStore = create<ArchitectureCanvasState>((set, get) => ({
  nodes: [],
  edges: [],
  past: [],
  future: [],
  selectedNodeId: null,
  editingEdgeId: null,
  collaborationOverlayOpen: true,
  reviewMode: false,
  initializeCanvas: (snapshot) =>
    set({
      ...cloneSnapshot(snapshot),
      past: [],
      future: [],
      selectedNodeId: null,
      editingEdgeId: null,
      collaborationOverlayOpen: true,
      reviewMode: false,
    }),
  setGraph: (next, options) =>
    set((state) => {
      const current = cloneSnapshot({ nodes: state.nodes, edges: state.edges });
      const resolved = typeof next === "function" ? next(current) : next;
      const nextSnapshot = cloneSnapshot(resolved);

      if (snapshotsEqual(current, nextSnapshot)) {
        return state;
      }

      if (options?.recordHistory === false) {
        return {
          ...state,
          ...nextSnapshot,
        };
      }

      const previousSnapshot = cloneSnapshot(options?.previous ?? current);

      return {
        ...state,
        ...nextSnapshot,
        past: [...state.past, previousSnapshot].slice(-100),
        future: [],
      };
    }),
  updateNodeData: (nodeId, patch, options) =>
    get().setGraph(
      (current) => ({
        ...current,
        nodes: current.nodes.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...(node.data ?? {}),
                  ...patch,
                },
              }
            : node,
        ),
      }),
      options,
    ),
  updateEdgeData: (edgeId, patch, options) =>
    get().setGraph(
      (current) => ({
        ...current,
        edges: current.edges.map((edge) =>
          edge.id === edgeId
            ? {
                ...edge,
                data: {
                  ...(edge.data ?? {}),
                  ...patch,
                },
              }
            : edge,
        ),
      }),
      options,
    ),
  setSelectedNodeId: (selectedNodeId) => set({ selectedNodeId }),
  setEditingEdgeId: (editingEdgeId) => set({ editingEdgeId }),
  setCollaborationOverlayOpen: (collaborationOverlayOpen) => set({ collaborationOverlayOpen }),
  setReviewMode: (reviewMode) => set({ reviewMode }),
  undo: () =>
    set((state) => {
      if (state.past.length === 0) {
        return state;
      }

      const previous = state.past[state.past.length - 1];
      const current = cloneSnapshot({ nodes: state.nodes, edges: state.edges });

      return {
        ...state,
        ...cloneSnapshot(previous),
        past: state.past.slice(0, -1),
        future: [current, ...state.future].slice(0, 100),
      };
    }),
  redo: () =>
    set((state) => {
      if (state.future.length === 0) {
        return state;
      }

      const [next, ...future] = state.future;
      const current = cloneSnapshot({ nodes: state.nodes, edges: state.edges });

      return {
        ...state,
        ...cloneSnapshot(next),
        past: [...state.past, current].slice(-100),
        future,
      };
    }),
}));
