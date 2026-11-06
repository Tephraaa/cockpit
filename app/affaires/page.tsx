import type { Metadata } from "next";
import Affaires from "@/components/affaires/affaires";

export const metadata: Metadata = { title: "Affaires" };

export default function Page() {
  return <Affaires />;
}
