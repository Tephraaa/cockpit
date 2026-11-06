"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/_ui/sheet";
import SidebarContent from "./sidebar-content";
import SidebarResizer from "./sidebar-resizer";
import { useCockpit } from "@/stores/cockpit-store";

export default function Sidebar() {
  const sidebarOpen = useCockpit((state) => state.sidebarOpen);
  const setSidebarOpen = useCockpit((state) => state.setSidebarOpen);

  return (
    <>
      <aside className="relative hidden w-(--sidebar-width) shrink-0 border-r border-sidebar-border bg-sidebar lg:flex lg:flex-col">
        <SidebarContent />
        <SidebarResizer />
      </aside>

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent
          side="left"
          className="w-[254px] max-w-[85vw] border-sidebar-border bg-sidebar"
        >
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">
            Les pages de Cockpit, ton équipe et ton pipeline
          </SheetDescription>
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  );
}
