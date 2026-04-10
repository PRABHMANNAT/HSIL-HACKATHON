import type { Metadata } from "next";

import { CopilotWorkbench } from "@/components/app/copilot-workbench";

export const metadata: Metadata = {
  title: "AI Copilot",
};

export default function CopilotPage() {
  return <CopilotWorkbench />;
}
