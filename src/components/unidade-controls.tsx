"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function UnidadeControls() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [term, setTerm] = useState(searchParams.get("term") || "")

  // Debounce para atualizar a URL apenas quando parar de digitar
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      
      if (term) params.set("term", term)
      else params.delete("term")

      router.replace(`?${params.toString()}`)
    }, 500)

    return () => clearTimeout(timer)
  }, [term, searchParams, router]) 

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Unidades</h1>
        
      
      </div>

      {/* Barra de Filtro */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar unidade..." 
            className="pl-8" 
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
        </div>
        <Button onClick={() => router.push("/cadastroUnidade")}>
          Nova Unidade
        </Button>
      </div>
    </div>
  )
}