"use client"

import { useState } from "react"
import { 
  Calendar as CalendarIcon, Clock, User, CheckCircle2, AlertCircle, Plus, Check, X, MessageSquareText, Trash2, BookOpen 
} from "lucide-react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { AgendamentoComDetalhes, Periodo } from "@/types"
import { responderSolicitacao, excluirAgendamento } from "@/app/actions/agendamento"
import { auth } from "@/lib/firebase"
import { toast } from "sonner"

interface DayDetailsDialogProps {
  isOpen: boolean
  onClose: () => void
  data: { day: number, month: number, appointments: AgendamentoComDetalhes[] } | null
  monthName: string
  onAgendarClick: (periodo: string) => void
  isAdmin: boolean
  onActionSuccess?: () => void
}

export function DayDetailsDialog({ 
  isOpen, 
  onClose, 
  data, 
  monthName, 
  onAgendarClick, 
  isAdmin, 
  onActionSuccess 
}: DayDetailsDialogProps) {
  
  const [loadingId, setLoadingId] = useState<number | null>(null);

  if (!data) return null
  
  const periodosOrder: Periodo[] = ["Manhã", "Tarde", "Noite"]

  const handleDecisao = async (idAgendamento: number, acao: "aprovar" | "rejeitar") => {
      setLoadingId(idAgendamento);
      const user = auth.currentUser;
      
      if (!user) {
          toast.error("Erro de sessão");
          return;
      }

      try {
        const res = await responderSolicitacao(idAgendamento, acao, user.uid);
        
        if (res.success) {
            if (acao === "aprovar") {
                toast.success("Aprovado!", { description: "Agendamento confirmado." });
            } else {
                toast.info("Rejeitado", { description: "Agendamento removido." });
            }
            if (onActionSuccess) onActionSuccess();
        } else {
            toast.error("Erro", { description: res.message });
        }
      } catch (error) {
        console.error(error);
        toast.error("Erro de conexão");
      } finally {
        setLoadingId(null);
      }
  }

  const handleExclusao = async (idAgendamento: number) => {
      if(!confirm("Tem certeza que deseja cancelar este agendamento?")) return;

      setLoadingId(idAgendamento);
      const user = auth.currentUser;
      
      if (!user) return;

      try {
          const res = await excluirAgendamento(idAgendamento, user.uid);
          if (res.success) {
              toast.success("Excluído", { description: "Agendamento cancelado com sucesso." });
              if (onActionSuccess) onActionSuccess();
          } else {
              toast.error("Erro", { description: res.message });
          }
      } catch (error) {
          console.error(error);
          toast.error("Erro ao excluir");
      } finally {
          setLoadingId(null);
      }
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b bg-zinc-50/50 dark:bg-zinc-900/50">
            <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
                <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/10">
                    <CalendarIcon className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <span className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">Agenda do dia</span>
                    <span className="font-bold text-lg">{data.day} de {monthName}</span>
                </div>
            </DialogTitle>
            </DialogHeader>
        </div>
        
        <ScrollArea className="max-h-[60vh] px-6 py-4">
          <div className="grid gap-4">
            {periodosOrder.map((periodo) => {
               const agendamento = data.appointments.find((a) => a.periodo === periodo)
               const isPendente = agendamento?.status === 'pendente';
               const isConfirmado = agendamento?.status === 'confirmado';
               
               return (
                 <div key={periodo} className={cn(
                   "group relative flex flex-col gap-2 rounded-xl border p-4 transition-all duration-200",
                   agendamento 
                      ? isPendente
                          ? "bg-amber-50/50 border-amber-200 dark:bg-amber-950/10 dark:border-amber-900"
                          : "bg-card shadow-sm border-zinc-200 dark:border-zinc-800" 
                      : "bg-zinc-50/50 border-dashed border-zinc-200 hover:border-zinc-300 hover:bg-zinc-100/50 dark:bg-zinc-900/50 dark:border-zinc-800"
                 )}>
                    {/* Linha do Tempo e Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="px-2.5 py-0.5 text-sm font-medium border-zinc-200">
                           <Clock className="mr-1.5 h-3.5 w-3.5" />
                           {periodo}
                        </Badge>
                      </div>
                      
                      {agendamento ? (
                         <div className="flex items-center gap-1.5">
                            {isConfirmado ? (
                               <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            ) : (
                               <AlertCircle className="h-4 w-4 text-amber-500" />
                            )}
                            <span className={cn(
                                "text-xs font-bold uppercase tracking-wide", 
                                isConfirmado ? "text-emerald-600" : "text-amber-600"
                            )}>
                               {agendamento.status}
                            </span>
                         </div>
                      ) : (
                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Disponível</span>
                      )}
                    </div>
                    
                    {/* Conteúdo */}
                    {agendamento ? (
                      <div className="pl-1 mt-2 space-y-3">
                         
                         {/* Disciplina */}
                         <div className="flex items-start gap-2">
                            <BookOpen className="h-4 w-4 mt-1 text-primary shrink-0" />
                            <div className="font-bold text-lg text-zinc-800 dark:text-zinc-100 leading-tight">
                                {agendamento.disciplina || "Sem disciplina"}
                            </div>
                         </div>

                         {/* Professor */}
                         <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 font-medium">
                            <div className="bg-zinc-100 dark:bg-zinc-800 p-1 rounded-full">
                                <User className="h-3.5 w-3.5" />
                            </div>
                            {agendamento.docente}
                         </div>
                         
                         {/* Observação */}
                         {agendamento.observacao && (
                            <div className="bg-yellow-50/50 dark:bg-yellow-900/10 p-2.5 rounded-md border border-yellow-100 dark:border-yellow-900/30">
                                <div className="flex items-start gap-2">
                                    <MessageSquareText className="h-3.5 w-3.5 mt-0.5 text-yellow-600 dark:text-yellow-500 shrink-0" />
                                    <span className="text-sm italic text-zinc-600 dark:text-zinc-300 leading-snug">
                                        "{agendamento.observacao}"
                                    </span>
                                </div>
                            </div>
                         )}

                         {/* AÇÕES DE ADMIN */}
                         {isAdmin && isPendente && (
                             <div className="pt-3 border-t border-amber-200/50 flex gap-2">
                                <Button 
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs font-semibold"
                                    size="sm"
                                    onClick={() => handleDecisao(agendamento.id, 'aprovar')}
                                    disabled={loadingId === agendamento.id}
                                >
                                    <Check className="mr-1.5 h-3.5 w-3.5" /> Aprovar
                                </Button>
                                <Button 
                                    className="flex-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 h-8 text-xs font-semibold"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDecisao(agendamento.id, 'rejeitar')}
                                    disabled={loadingId === agendamento.id}
                                >
                                    <X className="mr-1.5 h-3.5 w-3.5" /> Rejeitar
                                </Button>
                             </div>
                         )}

                         {isAdmin && isConfirmado && (
                             <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
                                <Button 
                                    className="w-full bg-white border border-red-200 text-red-600 hover:bg-red-50 h-8 text-xs font-medium"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleExclusao(agendamento.id)}
                                    disabled={loadingId === agendamento.id}
                                >
                                    <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Cancelar Agendamento
                                </Button>
                             </div>
                         )}

                      </div>
                    ) : (
                      <div className="mt-2 flex justify-center opacity-60 group-hover:opacity-100 transition-opacity">
                         <Button 
                            variant="ghost" 
                            size="sm"
                            className="w-full border border-dashed border-transparent hover:border-primary/20 hover:bg-primary/5 text-primary h-9"
                            onClick={() => { onClose(); onAgendarClick(periodo); }}
                         >
                            <Plus className="mr-2 h-4 w-4" /> Agendar {periodo}
                         </Button>
                      </div>
                    )}
                 </div>
               )
            })}
          </div>
        </ScrollArea>
        
        <div className="p-4 border-t bg-zinc-50/30 flex justify-end">
            <Button variant="outline" onClick={onClose}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}