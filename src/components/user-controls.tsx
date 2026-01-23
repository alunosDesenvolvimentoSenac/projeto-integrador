"use client"

import { useState, useTransition, useEffect } from "react" // Adicione useEffect
import { useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
// ... (mantenha os outros imports iguais) ... imports de dialog, select, sonner, etc.
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { toast } from "sonner"
import { cadastrarUsuarioNoBanco } from "@/app/actions/admin"

interface UserControlsProps {
  unidades: any[]
  perfis: any[]
}

export function UserControls({ unidades, perfis }: UserControlsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [isOpen, setIsOpen] = useState(false)

  // Estados locais
  const [term, setTerm] = useState(searchParams.get("term") || "")
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all")
  const [perfilFilter, setPerfilFilter] = useState(searchParams.get("perfil") || "all")

  // Estados do Modal
  const [novoNome, setNovoNome] = useState("")
  const [novoEmail, setNovoEmail] = useState("")
  const [novaUnidade, setNovaUnidade] = useState("")
  const [novoPerfil, setNovoPerfil] = useState("")

  // EFEITO DE DEBOUNCE: Só atualiza a URL 500ms depois de parar de digitar
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      
      if (term) params.set("term", term)
      else params.delete("term")

      router.replace(`?${params.toString()}`)
    }, 500)

    return () => clearTimeout(timer)
  }, [term]) // Removemos router e searchParams das dependências para evitar loop

  // Função para os Selects (Status e Perfil) - Atualiza Imediatamente
  const handleFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== "all") {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.replace(`?${params.toString()}`)
  }

  // A função handleCreate continua igual a anterior...
  const handleCreate = async () => {
     // ... (código do cadastro igual ao anterior)
     if (!novoNome || !novoEmail || !novaUnidade || !novoPerfil) {
        toast.error("Preencha todos os campos.")
        return
     }
     startTransition(async () => {
        const fakeUid = `user_${Date.now()}`
        const res = await cadastrarUsuarioNoBanco(fakeUid, novoNome, novoEmail, Number(novaUnidade), Number(novoPerfil))
        if(res.success) {
            toast.success("Sucesso")
            setIsOpen(false)
            router.refresh()
        } else {
            toast.error(res.message)
        }
     })
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho igual */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Usuários</h1>
        
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Filtrar por nome ou e-mail..." 
            className="pl-8" 
            value={term}
            onChange={(e) => setTerm(e.target.value)} // Apenas atualiza estado, o useEffect faz o replace
          />
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <Select 
            value={statusFilter} 
            onValueChange={(val) => {
              setStatusFilter(val)
              handleFilter("status", val)
            }}
          >
            <SelectTrigger className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="inativo">Inativo</SelectItem>
            </SelectContent>
          </Select>

          <Select 
            value={perfilFilter} 
            onValueChange={(val) => {
              setPerfilFilter(val)
              handleFilter("perfil", val)
            }}
          >
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Perfil" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Perfis</SelectItem>
              {perfis.map((p) => (
                <SelectItem key={p.idPerfil} value={String(p.idPerfil)}>{p.descricaoPerfil}</SelectItem>
              ))}
            </SelectContent>
          </Select>
           <Button onClick={() => router.push("/cadastroUsuarios")}>
                Novo Usuário
            </Button>
      </div>
        </div>
      </div>
  )
}