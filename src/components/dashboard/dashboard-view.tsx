"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, Plus, FlaskConical, Loader2 } from "lucide-react"
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
import { getDadosUsuarioSidebar } from "@/app/actions/auth" // Action existente para checar perfil
import { auth } from "@/lib/firebase"
import { AgendamentoComDetalhes, Sala } from "@/types"

interface DashboardViewProps {
  salasIniciais: Sala[]
}

export function DashboardView({ salasIniciais }: DashboardViewProps) {
  const today = new Date();
  
  const [date, setDate] = React.useState(new Date());
  const [selectedLab, setSelectedLab] = React.useState(salasIniciais[0]?.id.toString() || "");
  const [appointments, setAppointments] = React.useState<AgendamentoComDetalhes[]>([]);
  const [loadingApps, setLoadingApps] = React.useState(false);
  const [isAdmin, setIsAdmin] = React.useState(false); // Novo estado

  const [selectedDayDetails, setSelectedDayDetails] = React.useState<{ day: number, month: number, appointments: AgendamentoComDetalhes[] } | null>(null);
  const [isNovoAgendamentoOpen, setIsNovoAgendamentoOpen] = React.useState(false);

  const [preSelectedDate, setPreSelectedDate] = React.useState<Date | undefined>(undefined)
  const [preSelectedPeriod, setPreSelectedPeriod] = React.useState<string | undefined>(undefined)

  // --- EFEITOS ---

  // 1. Checa se é Admin ao carregar
  React.useEffect(() => {
    const checkRole = async () => {
        const user = auth.currentUser;
        if (user) {
            const dados = await getDadosUsuarioSidebar(user.uid);
            // Ajuste aqui conforme sua tabela: se for 'Administrador' ou booleano
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

  // 2. Busca Agendamentos
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
    const remainingSlots = 42 - days.length;
    for (let i = 1; i <= remainingSlots; i++) {
      days.push({ day: i, currentMonth: false, month: month + 1 });
    }
    return days;
  }, [date]);

  const getDailyApps = (day: number) => {
    return appointments.filter(a => {
        if (!a.dataInicio) return false;
        const appDate = new Date(a.dataInicio);
        return appDate.getDate() === day && appDate.getMonth() === date.getMonth();
    });
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#F8F9FA] dark:bg-zinc-950">
        
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
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

        <div className="flex flex-1 flex-col p-4 md:p-6 overflow-hidden h-[calc(100vh-64px)]">
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
             <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="flex items-center bg-white dark:bg-zinc-900 rounded-lg border shadow-sm p-1 h-10">
                  <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8"><ChevronLeft className="h-5 w-5" /></Button>
                  <div className="w-[1px] h-5 bg-border mx-1" />
                  <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8"><ChevronRight className="h-5 w-5" /></Button>
                </div>
                <h2 className="text-3xl font-bold capitalize text-zinc-800 dark:text-zinc-100 tracking-tight whitespace-nowrap">
                    {monthName}
                </h2>
                {loadingApps && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
             </div>

             <div className="flex items-center gap-2 w-full md:w-auto ml-auto">
                <div className="relative w-full md:w-[320px]">
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
                        {salasIniciais.map((lab) => (
                            <SelectItem key={lab.id} value={String(lab.id)}>{lab.nome}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </div>

                <Button 
                    className=" px-4 font-medium shadow-md whitespace-nowrap shrink-0"
                    onClick={handleOpenGenericBooking}
                >
                    <Plus className="mr-2 h-5 w-5" /> Novo Agendamento
                </Button>
             </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 mb-3 px-1">
             <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm"></span> Manhã</div>
             <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm"></span> Tarde</div>
             <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm"></span> Noite</div>
             <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground ml-auto sm:ml-4"><span className="w-2.5 h-2.5 rounded border border-zinc-300 bg-red-50 dark:bg-red-900/20 shadow-sm"></span> Fim de Semana</div>
          </div>

          <div className="flex-1 bg-white dark:bg-zinc-900 border rounded-xl shadow-sm flex flex-col overflow-hidden">
             <div className="grid grid-cols-7 border-b bg-zinc-50/80 dark:bg-zinc-900/50">
                {["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"].map((d) => (
                  <div key={d} className="py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    <span className="hidden md:inline">{d}</span>
                    <span className="md:hidden">{d.slice(0, 3)}</span>
                  </div>
                ))}
             </div>

             <div className="grid grid-cols-7 flex-1 auto-rows-fr">
                {calendarDays.map((slot, i) => {
                  if (!slot.currentMonth) return <div key={i} className="border-b border-r bg-transparent" />;

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
                        "relative border-b border-r p-2 transition-all flex flex-col gap-1 min-h-[80px] select-none",
                        isWeekend 
                            ? "bg-red-50/40 dark:bg-red-950/10 cursor-not-allowed" 
                            : "bg-background cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                      )}
                    >
                      <div className="flex items-center justify-between">
                         <span className={cn(
                           "text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full transition-colors",
                           isToday ? "bg-primary text-primary-foreground shadow-md font-bold" : "text-zinc-600 dark:text-zinc-400",
                           isWeekend && "text-zinc-400 dark:text-zinc-600"
                         )}>
                            {slot.day}
                         </span>
                      </div>
                      
                      {!isWeekend && (
                          <div className="flex flex-col gap-1 mt-1 overflow-hidden">
                            {apps.map((app) => <EventPill key={app.id} app={app} />)}
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
          isAdmin={isAdmin} // <--- Passando a permissão
          // Callback para quando aprovar/rejeitar e precisar atualizar o calendário
          onActionSuccess={() => {
             setSelectedDayDetails(null); // Fecha o modal
             fetchApps(); // Recarrega os dados
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