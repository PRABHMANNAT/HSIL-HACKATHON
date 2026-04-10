import type { Metadata } from "next";

import { ComponentsBomPage } from "@/components/app/components-bom-page";

export const metadata: Metadata = {
  title: "Components",
};

export default function ComponentsPage() {
  return <ComponentsBomPage />;
}
