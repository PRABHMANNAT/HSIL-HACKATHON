import type { Metadata } from "next";

import { SimulationWorkbench } from "@/components/app/simulation-workbench";

export const metadata: Metadata = {
  title: "Simulation",
};

export default function SimulationPage() {
  return <SimulationWorkbench />;
}
