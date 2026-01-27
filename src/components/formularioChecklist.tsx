"use client"

import * as React from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { 
  Layers, 
  Box, 
  CheckCircle2, 
  AlertTriangle,
  Loader2,
  Save,
  ImageIcon,
  ArrowRight,
  ArrowLeft,
  X,
  Brush,
  ClipboardList
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns" 
import { ptBR } from "date-fns/locale"

export function ChecklistForm({ equipamentos = [], onSubmit, onClose, isSubmitting, dadosAgendamento }: any) {
  const [localSubmitting, setLocalSubmitting] = React.useState(false)
  
  const hasEquipments = equipamentos && equipamentos.length > 0
  const [step, setStep] = React.useState(hasEquipments ? 1 : 2)
  const [checks, setChecks] = React.useState({
    limpeza: true,
    equipamentos: true
  })

  const [dadosSala, setDadosSala] = React.useState({
    status: 'conforme' as 'conforme' | 'problema', 
    observacaoGeral: ""
  })

  React.useEffect(() => {
      if (!hasEquipments) {
          setStep(2)
          setChecks(prev => ({ ...prev, equipamentos: true }))
      }
  }, [hasEquipments])

  const handleCheckChange = (field: 'limpeza' | 'equipamentos', value: boolean) => {
      setChecks(prev => ({ ...prev, [field]: value }))
      if (!value) {
          setDadosSala(prev => ({ ...prev, status: 'problema' }))
      }
  }

  const handleSubmit = () => {
    setLocalSubmitting(true)
    
    const itensParaSalvar = equipamentos.map((eq: any) => ({
        idEquipamento: eq.idEquipamento,
        tudoOk: true, 
        possuiAvaria: false,
        detalhesAvaria: null
    }))

    onSubmit({
      itens: itensParaSalvar,
      materialOk: checks.equipamentos, 
      limpezaOk: checks.limpeza,
      observacaoGeral: dadosSala.observacaoGeral
    })
  }

  const isLoading = isSubmitting || localSubmitting
  const progressValue = hasEquipments ? (step / 2) * 100 : 100
  const containerHeight = dadosAgendamento?.isSeries ? "h-[70vh]" : "h-[63.5vh]"

  return (
    <div className={cn("flex flex-col w-full relative bg-white dark:bg-zinc-950 overflow-hidden", containerHeight)}>
      
      {/* --- 1. CABEÇALHO (FIXO) --- */}
      <div className="bg-zinc-50/80 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800 p-4 pb-2 shrink-0 z-10">
          <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base font-bold tracking-tight flex items-center gap-2 text-zinc-800 dark:text-zinc-100">
                    {step === 1 ? <ClipboardList className="h-4 w-4 text-primary"/> : <CheckCircle2 className="h-4 w-4 text-primary"/>}
                    {step === 1 ? "Relatório de Agendamento" : "Relatório de Agendamento"}
                </h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                    {step === 1 ? "Conferência de equipamento" : "Conferência e relatório da sala"}
                </p>
              </div>
              
              <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7 rounded-full hover:bg-zinc-200/50">
                  <X className="h-4 w-4 text-muted-foreground" />
              </Button>
          </div>

          <div className="flex items-center gap-2 pb-2">
               <Progress value={progressValue} className="h-1.5 flex-1 bg-zinc-200 dark:bg-zinc-800" />
               <span className="text-[10px] font-bold text-muted-foreground min-w-[30px] text-right">{Math.round(progressValue)}%</span>
          </div>
      </div>

      {/* --- 2. CONTEÚDO (SCROLLÁVEL) --- */}
      <div className="flex-1 min-h-0 relative">
          <ScrollArea className="h-full w-full">
            <div className="p-4">
                
                {dadosAgendamento?.isSeries && (
                    <div className="mb-4 p-2 bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-800/50 rounded-md flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <Layers className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                            <span className="text-xs font-bold text-violet-900 dark:text-violet-200 uppercase">
                                Série ({dadosAgendamento.count} itens)
                            </span>
                        </div>
                        <span className="text-[10px] font-mono text-violet-700 dark:text-violet-400">
                            {dadosAgendamento.dateStart && format(new Date(dadosAgendamento.dateStart), "dd/MM", { locale: ptBR })} 
                            {' -> '} 
                            {dadosAgendamento.dateEnd && format(new Date(dadosAgendamento.dateEnd), "dd/MM", { locale: ptBR })}
                        </span>
                    </div>
                )}

                {/* ETAPA 1: LISTA (VISUALIZAÇÃO) */}
                {step === 1 && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-right-4 duration-300">
                        {equipamentos.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border-2 border-dashed rounded-xl bg-zinc-50/30">
                                <Box className="h-10 w-10 mb-2 opacity-20" />
                                <p className="text-xs font-medium">Nenhum equipamento cadastrado.</p>
                            </div>
                        ) : (
                            equipamentos.map((item: any) => (
                                <div 
                                    key={item.idEquipamento} 
                                    className="flex items-center gap-3 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:border-zinc-200 transition-colors"
                                >
                                    <div className="h-9 w-9 rounded-lg bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-100 dark:border-zinc-700">
                                        <ImageIcon className="h-4 w-4 text-zinc-400" />
                                    </div>

                                    <div className="flex-1 min-w-0 flex items-center justify-between">
                                        <h3 className="font-medium text-xs text-zinc-700 dark:text-zinc-200 truncate pr-2">
                                            {item.descricao}
                                        </h3>
                                        <Badge variant="secondary" className="bg-zinc-100 dark:bg-zinc-800 font-mono text-[10px] h-5 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 shrink-0">
                                            x{item.quantidade}
                                        </Badge>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* ETAPA 2: STATUS DA SALA */}
                {step === 2 && (
                    <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                          
                        {/* PARTE A: CHECKBOXES */}
                        <div className="flex flex-col gap-3">
                              
                             {/* Checkbox Limpeza */}
                             <div 
                                onClick={() => handleCheckChange('limpeza', !checks.limpeza)}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none",
                                    checks.limpeza 
                                        ? "bg-white border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 shadow-sm" 
                                        : "bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-900"
                                )}
                             >
                                <div className="flex items-center justify-center">
                                    <Checkbox 
                                        checked={checks.limpeza} 
                                        onCheckedChange={(v) => handleCheckChange('limpeza', !!v)}
                                        className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                                    />
                                </div>
                                <div className="flex items-center gap-3 flex-1">
                                    <div className="p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-md shrink-0">
                                        <Brush className="h-4 w-4 text-zinc-500" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200">Limpeza e Organização</span>
                                        <span className="text-[10px] text-muted-foreground">O ambiente está limpo e organizado?</span>
                                    </div>
                                </div>
                             </div>

                             {/* Checkbox Equipamentos */}
                             <div 
                                onClick={() => hasEquipments && handleCheckChange('equipamentos', !checks.equipamentos)}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-xl border transition-all select-none",
                                    !hasEquipments 
                                        ? "bg-zinc-100 border-zinc-200 opacity-60 cursor-not-allowed" 
                                        : "cursor-pointer shadow-sm " + (checks.equipamentos ? "bg-white border-zinc-200 dark:bg-zinc-900" : "bg-red-50 border-red-200")
                                )}
                             >
                                <div className="flex items-center justify-center">
                                    <Checkbox 
                                        checked={checks.equipamentos} 
                                        disabled={!hasEquipments}
                                        onCheckedChange={(v) => handleCheckChange('equipamentos', !!v)}
                                        className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 disabled:opacity-50"
                                    />
                                </div>
                                <div className="flex items-center gap-3 flex-1">
                                    <div className="p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-md shrink-0">
                                        <Box className="h-4 w-4 text-zinc-500" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200">Equipamentos Conformes</span>
                                        <span className="text-[10px] text-muted-foreground">
                                            {hasEquipments ? "Todos os equipamentos estão conformes?" : "Não há equipamentos nesta sala."}
                                        </span>
                                    </div>
                                </div>
                             </div>
                        </div>

                        {/* PARTE B: BOTÕES DE DECISÃO */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setDadosSala({ ...dadosSala, status: 'conforme' })}
                                    className={cn(
                                        "flex flex-col items-center justify-center gap-1 p-3 rounded-lg border-2 transition-all h-20 bg-white dark:bg-zinc-900",
                                        dadosSala.status === 'conforme'
                                            ? "border-emerald-500 text-emerald-700 dark:text-emerald-400 bg-emerald-50/10"
                                            : "border-zinc-100 hover:border-zinc-300 text-muted-foreground"
                                    )}
                                >
                                    <CheckCircle2 className="h-6 w-6" /> 
                                    <span className="font-bold text-xs">Conforme</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setDadosSala({ ...dadosSala, status: 'problema' })}
                                    className={cn(
                                        "flex flex-col items-center justify-center gap-1 p-3 rounded-lg border-2 transition-all h-20 bg-white dark:bg-zinc-900",
                                        dadosSala.status === 'problema'
                                            ? "border-red-500 text-red-700 dark:text-red-400 bg-red-50/10"
                                            : "border-zinc-100 hover:border-zinc-300 text-muted-foreground"
                                    )}
                                >
                                    <AlertTriangle className="h-6 w-6" /> 
                                    <span className="font-bold text-xs">Problema</span>
                                </button>
                        </div>

                        {/* PARTE C: OBSERVAÇÃO */}
                        <div className="pt-1">
                            <Label className={cn(
                                "text-[10px] font-bold uppercase mb-1.5 block ml-1",
                                dadosSala.status === 'problema' ? "text-red-600" : "text-muted-foreground"
                            )}>
                                {dadosSala.status === 'problema' ? "Descreva o problema (Obrigatório)" : "Observações (Opcional)"}
                            </Label>
                            <Textarea 
                                placeholder={dadosSala.status === 'problema' ? "Ex: Projetor não liga, Cadeira quebrada..." : "Alguma observação adicional?"}
                                className={cn(
                                    "resize-none h-24 text-sm bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200", 
                                    dadosSala.status === 'problema' 
                                        && "border-red-300 focus-visible:ring-red-500 bg-red-50/10 dark:bg-red-900/10" 
                                )}
                                value={dadosSala.observacaoGeral}
                                onChange={(e) => setDadosSala({...dadosSala, observacaoGeral: e.target.value})}
                            />
                        </div>
                    </div>
                )}
            </div>
          </ScrollArea>
      </div>

      {/* --- 3. RODAPÉ (FIXO) --- */}
      <div className="bg-zinc-50/80 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 p-4 pt-3 flex items-center justify-between gap-3 shrink-0 z-10 mt-auto">
          
          {step === 2 && hasEquipments ? (
              <Button variant="outline" size="sm" onClick={() => setStep(1)} disabled={isLoading} className="h-9 bg-white">
                  <ArrowLeft className="mr-2 h-3.5 w-3.5" /> Voltar
              </Button>
          ) : (
              <Button variant="ghost" size="sm" onClick={onClose} disabled={isLoading} className="h-9 text-muted-foreground hover:bg-zinc-200/50">
                  Cancelar
              </Button>
          )}

          {step === 1 ? (
              <Button size="sm" onClick={() => setStep(2)} className="h-9 px-6 font-bold bg-zinc-900 text-white hover:bg-zinc-800 ml-auto shadow-sm">
                  Próximo <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Button>
          ) : (
              <Button 
                  size="sm"
                  onClick={handleSubmit}
                  disabled={isLoading || (dadosSala.status === 'problema' && dadosSala.observacaoGeral.length < 3)}
                  className="h-9 flex-1 font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm ml-auto max-w-[160px]"
              >
                  {isLoading ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Save className="ml-2 h-3.5 w-3.5" />}
                  {isLoading ? "Salvando..." : "Concluir"}
              </Button>
          )}
      </div>
    </div>
  )
}