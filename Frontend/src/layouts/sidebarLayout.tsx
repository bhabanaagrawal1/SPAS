import { Outlet, useLocation } from "react-router-dom"

import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

const SectionNames: Record<string, string> = {
  "/overview": "ACADEMIC",
  "/academic-performance": "ACADEMIC",
  "/ml-insights": "ACADEMIC",
  "/developer-hub": "DEVELOPER HUB",
  "/developer-hub/coding-profiles": "DEVELOPER HUB",
  "/developer-hub/projects": "DEVELOPER HUB",
  "/developer-hub/github": "DEVELOPER HUB",
  "/developer-hub/tasks": "DEVELOPER HUB",
  "/settings/general": "SETTINGS",
  "/settings/billing": "SETTINGS",
}

const pageNames: Record<string, string> = {
  "/overview": "Overview",
  "/academic-performance": "Academic Performance",
  "/ml-insights": "ML Insights",
  "/developer-hub": "Developer Hub",
  "/developer-hub/coding-profiles": "Coding Profiles",
  "/developer-hub/projects": "My Projects",
  "/developer-hub/github": "GitHub",
  "/developer-hub/tasks": "Tasks & Goals",
  "/settings/general": "General",
  "/settings/billing": "Billing",
}

export default function SidebarLayout() {
  const location = useLocation()
  const pageName = pageNames[location.pathname] ?? "Student 360°"
  const sectionName = SectionNames[location.pathname] ?? "Overview"

  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white px-4">
          <SidebarTrigger className="-ml-1" />

          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />

          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/overview">
                  Student 360°
                </BreadcrumbLink>
              </BreadcrumbItem>

              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  {sectionName}
                </BreadcrumbPage>
              </BreadcrumbItem>
              <BreadcrumbSeparator />

              <BreadcrumbItem>
                <BreadcrumbPage>{pageName}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <main className="min-w-0 flex-1 bg-slate-50 p-4 md:p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
