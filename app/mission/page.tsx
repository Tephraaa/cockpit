import type { Metadata } from "next";
import MissionControl from "@/components/mission/mission-control";

export const metadata: Metadata = { title: "Mission control" };

export default function Page() {
  return <MissionControl />;
}
