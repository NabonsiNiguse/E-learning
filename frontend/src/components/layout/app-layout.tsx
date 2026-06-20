import type { ReactNode } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { AppHeader } from "./app-header";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    // SidebarProvider sets --sidebar-width CSS var and manages collapsed state
    <SidebarProvider>
      <AppSidebar />

      {/*
        SidebarInset = flex-1 w-full — fills all space the sidebar doesn't take.
        overflow-x-hidden prevents horizontal scroll when sidebar animates.
        min-h-svh ensures the column is always full viewport height.
      */}
      <SidebarInset className="min-h-svh overflow-x-hidden">
        {/* Sticky header — always visible at top */}
        <AppHeader />

        {/*
          Scrollable content area.
          - flex-1 so it grows to fill remaining height
          - overflow-y-auto so only this area scrolls, not the whole page
          - Responsive horizontal padding: 16px → 24px → 32px
          - Responsive vertical padding: 20px → 24px → 32px
          - max-w-screen-2xl caps ultra-wide layouts at 1536px
        */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-screen-2xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
