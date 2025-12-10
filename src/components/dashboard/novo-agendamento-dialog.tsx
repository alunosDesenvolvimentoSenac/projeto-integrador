"use client"

import { useState, useEffect } from "react"
import { auth } from "@/lib/firebase"
import { salvarAgendamento } from "@/app/actions/agendamento"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Loader2, Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface NovoAgendamentoProps {
  isOpen: boolean
  onClose: () => void
  idSalaSelecionada: number
  nomeSala: string
  initialDate?: Date
  initialPeriod?: string
  onSuccess?: () => void
}

export function NovoAgendamentoDialog({ 
  isOpen, 
  onClose, 
  idSalaSelecionada, 
  nomeSala, 
  initialDate, 
  initialPeriod,
  onSuccess 
}: NovoAgendamentoProps) {
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  })
  
  const [periodo, setPeriodo] = useState<string>("")
  const [disciplina, setDisciplina] = useState("")
  const [observacao, setObservacao] = useState("")
  const [loading, setLoading] = useState(false)

  // Atualiza o estado quando o modal abre com dados pré-definidos
  useEffect(() => {
    if (isOpen) {
        if (initialDate) {
            setDateRange({ from: initialDate, to: initialDate })
        } else {
            setDateRange({ from: new Date(), to: new Date() })
        }
        if (initialPeriod) setPeriodo(initialPeriod)
    }
  }, [isOpen, initialDate, initialPeriod])

  async function handleSave() {
    // Validação
    if (!dateRange?.from || !periodo || !disciplina) {
      toast.warning("Campos obrigatórios", {
        description: "Por favor, preencha o período, a data e a disciplina."
      })
      return
    }

    const user = auth.currentUser
    if (!user) {
      toast.error("Erro de autenticação", { description: "Faça login novamente." })
      return
    }

    setLoading(true)
    try {
      const result = await salvarAgendamento({
        dateRange: { from: dateRange.from, to: dateRange.to || dateRange.from },
        periodo: periodo as "Manhã" | "Tarde" | "Noite",
        idSala: idSalaSelecionada,
        uidUsuario: user.uid,
        disciplina: disciplina,
        observacao: observacao
      })

      if (result.success) {
        toast.success("Sucesso!", { description: result.message })
        if (onSuccess) onSuccess();
        
        onClose()
        // Limpar campos
        setDisciplina("")
        setObservacao("") 
      } else {
        toast.error("Erro ao agendar", { description: result.message })
      }
    } catch (e) {
      console.error(e)
      toast.error("Erro inesperado")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Solicitar Agendamento</DialogTitle>
          <p className="text-sm text-muted-foreground">
             Laboratório: <span className="font-semibold text-foreground">{nomeSala}</span>
          </p>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          
          {/* Seletor de Período */}
          <div className="grid gap-2">
            <Label>Período</Label>
            <Select onValueChange={setPeriodo} value={periodo}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o turno" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Manhã">Manhã (07:00 - 12:00)</SelectItem>
                <SelectItem value="Tarde">Tarde (13:00 - 18:00)</SelectItem>
                <SelectItem value="Noite">Noite (19:00 - 22:30)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Calendário (Range) */}
          <div className="grid gap-2">
            <Label>Selecione os dias</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd/MM/y", { locale: ptBR })} -{" "}
                        {format(dateRange.to, "dd/MM/y", { locale: ptBR })}
                      </>
                    ) : (
                      format(dateRange.from, "dd/MM/y", { locale: ptBR })
                    )
                  ) : (
                    <span>Selecione uma data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={1}
                  locale={ptBR}
                  disabled={(date) => date < new Date(new Date().setHours(0,0,0,0)) || date.getDay() === 0 || date.getDay() === 6}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Disciplina */}
          <div className="grid gap-2">
            <Label>Disciplina / Curso <span className="text-red-500">*</span></Label>
            <Input 
                placeholder="Ex: Desenvolvimento de Sistemas - Módulo 2" 
                value={disciplina} 
                onChange={e => setDisciplina(e.target.value)} 
            />
          </div>

          {/* Observação */}
          <div className="grid gap-2">
            <Label>Observações (Opcional)</Label>
            <Textarea 
                placeholder="Ex: Precisaremos de projetor extra e cabos HDMI." 
                value={observacao} 
                onChange={e => setObservacao(e.target.value)} 
                className="resize-none h-20"
            />
          </div>

        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {dateRange?.from && dateRange.to && dateRange.from !== dateRange.to ? "Agendar Vários Dias" : "Agendar Dia"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}