"use client"

import { cn } from "@/lib/utils"
import { AgendamentoComDetalhes } from "@/types"

interface EventPillProps {
  app: AgendamentoComDetalhes
}

export function EventPill({ app }: EventPillProps) {
  // Cores apenas para a "Bolinha" (Dot)
  const dotColors = {
    Manhã: "bg-sky-500", 
    Tarde: "bg-orange-500", 
    Noite: "bg-indigo-500", 
  }

  const isPendente = app.status === 'pendente';

  return (
    <div 
      className={cn(
        "group flex items-center gap-3 px-2.5 py-1.5 rounded-md border text-xs font-medium transition-all duration-200",
        // Estilos Base
        "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 shadow-sm",
        "hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md",
        
        // Estilo Pendente (Borda tracejada e texto levemente avermelhado)
        isPendente && "bg-red-50/30 border-dashed border-red-200 dark:border-red-900/50"
      )}
    >
      {/* 1. Indicador de Cor (Dot) */}
      <div 
        className={cn(
          "h-2 w-2 rounded-full ring-1 ring-offset-1 ring-offset-white dark:ring-offset-zinc-950 shrink-0",
          isPendente 
            ? "bg-red-500 ring-transparent" 
            : cn(dotColors[app.periodo], "ring-transparent group-hover:ring-zinc-200 dark:group-hover:ring-zinc-700")
        )} 
      />
      
      <div className="flex flex-1 items-center gap-2.5 overflow-hidden">
          {/* 2. Sigla do Período (Largura Fixa para Alinhamento Perfeito) */}
          <span className={cn(
            "text-[10px] font-bold uppercase tracking-widest shrink-0 w-[24px] text-center", // w-24px garante o alinhamento
            isPendente ? "text-red-600/70" : "text-muted-foreground/60"
          )}>
            {app.periodo.slice(0, 3)}
          </span>

          {/* 3. Separador Vertical Sutil */}
          <div className="h-3 w-[1px] bg-zinc-200 dark:bg-zinc-800 shrink-0 group-hover:bg-zinc-300 transition-colors" />

          {/* 4. Nome do Docente */}
          <span className={cn(
            "truncate leading-none flex-1",
            isPendente ? "text-red-900/80 dark:text-red-200" : "text-zinc-700 dark:text-zinc-200"
          )}>
            {app.docente}
          </span>
      </div>
    </div>
  )
}