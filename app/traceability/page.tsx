import type { Metadata } from "next";

import { TraceabilityMatrix } from "@/components/app/traceability-matrix";

export const metadata: Metadata = {
  title: "Traceability",
};

export default function TraceabilityPage() {
  return <TraceabilityMatrix />;
}
