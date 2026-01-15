"use client"

import * as React from "react"
import Image from "next/image" // 1. Import do componente Image
import senacLogo from "@/app/assets/senaclogomenu.svg" // 2. Import do seu logo



import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function TeamSwitcher() {
  
  // 1. ESTADO INICIAL (PLACEHOLDER)
 

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-default hover:bg-transparent"
        >
          {/* 3. Substituição do Ícone pelo Logo SVG */}
          <div >
             <Image
                          src={senacLogo}
                          alt="Senac Minas Logo"
                          width={100}
                          height={100}
                        >
              </Image>
          </div>
          
          {/* Textos Dinâmicos */}
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