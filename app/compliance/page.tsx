import type { Metadata } from "next";

import { ComplianceHub } from "@/components/app/compliance-hub";

export const metadata: Metadata = {
  title: "Compliance",
};

export default function CompliancePage() {
  return <ComplianceHub />;
}
