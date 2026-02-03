"use client"

import { useMemo } from "react";
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, Filter, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface SalaOption {
  id: number
  nome: string
  codigo: string
}

interface EquipamentoControlsProps {
  salas: SalaOption[]
}

export function EquipamentoControls({ salas }: EquipamentoControlsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [term, setTerm] = useState(searchParams.get("term") || "")
  const [salaId, setSalaId] = useState(searchParams.get("salaId") || "all")
  const [status, setStatus] = useState(searchParams.get("status") || "all")
  const [estoque, setEstoque] = useState(searchParams.get("estoque") || "all")

  // Verifica se há algum filtro ativo para mostrar o botão de limpar
  const hasActiveFilters = term || salaId !== "all" || status !== "all" || estoque !== "all"

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (term) params.set("term", term)
      else params.delete("term")
      router.replace(`?${params.toString()}`)
    }, 500)
    return () => clearTimeout(timer)
  }, [term, searchParams, router]) 

  const handleFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== "all") {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.replace(`?${params.toString()}`)
  }

  const clearFilters = () => {
    setTerm("")
    setSalaId("all")
    setStatus("all")
    setEstoque("all")
    router.replace("?")
  }

  // Cria uma cópia da lista e ordena pelo código
const salasOrdenadas = useMemo(() => {
    return [...salas].sort((a, b) => {
        // O localeCompare com numeric: true garante que "Sala 2" venha antes de "Sala 10"
        return a.codigo.localeCompare(b.codigo, undefined, { numeric: true });
    });
}, [salas]);

  return (
    <div className="space-y-4">
      {/* Cabeçalho com Título e Botão Novo */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Equipamentos</h1>
        
        
      </div>

      {/* Barra de Filtros Unificada (Tudo na mesma linha em telas grandes) */}
      <div className="flex flex-col md:flex-row gap-2">
        {/* Input de Busca (Ocupa o espaço restante) */}
        <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
                placeholder="Buscar equipamento..." 
                className="pl-8 bg-white" 
                value={term}
                onChange={(e) => setTerm(e.target.value)}
            />
        </div>
        
        {/* Selects e Botões (Agrupados para responsividade) */}
        <div className="flex flex-row gap-2 overflow-x-auto pb-1 md:pb-0">
            <Select value={salaId} onValueChange={(val) => { setSalaId(val); handleFilter("salaId", val); }}>
                <SelectTrigger className="w-[180px] md:w-[220px] bg-white">
                    <SelectValue placeholder="Todas as Salas" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todas as Salas</SelectItem>
                    {/* AQUI: Mapeie sobre salasOrdenadas ao invés de salas */}
                    {salasOrdenadas.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                            {s.codigo} - {s.nome}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select value={status} onValueChange={(val) => { setStatus(val); handleFilter("status", val); }}>
                <SelectTrigger className="w-[130px] bg-white">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Filter className="h-3 w-3" />
                        <SelectValue placeholder="Status" />
                    </div>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="ativo">Ativos</SelectItem>
                    <SelectItem value="inativo">Inativos</SelectItem>
                </SelectContent>
            </Select>

            <Button onClick={() => router.push("/cadastroEquipamentos")}>
                <Plus className="mr-2 h-4 w-4" /> Novo Equipamento
            </Button>

            

            {/* Botão de Limpar (Só aparece se houver filtros) */}
            {hasActiveFilters && (
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={clearFilters}
                    title="Limpar Filtros"
                    className="shrink-0 text-muted-foreground hover:text-red-500"
                >
                    <X className="h-4 w-4" />
                </Button>
            )}
        </div>
      </div>
    </div>
  )
}