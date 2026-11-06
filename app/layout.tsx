import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Coquille from "@/components/_common/coquille";
import { SIDEBAR_WIDTH_SCRIPT } from "@/lib/sidebar";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

export const metadata: Metadata = {
  title: { default: "Cockpit", template: "%s · Cockpit" },
  description:
    "Le mission control de ta boîte : ton CRM, tes factures Pennylane, ton agenda et tes tâches sur un seul écran.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={geist.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SIDEBAR_WIDTH_SCRIPT }} />
      </head>
      <body className="relative z-0 font-sans antialiased">
        <Coquille>{children}</Coquille>
      </body>
    </html>
  );
}
