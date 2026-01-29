"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label" 
// Importando os componentes do Dialog para o Modal
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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

  // Estados locais dos filtros
  const [term, setTerm] = useState(searchParams.get("term") || "")
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all")
  const [perfilFilter, setPerfilFilter] = useState(searchParams.get("perfil") || "all")

  // Estados do Modal de Criação Rápida
  const [novoNome, setNovoNome] = useState("")
  const [novoEmail, setNovoEmail] = useState("")
  const [novaUnidade, setNovaUnidade] = useState("")
  const [novoPerfil, setNovoPerfil] = useState("")
  const [novoDepartamento, setNovoDepartamento] = useState("") // 1. Estado adicionado

  // Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (term) params.set("term", term)
      else params.delete("term")
      router.replace(`?${params.toString()}`)
    }, 500)
    return () => clearTimeout(timer)
  }, [term]) 

  const handleFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== "all") {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.replace(`?${params.toString()}`)
  }

  const handleCreate = async () => {
      if (!novoNome || !novoEmail || !novaUnidade || !novoPerfil) {
        toast.error("Preencha todos os campos obrigatórios.")
        return
      }
      
      startTransition(async () => {
        const fakeUid = `user_${Date.now()}`
        
        // 2. Chamada corrigida com os 6 argumentos
        const res = await cadastrarUsuarioNoBanco(
            fakeUid, 
            novoNome, 
            novoEmail, 
            Number(novaUnidade), 
            Number(novoPerfil),
            novoDepartamento
        )
        
        if(res.success) {
            toast.success("Sucesso")
            setIsOpen(false)
            // Limpar campos
            setNovoNome("")
            setNovoEmail("")
            setNovaUnidade("")
            setNovoPerfil("")
            setNovoDepartamento("")
            router.refresh()
        } else {
            toast.error(res.message)
        }
      })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Usuários</h1>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Filtrar por nome ou e-mail..." 
            className="pl-8" 
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto">
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
          
          {/* 3. Botão ajustado para abrir o Modal (setIsOpen) ao invés de navegar */}
          <Button onClick={() => setIsOpen(true)}>
             Novo Usuário
          </Button>
        </div>
      </div>

      {/* 4. Modal de Criação Rápida */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
                <DialogTitle>Novo Usuário</DialogTitle>
                <DialogDescription>Preencha os dados para cadastro rápido.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label>Nome</Label>
                    <Input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} />
                </div>
                <div className="grid gap-2">
                    <Label>Email</Label>
                    <Input value={novoEmail} onChange={(e) => setNovoEmail(e.target.value)} />
                </div>
                
                {/* Campo de Departamento */}
                <div className="grid gap-2">
                    <Label>Departamento</Label>
                    <Input value={novoDepartamento} onChange={(e) => setNovoDepartamento(e.target.value)} placeholder="Ex: TI, RH..." />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label>Unidade</Label>
                        <Select value={novaUnidade} onValueChange={setNovaUnidade}>
                            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>
                                {unidades.map((u) => (
                                    <SelectItem key={u.idUnidade} value={String(u.idUnidade)}>{u.descricaoUnidade}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label>Perfil</Label>
                        <Select value={novoPerfil} onValueChange={setNovoPerfil}>
                            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>
                                {perfis.map((p) => (
                                    <SelectItem key={p.idPerfil} value={String(p.idPerfil)}>{p.descricaoPerfil}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreate} disabled={isPending}>{isPending ? "Salvando..." : "Salvar"}</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}