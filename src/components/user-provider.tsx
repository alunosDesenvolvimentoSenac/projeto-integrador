"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { auth } from "@/lib/firebase"
import { onAuthStateChanged, User } from "firebase/auth"
import { getDadosUsuarioSidebar } from "@/app/actions/auth"

interface UserContextData {
  user: User | null;
  userData: {
    name: string;
    email: string;
    avatar: string;
    role: string;
    id: number;
    unidadeId?: number;
  };
  isAdmin: boolean;
  isLoading: boolean;
}

const UserContext = createContext<UserContextData>({} as UserContextData)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  const [userData, setUserData] = useState({
    name: "Visitante",
    email: "",
    avatar: "",
    role: "",
    id: 0,
    unidadeId: 0
  })

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        
        try {
          const response = await getDadosUsuarioSidebar(firebaseUser.uid)
          // Forçamos 'any' para ler qualquer propriedade que vier do banco
          const infoBanco = response as any;
          
          if (infoBanco) {
            // Tenta todas as variações possíveis de nomes de coluna
            const nomeReal = infoBanco.nome || infoBanco.nomeUsuario || infoBanco.nome_usuario || firebaseUser.displayName || "Usuário";
            const perfilReal = infoBanco.descricaoPerfil || infoBanco.descricao_perfil || infoBanco.cargo || "Usuário";
            
            const isAdminCheck = 
                infoBanco.isAdmin === true || 
                infoBanco.idPerfil === 1 || 
                perfilReal === "Administrador";

            setUserData({
              name: nomeReal,
              email: infoBanco.email || firebaseUser.email || "",
              avatar: firebaseUser.photoURL || "",
              role: perfilReal,
              id: Number(infoBanco.idUsuario || infoBanco.id),
              unidadeId: Number(infoBanco.idUnidade)
            })
            setIsAdmin(isAdminCheck)
          }
        } catch (error) {
          console.error("Erro ao buscar dados do usuário:", error)
        }
      } else {
        setUser(null)
        setIsAdmin(false)
        setUserData({ name: "Visitante", email: "", avatar: "", role: "", id: 0, unidadeId: 0 })
      }
      
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return (
    <UserContext.Provider value={{ user, userData, isAdmin, isLoading }}>
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => useContext(UserContext)