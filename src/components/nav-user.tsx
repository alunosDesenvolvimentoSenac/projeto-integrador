"use client"

import * as React from "react"
import { ChevronsUpDown, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { signOut, onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase" 
import { getDadosUsuarioSidebar } from "@/app/actions/auth"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
    role: string 
  }
}) {
  const { isMobile } = useSidebar()
  const router = useRouter()

  // 1. Estado para armazenar o cargo
  const [cargo, setCargo] = React.useState("Carregando...")

  // 2. Busca os dados assim que o componente carrega
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          // Busca o dado real no banco
          const info = await getDadosUsuarioSidebar(currentUser.uid)
          
          if (info && info.cargo) {
            setCargo(info.cargo)
          } else {
            setCargo(user.role || "Usuário") // Fallback
          }
        } catch (error) {
          console.error("Erro ao buscar dados do usuário:", error)
          setCargo("Erro ao carregar")
        }
      }
    })

    // Limpa o listener quando o componente desmonta
    return () => unsubscribe()
  }, [user.role])

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.replace("/") 
    } catch (error) {
      console.error("Erro ao deslogar:", error)
    }
  }

  const getInitials = (name: string) => {
    if (!name) return "CN";
    const parts = name.trim().split(" ").filter(Boolean);
    if (parts.length === 0) return "CN";
    const firstInitial = parts[0][0];
    const secondInitial = parts[1] ? parts[1][0] : "";
    return (firstInitial + secondInitial).toUpperCase();
  }

  const userInitials = getInitials(user.name);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">{userInitials}</AvatarFallback>
              </Avatar>
              
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.name}</span>
                <span className="truncate text-xs font-medium text-zinc-500">
                    {cargo}
                </span>
                {/* <span className="truncate text-[10px] text-muted-foreground">{user.email}</span> */}
              </div>
              
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">{userInitials}</AvatarFallback>
                </Avatar>
                
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  
                  <span className="truncate text-[10px] font-medium text-primary mt-1">
                      {cargo}
                  </span>

                  <span className="truncate text-[10px] text-muted-foreground">{user.email}</span>
                </div>

              </div>
            </DropdownMenuLabel>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-500 hover:text-red-600 focus:text-red-600 focus:bg-red-50">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}