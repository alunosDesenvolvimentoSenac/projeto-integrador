"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function PerfilControls() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [term, setTerm] = useState(searchParams.get("term") || "")
  const [typeFilter, setTypeFilter] = useState(searchParams.get("type") || "all")

  // Debounce da busca
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Perfis de Acesso</h1>
        
        
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar perfil..." 
            className="pl-8" 
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <Select 
            value={typeFilter} 
            onValueChange={(val) => {
              setTypeFilter(val)
              handleFilter("type", val)
            }}
          >
            <SelectTrigger className="w-full sm:w-[160px]">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Filter className="h-3 w-3" />
                <SelectValue placeholder="Tipo" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="admin">Administrador</SelectItem>
              <SelectItem value="common">Comum</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => router.push("/cadastroPerfis")}>
          Novo Perfil
        </Button>
        </div>
      </div>
    </div>
  )
}