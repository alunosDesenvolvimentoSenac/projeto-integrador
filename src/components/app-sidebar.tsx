"use client"

import senaclogomenu from "@/app/assets/senaclogo.svg"
import sidebarlogo from "@/app/assets/sidebarlogo.svg"
import * as React from "react"
import {
  CalendarCheck,
  FileChartColumn,
  Users,
  Inbox,
  Monitor,
  Building,
  LayoutGrid,
  UserStar,
  Info // 1. Importe o ícone Info
} from "lucide-react"
import Image from "next/image"

import { auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { getDadosUsuarioSidebar } from "@/app/actions/auth"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarSeparator,
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
      title: "Checklists",
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
        { title: "Consultar Equipamentos", url: "/cadastroEquipamentos/exibirEquipamentos" },
      ],
    },
    // 2. Adicione o item "Sobre" aqui no DATA_MENU
    {
      title: "Sobre",
      url: "#",
      icon: Info,
      items: [
        { title: "Sobre o Projeto", url: "/sobre" },
      ],
    },
  ],
}

// Listas de definição de grupos
const ADMIN_ONLY_MENUS = ["Usuários", "Perfis", "Unidades", "Salas", "Equipamentos", "Solicitações", "Cadastros"];
const INFO_MENUS = ["Sobre"]; // Novo grupo para informações

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  
  const [isAdmin, setIsAdmin] = React.useState(false)
  
  const [userData, setUserData] = React.useState({
    name: "Usuário", 
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
            setIsAdmin(true)
          } else {
            setIsAdmin(false)
          }
        }
      }
    })

    return () => unsubscribe()
  }, [])

  // 3. ATUALIZADA A LÓGICA DE SEPARAÇÃO (AGORA COM 3 GRUPOS)
  const { menuGeral, menuAdmin, menuInfo } = React.useMemo(() => {
    // Grupo 1: Geral (Tudo que NÃO é Admin E NÃO é Info)
    const geral = DATA_MENU.navMain.filter(item => 
      !ADMIN_ONLY_MENUS.includes(item.title) && !INFO_MENUS.includes(item.title)
    );
    
    // Grupo 2: Admin (Apenas se for admin)
    const admin = isAdmin 
      ? DATA_MENU.navMain.filter(item => ADMIN_ONLY_MENUS.includes(item.title)) 
      : [];

    // Grupo 3: Informações (Sempre visível, itens da lista INFO_MENUS)
    const info = DATA_MENU.navMain.filter(item => INFO_MENUS.includes(item.title));

    return { menuGeral: geral, menuAdmin: admin, menuInfo: info }
  }, [isAdmin])


  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex h-12 items-center justify-center py-2 group-data-[collapsible=icon]:p-0">
            <div className="relative h-8 w-full px-2 group-data-[collapsible=icon]:hidden">
                 <Image 
                    src={senaclogomenu} 
                    alt="Logo Senac Completa" 
                    height={120}
                    width={120}
                    className="object-contain object-left" 
                    priority
                 />
            </div>
            <div className="hidden group-data-[collapsible=icon]:block relative h-8 w-8">
                 <Image 
                    src={sidebarlogo} 
                    alt="Logo Senac Ícone" 
                    fill 
                    className="object-contain" 
                 />
            </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="overflow-x-hidden">
        {/* GRUPO 1: GERAL */}
        <NavMain items={menuGeral} label="Sistema de Agendamento" />

        {/* GRUPO 2: ADMIN (Se houver) */}
        {menuAdmin.length > 0 && (
          <>
            
            <NavMain items={menuAdmin} label="Gerenciamento" />
          </>
        )}

        {/* GRUPO 3: INFORMAÇÕES (Novo Grupo) */}
        {menuInfo.length > 0 && (
          <>
             
             <NavMain items={menuInfo} label="Informações" />
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