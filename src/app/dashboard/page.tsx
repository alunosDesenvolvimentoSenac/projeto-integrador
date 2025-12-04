"use client"

import * as React from "react"
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  User,
  CheckCircle2,
  AlertCircle,
  Plus,
  FlaskConical
} from "lucide-react"
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

// --- DADOS MOCKADOS ---
const LABORATORIOS = [
  { id: 1, nome: "Laboratório de Informática 01" },
  { id: 2, nome: "Laboratório de Hardware" },
  { id: 3, nome: "Laboratório de Enfermagem" },
]

type Periodo = "Manhã" | "Tarde" | "Noite"

interface Agendamento {
  id: number
  dia: number
  mes: number
  ano: number
  periodo: Periodo
  status: "confirmado" | "pendente"
  docente: string
  disciplina: string
}

const MOCK_AGENDAMENTOS: Agendamento[] = [
  { id: 1, dia: 5, mes: 11, ano: 2025, periodo: "Manhã", status: "confirmado", docente: "Carlos Silva", disciplina: "Algoritmos" },
  { id: 2, dia: 5, mes: 11, ano: 2025, periodo: "Noite", status: "pendente", docente: "Ana Souza", disciplina: "Redes" },
  { id: 3, dia: 12, mes: 11, ano: 2025, periodo: "Tarde", status: "confirmado", docente: "Roberto", disciplina: "Banco de Dados" },
  { id: 4, dia: 20, mes: 11, ano: 2025, periodo: "Manhã", status: "confirmado", docente: "Carlos Silva", disciplina: "Algoritmos" },
  { id: 5, dia: 20, mes: 11, ano: 2025, periodo: "Tarde", status: "confirmado", docente: "Julia", disciplina: "Design" },
  { id: 6, dia: 20, mes: 11, ano: 2025, periodo: "Noite", status: "confirmado", docente: "Marcos", disciplina: "Java" },
]

export default function Dashboard() {
  const today = new Date();
  const [date, setDate] = React.useState(new Date(2025, 11, 1)) // Dezembro 2025
  
  const [selectedLab, setSelectedLab] = React.useState("1")
  const [selectedDayDetails, setSelectedDayDetails] = React.useState<{ day: number, month: number, appointments: Agendamento[] } | null>(null)

  const nextMonth = () => setDate(new Date(date.getFullYear(), date.getMonth() + 1, 1))
  const prevMonth = () => setDate(new Date(date.getFullYear(), date.getMonth() - 1, 1))

  const monthName = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  
  const handleDayClick = (day: number, month: number, apps: Agendamento[]) => {
    setSelectedDayDetails({ day, month, appointments: apps })
  }

  const getCalendarDays = () => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, currentMonth: false, month: month - 1 });
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, currentMonth: true, month: month });
    }
    
    const remainingSlots = 42 - days.length;
    for (let i = 1; i <= remainingSlots; i++) {
      days.push({ day: i, currentMonth: false, month: month + 1 });
    }
    
    return days;
  };

  const calendarDays = getCalendarDays();

  const getAppointments = (day: number, month: number) => {
    return MOCK_AGENDAMENTOS.filter(
      (a) => a.dia === day && a.mes === month && a.ano === date.getFullYear()
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#F8F9FA] dark:bg-zinc-950">
        
        {/* HEADER */}
         <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b bg-background px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">
                    Agendamento
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Agendamentos</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        {/* ÁREA PRINCIPAL */}
        <div className="flex flex-1 flex-col p-4 md:p-6 overflow-hidden h-[calc(100vh-64px)]">
          
          {/* BARRA DE FERRAMENTAS - Layout Ajustado */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
             
             {/* Esquerda: Mês e Navegação */}
             <div className="flex items-center gap-4 w-full md:w-auto">
                {/* Botões de navegação */}
                <div className="flex items-center bg-white dark:bg-zinc-900 rounded-lg border shadow-sm p-1 h-10">
                  <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8">
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <div className="w-[1px] h-5 bg-border mx-1" />
                  <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8">
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
                <h2 className="text-3xl font-bold capitalize text-zinc-800 dark:text-zinc-100 tracking-tight whitespace-nowrap">
                    {monthName}
                </h2>
             </div>

             {/* Direita: Controles AGRUPADOS */}
             <div className="flex items-center gap-2 w-full md:w-auto ml-auto"> {/* ml-auto empurra para direita */}
                
                {/* SELETOR DE LABORATÓRIO */}
                <div className="relative w-full md:w-[320px]"> {/* Largura fixa mas responsiva */}
                    <Select value={selectedLab} onValueChange={setSelectedLab}>
                        <SelectTrigger className="h-10 bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 shadow-sm w-full">
                          <div className="flex items-center gap-2 truncate">
                              <div className="bg-primary/10 p-1 rounded-md shrink-0">
                                  <FlaskConical className="h-4 w-4 text-primary" />
                              </div>
                              <SelectValue placeholder="Selecione o laboratório" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                        {LABORATORIOS.map((lab) => (
                            <SelectItem key={lab.id} value={String(lab.id)}>
                                {lab.nome}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Botão Novo Agendamento */}
                <Button>
                    <Plus /> Novo Agendamento
                </Button>
             </div>
          </div>

          {/* LEGENDAS */}
          <div className="flex items-center gap-4 mb-3 px-1">
             <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm"></span> Manhã
             </div>
             <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm"></span> Tarde
             </div>
             <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm"></span> Noite
             </div>
             {/* Legenda do Fim de Semana */}
             <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-muted-foreground ml-4">
                <span className="w-2.5 h-2.5 rounded border border-zinc-300 bg-red-600 dark:bg-red-900/20 shadow-sm"></span> Fim de Semana
             </div>
          </div>

          {/* GRID CALENDÁRIO */}
          <div className="flex-1 bg-white dark:bg-zinc-900 border rounded-xl shadow-sm flex flex-col overflow-hidden">
             
             {/* Cabeçalho dias da semana */}
             <div className="grid grid-cols-7 border-b bg-zinc-50/80 dark:bg-zinc-900/50">
                {["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"].map((d) => (
                  <div key={d} className="py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    <span className="hidden md:inline">{d}</span>
                    <span className="md:hidden">{d.slice(0, 3)}</span>
                  </div>
                ))}
             </div>

             {/* Células */}
             <div className="grid grid-cols-7 flex-1 auto-rows-fr">
                {calendarDays.map((slot, i) => {
                  const apps = getAppointments(slot.day, slot.month);
                  const isToday = 
                    slot.day === today.getDate() && 
                    slot.month === today.getMonth() && 
                    date.getFullYear() === today.getFullYear();
                  
                  const slotDate = new Date(date.getFullYear(), slot.month, slot.day);
                  const dayOfWeek = slotDate.getDay(); // 0 = Dom, 6 = Sab
                  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                  // 1. Se NÃO é do mês atual: Invisível (mas ocupa espaço no grid)
                  if (!slot.currentMonth) {
                      return (
                        <div key={i} className="border-b border-r bg-transparent" />
                      )
                  }

                  // 2. Se É do mês atual
                  return (
                    <div 
                      key={i}
                      // Bloqueia clique se for fim de semana
                      onClick={() => !isWeekend && handleDayClick(slot.day, slot.month, apps)}
                      className={cn(
                        "relative border-b border-r p-2 transition-all flex flex-col gap-1 min-h-[100px] select-none",
                        isWeekend 
                            ? "bg-red-50 dark:bg-red-950/10 cursor-not-allowed" 
                            : "bg-background cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                      )}
                    >
                      {/* Número do Dia */}
                      <div className="flex items-center justify-between">
                         <span className={cn(
                           "text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full transition-colors",
                           isToday 
                             ? "bg-primary text-primary-foreground shadow-md font-bold" 
                             : "text-zinc-600 dark:text-zinc-400",
                            isWeekend && "text-zinc-400 dark:text-zinc-600"
                         )}>
                            {slot.day}
                         </span>
                      </div>

                      {/* Lista de Eventos */}
                      {!isWeekend && (
                          <div className="flex flex-col gap-1 mt-1 overflow-hidden">
                            {apps.map((app) => (
                            <EventPill key={app.id} app={app} />
                            ))}
                          </div>
                      )}
                    </div>
                  )
                })}
             </div>
          </div>
        </div>

        {/* MODAL DETALHES (Mantido igual) */}
        <DayDetailsDialog 
          isOpen={!!selectedDayDetails}
          onClose={() => setSelectedDayDetails(null)}
          data={selectedDayDetails}
          monthName={monthName}
        />

      </SidebarInset>
    </SidebarProvider>
  )
}

// ... Componentes auxiliares (EventPill, DayDetailsDialog) mantidos iguais ao anterior ...
// Se precisar, posso repostá-los aqui, mas a lógica deles não mudou.
function EventPill({ app }: { app: Agendamento }) {
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
      <div className={cn("text-[11px] px-2 py-0.5 rounded-md border truncate font-medium flex items-center gap-1.5 shadow-sm", finalStyle)}>
        <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", isPendente ? "bg-amber-500" : "bg-current opacity-60")} />
        <span className="truncate leading-tight">
            <span className="font-bold mr-1">{app.periodo.charAt(0)}:</span>
            {app.docente}
        </span>
      </div>
    )
  }
  
  function DayDetailsDialog({ isOpen, onClose, data, monthName }: any) {
    if (!data) return null
    
    const periodosOrder = ["Manhã", "Tarde", "Noite"]
    
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="flex items-center gap-3 text-xl">
               <div className="bg-primary/10 p-2.5 rounded-xl">
                  <CalendarIcon className="h-6 w-6 text-primary" />
               </div>
               <div>
                 <span className="block text-sm font-normal text-muted-foreground">Agenda do laboratório</span>
                 <span className="font-bold">{data.day} de {monthName}</span>
               </div>
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh] -mr-4 pr-4 pt-4">
            <div className="grid gap-3">
              {periodosOrder.map((periodo) => {
                 const agendamento = data.appointments.find((a: any) => a.periodo === periodo)
                 
                 return (
                   <div key={periodo} className={cn(
                     "group relative flex flex-col gap-1 rounded-xl border p-4 transition-all duration-200",
                     agendamento 
                        ? "bg-card shadow-sm border-zinc-200 dark:border-zinc-800" 
                        : "bg-zinc-50/50 border-dashed border-zinc-200 hover:border-zinc-300 dark:bg-zinc-900/50 dark:border-zinc-800"
                   )}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="px-2.5 py-0.5 text-sm font-medium bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                             <Clock className="mr-1.5 h-3.5 w-3.5" />
                             {periodo}
                          </Badge>
                        </div>
                        {agendamento ? (
                           <div className="flex items-center gap-1.5">
                              {agendamento.status === 'confirmado' ? (
                                 <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                              ) : (
                                 <AlertCircle className="h-4 w-4 text-amber-500" />
                              )}
                              <span className={cn("text-xs font-bold uppercase tracking-wide", agendamento.status === 'confirmado' ? "text-emerald-600" : "text-amber-600")}>
                                 {agendamento.status}
                              </span>
                           </div>
                        ) : (
                          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Disponível</span>
                        )}
                      </div>
                      
                      {agendamento ? (
                        <div className="pl-1">
                           <div className="font-bold text-lg text-zinc-800 dark:text-zinc-100">{agendamento.disciplina}</div>
                           <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1.5">
                              <div className="bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-full"><User className="h-3.5 w-3.5" /></div>
                              <span className="font-medium">{agendamento.docente}</span>
                           </div>
                        </div>
                      ) : (
                        <div className="mt-2 flex justify-center opacity-60 group-hover:opacity-100 transition-opacity">
                           <Button variant="ghost" className="w-full border-2 border-dashed border-transparent hover:border-primary/20 hover:bg-primary/5 text-primary">
                              <Plus className="mr-2 h-4 w-4" /> Agendar Horário
                           </Button>
                        </div>
                      )}
                   </div>
                 )
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    )
  }