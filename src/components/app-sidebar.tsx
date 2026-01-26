"use client"

import * as React from "react"
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
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarSeparator, // 1. IMPORTAR O SEPARATOR
} from "@/components/ui/sidebar"

const DATA_MENU = {
  teams: [],
  navMain: [
    {
      title: "Agendamento",
      url: "#",
      icon: CalendarCheck,
      items: [
        { title: "Agendar Sala", url: "/dashboard" },
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
      title: "Checklists", // Alterei o título "Checklists" para "Relatórios" conforme seu código anterior parecia indicar
      url: "#",
      icon: FileChartColumn,
      items: [
        { title: "Histórico", url: "/relatorios/historico" },
      ],
    },
    {
      title: "Usuários",
      url: "#",
      icon: Users,
      items: [
        { title: "Cadastrar Usuarios", url: "/cadastroUsuarios" },
        { title: "Exibir Usuarios", url: "/cadastroUsuarios/exibirUsuarios" },
      ],
    },
    {
      title: "Salas",
      url: "#",
      icon: LayoutGrid,
      items: [
        { title: "Cadastrar Salas", url: "/cadastroSalas" },
        { title: "Consultar Salas", url: "/cadastroSalas/exibirSalas" },
      ],
    },
    {
      title: "Unidades",
      url: "#",
      icon: Building,
      items: [
        { title: "Cadastrar Unidades", url: "/cadastroUnidade" },
        { title: "Consultar Unidades", url: "/cadastroUnidade/exibirUnidade" },
      ],
    },
    {
      title: "Perfis",
      url: "#",
      icon: UserStar,
      items: [
        { title: "Cadastrar Perfis", url: "/cadastroPerfis" },
        { title: "Consultar Perfis", url: "/cadastroPerfis/exibirPerfis" },
      ],
    },
    {
      title: "Equipamentos",
      url: "#",
      icon: Monitor,
      items: [
        { title: "Cadastrar Equipamentos", url: "/cadastroEquipamentos" },
        { title: "Consultar Equipamentos", url: "/exibirEquipamentos" },
      ],
    },
  ],
}

// Lista de itens que ficam na parte de baixo (CRUDs)
const ADMIN_ONLY_MENUS = ["Usuários", "Perfis", "Unidades", "Salas", "Equipamentos", "Solicitações", "Cadastros"];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  
  const [isAdmin, setIsAdmin] = React.useState(false)
  
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

          if (infoBanco.cargo === "Administrador") {
            setIsAdmin(true)
          } else {
            setIsAdmin(false)
          }
        }
      }
    })

    return () => unsubscribe()
  }, [])

  // 2. LÓGICA DE SEPARAÇÃO DOS ITENS
  const { menuGeral, menuAdmin } = React.useMemo(() => {
    // Itens gerais (disponíveis para todos ou que não são CRUDs pesados)
    // Filtramos: Itens que NÃO estão na lista ADMIN_ONLY_MENUS
    const geral = DATA_MENU.navMain.filter(item => !ADMIN_ONLY_MENUS.includes(item.title));
    
    // Itens Admin (CRUDs)
    // Se for admin, pega os itens que ESTÃO na lista. Se não for admin, array vazio.
    const admin = isAdmin 
      ? DATA_MENU.navMain.filter(item => ADMIN_ONLY_MENUS.includes(item.title)) 
      : [];

    return { menuGeral: geral, menuAdmin: admin }
  }, [isAdmin])


  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher /> 
      </SidebarHeader>
      
      <SidebarContent className="overflow-x-hidden">
        {/* GRUPO 1: GERAL (Sempre aparece) */}
        <NavMain items={menuGeral} label="Sistema de Agendamento" />

        {/* SEPARADOR E GRUPO 2: ADMIN (Só aparece se tiver itens) */}
        {menuAdmin.length > 0 && (
          <>
            
            <NavMain items={menuAdmin} label="Gerenciamento" />
          </>
        )}
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}