"use client"

import * as React from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge" 
import { 
  AlertTriangle, 
  Check, 
  ImageIcon,
  Brush,
  Loader2,
  Layers, 
  CalendarDays 
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns" 
import { ptBR } from "date-fns/locale"

export function ChecklistForm({ equipamentos = [], onSubmit, isSubmitting, dadosAgendamento }: any) {
  const totalEquipamentos = equipamentos.length
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [localSubmitting, setLocalSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (!isSubmitting) setLocalSubmitting(false)
  }, [isSubmitting])
  
  const [respostas, setRespostas] = React.useState<any>(
    equipamentos.map((eq: any) => ({
      idEquipamento: eq.idEquipamento,
      descricao: eq.descricao,
      quantidade: eq.quantidade,
      tudoOk: true, 
      possuiAvaria: false,
      detalhesAvaria: { faltando: false, quebrado: false, outros: false },
      observacao: "",
    }))
  )

  const [dadosSala, setDadosSala] = React.useState({
    limpezaOk: true,
    observacaoGeral: ""
  })

  const isPassoFinal = currentIndex === totalEquipamentos
  const itemAtual = respostas[currentIndex]
  const isLoading = isSubmitting || localSubmitting

  const next = () => {
    if (currentIndex < totalEquipamentos) {
      setCurrentIndex(c => c + 1)
    } else {
      setLocalSubmitting(true)
      onSubmit({
        itens: respostas,
        ...dadosSala,
        materialOk: respostas.every((r: any) => r.tudoOk) && dadosSala.limpezaOk
      })
    }
  }

  const prev = () => {
    if (currentIndex > 0) setCurrentIndex(c => c - 1)
  }

  const handleToggleStatus = (tipo: 'ok' | 'avaria') => {
    setRespostas((prevRes: any) => prevRes.map((it: any, idx: number) => {
      if (idx === currentIndex) {
        return tipo === 'ok' 
          ? { ...it, tudoOk: true, possuiAvaria: false } 
          : { ...it, tudoOk: false, possuiAvaria: true }
      }
      return it
    }))
  }

  const updateItem = (field: string, value: any) => {
    setRespostas((prevRes: any) => prevRes.map((it: any, idx: number) => 
      idx === currentIndex ? { ...it, [field]: value } : it
    ))
  }

  return (
    <div className="flex flex-col w-full h-full relative">
      
      {/* --- CABEÇALHO DE SÉRIE --- */}
      {dadosAgendamento?.isSeries && (
        <div className="mb-6 p-4 bg-violet-50/80 border border-violet-200 rounded-xl flex flex-col gap-2 shadow-sm">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-violet-100 rounded-md">
                        <Layers className="h-4 w-4 text-violet-600" />
                    </div>
                    <span className="text-sm font-bold text-violet-900 uppercase tracking-wide">
                        Conferência em Série
                    </span>
                </div>
                <Badge variant="secondary" className="bg-violet-100 text-violet-700 border-violet-200 hover:bg-violet-100">
                    {dadosAgendamento.count} agendamentos
                </Badge>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-violet-800 bg-white/50 p-2 rounded-lg border border-violet-100/50">
                <CalendarDays className="h-4 w-4 text-violet-500" />
                <span>Aplicar de:</span>
                <span className="font-bold font-mono">
                    {/* new Date() garante que a formatação funcione mesmo se vier como string */}
                    {dadosAgendamento.dateStart && format(new Date(dadosAgendamento.dateStart), "dd/MM/yyyy", { locale: ptBR })}
                </span>
                <span>até</span>
                <span className="font-bold font-mono">
                    {dadosAgendamento.dateEnd && format(new Date(dadosAgendamento.dateEnd), "dd/MM/yyyy", { locale: ptBR })}
                </span>
            </div>
        </div>
      )}

      <div className="mb-8 space-y-2">
        <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground">
          <span>Progresso</span>
          <span>{currentIndex + 1} de {totalEquipamentos + 1}</span>
        </div>
        <Progress value={((currentIndex + 1) / (totalEquipamentos + 1)) * 100} className="h-2 w-full" />
      </div>

      <div className="flex-1 animate-in fade-in duration-300 flex flex-col justify-center min-h-[300px]">
        {totalEquipamentos === 0 || isPassoFinal ? (
          <div className="w-full space-y-6">
            <div className="flex flex-col items-center text-center gap-4 bg-emerald-50 dark:bg-emerald-950/20 p-8 rounded-2xl border border-emerald-100 border-dashed">
              <div className="p-4 bg-emerald-100 dark:bg-emerald-900 rounded-full">
                 <Brush className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-emerald-950 dark:text-emerald-50">Limpeza da Sala</h2>
                <p className="text-sm text-muted-foreground mt-1">Como você encontrou o ambiente?</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 border rounded-xl bg-zinc-50 dark:bg-zinc-900 shadow-sm cursor-pointer" onClick={() => setDadosSala({...dadosSala, limpezaOk: !dadosSala.limpezaOk})}>
              <Checkbox 
                id="limpeza" 
                className="h-6 w-6"
                checked={dadosSala.limpezaOk}
                onCheckedChange={(v) => setDadosSala({...dadosSala, limpezaOk: !!v})}
              />
              <Label htmlFor="limpeza" className="text-base font-medium cursor-pointer flex-1">
                A sala está limpa e organizada?
              </Label>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase font-bold text-muted-foreground ml-1">Observações Gerais (Opcional)</Label>
              <Textarea 
                placeholder="Ex: Ar condicionado pingando, luz queimada..."
                className="min-h-[100px] w-full text-sm p-3 resize-none bg-background focus-visible:ring-emerald-500"
                value={dadosSala.observacaoGeral}
                onChange={(e) => setDadosSala({...dadosSala, observacaoGeral: e.target.value})}
              />
            </div>
          </div>
        ) : (
          <div className="w-full space-y-10">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-40 h-40 rounded-3xl bg-zinc-50 dark:bg-zinc-900 border-2 border-dashed flex items-center justify-center shadow-sm relative overflow-hidden group">
                 {/* Imagem dos equiapemnetos */}
                 <ImageIcon className="h-12 w-12 text-zinc-300 group-hover:scale-110 transition-transform" />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-black leading-tight text-foreground px-4">{itemAtual.descricao}</h2>
                <div className="inline-flex items-center px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full border">
                    <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">Quantidade: {itemAtual.quantidade}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full max-w-[340px] mx-auto">
              <button 
                type="button"
                onClick={() => handleToggleStatus('ok')}
                className={cn(
                  "flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 transition-all active:scale-95 shadow-sm",
                  itemAtual.tudoOk 
                    ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 ring-1 ring-emerald-500/50" 
                    : "border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                )}
              >
                <div className={cn("p-2.5 rounded-full transition-colors", itemAtual.tudoOk ? "bg-emerald-500 text-white" : "bg-zinc-100 text-zinc-300")}>
                    <Check className="h-6 w-6" />
                </div>
                <span className={cn("text-sm font-bold uppercase tracking-wide", itemAtual.tudoOk ? "text-emerald-700" : "text-muted-foreground")}>
                    Conforme
                </span>
              </button>

              <button 
                type="button"
                onClick={() => handleToggleStatus('avaria')}
                className={cn(
                  "flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 transition-all active:scale-95 shadow-sm",
                  itemAtual.possuiAvaria 
                    ? "border-red-500 bg-red-50/50 dark:bg-red-950/20 ring-1 ring-red-500/50" 
                    : "border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                )}
              >
                <div className={cn("p-2.5 rounded-full transition-colors", itemAtual.possuiAvaria ? "bg-red-500 text-white" : "bg-zinc-100 text-zinc-300")}>
                    <AlertTriangle className="h-6 w-6" />
                </div>
                <span className={cn("text-sm font-bold uppercase tracking-wide", itemAtual.possuiAvaria ? "text-red-700" : "text-muted-foreground")}>
                    Problema
                </span>
              </button>
            </div>

            {itemAtual.possuiAvaria && (
              <div className="w-full max-w-md mx-auto p-5 border border-red-200 bg-red-50/50 dark:bg-red-900/10 rounded-xl space-y-4 animate-in slide-in-from-bottom-2 fade-in zoom-in-95 duration-300">
                <Label className="text-xs font-bold text-red-800 uppercase tracking-wide">Qual o defeito?</Label>
                <div className="flex flex-wrap gap-2">
                  {['faltando', 'quebrado', 'outros'].map(sub => (
                    <div key={sub} className="flex-1 min-w-[80px]">
                        <input 
                            type="checkbox" 
                            id={`check-${sub}`}
                            className="peer sr-only"
                            checked={itemAtual.detalhesAvaria[sub]}
                            onChange={(e) => {
                                const novosDetalhes = { ...itemAtual.detalhesAvaria, [sub]: e.target.checked }
                                updateItem('detalhesAvaria', novosDetalhes)
                            }}
                        />
                        <label 
                            htmlFor={`check-${sub}`}
                            className="flex items-center justify-center w-full px-3 py-2 rounded-lg border bg-white dark:bg-zinc-900 text-xs font-bold uppercase text-muted-foreground border-zinc-200 cursor-pointer transition-all peer-checked:border-red-500 peer-checked:text-red-600 peer-checked:bg-red-50 hover:border-red-200"
                        >
                            {sub}
                        </label>
                    </div>
                  ))}
                </div>
                <Textarea 
                  placeholder="Descreva melhor o que aconteceu..." 
                  value={itemAtual.observacao}
                  onChange={(e) => updateItem('observacao', e.target.value)}
                  className="w-full min-h-[80px] text-sm bg-white dark:bg-zinc-950 resize-none border-red-200 focus-visible:ring-red-500"
                />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-6 gap-3 mt-auto bg-white dark:bg-zinc-950 sticky bottom-0">
        <Button 
          variant="ghost" 
          type="button" 
          onClick={prev} 
          disabled={currentIndex === 0 || isLoading}
          className="h-12 px-6 font-bold text-muted-foreground hover:bg-zinc-100"
        >
          Voltar
        </Button>

        <Button 
          type="button" 
          onClick={next} 
          disabled={isLoading}
          className={cn(
            "flex-1 h-12 font-bold text-base rounded-xl transition-all shadow-md flex items-center justify-center gap-2",
            isPassoFinal ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200" : "bg-zinc-900 text-white hover:bg-zinc-800"
          )}
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isPassoFinal ? (isLoading ? "Finalizando..." : "Concluir Conferência") : "Próximo Item"}
        </Button>
      </div>
    </div>
  )
}