import type { Metadata } from "next";
import Factures from "@/components/factures/factures";

export const metadata: Metadata = { title: "Factures" };

export default function Page() {
  return <Factures />;
}
