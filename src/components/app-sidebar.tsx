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
          url: "dashboard",
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
          title: "Cadastrar Usuários",
          url: "/cadastroUsuario",
        },
        {
          title: "Cadastrar Equipamentos",
          url: "#",
        },
        {
          title: "Cadastrar Laboratórios",
          url: "#",
        },
       
      ],
    },

    
   
    
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  
  // ESTRATÉGIA: Começa com o menu "Padrão" (Filtrado para Docente)
  // Assim o usuário vê algo imediatamente, sem esperar loading.
  const menuPadrao = DATA_MENU.navMain.filter(item => item.title !== "Cadastros")
  
  const [menuItems, setMenuItems] = React.useState(menuPadrao)
  
  // Estado inicial mais limpo para não parecer "quebrado" enquanto carrega
  const [userData, setUserData] = React.useState({
    name: "Usuário", 
    email: "",
    avatar: "",
  })

  // REMOVI O STATE DE LOADING QUE BLOQUEAVA A TELA

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Atualiza email visualmente rápido
        setUserData(prev => ({ ...prev, email: user.email || "" }))

        // Busca dados no Banco (Neon) em segundo plano
        const infoBanco = await getDadosUsuarioSidebar(user.uid)
        
        if (infoBanco) {
          // Atualiza o nome quando chegar
          setUserData({
            name: infoBanco.nomeUsuario,
            email: user.email || "",
            avatar: "",
          })

          // SE for Admin, nós "adicionamos" o menu que faltava
          if (infoBanco.cargo === "Administrador") {
            setMenuItems(DATA_MENU.navMain) // Mostra tudo
          }
          // Se for Docente, não precisa fazer nada, pois já iniciou filtrado.
        }
      }
    })

    return () => unsubscribe()
  }, [])

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
