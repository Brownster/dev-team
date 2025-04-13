"use client";

import {SidebarProvider} from "@/components/ui/sidebar";
import {Toaster} from "@/components/ui/toaster";
import DevTeamAIApp from "@/components/DevTeamAIApp";

export default function Home() {
  return (
    <SidebarProvider>
      <DevTeamAIApp/>
      <Toaster/>
    </SidebarProvider>
  );
}
