"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { auth } from "@/lib/firebase"
import { onAuthStateChanged, User } from "firebase/auth"
import { getDadosUsuarioSidebar } from "@/app/actions/auth"

// Definindo o formato dos dados
interface UserContextData {
  user: User | null; // Usuário do Firebase
  userData: {
    name: string;
    email: string;
    avatar: string;
    role: string;
    id: number; // Adicionei o ID aqui pois é usado no dashboard
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
    id: 0
  })

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        
        try {
          // Busca dados no banco (Server Action)
          const infoBanco = await getDadosUsuarioSidebar(firebaseUser.uid)
          
          if (infoBanco) {
            const role = infoBanco.cargo || "Usuário"
            const isAdminCheck = role === "Administrador" || infoBanco.id_perfil === 1

            setUserData({
              name: infoBanco.nomeUsuario || firebaseUser.displayName || "Usuário",
              email: firebaseUser.email || "",
              avatar: firebaseUser.photoURL || "",
              role: role,
              id: Number(infoBanco.idUsuario || infoBanco.id)
            })
            setIsAdmin(isAdminCheck)
          }
        } catch (error) {
          console.error("Erro ao buscar dados do usuário:", error)
        }
      } else {
        // Reset se deslogar
        setUser(null)
        setIsAdmin(false)
        setUserData({ name: "Visitante", email: "", avatar: "", role: "", id: 0 })
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

// Hook personalizado para usar os dados em qualquer lugar
export const useUser = () => useContext(UserContext)