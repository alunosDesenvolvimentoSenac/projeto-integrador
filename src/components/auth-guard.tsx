"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useUser } from "@/components/user-provider"
import { Loader2 } from "lucide-react"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useUser() // Pega dados do seu UserProvider
  const router = useRouter()
  const pathname = usePathname()

  // Rotas que são públicas (não precisam de login)
  // Adicione aqui a rota de recuperação de senha ou 'sobre' se for pública
  const publicRoutes = ["/", "/recovery", "/sobre"]

  useEffect(() => {
    // Só executa se o carregamento do Firebase terminou
    if (!isLoading) {
      const isPublicRoute = publicRoutes.includes(pathname)

      // Se NÃO tem usuário e NÃO está numa rota pública -> Manda pro Login
      if (!user && !isPublicRoute) {
        router.push("/") 
      }
      
      // (Opcional) Se TEM usuário e ele tenta ir pro Login -> Manda pro Dashboard
      if (user && pathname === "/") {
        router.push("/dashboard")
      }
    }
  }, [user, isLoading, router, pathname])

  // 1. Enquanto carrega o Firebase, mostra um loading bonito
  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Verificando credenciais...</p>
      </div>
    )
  }

  // 2. Se não tem usuário e a rota é privada, não renderiza nada (para evitar "piscar" a tela antes de redirecionar)
  if (!user && !publicRoutes.includes(pathname)) {
    return null
  }

  // 3. Se está tudo ok, renderiza a página
  return <>{children}</>
}