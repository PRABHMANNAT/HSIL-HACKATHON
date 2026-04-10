import type { Metadata } from "next";

import { Pacemaker3DWorkbench } from "@/components/app/pacemaker-3d-workbench";

export const metadata: Metadata = {
  title: "3D Design",
};

export default function ThreeDDesignPage() {
  return <Pacemaker3DWorkbench />;
}
