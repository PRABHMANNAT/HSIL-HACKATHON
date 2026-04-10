import type { Metadata } from "next";

import { ArchitectureWorkbench } from "@/components/app/architecture-workbench";

export const metadata: Metadata = {
  title: "Architecture",
};

export default function ArchitecturePage() {
  return <ArchitectureWorkbench />;
}
