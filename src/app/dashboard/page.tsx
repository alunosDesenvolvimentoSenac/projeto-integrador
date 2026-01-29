"use client"

import * as React from "react"
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User, 
  CheckCircle2, AlertCircle, Plus, FlaskConical, ListChecks, 
  Loader2, X, Check, Lock, CalendarDays, Layers, ListFilter,
  SunMedium, FileWarning 
} from "lucide-react"

import { useRouter } from "next/navigation" 
import { auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { getDadosUsuarioSidebar } from "@/app/actions/auth"

import { 
  getAgendamentosAction, 
  saveAgendamentoAction, 
  deleteAgendamentoAction, 
  deleteSerieAction, 
  approveAgendamentoAction, 
  approveSerieAction, 
  getSalasAction,
  getUsersOptionsAction
} from "@/app/actions/agendamentos"

import { getRelatoriosPendentesAction } from "@/app/actions/checklist"

import { format, differenceInDays } from "date-fns"
import { ptBR } from "date-fns/locale"

import { AppSidebar } from "@/components/app-sidebar"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input" 
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/sonner" 
import { toast } from "sonner"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

type Periodo = "Manhã" | "Tarde" | "Noite"

interface Usuario {
  id: number;
  nome: string;
  email: string;
  role: "ADMIN" | "USER"
}

interface Agendamento {
  id: number; 
  dia: number; 
  mes: number; 
  ano: number; 
  periodo: Periodo;
  status: "confirmado" | "pendente"; 
  docente: string; 
  disciplina: string;
  labId?: number; 
  groupId?: string; 
  observacao?: string; 
  dataInicio?: string 
}

interface Sala { id: number; nome: string; codigo?: string; }

export default function DashboardView() {
  const router = useRouter()
  const today = new Date();
  today.setHours(0, 0, 0, 0); 

  const [date, setDate] = React.useState(new Date()) 
  const [agendamentos, setAgendamentos] = React.useState<Agendamento[]>([])
  const [laboratorios, setLaboratorios] = React.useState<Sala[]>([]) 
  const [usersOptions, setUsersOptions] = React.useState<any[]>([]) 
  const [relatoriosPendentes, setRelatoriosPendentes] = React.useState<any[]>([]) 
  const [isLoading, setIsLoading] = React.useState(true)
  const [currentUser, setCurrentUser] = React.useState<Usuario | null>(null)

  const [selectedLab, setSelectedLab] = React.useState("0") 
  const [filterStatus, setFilterStatus] = React.useState("todos")
  const [filterPeriod, setFilterPeriod] = React.useState("todos")

  const [isLabError, setIsLabError] = React.useState(false)

  const [selectedDayDetails, setSelectedDayDetails] = React.useState<{ day: number, month: number, year: number, appointments: Agendamento[] } | null>(null)
  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [isRangeMode, setIsRangeMode] = React.useState(false) 
    
  const [formInitialDate, setFormInitialDate] = React.useState<{
    day: number, month: number, year: number, periodoPre?: Periodo, labIdPre?: string 
  } | null>(null)

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const rawResponse = await getDadosUsuarioSidebar(user.uid)
          const infoBanco = Array.isArray(rawResponse) ? rawResponse[0] : rawResponse;

          if (infoBanco) {
            const rawId = (infoBanco as any).id_usuario || (infoBanco as any).idUsuario || (infoBanco as any).id;
            const idUsuarioCorreto = Number(rawId);
            const roleMapeada = ((infoBanco as any).id_perfil === 1 || (infoBanco as any).cargo === "Administrador") ? "ADMIN" : "USER";

            if (!idUsuarioCorreto || isNaN(idUsuarioCorreto)) {
               toast.error("Erro crítico: ID do usuário não encontrado.");
            }

            const nomeCorreto = (infoBanco as any).nome || (infoBanco as any).nomeUsuario || (infoBanco as any).nome_usuario || "Usuário";

            setCurrentUser({
              id: idUsuarioCorreto || 0,
              nome: nomeCorreto,
              email: user.email || "",
              role: roleMapeada
            })
          }
        } catch (error) { console.error(error); }
      } else { setCurrentUser(null) }
    })
    return () => unsubscribe()
  }, [])

  const fetchData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const [dadosAgendamentos, dadosSalas, dadosRelatorios, dadosUsuarios] = await Promise.all([
        getAgendamentosAction(),
        getSalasAction(),
        getRelatoriosPendentesAction(),
        getUsersOptionsAction()
      ]);
      
      setAgendamentos(dadosAgendamentos as unknown as Agendamento[])
      setLaboratorios(dadosSalas)
      setRelatoriosPendentes(dadosRelatorios)
      setUsersOptions(dadosUsuarios)
    } catch (error) {
      console.error(error)
      toast.error("Erro ao carregar dados.")
    } finally {
      setIsLoading(false)
    }
  }, []) 

  React.useEffect(() => { fetchData() }, [fetchData])

  const nextMonth = () => setDate(new Date(date.getFullYear(), date.getMonth() + 1, 1))
  const prevMonth = () => setDate(new Date(date.getFullYear(), date.getMonth() - 1, 1))
  const rawMonthName = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const monthName = rawMonthName.charAt(0).toUpperCase() + rawMonthName.slice(1);

 const validateLabSelection = () => {
    if (!selectedLab || selectedLab === "0") {
        setIsLabError(true);
        toast.error("Selecione uma Sala", { 
            description: "É necessário escolher uma sala para visualizar a agenda.",
            duration: 4000,
            icon: <FlaskConical className="h-5 w-5 text-red-500" />,
            id: "erro-selecionar-lab" // <--- ADICIONE ESTA LINHA
        });
        return false;
    }
    return true;
}

  const handleDayClick = (day: number, month: number, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return;
    if (!validateLabSelection()) return;

    const year = date.getFullYear()
    
    // Cria as datas para comparação
    const clickedDate = new Date(year, month, day);
    const now = new Date();
    now.setHours(0,0,0,0); // Zera hora para comparar apenas o dia

    // LÓGICA DE BLOQUEIO (Para todos)
    if (clickedDate < now) {
        toast.error("Data Retroativa", { 
            description: "Não é possível agendar Data Retroativa.", 
            icon: <Lock className="h-4 w-4 text-red-500"/>,
            id: "erro-data-retroativa" // Impede spam de mensagens
        })
        return;
    }

    const apps = getAppointments(day, month, year)
    setSelectedDayDetails({ day, month, year, appointments: apps })
  }

  const handleOpenAddForm = (periodo?: Periodo, enableRange: boolean = false) => {
    if (!currentUser || !currentUser.id) return;

    const usuarioTemPendencia = relatoriosPendentes.some(r => r.idUsuario === currentUser.id);

    if (usuarioTemPendencia && currentUser.role !== "ADMIN") {
        router.push("/agendamentosMeus");
        return;
    }

    if (!validateLabSelection()) return;

    let targetDay = today.getDate();
    let targetMonth = today.getMonth();
    let targetYear = today.getFullYear();

    if (selectedDayDetails && !enableRange) {
        targetDay = selectedDayDetails.day;
        targetMonth = selectedDayDetails.month;
        targetYear = selectedDayDetails.year;
        setSelectedDayDetails(null) 
    }

    setFormInitialDate({
        day: targetDay, month: targetMonth, year: targetYear, periodoPre: periodo, labIdPre: selectedLab 
    })
    setIsRangeMode(enableRange) 
    setIsFormOpen(true)
  }

  const handleSaveAppointment = async (data: any) => {
    if (!currentUser || !currentUser.id || currentUser.id === 0) {
        toast.error("Erro de Permissão", { description: "Usuário inválido. Recarregue a página." });
        return;
    }

    const startDate = new Date(data.startDetails.y, data.startDetails.m, data.startDetails.d);
    let endDate = startDate;
    if (data.endDateStr) {
        const [endY, endM, endD] = data.endDateStr.split('-').map(Number);
        endDate = new Date(endY, endM - 1, endD);
    }
    const actualEndDate = endDate < startDate ? startDate : endDate;

    const appointmentsToSave: any[] = [];
    const currentDateIterator = new Date(startDate);
    const todayZero = new Date(); todayZero.setHours(0,0,0,0);
    const now = new Date(); const currentHour = now.getHours();
    const initialStatus = currentUser.role === "ADMIN" ? "confirmado" : "pendente";

    let totalDaysAttempted = 0;

    while (currentDateIterator <= actualEndDate) {
        const currentDia = currentDateIterator.getDate();
        const currentMes = currentDateIterator.getMonth();
        const currentAno = currentDateIterator.getFullYear();
        const isLoopToday = currentDateIterator.getTime() === todayZero.getTime();

        const dayOfWeek = currentDateIterator.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        if (isWeekend && currentUser.role !== "ADMIN") {
            currentDateIterator.setDate(currentDateIterator.getDate() + 1);
            continue; 
        }

        totalDaysAttempted++;

        data.periodos.forEach((p: Periodo) => {
              let skip = false;
              if (isLoopToday) {
                  if (p === 'Manhã' && currentHour >= 12) skip = true;
                  if (p === 'Tarde' && currentHour >= 18) skip = true;
                  if (p === 'Noite' && currentHour >= 22) skip = true;
              }
              const conflito = agendamentos.find((a) => 
                  a.dia === currentDia && a.mes === currentMes && a.ano === currentAno && a.periodo === p && String(a.labId) === String(data.labId)
              );

              if (!skip && !conflito) {
                  appointmentsToSave.push({
                    dia: currentDia, mes: currentMes, ano: currentAno, periodo: p,
                    status: initialStatus, labId: data.labId, observacao: data.observacao,
                    docente: data.targetUserName, 
                    disciplina: data.disciplina 
                  });
              }
        });
        currentDateIterator.setDate(currentDateIterator.getDate() + 1);
    }

    if (appointmentsToSave.length === 0) {
        if (totalDaysAttempted > 0) {
             toast.error("Não foi possível agendar", { 
                 description: "Todas as datas/horários selecionados já estão ocupados ou indisponíveis.",
                 duration: 5000
             });
        } else {
             toast.warning("Indisponível", { description: "Agendamento restrito para as datas selecionadas." });
        }
        return;
    }

    const generatedGroupId = appointmentsToSave.length > 1 ? Math.random().toString(36).substr(2, 9) + Date.now().toString(36) : null;
    const finalPayload = appointmentsToSave.map(app => ({ ...app, groupId: generatedGroupId }));
    const toastId = toast.loading("Salvando...");

    try {
        const result = await saveAgendamentoAction(
            finalPayload, 
            data.targetUserId, 
            currentUser.id 
        );

        if (result.success) {
             const expectedItems = totalDaysAttempted * data.periodos.length;
             
             if (appointmentsToSave.length < expectedItems) {
                 toast.warning("Agendamento Parcial Realizado", { 
                     id: toastId, 
                     description: "Alguns dias ou horários já estavam ocupados e foram pulados. Verifique o calendário.",
                     duration: 6000 
                 });
             } else {
                 toast.success("Sucesso!", { id: toastId });
             }

             fetchData(); 
             setIsFormOpen(false);
        } else {
             toast.error("Erro ao salvar", { id: toastId, description: String(result.error) });
        }
    } catch (e) { 
        toast.error("Erro de conexão", { id: toastId }); 
    }
  }

  const handleDeleteAppointment = async (id: number, deleteAllInGroup: boolean = false, status?: string) => {
    const toastId = toast.loading("Removendo...");
    try {
        if (deleteAllInGroup) {
            const targetApp = agendamentos.find(a => a.id === id);
            if (targetApp && targetApp.groupId) await deleteSerieAction(targetApp.groupId, status || targetApp.status);
            else await deleteAgendamentoAction(id);
        } else {
            await deleteAgendamentoAction(id);
        }
        setAgendamentos(prev => prev.filter(a => {
            if (deleteAllInGroup) {
                const target = agendamentos.find(t => t.id === id);
                if (!target?.groupId) return a.id !== id;
                return !(a.groupId === target.groupId && a.status === (status || target.status));
            }
            return a.id !== id;
        }));
        await fetchData();
        if (selectedDayDetails) {
            if (deleteAllInGroup) setSelectedDayDetails(null);
            else {
                const updatedList = selectedDayDetails.appointments.filter(a => a.id !== id) as Agendamento[];
                setSelectedDayDetails({ ...selectedDayDetails, appointments: updatedList });
            }
        }
        toast.success("Removido!", { id: toastId });
    } catch (error) { toast.error("Erro ao remover.", { id: toastId }); }
  }

  const handleApproveAppointment = async (id: number, approveAllInGroup: boolean = false) => {
    const toastId = toast.loading("Aprovando...");
    try {
        if (approveAllInGroup) {
             const targetApp = agendamentos.find(a => a.id === id);
             if (targetApp && targetApp.groupId) await approveSerieAction(targetApp.groupId);
             else await approveAgendamentoAction(id);
        } else {
             await approveAgendamentoAction(id);
        }
        fetchData(); 
        toast.success("Aprovado!", { id: toastId });
        if (selectedDayDetails) setSelectedDayDetails(null); 
    } catch (error) { toast.error("Erro ao aprovar.", { id: toastId }); }
  }

  const calendarDays = React.useMemo(() => {
    const year = date.getFullYear(); const month = date.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay(); 
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDayOfMonth - 1; i >= 0; i--) days.push({ day: prevMonthDays - i, currentMonth: false, month: month - 1 });
    for (let i = 1; i <= daysInMonth; i++) days.push({ day: i, currentMonth: true, month: month });
    const remainingSlots = 42 - days.length; 
    for (let i = 1; i <= remainingSlots; i++) days.push({ day: i, currentMonth: false, month: month + 1 });
    return days;
  }, [date]);

  const getAppointments = (day: number, month: number, year: number) => {
    if (!selectedLab || selectedLab === "0") return [];
    const filtered = agendamentos.filter((a) => {
        const matchDate = a.dia === day && a.mes === month && a.ano === year;
        const matchStatus = filterStatus === "todos" ? true : a.status === filterStatus;
        const matchPeriod = filterPeriod === "todos" ? true : a.periodo === filterPeriod;
        const matchLab = String(a.labId) === String(selectedLab);
        return matchDate && matchStatus && matchPeriod && matchLab;
    });
    const order = { "Manhã": 1, "Tarde": 2, "Noite": 3 };
    return filtered.sort((a, b) => order[a.periodo] - order[b.periodo]);
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#F8F9FA] dark:bg-zinc-950 flex flex-col flex-1 h-full overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4 sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" /><Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb><BreadcrumbList><BreadcrumbItem className="hidden md:block"><BreadcrumbLink >Agendamento</BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator className="hidden md:block" /><BreadcrumbItem><BreadcrumbPage>Agendar Sala</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb>
          </div>
          {isLoading && <Loader2 className="ml-auto h-4 w-4 animate-spin text-muted-foreground"/>}
        </header>
        <div className="flex flex-1 flex-col p-3 md:p-6">
          <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 mb-4 shrink-0">
            <div className="flex items-center justify-between bg-white dark:bg-zinc-900 rounded-md border border-zinc-300 dark:border-zinc-700 shadow-sm h-9 w-full sm:w-[320px] px-1 gap-2">
                <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8 hover:bg-zinc-100 dark:hover:bg-zinc-800"><ChevronLeft className="h-4 w-4" /></Button>
                <span className="font-semibold text-sm text-zinc-800 dark:text-zinc-100 whitespace-nowrap">{monthName}</span>
                <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8 hover:bg-zinc-100 dark:hover:bg-zinc-800"><ChevronRight className="h-4 w-4" /></Button>
             </div>
             <div className="flex flex-col sm:flex-row flex-wrap items-center gap-2 w-full xl:w-auto ml-auto">
                <div className="relative w-full sm:flex-1 min-w-[200px] xl:w-[280px]">
                    <Select value={selectedLab} onValueChange={(val) => { setSelectedLab(val); setIsLabError(false); }}>
                        <SelectTrigger className={cn("h-9 bg-white dark:bg-zinc-900 shadow-sm w-full font-normal transition-all duration-300", isLabError ? "border-red-500 ring-2 ring-red-200 dark:ring-red-900 animate-in fade-in zoom-in-95" : "border-zinc-300 dark:border-zinc-700")}>
                          <div className="flex items-center gap-2 truncate"><div className="bg-primary/10 p-1 rounded-md shrink-0"><FlaskConical className="h-3 w-3 text-primary" /></div><SelectValue placeholder="Laboratório" /></div>
                        </SelectTrigger>
                        <SelectContent><SelectItem value="0" disabled>Selecione uma sala...</SelectItem>{laboratorios.map((lab) => (<SelectItem key={lab.id} value={String(lab.id)}>{lab.codigo && <span className="font-mono font-bold text-muted-foreground mr-2 ">{lab.codigo}</span>}{lab.nome}</SelectItem>))}</SelectContent>
                    </Select>
                </div>
                <div className="w-full sm:w-auto sm:min-w-[130px]">
                    <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                        <SelectTrigger className="h-9 bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 shadow-sm w-full "><div className="flex items-center gap-2 truncate"><div className="bg-zinc-100 dark:bg-zinc-800 p-1 rounded-md shrink-0"><Clock className="h-3 w-3 text-zinc-500 dark:text-zinc-400" /></div><SelectValue placeholder="Período" /></div></SelectTrigger>
                        <SelectContent><SelectItem value="todos">Períodos</SelectItem><SelectItem value="Manhã">Manhã</SelectItem><SelectItem value="Tarde">Tarde</SelectItem><SelectItem value="Noite">Noite</SelectItem></SelectContent>
                    </Select>
                </div>
                <div className="w-full sm:w-auto sm:min-w-[130px]">
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="h-9 bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 shadow-sm w-full "><div className="flex items-center gap-2 truncate"><div className="bg-zinc-100 dark:bg-zinc-800 p-1 rounded-md shrink-0"><ListFilter className="h-3 w-3 text-zinc-500 dark:text-zinc-400" /></div><SelectValue placeholder="Status" /></div></SelectTrigger>
                        <SelectContent><SelectItem value="todos">Status</SelectItem><SelectItem value="pendente">Pendentes</SelectItem><SelectItem value="confirmado">Confirmados</SelectItem></SelectContent>
                    </Select>
                </div>
                <Button className="h-9 px-4 font-medium shadow-md whitespace-nowrap shrink-0 w-full sm:w-auto  bg-primary hover:bg-primary/90" onClick={() => handleOpenAddForm(undefined, true)}><Plus className="mr-2 h-4 w-4" /> Agendar Período</Button>
             </div>
          </div>
          {/* Legenda e Grid do Calendário */}
          <div className="flex flex-wrap items-center gap-6 mb-4 px-2 py-2 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-lg border border-zinc-100 dark:border-zinc-800 shrink-0">
             <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mr-auto md:mr-0">Legenda</div>
             <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-sky-500"></span><span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Manhã</span></div>
             <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-orange-500"></span><span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Tarde</span></div>
             <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-zinc-900 dark:bg-zinc-100"></span><span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Noite</span></div>
             <div className="h-3 w-[1px] bg-zinc-300 dark:bg-zinc-700 hidden sm:block"></div>
             <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-emerald-500"></div><span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Confirmado</span></div>
             <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-amber-500"></div><span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Pendente</span></div>
             <div className="flex items-center gap-2 ml-auto"><span className="h-3 w-3 rounded-[2px] bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50"></span><span className="text-xs font-medium text-muted-foreground">Fim de Semana</span></div>
          </div>
          <div className="bg-white dark:bg-zinc-900 border rounded-xl shadow-sm flex flex-col">
             <div className="grid grid-cols-7 border-b bg-zinc-50/80 dark:bg-zinc-900/50">
                {["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"].map((d) => (
                  <div key={d} className="py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider"><span className="hidden md:inline">{d}</span><span className="md:hidden">{d.slice(0, 3)}</span></div>
                ))}
             </div>
             <div className="grid grid-cols-7 auto-rows-fr">
                {calendarDays.map((slot, i) => {
                  let slotYear = date.getFullYear(); if (slot.month === -1) slotYear = date.getFullYear() - 1; if (slot.month === 12) slotYear = date.getFullYear() + 1;
                  const apps = getAppointments(slot.day, slot.month, slotYear);
                  const isToday = slot.day === today.getDate() && slot.month === today.getMonth() && date.getFullYear() === today.getFullYear();
                  const slotDate = new Date(slotYear, slot.month, slot.day);
                  const dayOfWeek = slotDate.getDay(); const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                  const isOtherMonth = !slot.currentMonth;
                  return (
                    <div key={i} onClick={() => !isWeekend && !isOtherMonth && handleDayClick(slot.day, slot.month, slot.currentMonth)} className={cn("relative border-b border-r p-1 md:p-2 transition-all flex flex-col gap-1 min-h-[140px] select-none", isOtherMonth ? "bg-zinc-50/60 dark:bg-zinc-950/40 text-muted-foreground/30 cursor-default" : isWeekend ? "bg-red-50/40 dark:bg-red-950/10 cursor-not-allowed" : "bg-background cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50")}>
                      <div className="flex items-center justify-center md:justify-between mb-1">
                          <span className={cn("text-xs md:text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full transition-colors", isToday ? "bg-primary text-primary-foreground shadow-md font-bold" : "text-zinc-600 dark:text-zinc-400", (isWeekend || isOtherMonth) && "text-zinc-400 dark:text-zinc-600 opacity-60")}>{slot.day}</span>
                      </div>
                      {!isWeekend && !isOtherMonth && (
                          <div className="flex flex-col gap-1.5 mt-1">
                            <div className="hidden md:flex flex-col gap-1.5">{apps.slice(0, 4).map((app) => <EventPill key={app.id} app={app} />)}{apps.length > 4 && <span className="text-[10px] text-muted-foreground pl-1">+ {apps.length - 4}</span>}</div>
                            <div className="flex md:hidden flex-wrap gap-1 justify-center content-end pb-1">{apps.map((app) => {const dotColor = app.periodo === 'Manhã' ? "bg-sky-500" : app.periodo === 'Tarde' ? "bg-orange-500" : "bg-zinc-900 dark:bg-zinc-100"; return <div key={app.id} className={cn("h-1.5 w-1.5 rounded-full", dotColor, app.status === 'pendente' && "opacity-60")} />})}</div>
                          </div>
                      )}
                    </div>
                  )
                })}
             </div>
          </div>
        </div>
        <DayDetailsDialog isOpen={!!selectedDayDetails} onClose={() => setSelectedDayDetails(null)} data={selectedDayDetails} monthName={monthName} onAddClick={(periodo: Periodo) => handleOpenAddForm(periodo, false)} onDelete={handleDeleteAppointment} onApprove={handleApproveAppointment} currentUser={currentUser} />
        <AppointmentFormDialog isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} formData={formInitialDate} onSave={handleSaveAppointment} laboratorios={laboratorios} currentUser={currentUser} usersOptions={usersOptions} isRangeMode={isRangeMode} />
      </SidebarInset>
      <Toaster position="bottom-right" className="z-[99999]" />
    </SidebarProvider>
  )
}

interface EventPillProps { app: Agendamento }
export function EventPill({ app }: EventPillProps) {
  const dotColors = { Manhã: "bg-sky-500", Tarde: "bg-orange-500", Noite: "bg-zinc-900 dark:bg-zinc-100" }
  const isPendente = app.status === 'pendente';
  return (
    <div className={cn("group flex items-center gap-3 px-2.5 py-1.5 rounded-md border text-xs font-medium transition-all duration-200", "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 shadow-sm", "hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md", isPendente && "bg-amber-50/50 border-dashed border-amber-200 dark:border-amber-900/50")}>
      <div className={cn("h-2 w-2 rounded-full shrink-0", dotColors[app.periodo])} />
      <div className="flex flex-1 items-center gap-2.5 overflow-hidden">
          <span className={cn("text-[10px] font-bold uppercase tracking-widest shrink-0 w-[24px] text-center", isPendente ? "text-amber-600/90" : "text-muted-foreground/60")}>{app.periodo.slice(0, 3)}</span>
          <div className="h-3 w-[1px] bg-zinc-200 dark:bg-zinc-800 shrink-0 group-hover:bg-zinc-300 transition-colors" />
          <span className={cn("truncate leading-none flex-1", isPendente ? "text-amber-900/80 dark:text-amber-200" : "text-zinc-700 dark:text-zinc-200")}>{app.docente}</span>
          {app.groupId && (<div className="ml-2 pl-2 border-l border-zinc-200 dark:border-zinc-700 shrink-0"><Layers className="h-3 w-3 text-zinc-400 dark:text-zinc-500" /></div>)}
      </div>
    </div>
  )
}

function DayDetailsDialog({ isOpen, onClose, data, monthName, onAddClick, onDelete, onApprove, currentUser }: any) {
    const [confirmationState, setConfirmationState] = React.useState<{ isOpen: boolean; type: 'delete' | 'approve'; item: { id: number, groupId?: string, status: string }; step: 'select-scope' | 'confirm'; scope: 'single' | 'series' | null; } | null>(null);
    React.useEffect(() => { if (!isOpen) setConfirmationState(null); }, [isOpen]);
    if (!data) return null
    const periodosOrder: Periodo[] = ["Manhã", "Tarde", "Noite"]
    const isAdmin = currentUser?.role === "ADMIN"
    const truncateText = (text: string, limit: number) => { if (!text) return ""; return text.length > limit ? text.substring(0, limit) + "..." : text; }
    const renderSmartText = (fullText: string, limit: number, label: string, isItalic = false) => {
        if (!fullText) return null; const isTruncated = fullText.length > limit; const baseClasses = cn("text-xs text-zinc-900 dark:text-zinc-100 break-all transition-colors leading-relaxed", isItalic && "italic");
        if (!isTruncated) return <div className={cn(baseClasses, isItalic && "mt-2 bg-muted/30 p-2 rounded border border-transparent")}>{isItalic ? `"${fullText}"` : fullText}</div>;
        return (<Popover><PopoverTrigger asChild><div className={cn(baseClasses, "cursor-pointer hover:text-primary hover:underline decoration-primary/50 underline-offset-2", isItalic && "mt-2 bg-muted/30 hover:bg-muted/50 p-2 rounded border border-transparent hover:border-border")}>{isItalic ? `"${truncateText(fullText, limit)}"` : truncateText(fullText, limit)}</div></PopoverTrigger><PopoverContent side="bottom" align="start" className="w-auto max-w-[280px] p-3 text-sm break-words shadow-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"><p className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider mb-1 not-italic">{label}:</p><span className={cn("text-zinc-900 dark:text-zinc-100", isItalic && "italic")}>{isItalic ? `"${fullText}"` : fullText}</span></PopoverContent></Popover>);
    }
    const isPeriodExpired = (period: Periodo) => {
        const selectedDate = new Date(data.year, data.month, data.day); const today = new Date(); today.setHours(0,0,0,0);
        if (selectedDate < today) return true; if (selectedDate > today) return false;
        const currentHour = new Date().getHours();
        if (period === 'Manhã' && currentHour >= 12) return true; if (period === 'Tarde' && currentHour >= 18) return true; if (period === 'Noite' && currentHour >= 21) return true; 
        return false;
    }
    const handleInitialAction = (type: 'delete' | 'approve', app: Agendamento) => { const hasSeries = !!app.groupId; setConfirmationState({ isOpen: true, type: type, item: { id: app.id, groupId: app.groupId, status: app.status }, step: hasSeries ? 'select-scope' : 'confirm', scope: hasSeries ? null : 'single' }); }
    const confirmAction = async () => { if (!confirmationState) return; const isSeries = confirmationState.scope === 'series'; if (confirmationState.type === 'delete') { if (isSeries && confirmationState.item.groupId) { onDelete(confirmationState.item.id, true, confirmationState.item.status); } else { onDelete(confirmationState.item.id, false); } } else { onApprove(confirmationState.item.id, isSeries); } setConfirmationState(null); }

    return (<><Dialog open={isOpen} onOpenChange={onClose}><DialogContent className="sm:max-w-[480px] p-0 overflow-hidden gap-0"><DialogHeader className="px-6 py-4 bg-muted/20 border-b"><DialogTitle className="flex items-center gap-3"><div className="bg-background p-2 rounded-lg border shadow-sm"><CalendarIcon className="h-5 w-5 text-primary" /></div><div><span className="block text-xs font-normal text-muted-foreground uppercase tracking-wider">Agenda Detalhada</span><span className="text-lg">{data.day} de {monthName}</span></div></DialogTitle><DialogDescription className="sr-only">Lista de agendamentos</DialogDescription></DialogHeader><ScrollArea className="max-h-[60vh] p-6"><div className="grid gap-4">{periodosOrder.map((periodo) => { const agendamento = data.appointments.find((a: any) => a.periodo === periodo); const expired = isPeriodExpired(periodo); return (<div key={periodo} className={cn("group relative flex flex-col gap-2 rounded-xl border p-4 transition-all", agendamento ? "bg-card shadow-sm border-zinc-200 dark:border-zinc-800" : expired ? "bg-red-50/50 border-red-200 dark:bg-red-900/10 dark:border-red-900/30 opacity-80" : "bg-muted/10 border-dashed hover:border-primary/30", agendamento?.status === 'pendente' && "bg-amber-50/40 border-amber-200 border-dashed")}><div className="flex items-center justify-between"><div className="flex items-center gap-2"><Badge variant="outline" className="gap-1.5 font-normal"><Clock className="h-3 w-3" />{periodo}</Badge>{!agendamento && <span className={cn("text-[10px] font-medium uppercase tracking-wider", expired ? "text-red-500 font-bold" : "text-emerald-600")}>{expired ? "Encerrado" : "Disponível"}</span>}{agendamento && <div className="flex items-center gap-2"><Badge variant={agendamento.status === 'confirmado' ? 'default' : 'secondary'} className={cn("text-[10px] h-5 px-1.5", agendamento.status === 'confirmado' && "bg-emerald-600 hover:bg-emerald-700", agendamento.status === 'pendente' && "bg-amber-500 hover:bg-amber-600 text-white")}>{agendamento.status}</Badge>{agendamento.groupId && (<Badge variant="outline" className="h-5 px-1.5 gap-1 bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-800 text-[10px] pointer-events-none"><Layers className="h-3 w-3" /> Série</Badge>)}</div>}</div>{agendamento && isAdmin && (<div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">{agendamento.status === 'pendente' && <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600 hover:bg-emerald-50" onClick={() => handleInitialAction('approve', agendamento)}><Check className="h-4 w-4" /></Button>}<Button variant="ghost" size="icon" className="h-7 w-7 text-red-600 hover:bg-red-50" onClick={() => handleInitialAction('delete', agendamento)}><X className="h-4 w-4" /></Button></div>)}</div>{agendamento ? (<div className="pl-1 pt-1"><div className="flex items-start gap-3"><div className="bg-primary/10 p-2 rounded-full mt-0.5 shrink-0"><User className="h-4 w-4 text-primary" /></div><div className="flex-1 space-y-1 w-full min-w-0"><p className="font-semibold text-sm leading-tight text-zinc-900 dark:text-zinc-100 truncate">{agendamento.docente}</p>{renderSmartText(agendamento.disciplina, 60, "Disciplina")}{renderSmartText(agendamento.observacao, 100, "Observação", true)}</div></div></div>) : (!expired && <Button variant="ghost" size="sm" onClick={() => onAddClick(periodo)} className="w-full mt-1 border-2 border-dashed border-transparent hover:border-primary/20 hover:bg-primary/5 text-primary justify-start h-auto py-2"><Plus className="mr-2 h-4 w-4" />Agendar este horário</Button>)}</div>)})}</div></ScrollArea></DialogContent></Dialog><AlertDialog open={!!confirmationState} onOpenChange={(val) => !val && setConfirmationState(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirmação</AlertDialogTitle><AlertDialogDescription>{confirmationState?.step === 'select-scope' ? "Este agendamento faz parte de uma série. Como deseja prosseguir?" : "Tem certeza que deseja confirmar esta ação?"}</AlertDialogDescription></AlertDialogHeader>{confirmationState?.step === 'select-scope' ? (<div className="flex gap-4 py-4"><Button variant="outline" className="flex-1 flex-col h-auto py-4 gap-1" onClick={() => setConfirmationState(prev => prev ? ({ ...prev, scope: 'single', step: 'confirm' }) : null)}><span className="font-semibold">Apenas hoje</span><span className="text-xs text-muted-foreground">Ocorre somente nesta data</span></Button><Button variant="outline" className="flex-1 flex-col h-auto py-4 gap-1" onClick={() => setConfirmationState(prev => prev ? ({ ...prev, scope: 'series', step: 'confirm' }) : null)}><span className="font-semibold">Toda a série</span><span className="text-xs text-muted-foreground">Todos os dias vinculados</span></Button></div>) : (<AlertDialogFooter><Button variant="ghost" onClick={() => setConfirmationState(null)}>Cancelar</Button><AlertDialogAction onClick={confirmAction}>Confirmar</AlertDialogAction></AlertDialogFooter>)}</AlertDialogContent></AlertDialog></>)
}

function AppointmentFormDialog({ isOpen, onClose, formData, onSave, laboratorios, currentUser, usersOptions, isRangeMode }: any) {
    const [disciplina, setDisciplina] = React.useState("")
    const [labId, setLabId] = React.useState("")
    const [observacao, setObservacao] = React.useState("")
    const [startDate, setStartDate] = React.useState<Date | undefined>(undefined)
    const [endDate, setEndDate] = React.useState<Date | undefined>(undefined)
    const [selectedPeriodos, setSelectedPeriodos] = React.useState<Periodo[]>([])
    
    const [selectedUserId, setSelectedUserId] = React.useState<string>("")

    const today = new Date(); today.setHours(0,0,0,0);
  
    React.useEffect(() => {
        if(isOpen && formData && currentUser) {
            setDisciplina("")
            setLabId(String(formData.labIdPre || ""))
            setObservacao("") 
            if (formData.periodoPre) setSelectedPeriodos([formData.periodoPre])
            else setSelectedPeriodos([])
            const y = formData.year; const initialDate = new Date(y, formData.month, formData.day);
            setStartDate(initialDate);
            if (isRangeMode) { const nextDay = new Date(initialDate); nextDay.setDate(nextDay.getDate() + 1); setEndDate(nextDay); } else setEndDate(initialDate);
            
            setSelectedUserId(String(currentUser.id))
        }
    }, [isOpen, formData, isRangeMode, currentUser])

    const handleStartDateSelect = (date: Date | undefined) => {
        if (!date) return;
        setStartDate(date);
        const nextDay = new Date(date); nextDay.setDate(nextDay.getDate() + 1);
        if (!endDate || endDate < nextDay) setEndDate(nextDay);
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if(!labId || labId === "0") { toast.error("Selecione um laboratório."); return; }
        if(selectedPeriodos.length === 0) { toast.error("Selecione um turno."); return; }
        if(!startDate) { toast.error("Data inválida."); return; }
        
        const targetId = currentUser.role === "ADMIN" ? Number(selectedUserId) : currentUser.id;
        const targetName = currentUser.role === "ADMIN" ? usersOptions.find((u:any) => u.id === targetId)?.nome : currentUser.nome;

        const finalEndDate = endDate || startDate;
        const yEnd = finalEndDate.getFullYear(); const mEnd = String(finalEndDate.getMonth() + 1).padStart(2, '0'); const dEnd = String(finalEndDate.getDate()).padStart(2, '0');
        const endDateFormatted = `${yEnd}-${mEnd}-${dEnd}`;
        
        onSave({ 
            targetUserId: targetId, 
            targetUserName: targetName,
            disciplina, 
            labId: Number(labId), 
            startDetails: { d: startDate.getDate(), m: startDate.getMonth(), y: startDate.getFullYear() }, 
            endDateStr: endDateFormatted, 
            periodos: selectedPeriodos, 
            observacao 
        })
    }

    const isTurnoDisponivel = (turno: Periodo) => {
        if (!startDate) return false;
        const startZero = new Date(startDate); startZero.setHours(0, 0, 0, 0);
        if (startZero > today) return true; if (startZero < today) return false;
        const currentHour = new Date().getHours();
        if (turno === 'Manhã' && currentHour >= 12) return false; if (turno === 'Tarde' && currentHour >= 18) return false; if (turno === 'Noite' && currentHour >= 22) return false; 
        return true;
    }

    const togglePeriodo = (p: Periodo) => {
        if (!isRangeMode && !isTurnoDisponivel(p)) return; 
        setSelectedPeriodos(prev => prev.includes(p) ? [] : [p])
    }
  
    if (!formData) return null
  
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>{isRangeMode ? "Novo Agendamento" : "Agendar para o dia"}</DialogTitle><DialogDescription className="sr-only">Form</DialogDescription></DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
             {isRangeMode ? (
                <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="startDate" className="text-xs text-muted-foreground uppercase font-semibold">Data Inicial</Label>
                          <Popover>
                          <PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{startDate ? format(startDate, "PPP", { locale: ptBR }) : <span>Selecione...</span>}</Button></PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={startDate} onSelect={handleStartDateSelect} initialFocus locale={ptBR} disabled={(date) => date < today} /></PopoverContent>
                        </Popover>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label className="text-xs text-muted-foreground uppercase font-semibold">Data Final</Label>
                        <Popover>
                          <PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{endDate ? format(endDate, "PPP", { locale: ptBR }) : <span>Selecione...</span>}</Button></PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus locale={ptBR} disabled={(date) => !startDate || date <= startDate} /></PopoverContent>
                        </Popover>
                      </div>
                </div>
             ) : (
                <div className="flex flex-col gap-2">
                    <Label className="text-xs text-muted-foreground uppercase font-semibold">Data do Agendamento</Label>
                        <div className="flex items-center justify-center p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-md border text-sm font-medium w-full text-zinc-600 dark:text-zinc-400 cursor-not-allowed">
                            <CalendarDays className="mr-2 h-4 w-4 opacity-50"/>
                            
                            {String(formData.day).padStart(2, "0")}/{String(formData.month + 1).padStart(2, "0")}/{formData.year}
                        </div>
                </div>
             )}
             
             <div className="flex flex-col gap-2">
                <Label className="text-xs text-muted-foreground uppercase font-semibold mb-1">Turnos</Label>
                <div className="flex gap-2">
                    {(["Manhã", "Tarde", "Noite"] as Periodo[]).map((p) => {
                        const isSelected = selectedPeriodos.includes(p); const isAvailable = isRangeMode ? true : isTurnoDisponivel(p);
                        return (
                            <div key={p} onClick={() => togglePeriodo(p)} className={cn("flex-1 flex items-center justify-center gap-2 p-2.5 rounded-md border transition-all select-none text-sm font-medium", !isAvailable && "opacity-40 cursor-not-allowed bg-zinc-100 dark:bg-zinc-800", isAvailable && "cursor-pointer", isAvailable && isSelected ? "bg-primary text-primary-foreground border-primary shadow-sm" : isAvailable && "bg-background hover:bg-zinc-50 dark:hover:bg-zinc-800 border-dashed")} title={!isAvailable ? "Horário indisponível para hoje" : ""}>
                                {isSelected ? <CheckCircle2 className="h-4 w-4"/> : <div className="w-4 h-4 rounded-full border border-zinc-300 dark:border-zinc-600"/>}{p}
                            </div>
                        )
                    })}
                </div>
             </div>
             
             <Separator className="my-2"/>
             
             <div className="grid gap-2 w-full">
                <Label htmlFor="lab">Sala</Label>
                <div className="relative">
                    <Select value={labId} onValueChange={setLabId} disabled>
                      <SelectTrigger className="w-full bg-muted text-muted-foreground opacity-100 cursor-not-allowed"><SelectValue placeholder="Laboratório" /></SelectTrigger>
                      <SelectContent>{laboratorios.map((lab: any) => (<SelectItem key={lab.id} value={String(lab.id)}>{lab.nome}</SelectItem>))}</SelectContent>
                    </Select>
                </div>
             </div>

             <div className="grid gap-2">
                <Label htmlFor="docente">Nome do Docente</Label>
                {currentUser?.role === "ADMIN" ? (
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione o docente" />
                        </SelectTrigger>
                        <SelectContent>
                            {usersOptions && usersOptions.map((u: any) => (
                                <SelectItem key={u.id} value={String(u.id)}>{u.nome}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : (
                    <div className="relative"><Input id="docente" value={currentUser?.nome || ""} readOnly className="bg-muted text-muted-foreground cursor-not-allowed border-dashed focus-visible:ring-0 pl-3 pr-20" tabIndex={-1} required /><div className="absolute inset-y-0 right-3 flex items-center pointer-events-none"><span className="text-xs text-muted-foreground bg-background px-1 border rounded shadow-sm">Seu nome</span></div></div>
                )}
             </div>

             <div className="grid gap-2"><Label htmlFor="disciplina">Turma <span className="text-xs font-normal text-muted-foreground ml-2"></span></Label><Input id="disciplina" placeholder="Ex: Algoritmos e Lógica" value={disciplina} onChange={(e) => setDisciplina(e.target.value)} /></div>
             <div className="grid gap-2"><Label htmlFor="obs">Observação <span className="text-xs font-normal text-muted-foreground ml-2"></span></Label><textarea id="obs" className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none" placeholder="Adicione observações..." value={observacao} onChange={(e) => setObservacao(e.target.value)} /></div>
             <div className="grid grid-cols-2 gap-4 pt-4"><Button type="button" variant="outline" onClick={onClose} className="w-full">Cancelar</Button><Button type="submit" className="w-full">Confirmar</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    )
}