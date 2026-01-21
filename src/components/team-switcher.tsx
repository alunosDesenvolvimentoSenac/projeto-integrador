"use client"

import * as React from "react"
<<<<<<< HEAD
import { Building2, GraduationCap } from "lucide-react"
import { auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { getDadosUsuarioSidebar } from "@/app/actions/auth"
=======
import Image from "next/image" // 1. Import do componente Image
import senacLogo from "@/app/assets/senaclogomenu.svg" // 2. Import do seu logo


>>>>>>> df897e404b85e7dc5c3a7e6443c02281a1a65aff

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function TeamSwitcher() {
  
<<<<<<< HEAD
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

=======
  // 1. ESTADO INICIAL (PLACEHOLDER)
 
>>>>>>> df897e404b85e7dc5c3a7e6443c02281a1a65aff

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-default hover:bg-transparent"
        >
<<<<<<< HEAD
          <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
            <GraduationCap className="size-4" />
=======
          {/* 3. Substituição do Ícone pelo Logo SVG */}
          <div >
             <Image
                          src={senacLogo}
                          alt="Senac Minas Logo"
                          width={100}
                          height={100}
                        >
              </Image>
>>>>>>> df897e404b85e7dc5c3a7e6443c02281a1a65aff
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">
             
            </span>
            <span className="truncate text-xs">
              
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}