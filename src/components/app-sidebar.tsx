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
  Info
} from "lucide-react"
import Image from "next/image"
import { usePathname } from "next/navigation"

import { useUser } from "@/components/user-provider" // Seu UserProvider criado anteriormente

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

// ... (DATA_MENU, ADMIN_ONLY_MENUS, INFO_MENUS mantidos iguais) ...
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
        { title: "Histórico", url: "/checklist" },
      ],
    },
    {
      title: "Usuários",
      url: "#",
      icon: Users,
      items: [
        { title: "Cadastrar Usuarios", url: "/cadastroUsuarios" },
        { title: "Consultar Usuarios", url: "/cadastroUsuarios/exibirUsuarios" },
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
      title: "Salas",
      url: "#",
      icon: LayoutGrid,
      items: [
        { title: "Cadastrar Salas", url: "/cadastroSalas" },
        { title: "Consultar Salas", url: "/cadastroSalas/exibirSalas" },
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

const ADMIN_ONLY_MENUS = ["Usuários", "Perfis", "Unidades", "Salas", "Equipamentos", "Cadastros"];
const INFO_MENUS = ["Sobre"];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  
  const { isAdmin, userData, isLoading } = useUser() 
  const pathname = usePathname()

  // 1. ESTADO DE PERSISTÊNCIA (Dicionário: { "Agendamento": true, "Salas": false })
  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>({})

  // 2. CARREGAR DO CACHE AO INICIAR
  React.useEffect(() => {
    const saved = localStorage.getItem("sidebar-open-groups")
    if (saved) {
      try {
        setOpenGroups(JSON.parse(saved))
      } catch (e) {
        console.error("Erro ao ler cache da sidebar", e)
      }
    }
  }, [])

  // 3. SINCRONIZAR COM A URL (Se eu navego, o grupo da página TEM que abrir)
  React.useEffect(() => {
    // Descobre qual grupo deve estar ativo baseado na URL
    const activeGroup = DATA_MENU.navMain.find(item => 
        item.items?.some(subItem => pathname === subItem.url || pathname.startsWith(`${subItem.url}/`))
    );

    if (activeGroup) {
        setOpenGroups(prev => {
            // Se já está aberto, não faz nada (evita re-render desnecessário)
            if (prev[activeGroup.title]) return prev;
            
            // Se estava fechado, abre e salva no cache
            const newState = { ...prev, [activeGroup.title]: true }
            localStorage.setItem("sidebar-open-groups", JSON.stringify(newState))
            return newState
        })
    }
  }, [pathname])

  // 4. FUNÇÃO DE TOGGLE (Chamada quando o usuário clica no menu)
  const handleToggle = (title: string, isOpen: boolean) => {
      setOpenGroups(prev => {
          const newState = { ...prev, [title]: isOpen }
          localStorage.setItem("sidebar-open-groups", JSON.stringify(newState))
          return newState
      })
  }

  const { menuGeral, menuAdmin, menuInfo } = React.useMemo(() => {
    if (isLoading) return { menuGeral: [], menuAdmin: [], menuInfo: [] };

    // Mapeia os itens aplicando o estado 'isActive' baseado no nosso estado local (openGroups)
    const mapWithState = (items: typeof DATA_MENU.navMain) => {
        return items.map(item => ({
            ...item,
            // AQUI ESTÁ A MÁGICA: O estado vem do nosso dicionário openGroups
            isActive: !!openGroups[item.title] 
        }))
    }

    const allItems = mapWithState(DATA_MENU.navMain);

    const geral = allItems.filter(item => {
        if (ADMIN_ONLY_MENUS.includes(item.title) || INFO_MENUS.includes(item.title)) return false;
        if (item.title === "Solicitações" && !isAdmin) return false;
        return true;
    });
    
    const admin = isAdmin 
      ? allItems.filter(item => ADMIN_ONLY_MENUS.includes(item.title)) 
      : [];

    const info = allItems.filter(item => INFO_MENUS.includes(item.title));

    return { menuGeral: geral, menuAdmin: admin, menuInfo: info }
  }, [isAdmin, isLoading, openGroups]) // openGroups é dependência agora

  if (isLoading) return null; 

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex h-12 items-center justify-center py-2 group-data-[collapsible=icon]:p-0">
            <div className="relative h-8 w-full px-2 group-data-[collapsible=icon]:hidden">
                 <Image src={senaclogomenu} alt="Logo Senac" height={120} width={120} className="object-contain object-left" priority />
            </div>
            <div className="hidden group-data-[collapsible=icon]:block relative h-8 w-8">
                 <Image src={sidebarlogo} alt="Icone" fill className="object-contain" />
            </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="overflow-x-hidden">
        {/* Passamos o handleToggle para o NavMain */}
        <NavMain items={menuGeral} label="Agendamento" onToggle={handleToggle} />

        {menuAdmin.length > 0 && (
          <>
            
            <NavMain items={menuAdmin} label="Gerenciamento" onToggle={handleToggle} />
          </>
        )}

        {menuInfo.length > 0 && (
          <>
             
             <NavMain items={menuInfo} label="Informações" onToggle={handleToggle} />
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