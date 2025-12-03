"use client"

import * as React from "react"
import { Building2, GraduationCap } from "lucide-react" // Removi o Loader2 pois não usaremos mais
import { auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { getDadosUsuarioSidebar } from "@/app/actions/auth"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function TeamSwitcher() {
  
  // 1. ESTADO INICIAL (PLACEHOLDER)
  // O componente nasce renderizando isso, sem esperar nada.
  const [dados, setDados] = React.useState({
    nomeUnidade: "Senac Minas", // Texto padrão seguro
    cargo: "LabManager",        // Subtítulo genérico do sistema
  })


  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // O usuário já está vendo o placeholder.
        // Agora buscamos o dado real no banco (Neon) em background.
        const info = await getDadosUsuarioSidebar(user.uid)
        
        if (info) {
          // Assim que chegar, o texto troca instantaneamente
          setDados({
            nomeUnidade: info.nomeUnidade,
            cargo: info.cargo
          })
        }
      }
    })

    return () => unsubscribe()
  }, [])

  // O componente sempre renderiza a estrutura visual agora.

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-default hover:bg-transparent"
        >
          {/* Ícone da Unidade */}
          <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
            <GraduationCap className="size-4" />
          </div>
          
          {/* Textos Dinâmicos */}
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