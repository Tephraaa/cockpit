import type { Metadata } from "next";
import Taches from "@/components/taches/taches";

export const metadata: Metadata = { title: "Tâches" };

export default function Page() {
  return <Taches />;
}
