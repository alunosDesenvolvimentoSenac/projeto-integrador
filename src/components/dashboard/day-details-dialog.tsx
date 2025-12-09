"use client"

import { useState } from "react"
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Check, 
  X, 
  MessageSquareText, 
  Trash2 
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

  // Função para Aprovar ou Rejeitar (Pendentes)
  const handleDecisao = async (idAgendamento: number, acao: "aprovar" | "rejeitar") => {
      setLoadingId(idAgendamento);
      const user = auth.currentUser;
      
      if (!user) {
          toast.error("Erro de sessão", { description: "Faça login novamente." });
          return;
      }

      try {
        const res = await responderSolicitacao(idAgendamento, acao, user.uid);
        
        if (res.success) {
            if (acao === "aprovar") {
                toast.success("Agendamento Aprovado!", { description: "O horário foi confirmado na agenda." });
            } else {
                toast.info("Solicitação Rejeitada", { description: "O horário foi liberado." });
            }

            if (onActionSuccess) onActionSuccess();
        } else {
            toast.error("Erro ao processar", { description: res.message });
        }
      } catch (error) {
        console.error(error);
        toast.error("Erro de conexão");
      } finally {
        setLoadingId(null);
      }
  }

  // Função para Excluir Agendamento (Confirmados)
  const handleExclusao = async (idAgendamento: number) => {
      // Confirmação simples do navegador antes de prosseguir
      if(!confirm("Tem certeza que deseja cancelar este agendamento? O horário ficará livre novamente.")) return;

      setLoadingId(idAgendamento);
      const user = auth.currentUser;
      
      if (!user) {
          toast.error("Erro de sessão");
          return;
      }

      try {
          const res = await excluirAgendamento(idAgendamento, user.uid);
          
          if (res.success) {
              toast.success("Agendamento cancelado", { description: "O registro foi excluído do sistema." });
              if (onActionSuccess) onActionSuccess();
          } else {
              toast.error("Não foi possível excluir", { description: res.message });
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
        
        {/* Cabeçalho */}
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
        
        {/* Lista de Períodos */}
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
                          ? "bg-amber-50/50 border-amber-200 dark:bg-amber-950/10 dark:border-amber-900" // Estilo Pendente
                          : "bg-card shadow-sm border-zinc-200 dark:border-zinc-800" // Estilo Confirmado
                      : "bg-zinc-50/50 border-dashed border-zinc-200 hover:border-zinc-300 hover:bg-zinc-100/50 dark:bg-zinc-900/50 dark:border-zinc-800" // Estilo Livre
                 )}>
                    {/* Linha do Cabeçalho do Card */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="px-2.5 py-0.5 text-sm font-medium bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200">
                           <Clock className="mr-1.5 h-3.5 w-3.5" />
                           {periodo}
                        </Badge>
                      </div>
                      
                      {agendamento ? (
                         <div className="flex items-center gap-1.5">
                            {isConfirmado || agendamento.status === 'concluido' ? (
                               <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            ) : (
                               <AlertCircle className="h-4 w-4 text-amber-500" />
                            )}
                            <span className={cn(
                                "text-xs font-bold uppercase tracking-wide", 
                                (isConfirmado || agendamento.status === 'concluido') ? "text-emerald-600" : "text-amber-600"
                            )}>
                               {agendamento.status}
                            </span>
                         </div>
                      ) : (
                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Disponível</span>
                      )}
                    </div>
                    
                    {/* Conteúdo do Card */}
                    {agendamento ? (
                      <div className="pl-1 mt-1">
                         <div className="font-bold text-lg text-zinc-800 dark:text-zinc-100 leading-tight">
                            {agendamento.disciplina !== "Reserva" ? agendamento.disciplina : "Agendamento"}
                         </div>
                         
                         {/* Observação (Se houver) */}
                         {agendamento.observacao && (
                            <div className="flex items-start gap-2 mt-3 bg-white/60 dark:bg-black/20 p-2.5 rounded-md text-sm text-zinc-600 dark:text-zinc-300 border border-black/5 dark:border-white/5">
                                <MessageSquareText className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                                <span className="italic leading-snug">"{agendamento.observacao}"</span>
                            </div>
                         )}

                         <div className="flex items-center gap-2 text-muted-foreground text-sm mt-3">
                            <div className="bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-full"><User className="h-3.5 w-3.5" /></div>
                            <span className="font-medium">{agendamento.docente}</span>
                         </div>

                         {/* AÇÕES DE ADMIN */}
                         
                         {/* 1. Aprovar / Rejeitar (Apenas se Pendente) */}
                         {isAdmin && isPendente && (
                             <div className="mt-4 pt-3 border-t border-amber-200/50 flex gap-2">
                                <Button 
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs font-semibold"
                                    size="sm"
                                    onClick={() => handleDecisao(agendamento.id, 'aprovar')}
                                    disabled={loadingId === agendamento.id}
                                >
                                    <Check className="mr-1.5 h-3.5 w-3.5" /> Aprovar
                                </Button>
                                <Button 
                                    className="flex-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 h-8 text-xs font-semibold"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDecisao(agendamento.id, 'rejeitar')}
                                    disabled={loadingId === agendamento.id}
                                >
                                    <X className="mr-1.5 h-3.5 w-3.5" /> Rejeitar
                                </Button>
                             </div>
                         )}

                         {/* 2. Cancelar/Excluir (Apenas se Confirmado) */}
                         {isAdmin && isConfirmado && (
                             <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                                <Button 
                                    className="w-full bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 h-8 text-xs font-medium transition-colors"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleExclusao(agendamento.id)}
                                    disabled={loadingId === agendamento.id}
                                >
                                    {loadingId === agendamento.id ? (
                                        "Processando..."
                                    ) : (
                                        <>
                                            <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Cancelar Agendamento
                                        </>
                                    )}
                                </Button>
                             </div>
                         )}

                      </div>
                    ) : (
                      // Estado Livre (Botão de Agendar)
                      <div className="mt-2 flex justify-center opacity-60 group-hover:opacity-100 transition-opacity">
                         <Button 
                            variant="ghost" 
                            size="sm"
                            className="w-full border border-dashed border-transparent hover:border-primary/20 hover:bg-primary/5 text-primary h-9"
                            onClick={() => {
                                onClose(); 
                                onAgendarClick(periodo);
                            }}
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
        
        {/* Rodapé */}
        <div className="p-4 border-t bg-zinc-50/30 flex justify-end">
            <Button variant="outline" onClick={onClose}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}