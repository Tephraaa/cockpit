import type { Metadata } from "next";
import Entreprises from "@/components/entreprises/entreprises";

export const metadata: Metadata = { title: "Entreprises" };

export default function Page() {
  return <Entreprises />;
}
