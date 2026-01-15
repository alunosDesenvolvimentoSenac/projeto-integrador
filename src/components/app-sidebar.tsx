"use client"

import * as React from "react"
import {
  CalendarCheck,
  FileChartColumn,
  GraduationCap,
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
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// 2. ADICIONE O ITEM NO MENU
const DATA_MENU = {
  teams: [
    {
      name: "Senac Minas",
      logo: GraduationCap,
      plan: "LabManager",
    },
  ],
  navMain: [
    {
      title: "Agendamento",
      url: "#",
      icon: CalendarCheck,
      items: [
        {
          title: "Agendar Laboratório",
          url: "/dashboard",
        },
        {
           title: "Minha Agenda",
           url: "/agendamentosMeus",
        },
      ],
    },
    {
      title: "Solicitações",
      url: "#",
      icon: Inbox,
      items: [
        {
          title: "Pendências",
          url: "/solicitacoesAgendamentos",
        },
      ],
    },
    {
      title: "Relatórios",
      url: "#",
      icon: FileChartColumn,
      items: [
        {
          title: "Histórico",
          url: "/relatorios/historico",
        },
      ],
    },
    {
      title: "Usuários",
      url: "#",
      icon: Users,
      items: [
        {
          title: "Cadastrar Usuarios",
          url: "/cadastroUsuarios",
        },
      ],
    },
    {
      title: "Salas",
      url: "#",
      icon: LayoutGrid,
      items: [
        {
          title: "Cadastrar Salas",
          url: "/cadastroSalas",
        },        
      ],
    },
    {
      title: "Unidades",
      url: "#",
      icon: Building,
      items: [
        {
          title: "Cadastrar Unidades",
          url: "/cadastroUnidade",
        },        
      ],
    }, 
    {
      title: "Perfis",
      url: "#",
      icon: UserStar,
      items: [
        {
          title: "Cadastrar Perfis",
          url: "/cadastroPerfis",
        },        
      ],
    },           
    {
      title: "Equipamentos",
      url: "#",
      icon: Monitor,
      items: [
        {
          title: "Cadastrar Equipamentos",
          url: "/cadastroEquipamentos",
        },        
      ],
    },     
  ],
}

const ADMIN_ONLY_MENUS = ["Cadastros", "Solicitações", "Usuários", "Perfis", "Unidades", "Salas", "Equipamentos"];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  
  // 3. ATUALIZE O FILTRO INICIAL
  // Removemos tudo que estiver na lista ADMIN_ONLY_MENUS
  const menuPadrao = DATA_MENU.navMain.filter(item => !ADMIN_ONLY_MENUS.includes(item.title))
  
  const [menuItems, setMenuItems] = React.useState(menuPadrao)
  
  const [userData, setUserData] = React.useState({
    name: "Usuário", 
    email: "",
    avatar: "",
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
          })

          // SE for Admin, mostramos o MENU COMPLETO (incluindo Solicitações e Cadastros)
          if (infoBanco.cargo === "Administrador") {
            setMenuItems(DATA_MENU.navMain) 
          }
          // Se não for admin, ele mantém o 'menuPadrao' que já filtramos lá em cima
        }
      }
    })

    return () => unsubscribe()
  }, [])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher /> 
      </SidebarHeader>
      
      <SidebarContent>
        <NavMain items={menuItems} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}