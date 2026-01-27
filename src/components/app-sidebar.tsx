"use client"

import * as React from "react"
import Image from "next/image"
import {
  CalendarCheck,
  FileChartColumn,
  Users,
  Inbox,
  Monitor,
  Building,
  LayoutGrid,
  UserStar
} from "lucide-react"

import { auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { getDadosUsuarioSidebar } from "@/app/actions/auth"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { Separator } from "@/components/ui/separator" 
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

const DATA_MENU = {
  teams: [
    {
      name: "Senac",
      plan: "Corporativo",
    },
  ],
  navMain: [
    {
      title: "Agendamento",
      url: "#",
      icon: CalendarCheck,
      items: [
        { title: "Agendar Laboratório", url: "/dashboard" },
        { title: "Minha Agenda", url: "/agendamentosMeus" },
      ],
    },
    {
        title: "Solicitações",
        url: "#",
        icon: Inbox,
        items: [
          { title: "Pendências", url: "/solicitacoesAgendamentos" },
        ],
    },
    {
        title: "Relatórios",
        url: "#",
        icon: FileChartColumn,
        items: [
          { title: "Histórico", url: "/checklist" },
        ],
    },
    {
        title: "Usuários",
        url: "#",
        icon: Users,
        items: [
          { title: "Consultar Usuarios", url: "/usuarios/consultarUsuarios" },
          { title: "Cadastrar Usuarios", url: "/usuarios/cadastrarUsuarios" }, 
        ],
    },
    {
        title: "Salas",
        url: "#",
        icon: LayoutGrid,
        items: [
          { title: "Consultar Salas", url: "/salas/consultarSalas" },
          { title: "Cadastrar Salas", url: "/salas/cadastrarSalas" },        
        ],
    },
    {
        title: "Unidades",
        url: "#",
        icon: Building,
        items: [
          { title: "Consultar Unidades", url: "/unidade/consultarUnidades" },        
          { title: "Cadastrar Unidades", url: "/unidade/cadastrarUnidades" },                
        ],
    }, 
    {
        title: "Perfis",
        url: "#",
        icon: UserStar,
        items: [
          { title: "Consultar Perfis", url: "/perfis/consultarPerfis" },        
          { title: "Cadastrar Perfis", url: "/perfis/cadastrarPerfis" },        
        ],
    },          
    {
        title: "Equipamentos",
        url: "#",
        icon: Monitor,
        items: [
          { title: "Consultar Equipamentos", url: "/equipamentos/consultarEquipamentos" },        
          { title: "Cadastrar Equipamentos", url: "/equipamentos/cadastrarEquipamentos" },                
        ],
    },
  ],
}

const ADMIN_ONLY_MENUS = ["Cadastros", "Solicitações", "Usuários", "Perfis", "Unidades", "Salas", "Equipamentos", "Relatórios"];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  
  const menuPadrao = DATA_MENU.navMain.filter(item => !ADMIN_ONLY_MENUS.includes(item.title))
  
  const [menuItems, setMenuItems] = React.useState(menuPadrao)
  
  const [userData, setUserData] = React.useState({
    name: "Carregando...", 
    email: "",
    avatar: "",
    role: "" 
  })

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserData(prev => ({ ...prev, email: user.email || "" }))

        const infoBanco = await getDadosUsuarioSidebar(user.uid)
        
        if (infoBanco) {
          setUserData({
            name: infoBanco.nomeUsuario,
            email: user.email || "",
            avatar: "",
            role: infoBanco.cargo || "Usuário"
          })

          if (infoBanco.cargo === "Administrador") {
            setMenuItems(DATA_MENU.navMain) 
          }
        }
      }
    })

    return () => unsubscribe()
  }, [])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex h-12 items-center justify-center py-2 group-data-[collapsible=icon]:p-0">
            
            <div className="relative h-8 w-full px-2 group-data-[collapsible=icon]:hidden">
                 <Image 
                    src="/senaclogomenu.5a93f6af.svg" 
                    alt="Logo Senac Completa" 
                    fill 
                    className="object-contain object-left" 
                    priority
                 />
            </div>

            <div className="hidden group-data-[collapsible=icon]:block relative h-8 w-8">
                 <Image 
                    src="/logo1.png" 
                    alt="Logo Senac Ícone" 
                    fill 
                    className="object-contain" 
                 />
            </div>

        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <NavMain items={menuItems} />
      </SidebarContent>

      <SidebarFooter>
        <Separator className="mb-2 bg-sidebar-border" />
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}