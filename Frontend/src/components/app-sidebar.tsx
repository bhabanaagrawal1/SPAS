"use client"

import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { GalleryVerticalEndIcon, AudioLinesIcon, TerminalIcon, TerminalSquareIcon, BotIcon, BookOpenIcon, Settings2Icon, FrameIcon, PieChartIcon, MapIcon } from "lucide-react"

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "https://i.pinimg.com/736x/d9/7b/bb/d97bbb08017ac2309307f0822e63d082.jpg",
  },
  teams: [
    {
      name: "Student 360°",
      logo: (
        <GalleryVerticalEndIcon
        />
      ),
      plan: "Your academic workspace",
    },
    {
      name: "Acme Corp.",
      logo: (
        <AudioLinesIcon
        />
      ),
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: (
        <TerminalIcon
        />
      ),
      plan: "Free",
    },
  ],
  navMain: [
  {
    title: "ACADEMIC",
    url: "#",
    icon: <TerminalSquareIcon />,
    isActive: true,
    items: [
      {
        title: "Overview",
        url: "/overview",
      },
      {
        title: "Academic Performance",
        url: "/academic-performance",
      },
      {
        title: "ML Insights",
        url: "/ml-insights",
      },
    ],
  },
  {
    title: "DEVELOPER HUB",
    url: "#",
    icon: <BotIcon />,
    items: [
      {
        title: "My Projects",
        url: "/developer-hub/projects",
      },
      {
        title: "GitHub",
        url: "/developer-hub/github",
      },
      {
        title: "Coding Profiles",
        url: "/developer-hub/coding-profiles",
      },
      {
        title: "Tasks & Goals",
        url: "/developer-hub/tasks",
      },
    ],
  },
  {
    title: "SETTINGS",
    url: "#",
    icon: <Settings2Icon />,
    items: [
      {
        title: "General",
        url: "/settings/general",
      },
      {
        title: "Billing",
        url: "/settings/billing",
      },
    ],
  },
],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent className="bg-[#F5FAFB]">
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
