import type { Metadata } from "next";

import { EvidencePackBuilder } from "@/components/app/evidence-pack-builder";

export const metadata: Metadata = {
  title: "Evidence Pack",
};

export default function EvidencePage() {
  return <EvidencePackBuilder />;
}
