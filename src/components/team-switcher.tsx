"use client"

import * as React from "react"
import { Building2, GraduationCap } from "lucide-react"
import { auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { getDadosUsuarioSidebar } from "@/app/actions/auth"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function TeamSwitcher() {
  
  const [dados, setDados] = React.useState({
    nomeUnidade: "Senac Minas",
    cargo: "LabManager",
  })


  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const info = await getDadosUsuarioSidebar(user.uid)
        
        if (info) {
          setDados({
            nomeUnidade: info.nomeUnidade,
            cargo: info.cargo
          })
        }
      }
    })

    return () => unsubscribe()
  }, [])


  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-default hover:bg-transparent"
        >
          <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
            <GraduationCap className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">
              {dados.nomeUnidade}
            </span>
            <span className="truncate text-xs">
              {dados.cargo}
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}