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
  FlaskConical,
  ListChecks,
  SunMedium
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
  labId?: number
}

const MOCK_AGENDAMENTOS: Agendamento[] = [
  { id: 1, dia: 5, mes: 11, ano: 2025, periodo: "Manhã", status: "confirmado", docente: "Carlos Silva", disciplina: "Algoritmos", labId: 1 },
  { id: 2, dia: 5, mes: 11, ano: 2025, periodo: "Noite", status: "pendente", docente: "Ana Souza", disciplina: "Redes", labId: 1 },
  { id: 3, dia: 12, mes: 11, ano: 2025, periodo: "Tarde", status: "confirmado", docente: "Roberto", disciplina: "Banco de Dados", labId: 2 },
  { id: 4, dia: 20, mes: 11, ano: 2025, periodo: "Manhã", status: "confirmado", docente: "Carlos Silva", disciplina: "Algoritmos", labId: 1 },
  { id: 5, dia: 20, mes: 11, ano: 2025, periodo: "Tarde", status: "confirmado", docente: "Julia", disciplina: "Design", labId: 3 },
  { id: 6, dia: 20, mes: 11, ano: 2025, periodo: "Noite", status: "confirmado", docente: "Marcos", disciplina: "Java", labId: 1 },
]

export default function Dashboard() {
  const today = new Date();
  const [date, setDate] = React.useState(new Date(2025, 11, 1)) // 1 de Dezembro de 2025
  
  const [selectedLab, setSelectedLab] = React.useState("todos")
  const [filterStatus, setFilterStatus] = React.useState("todos")
  const [filterPeriod, setFilterPeriod] = React.useState("todos")
  
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

  const getAppointments = (day: number, month: number, year: number) => {
    return MOCK_AGENDAMENTOS.filter(
      (a) => {
        const matchDate = a.dia === day && a.mes === month && a.ano === year;
        const matchStatus = filterStatus === "todos" ? true : a.status === filterStatus;
        const matchPeriod = filterPeriod === "todos" ? true : a.periodo === filterPeriod;
        const matchLab = true; // Filtro de laboratório desativado temporariamente
        
        return matchDate && matchStatus && matchPeriod && matchLab;
      }
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
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">Agendamento</BreadcrumbLink>
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
          
          {/* BARRA SUPERIOR: Data e Botão Novo */}
          <div className="flex items-center justify-between w-full mb-6">
             
             {/* Navegação de Data */}
             <div className="flex items-center bg-white dark:bg-zinc-900 rounded-lg border shadow-sm p-1">
                <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8 text-zinc-500 hover:text-zinc-900">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                {/* Texto da Data (Mês e Ano) */}
                <div className="px-4 border-x border-zinc-100 dark:border-zinc-800 mx-1 min-w-[180px] flex justify-center">
                    <span className="text-sm font-semibold capitalize text-zinc-700 dark:text-zinc-200 tracking-tight">
                        {monthName}
                    </span>
                </div>

                <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8 text-zinc-500 hover:text-zinc-900">
                  <ChevronRight className="h-4 w-4" />
                </Button>
             </div>

             {/* Botão Novo Agendamento */}
             <Button>
                <Plus className="mr-2 h-4 w-4" /> Novo Agendamento
             </Button>
          </div>

          {/* BARRA DE CONTROLE */}
          <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 mb-4"> 
            
             {/* ESQUERDA: Legendas */}
             <div className="flex items-center gap-4 px-1 shrink-0">
                 <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-full border shadow-sm">
                    {/* MANHÃ = AMARELO */}
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Manhã
                 </div>
                 <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-full border shadow-sm">
                    {/* TARDE = AZUL */}
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Tarde
                 </div>
                 <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-full border shadow-sm">
                    {/* NOITE = PRETO */}
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-950 dark:bg-zinc-100"></span> Noite
                 </div>
             </div>

             {/* DIREITA: Filtros Coloridos */}
             <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto xl:justify-end">
                
                {/* 1. SELETOR DE PERÍODO (LARANJA) */}
                <div className="relative w-full sm:w-[200px]">
                    <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                        <SelectTrigger className="h-10 bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 shadow-sm w-full text-sm">
                          <div className="flex items-center gap-2 truncate">
                              <div className="bg-orange-100 dark:bg-orange-900/30 p-1 rounded-md shrink-0">
                                  <SunMedium className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                              </div>
                              <SelectValue placeholder="Período" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="todos">Todos os períodos</SelectItem>
                            <SelectItem value="Manhã">Manhã</SelectItem>
                            <SelectItem value="Tarde">Tarde</SelectItem>
                            <SelectItem value="Noite">Noite</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* 2. SELETOR DE STATUS (ROXO/VIOLETA) */}
                <div className="relative w-full sm:w-[200px]">
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="h-10 bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 shadow-sm w-full text-sm">
                          <div className="flex items-center gap-2 truncate">
                              <div className="bg-violet-100 dark:bg-violet-900/30 p-1 rounded-md shrink-0">
                                  <ListChecks className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                              </div>
                              <SelectValue placeholder="Status" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="todos">Todos os status</SelectItem>
                            <SelectItem value="confirmado">Confirmados</SelectItem>
                            <SelectItem value="pendente">Pendentes</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* 3. SELETOR DE LABORATÓRIO (AZUL - SEM EFEITO) */}
                <div className="relative w-full sm:w-[280px]">
                    <Select value={selectedLab} onValueChange={setSelectedLab}>
                        <SelectTrigger className="h-10 bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 shadow-sm w-full text-sm">
                          <div className="flex items-center gap-2 truncate">
                              <div className="bg-blue-100 dark:bg-blue-900/30 p-1 rounded-md shrink-0">
                                  <FlaskConical className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              </div>
                              <SelectValue placeholder="Selecione o laboratório" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="todos">Todas as salas</SelectItem>
                            {LABORATORIOS.map((lab) => (
                                <SelectItem key={lab.id} value={String(lab.id)}>
                                    {lab.nome}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
             </div>
          </div>

          {/* GRID CALENDÁRIO */}
          <div className="flex-1 bg-white dark:bg-zinc-900 border rounded-xl shadow-sm flex flex-col overflow-hidden">
             
             {/* Cabeçalho dias */}
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
                  let slotYear = date.getFullYear();
                  if (slot.month === -1) slotYear = date.getFullYear() - 1; 
                  if (slot.month === 12) slotYear = date.getFullYear() + 1;

                  const apps = getAppointments(slot.day, slot.month, slotYear);
                  const isToday = 
                    slot.day === today.getDate() && 
                    slot.month === today.getMonth() && 
                    date.getFullYear() === today.getFullYear();
                  
                  const isCurrentMonth = slot.currentMonth;

                  const slotDate = new Date(date.getFullYear(), slot.month, slot.day);
                  const dayOfWeek = slotDate.getDay(); 
                  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                  return (
                    <div 
                      key={i}
                      onClick={() => isCurrentMonth && !isWeekend && handleDayClick(slot.day, slot.month, apps)}
                      className={cn(
                        "relative border-b border-r p-2 transition-all flex flex-col gap-1 min-h-[100px] select-none",
                        !isCurrentMonth && "bg-zinc-50/60 dark:bg-zinc-900/50 opacity-40 grayscale pointer-events-none",
                        isCurrentMonth && isWeekend 
                            ? "bg-red-50 dark:bg-red-950/10 cursor-not-allowed" 
                            : isCurrentMonth && "bg-background cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                      )}
                    >
                      <div className="flex items-center justify-between">
                          <span className={cn(
                            "text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full transition-colors",
                            isToday && isCurrentMonth
                              ? "bg-primary text-primary-foreground shadow-md font-bold" 
                              : "text-zinc-600 dark:text-zinc-400",
                             isWeekend && isCurrentMonth && "text-zinc-400 dark:text-zinc-600"
                          )}>
                             {slot.day}
                          </span>
                      </div>

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

        {/* MODAL DETALHES */}
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

function EventPill({ app }: { app: Agendamento }) {
    const bgStyles = {
        confirmado: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
        pendente: "bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800",
    }
  
    const dotColors = {
        Manhã: "bg-amber-500",
        Tarde: "bg-blue-500",
        Noite: "bg-zinc-950 dark:bg-zinc-100",
    }
  
    return (
      <div className={cn(
          "text-[11px] px-2 py-0.5 rounded-md border truncate font-medium flex items-center gap-1.5 shadow-sm", 
          bgStyles[app.status]
      )}>
        <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColors[app.periodo])} />
        <span className="truncate leading-tight">
            {app.docente}
        </span>
      </div>
    )
}
  
function DayDetailsDialog({ isOpen, onClose, data, monthName }: any) {
    if (!data) return null
    
    const periodosOrder = ["Manhã", "Tarde", "Noite"]
    
    const badgeColors: Record<string, string> = {
        Manhã: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
        Tarde: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
        Noite: "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-300"
    }

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
                          <Badge variant="secondary" className={cn("px-2.5 py-0.5 text-sm font-medium", badgeColors[periodo])}>
                             <Clock className="mr-1.5 h-3.5 w-3.5" />
                             {periodo}
                          </Badge>
                        </div>
                        {agendamento ? (
                           <div className="flex items-center gap-1.5">
                              {agendamento.status === 'confirmado' ? (
                                 <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                              ) : (
                                 <AlertCircle className="h-4 w-4 text-orange-500" />
                              )}
                              <span className={cn("text-xs font-bold uppercase tracking-wide", agendamento.status === 'confirmado' ? "text-emerald-600" : "text-orange-600")}>
                                 {agendamento.status}
                              </span>
                           </div>
                        ) : (
                          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Disponível</span>
                        )}
                      </div>
                      
                      {agendamento ? (
                        <div className="pl-1">
                           {/* DISCIPLINA REMOVIDA DAQUI - Só mostra o Docente agora */}
                           <div className="flex items-center gap-2 mt-1">
                              <div className="bg-zinc-100 dark:bg-zinc-800 p-2 rounded-full"><User className="h-4 w-4" /></div>
                              <span className="font-bold text-lg text-zinc-800 dark:text-zinc-100">{agendamento.docente}</span>
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