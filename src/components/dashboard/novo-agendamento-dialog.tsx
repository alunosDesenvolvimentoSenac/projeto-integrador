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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea" // Se estiver usando Textarea
import { Calendar } from "@/components/ui/calendar"
import { Loader2 } from "lucide-react"
import { DateRange } from "react-day-picker"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner" // <--- IMPORTAR O TOAST

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
  const [observacao, setObservacao] = useState("")
  const [loading, setLoading] = useState(false)

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
    // Validação com Toast de Erro
    if (!dateRange?.from || !periodo || !observacao) {
      toast.warning("Atenção", {
        description: "Preencha o período, a data e a observação."
      })
      return
    }

    const user = auth.currentUser
    if (!user) {
      toast.error("Erro de autenticação", {
        description: "Você precisa estar logado para realizar esta ação."
      })
      return
    }

    setLoading(true)
    try {
      const result = await salvarAgendamento({
        dateRange: { from: dateRange.from, to: dateRange.to || dateRange.from },
        periodo: periodo as "Manhã" | "Tarde" | "Noite",
        idSala: idSalaSelecionada,
        uidUsuario: user.uid,
        disciplina: ""
      })

      if (result.success) {
        // SUCESSO!
        toast.success("Sucesso!", {
            description: result.message,
        })
        
        if (onSuccess) onSuccess();
        onClose()
        setObservacao("") 
      } else {
        // ERRO DO BACKEND (ex: Conflito)
        toast.error("Não foi possível agendar", {
            description: result.message
        })
      }
    } catch (e) {
      console.error(e)
      toast.error("Erro inesperado", {
        description: "Ocorreu um erro de conexão. Tente novamente."
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Agendar: {nomeSala}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
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

          <div className="grid gap-2">
            <Label>Selecione os dias</Label>
            <div className="border rounded-md p-2 flex justify-center">
                <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={1}
                    locale={ptBR}
                    disabled={(date) => date < new Date(new Date().setHours(0,0,0,0)) || date.getDay() === 0 || date.getDay() === 6}
                />
            </div>
            <p className="text-xs text-muted-foreground text-center">
                {dateRange?.from ? (
                    dateRange.to && dateRange.to !== dateRange.from ? (
                        <>De <b>{format(dateRange.from, "dd/MM")}</b> até <b>{format(dateRange.to, "dd/MM")}</b></>
                    ) : (
                        <>Dia <b>{format(dateRange.from, "dd/MM")}</b> selecionado</>
                    )
                ) : "Nenhuma data selecionada"}
            </p>
          </div>

          <div className="grid gap-2">
            <Label>Observação / Disciplina</Label>
            <Textarea 
                placeholder="Ex: Aula de Robótica - Precisaremos do Projetor" 
                value={observacao} 
                onChange={e => setObservacao(e.target.value)} 
                className="resize-none"
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