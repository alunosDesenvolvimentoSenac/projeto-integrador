"use client"

import { cn } from "@/lib/utils"
import { AgendamentoComDetalhes } from "@/types"

interface EventPillProps {
  app: AgendamentoComDetalhes
}

export function EventPill({ app }: EventPillProps) {
  const styles = {
    Manhã: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    Tarde: "bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800",
    Noite: "bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800",
  }

  const isPendente = app.status === 'pendente';
  const finalStyle = isPendente 
     ? "bg-amber-50 text-amber-700 border-amber-200 border-dashed dark:bg-amber-950/40 dark:text-amber-300" 
     : styles[app.periodo];

  return (
    // MUDANÇAS AQUI:
    // 1. text-[11px] -> text-xs (aumenta fonte)
    // 2. px-2 py-0.5 -> px-3 py-1.5 (aumenta o "gordo" do card)
    // 3. mb-1 (adiciona um espacinho extra entre eles)
    <div className={cn("text-xs px-2 py-0.5 rounded-md border truncate font-medium flex items-center gap-2 shadow-sm mb-0.5", finalStyle)}>
      {/* Aumentei a bolinha também de w-1.5 para w-2 */}
      <div className={cn("w-2 h-2 rounded-full shrink-0", isPendente ? "bg-amber-500" : "bg-current opacity-60")} />
      
      <span className="truncate leading-tight">
          <span className="font-bold mr-1 opacity-80">{app.periodo.charAt(0)}:</span>
          {app.docente}
      </span>
    </div>
  )
}