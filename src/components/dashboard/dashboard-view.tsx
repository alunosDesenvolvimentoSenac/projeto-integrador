"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, Plus, FlaskConical, Loader2, Clock, ListFilter } from "lucide-react"
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { AppSidebar } from "@/components/app-sidebar"
import { EventPill } from "./event-pill" 
import { DayDetailsDialog } from "./day-details-dialog"
import { NovoAgendamentoDialog } from "./novo-agendamento-dialog"

import { buscarAgendamentosDoMes } from "@/app/actions/agendamento"
import { getDadosUsuarioSidebar } from "@/app/actions/auth"
import { auth } from "@/lib/firebase"
import { AgendamentoComDetalhes, Sala } from "@/types"

interface DashboardViewProps {
  salasIniciais: Sala[]
}

export function DashboardView({ salasIniciais }: DashboardViewProps) {
  const today = new Date();
  
  // --- ESTADOS ---
  const [date, setDate] = React.useState(new Date());
  const [selectedLab, setSelectedLab] = React.useState(salasIniciais[0]?.id.toString() || "");
  const [appointments, setAppointments] = React.useState<AgendamentoComDetalhes[]>([]);
  const [loadingApps, setLoadingApps] = React.useState(false);
  const [isAdmin, setIsAdmin] = React.useState(false);

  // --- FILTROS ---
  const [filterPeriodo, setFilterPeriodo] = React.useState<string>("todos");
  const [filterStatus, setFilterStatus] = React.useState<string>("todos");

  // Modais
  const [selectedDayDetails, setSelectedDayDetails] = React.useState<{ day: number, month: number, appointments: AgendamentoComDetalhes[] } | null>(null);
  const [isNovoAgendamentoOpen, setIsNovoAgendamentoOpen] = React.useState(false);

  const [preSelectedDate, setPreSelectedDate] = React.useState<Date | undefined>(undefined)
  const [preSelectedPeriod, setPreSelectedPeriod] = React.useState<string | undefined>(undefined)

  // --- EFEITOS ---

  React.useEffect(() => {
    const checkRole = async () => {
        const user = auth.currentUser;
        if (user) {
            const dados = await getDadosUsuarioSidebar(user.uid);
            if (dados && dados.cargo === 'Administrador') { 
                setIsAdmin(true);
            }
        }
    }
    const unsubscribe = auth.onAuthStateChanged((u) => {
        if(u) checkRole();
    });
    return () => unsubscribe();
  }, []);

  const fetchApps = React.useCallback(async () => {
    if (!selectedLab) return;
    setLoadingApps(true);
    try {
      const dados = await buscarAgendamentosDoMes(date.getMonth(), date.getFullYear(), Number(selectedLab));
      setAppointments(dados as any);
    } catch (error) {
      console.error("Erro ao buscar agendamentos", error);
    } finally {
      setLoadingApps(false);
    }
  }, [date, selectedLab]);

  React.useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  // --- HANDLERS ---

  const nextMonth = () => setDate(new Date(date.getFullYear(), date.getMonth() + 1, 1));
  const prevMonth = () => setDate(new Date(date.getFullYear(), date.getMonth() - 1, 1));
  const monthName = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const handleDayClick = (day: number, month: number, apps: any[]) => {
    setSelectedDayDetails({ day, month, appointments: apps });
  };

  const handleOpenGenericBooking = () => {
      setPreSelectedDate(new Date()) 
      setPreSelectedPeriod(undefined) 
      setIsNovoAgendamentoOpen(true)
  }

  const handleBookingFromDetails = (periodo: string) => {
      if (selectedDayDetails) {
          const dataClicada = new Date(date.getFullYear(), selectedDayDetails.month, selectedDayDetails.day)
          setPreSelectedDate(dataClicada)
          setPreSelectedPeriod(periodo)
          setIsNovoAgendamentoOpen(true)
      }
  }

  // --- LÓGICA DO GRID ---
  const calendarDays = React.useMemo(() => {
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
    
    // Completar o grid para sempre ter dias suficientes (visual mais bonito)
    const remainingSlots = 35 - days.length;
    for (let i = 1; i <= remainingSlots; i++) {
      days.push({ day: i, currentMonth: false, month: month + 1 });
    }
    return days;
  }, [date]);

  const getDailyApps = (day: number) => {
    return appointments.filter(a => {
        if (!a.dataInicio) return false;
        
        const appDate = new Date(a.dataInicio);
        const matchDate = appDate.getDate() === day && appDate.getMonth() === date.getMonth();
        if (!matchDate) return false;

        if (filterPeriodo !== "todos" && a.periodo !== filterPeriodo) return false;
        if (filterStatus !== "todos" && a.status !== filterStatus) return false;

        return true;
    });
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      {/* ALTERAÇÃO 1: Removi h-screen e overflow-hidden. 
          Usei min-h-screen para garantir que cubra a tela, mas permita scroll se crescer.
      */}
      <SidebarInset className="bg-[#F8F9FA] dark:bg-zinc-950 flex flex-col min-h-screen">
        
        <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4 sticky top-0 z-20">
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
                  <BreadcrumbPage>Visão Geral</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        {/* ALTERAÇÃO 2: Removi 'overflow-hidden' e 'h-[calc...]'
            Isso permite que o conteúdo empurre a página para baixo.
        */}
        <div className="flex flex-1 flex-col p-3 md:p-6">
          
          {/* BARRA DE CONTROLES */}
          <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 mb-4">
             
              {/* BARRA SUPERIOR */}
          <div className="flex items-center justify-between h-1 w-full ">
              <div className="flex items-center bg-white dark:bg-zinc-900 rounded-lg border shadow-sm p-1">
                <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8 text-zinc-500 hover:text-zinc-900"><ChevronLeft className="h-4 w-4" /></Button>
                <div className="px-4 border-x border-zinc-100 dark:border-zinc-800 mx-1 min-w-[180px] flex justify-center">
                    <span className="text-sm font-semibold capitalize text-zinc-700 dark:text-zinc-200 tracking-tight">{monthName}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8 text-zinc-500 hover:text-zinc-900"><ChevronRight className="h-4 w-4" /></Button>
              </div>
              </div>

             {/* Direita */}
             <div className="flex flex-col sm:flex-row items-center gap-2 w-full xl:w-auto ml-auto">
                {/* ... (Selects e Botões mantidos iguais) ... */}
                <div className="relative w-full sm:w-[280px]">
                    <Select value={selectedLab} onValueChange={setSelectedLab}>
                        <SelectTrigger className="h-10 bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 shadow-sm w-full font-medium">
                          <div className="flex items-center gap-2 truncate">
                              <div className="bg-primary/10 p-1 rounded-md shrink-0">
                                  <FlaskConical className="h-4 w-4 text-primary" />
                              </div>
                              <SelectValue placeholder="Selecione o laboratório" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                        {salasIniciais.map((lab) => (
                            <SelectItem key={lab.id} value={String(lab.id)}>
                                <span className="font-mono font-bold text-muted-foreground mr-2 text-xs">{lab.codigo}</span>
                                {lab.nome}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="w-full sm:w-[140px]">
                    <Select value={filterPeriodo} onValueChange={setFilterPeriodo}>
                        <SelectTrigger className="h-10 bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 shadow-sm w-full">
                            <div className="flex items-center gap-2 truncate">
                                <div className="bg-zinc-100 dark:bg-zinc-800 p-1 rounded-md shrink-0">
                                    <Clock className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                                </div>
                                <SelectValue placeholder="Período" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="todos">Período</SelectItem>
                            <SelectItem value="Manhã">Manhã</SelectItem>
                            <SelectItem value="Tarde">Tarde</SelectItem>
                            <SelectItem value="Noite">Noite</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="w-full sm:w-[140px]">
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="h-10 bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 shadow-sm w-full">
                            <div className="flex items-center gap-2 truncate">
                                <div className="bg-zinc-100 dark:bg-zinc-800 p-1 rounded-md shrink-0">
                                    <ListFilter className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                                </div>
                                <SelectValue placeholder="Status" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="todos">Status</SelectItem>
                            <SelectItem value="pendente">Pendentes</SelectItem>
                            <SelectItem value="confirmado">Confirmados</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Button 
                    className="h-10 px-4 font-medium shadow-md whitespace-nowrap shrink-0 w-full sm:w-auto"
                    onClick={handleOpenGenericBooking}
                >
                    <Plus className="mr-2 h-5 w-5" /> Novo
                </Button>
             </div>
          </div>

          {/* LEGENDAS */}
          <div className="flex flex-wrap items-center gap-6 mb-4 px-2 py-2 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-lg border border-zinc-100 dark:border-zinc-800 shrink-0">
             {/* ... (Legendas mantidas iguais) ... */}
             <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mr-auto md:mr-0">Legenda</div>
             <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-sky-500 ring-1 ring-offset-1 ring-offset-zinc-50 ring-transparent"></span><span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Manhã</span></div>
             <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-orange-500 ring-1 ring-offset-1 ring-offset-zinc-50 ring-transparent"></span><span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Tarde</span></div>
             <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-indigo-500 ring-1 ring-offset-1 ring-offset-zinc-50 ring-transparent"></span><span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Noite</span></div>
             <div className="h-3 w-[1px] bg-zinc-300 dark:bg-zinc-700 hidden sm:block"></div>
             <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-red-500"></div><span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Pendente</span></div>
             <div className="flex items-center gap-2 ml-auto"><span className="h-3 w-3 rounded-[2px] bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50"></span><span className="text-xs font-medium text-muted-foreground">Fim de Semana</span></div>
          </div>

          {/* GRID DO CALENDÁRIO 
              ALTERAÇÃO 3: Removi 'overflow-hidden' e defini uma altura mínima segura para as células.
          */}
          <div className="bg-white dark:bg-zinc-900 border rounded-xl shadow-sm flex flex-col">
             
             {/* Cabeçalho */}
             <div className="grid grid-cols-7 border-b bg-zinc-50/80 dark:bg-zinc-900/50">
                {["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"].map((d) => (
                  <div key={d} className="py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    <span className="hidden md:inline">{d}</span>
                    <span className="md:hidden">{d.slice(0, 3)}</span>
                  </div>
                ))}
             </div>

             {/* Dias */}
             <div className="grid grid-cols-7 auto-rows-fr">
                {calendarDays.map((slot, i) => {
                  if (!slot.currentMonth) return <div key={i} className="border-b border-r bg-zinc-50/20 dark:bg-zinc-900/20" />;

                  const apps = getDailyApps(slot.day);
                  const isToday = slot.day === today.getDate() && slot.month === today.getMonth() && date.getFullYear() === today.getFullYear();
                  
                  const slotDate = new Date(date.getFullYear(), slot.month, slot.day);
                  const dayOfWeek = slotDate.getDay(); 
                  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                  return (
                    <div 
                      key={i}
                      onClick={() => !isWeekend && handleDayClick(slot.day, slot.month, apps)}
                      className={cn(
                        // ALTERAÇÃO 4: min-h fixo generoso (140px)
                        // Isso garante que o quadrado nunca encolha, mesmo se a tela for pequena.
                        "relative border-b border-r p-1 md:p-2 transition-all flex flex-col gap-1 min-h-[140px] select-none",
                        isWeekend 
                            ? "bg-red-50/40 dark:bg-red-950/10 cursor-not-allowed" 
                            : "bg-background cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                      )}
                    >
                      <div className="flex items-center justify-center md:justify-between mb-1">
                         <span className={cn(
                           "text-xs md:text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full transition-colors",
                           isToday ? "bg-primary text-primary-foreground shadow-md font-bold" : "text-zinc-600 dark:text-zinc-400",
                           isWeekend && "text-zinc-400 dark:text-zinc-600"
                         )}>
                            {slot.day}
                         </span>
                      </div>
                      
                      {!isWeekend && (
                          <div className="flex flex-col gap-0.5 mt-0.5">
                            
                            {/* Desktop */}
                            <div className="hidden md:flex flex-col gap-0.5">
                                {apps.map((app) => <EventPill key={app.id} app={app} />)}
                            </div>

                            {/* Mobile */}
                            <div className="flex md:hidden flex-wrap gap-1 justify-center content-end pb-1">
                                {apps.map((app) => {
                                    const dotColor = app.status === 'pendente' 
                                        ? "bg-red-500"
                                        : app.periodo === 'Manhã' ? "bg-sky-500"
                                        : app.periodo === 'Tarde' ? "bg-orange-500"
                                        : "bg-indigo-500";
                                    return <div key={app.id} className={cn("h-1.5 w-1.5 rounded-full", dotColor)} />
                                })}
                            </div>

                          </div>
                      )}
                    </div>
                  )
                })}
             </div>
          </div>
        </div>

        <DayDetailsDialog 
          isOpen={!!selectedDayDetails}
          onClose={() => setSelectedDayDetails(null)}
          data={selectedDayDetails}
          monthName={monthName}
          onAgendarClick={handleBookingFromDetails}
          isAdmin={isAdmin}
          onActionSuccess={() => {
             setSelectedDayDetails(null); 
             fetchApps(); 
          }}
        />

        <NovoAgendamentoDialog 
          isOpen={isNovoAgendamentoOpen}
          onClose={() => setIsNovoAgendamentoOpen(false)}
          idSalaSelecionada={Number(selectedLab)}
          nomeSala={salasIniciais.find(s => s.id === Number(selectedLab))?.nome || "Sala"}
          initialDate={preSelectedDate}
          initialPeriod={preSelectedPeriod}
          onSuccess={fetchApps} 
        />

      </SidebarInset>
    </SidebarProvider>
  )
}