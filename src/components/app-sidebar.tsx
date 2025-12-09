"use client"

import * as React from "react"
import {
  CalendarCheck,
  FileChartColumn,
  GraduationCap,
  Users,
} from "lucide-react"

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

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Senac Minas",
      logo: GraduationCap,
      plan: "Administrador",
    },
    
  ],
  navMain: [
    {
      title: "Agendamento",
      url: "#",
      icon: CalendarCheck,
      isActive: true,
      items: [
        {
          title: "Agendar Laboratório",
          url: "#",
        },
      ],
    },
    {
      title: "Relatórios",
      url: "#",
      icon: FileChartColumn,
      items: [
        {
          title: "Exibir Relatórios",
          url: "#",
        },
        {
          title: "Histórico",
          url: "#",
        },
       
      ],
    },
    {
      title: "Cadastros",
      url: "#",
      icon: Users,
      items: [
        {
          title: "Cadastrar Usuarios",
          url: "#",
        },
        {
          title: "Cadastrar Equipamentos",
          url: "#",
        },
       
      ],
    },

    
   
    
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher/>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
