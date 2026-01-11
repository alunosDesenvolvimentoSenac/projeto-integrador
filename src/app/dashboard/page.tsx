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
  SunMedium,
  Loader2,
  X, 
  Check, 
  Lock,
  Unlock,
  CalendarDays, 
  Info,
  Layers
} from "lucide-react"

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
  getSalasAction
} from "@/app/actions/agendamentos"

import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input" 
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/sonner" 
import { toast } from "sonner"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

type Periodo = "Manhã" | "Tarde" | "Noite"

interface Usuario {
  id: number
  nome: string
  email: string
  role: "ADMIN" | "USER"
}

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
  groupId?: string
  observacao?: string 
}

interface Sala {
  id: number;
  nome: string;
}

export default function Dashboard() {
  const today = new Date();
  today.setHours(0, 0, 0, 0); 

  const [date, setDate] = React.useState(new Date()) 
  
  const [agendamentos, setAgendamentos] = React.useState<Agendamento[]>([])
  const [laboratorios, setLaboratorios] = React.useState<Sala[]>([]) 
  const [isLoading, setIsLoading] = React.useState(true)
  
  const [currentUser, setCurrentUser] = React.useState<Usuario | null>(null)

  const [selectedLab, setSelectedLab] = React.useState("0") 
  const [filterStatus, setFilterStatus] = React.useState("todos")
  const [filterPeriod, setFilterPeriod] = React.useState("todos")
  
  const [selectedDayDetails, setSelectedDayDetails] = React.useState<{ day: number, month: number, year: number, appointments: Agendamento[] } | null>(null)
  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [isRangeMode, setIsRangeMode] = React.useState(false) 
  
  const [formInitialDate, setFormInitialDate] = React.useState<{
    day: number, 
    month: number, 
    year: number,
    periodoPre?: Periodo, 
    labIdPre?: string 
  } | null>(null)

  // --- 1. BUSCA DADOS DO USUÁRIO ---
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const infoBanco = await getDadosUsuarioSidebar(user.uid)
          
          if (infoBanco) {
            const roleMapeada = infoBanco.cargo === "Administrador" ? "ADMIN" : "USER"

            // Tenta forçar a conversão para Number para garantir
            const idUsuarioCorreto = Number((infoBanco as any).idUsuario);

            // Log para debug (abra o console F12 para ver se aparece o ID certo agora)
            console.log("ID recuperado do banco:", idUsuarioCorreto);

            setCurrentUser({
              id: idUsuarioCorreto || 0, // Se ainda falhar, fica 0, mas o log vai nos dizer
              nome: infoBanco.nomeUsuario,
              email: user.email || "",
              role: roleMapeada
            })
          }
        } catch (error) {
          console.error("Erro ao buscar dados do usuário:", error)
          toast.error("Erro ao carregar perfil do usuário.")
        }
      } else {
        setCurrentUser(null)
      }
    })

    return () => unsubscribe()
  }, [])

  // --- 2. BUSCA AGENDAMENTOS E SALAS ---
  const fetchData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const [dadosAgendamentos, dadosSalas] = await Promise.all([
        getAgendamentosAction(),
        getSalasAction()
      ]);
      
      setAgendamentos(dadosAgendamentos as unknown as Agendamento[])
      setLaboratorios(dadosSalas)
      
    } catch (error) {
      console.error("Erro", error)
      toast.error("Erro ao carregar dados.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const nextMonth = () => setDate(new Date(date.getFullYear(), date.getMonth() + 1, 1))
  const prevMonth = () => setDate(new Date(date.getFullYear(), date.getMonth() - 1, 1))
  const monthName = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  // --- INTERAÇÕES ---

  const handleDayClick = (day: number, month: number) => {
    const year = date.getFullYear()
    const isAdmin = currentUser?.role === "ADMIN"
    
    const clickedDate = new Date(year, month, day);
    const now = new Date();
    now.setHours(0,0,0,0); 

    if (clickedDate < now && !isAdmin) {
        toast.error("Data Retroativa", {
            description: "Não é possível realizar agendamentos em dias passados.",
            icon: <Lock className="h-4 w-4 text-red-500"/>
        })
        return;
    }

    if (selectedLab === "0") {
        toast.error("Laboratório não selecionado", {
            description: "Por favor, selecione um laboratório no filtro superior."
        })
        return; 
    }

    const apps = getAppointments(day, month, year)
    setSelectedDayDetails({ day, month, year, appointments: apps })
  }

  const handleOpenAddForm = (periodo?: Periodo, enableRange: boolean = false) => {
    if (selectedLab === "0") return;

    let targetDay = today.getDate();
    let targetMonth = today.getMonth();
    let targetYear = today.getFullYear();

    if (selectedDayDetails) {
        targetDay = selectedDayDetails.day;
        targetMonth = selectedDayDetails.month;
        targetYear = selectedDayDetails.year;
        setSelectedDayDetails(null) 
    }

    setFormInitialDate({
        day: targetDay,
        month: targetMonth,
        year: targetYear,
        periodoPre: periodo,
        labIdPre: selectedLab 
    })
    setIsRangeMode(enableRange) 
    setIsFormOpen(true)
  }

  // --- LÓGICA DE SALVAR NO BANCO ---
  const handleSaveAppointment = async (data: { 
    docente: string, 
    disciplina: string, 
    labId: number,
    startDetails: {d: number, m: number, y: number},
    endDateStr: string, 
    periodos: Periodo[],
    observacao?: string
  }) => {
    
    if (!currentUser || !currentUser.id || currentUser.id === 0) {
        toast.error("Erro de autenticação", {
            description: "Deslogue e faça login novamente para carregar o perfil..."
        });
        // Tenta recarregar a página se o ID não for encontrado
        return;
    }

    const startDate = new Date(data.startDetails.y, data.startDetails.m, data.startDetails.d);
    const [endY, endM, endD] = data.endDateStr.split('-').map(Number);
    const endDate = new Date(endY, endM - 1, endD);
    const actualEndDate = endDate < startDate ? startDate : endDate;

    const appointmentsToSave: any[] = [];
    
    const createDateLoop = new Date(startDate);
    const todayZero = new Date();
    todayZero.setHours(0,0,0,0);
    const now = new Date();
    const currentHour = now.getHours();

    const initialStatus = currentUser.role === "ADMIN" ? "confirmado" : "pendente";

    for (let d = createDateLoop; d <= actualEndDate; d.setDate(d.getDate() + 1)) {
        const currentDia = d.getDate();
        const currentMes = d.getMonth();
        const currentAno = d.getFullYear();

        const isLoopToday = d.getTime() === todayZero.getTime();

        data.periodos.forEach(p => {
              let skip = false;
              if (isLoopToday) {
                  if (p === 'Manhã' && currentHour >= 12) skip = true;
                  if (p === 'Tarde' && currentHour >= 18) skip = true;
                  if (p === 'Noite' && currentHour >= 22) skip = true;
              }

              const conflito = agendamentos.find(
                (a) => 
                    a.dia === currentDia && 
                    a.mes === currentMes && 
                    a.ano === currentAno && 
                    a.periodo === p &&
                    a.labId === data.labId
              );

              if (!skip && !conflito) {
                  appointmentsToSave.push({
                    dia: currentDia,
                    mes: currentMes,
                    ano: currentAno,
                    periodo: p,
                    status: initialStatus,
                    labId: data.labId,
                    observacao: data.observacao,
                    // OBS: O nome 'docente' aqui serve apenas para referência local
                    // O banco usará o ID para linkar
                    docente: currentUser.nome, 
                    disciplina: data.disciplina 
                  });
              }
        });
    }

    if (appointmentsToSave.length === 0) {
        toast.error("Nenhum horário disponível", {
            description: "Todos os horários selecionados já passaram ou estão ocupados."
        });
        return;
    }

    const shouldGroup = appointmentsToSave.length > 1;
    const generatedGroupId = shouldGroup 
        ? Math.random().toString(36).substr(2, 9) + Date.now().toString(36) 
        : null;

    const finalPayload = appointmentsToSave.map(app => ({
        ...app,
        groupId: generatedGroupId
    }));

    try {
        // Envia o ID CORRETO (currentUser.id) para o banco
        const result = await saveAgendamentoAction(finalPayload, currentUser.id);

        if (result.success) {
             fetchData(); 
             setIsFormOpen(false);

             const roleMsg = currentUser.role === 'ADMIN' ? "Agendamento confirmado!" : "Solicitação enviada!";
             toast.success(shouldGroup ? `Série ${currentUser.role === 'ADMIN' ? 'confirmada' : 'solicitada'} com sucesso!` : roleMsg);
        } else {
             console.error(result.error);
             toast.error("Erro ao salvar no banco de dados.");
        }
    } catch (e) {
        toast.error("Erro de conexão.");
    }
  }

  // --- LÓGICA DE EXCLUSÃO NO BANCO ---
  const handleDeleteAppointment = async (id: number, deleteAllInGroup: boolean = false) => {
    try {
        if (deleteAllInGroup) {
            const targetApp = agendamentos.find(a => a.id === id);
            
            if (targetApp && targetApp.groupId) {
                 await deleteSerieAction(targetApp.groupId);
                 toast.success("Série completa removida.");
            } else {
                await deleteAgendamentoAction(id);
                toast.success("Agendamento removido.");
            }
        } else {
            await deleteAgendamentoAction(id);
            toast.success("Agendamento removido.");
        }

        setAgendamentos(prev => prev.filter(a => a.id !== id)) 
        
        const [dadosAtualizados] = await Promise.all([getAgendamentosAction()]);
        setAgendamentos(dadosAtualizados as unknown as Agendamento[]);
        
        if (selectedDayDetails) {
            if (deleteAllInGroup) {
                setSelectedDayDetails(null);
            } else {
                const updatedList = selectedDayDetails.appointments.filter(a => a.id !== id) as Agendamento[];
                setSelectedDayDetails({ ...selectedDayDetails, appointments: updatedList });
            }
        }

    } catch (error) {
        toast.error("Erro ao remover agendamento.");
    }
  }

  // --- LÓGICA DE APROVAÇÃO NO BANCO ---
  const handleApproveAppointment = async (id: number, approveAllInGroup: boolean = false) => {
    try {
        if (approveAllInGroup) {
             const targetApp = agendamentos.find(a => a.id === id);
             if (targetApp && targetApp.groupId) {
                  await approveSerieAction(targetApp.groupId);
                  toast.success("Série completa aprovada!");

                  setAgendamentos(prev => prev.map(a => 
                      a.groupId === targetApp.groupId ? { ...a, status: "confirmado" } : a
                  ));

                  if (selectedDayDetails) {
                      const updatedList = selectedDayDetails.appointments.map(a => 
                          a.groupId === targetApp.groupId ? { ...a, status: "confirmado" } : a
                      ) as Agendamento[];
                      setSelectedDayDetails({ ...selectedDayDetails, appointments: updatedList })
                  }
             } else {
                  await approveAgendamentoAction(id);
                  toast.success("Agendamento aprovado!");
             }
        } else {
             const result = await approveAgendamentoAction(id);
             
             if (result.success) {
                  setAgendamentos(prev => prev.map(a => 
                     a.id === id ? { ...a, status: "confirmado" } : a
                  ))
      
                  if (selectedDayDetails) {
                     const updatedList = selectedDayDetails.appointments.map(a => 
                         a.id === id ? { ...a, status: "confirmado" } : a
                     ) as Agendamento[]; 
                     setSelectedDayDetails({ ...selectedDayDetails, appointments: updatedList })
                  }
                  toast.success("Agendamento aprovado!");
             } else {
                 toast.error("Erro ao aprovar.");
             }
        }
    } catch (error) {
        toast.error("Erro de conexão.");
    }
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
    if (selectedLab === "0") return [];

    return agendamentos.filter(
      (a) => {
        const matchDate = a.dia === day && a.mes === month && a.ano === year;
        const matchStatus = filterStatus === "todos" ? true : a.status === filterStatus;
        const matchPeriod = filterPeriod === "todos" ? true : a.periodo === filterPeriod;
        const matchLab = String(a.labId) === selectedLab;
        return matchDate && matchStatus && matchPeriod && matchLab;
      }
    )
  }

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
                  <BreadcrumbPage>Agendamentos</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          
          <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
              {currentUser ? (
                <span>Logado como: <strong>{currentUser.nome}</strong> ({currentUser.role})</span>
              ) : (
                <span>Carregando usuário...</span>
              )}
          </div>
        </header>

        <div className="flex flex-1 flex-col p-4 md:p-6 overflow-hidden h-[calc(100vh-64px)]">
          
          <div className="flex items-center justify-between w-full mb-6">
              <div className="flex items-center bg-white dark:bg-zinc-900 rounded-lg border shadow-sm p-1">
                <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8 text-zinc-500 hover:text-zinc-900"><ChevronLeft className="h-4 w-4" /></Button>
                <div className="px-4 border-x border-zinc-100 dark:border-zinc-800 mx-1 min-w-[180px] flex justify-center">
                    <span className="text-sm font-semibold capitalize text-zinc-700 dark:text-zinc-200 tracking-tight">{monthName}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8 text-zinc-500 hover:text-zinc-900"><ChevronRight className="h-4 w-4" /></Button>
              </div>

              <Button onClick={() => {
                if (selectedLab === "0") {
                    toast.error("Selecione um laboratório antes de criar um novo agendamento.")
                    return
                }
                handleOpenAddForm(undefined, true);
              }}>
                <Plus className="mr-2 h-4 w-4" /> Agendamento Personalizado
              </Button>
          </div>

          <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 mb-4"> 
              <div className="flex items-center gap-4 px-1 shrink-0">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-full border shadow-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Manhã
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-full border shadow-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Tarde
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-full border shadow-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-950 dark:bg-zinc-100"></span> Noite
                  </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto xl:justify-end">
                <div className="relative w-full sm:w-[200px]">
                    <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                        <SelectTrigger className="h-10 bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 shadow-sm w-full text-sm">
                          <div className="flex items-center gap-2 truncate">
                              <div className="bg-orange-100 dark:bg-orange-900/30 p-1 rounded-md shrink-0"><SunMedium className="h-4 w-4 text-orange-600 dark:text-orange-400" /></div>
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

                <div className="relative w-full sm:w-[200px]">
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="h-10 bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 shadow-sm w-full text-sm">
                          <div className="flex items-center gap-2 truncate">
                              <div className="bg-violet-100 dark:bg-violet-900/30 p-1 rounded-md shrink-0"><ListChecks className="h-4 w-4 text-violet-600 dark:text-violet-400" /></div>
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

                <div className="relative w-full sm:w-[280px]">
                    <Select value={selectedLab} onValueChange={setSelectedLab}>
                        <SelectTrigger className={cn(
                          "h-10 border-zinc-300 dark:border-zinc-700 shadow-sm w-full text-sm transition-colors",
                          selectedLab === "0" 
                            ? "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 ring-1 ring-red-200 dark:ring-red-900" 
                            : "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                        )}>
                          <div className="flex items-center gap-2 truncate">
                              <div className={cn(
                                "p-1 rounded-md shrink-0 transition-colors",
                                selectedLab === "0" ? "bg-zinc-200 dark:bg-zinc-700" : "bg-blue-100 dark:bg-blue-900/30"
                              )}>
                                  <FlaskConical className={cn(
                                    "h-4 w-4", 
                                    selectedLab === "0" ? "text-zinc-500" : "text-blue-600 dark:text-blue-400"
                                  )} />
                              </div>
                              <SelectValue placeholder="Procurar sala" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="0" className="text-muted-foreground font-medium">Preencher sala...</SelectItem>
                            {laboratorios.map((lab) => (
                                <SelectItem key={lab.id} value={String(lab.id)}>{lab.nome}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
              </div>
          </div>

          {/* GRID CALENDÁRIO */}
          <div className="flex-1 bg-white dark:bg-zinc-900 border rounded-xl shadow-sm flex flex-col overflow-hidden relative">
              {isLoading && (
                <div className="absolute inset-0 bg-white/80 dark:bg-zinc-950/80 z-50 flex items-center justify-center backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="text-sm font-medium text-muted-foreground">Carregando agenda...</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-7 border-b bg-zinc-50/80 dark:bg-zinc-900/50">
                {["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"].map((d) => (
                  <div key={d} className="py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    <span className="hidden md:inline">{d}</span>
                    <span className="md:hidden">{d.slice(0, 3)}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 flex-1 auto-rows-fr overflow-y-auto">
                {calendarDays.map((slot, i) => {
                  let slotYear = date.getFullYear();
                  if (slot.month === -1) slotYear = date.getFullYear() - 1; 
                  if (slot.month === 12) slotYear = date.getFullYear() + 1;

                  const apps = getAppointments(slot.day, slot.month, slotYear);
                  
                  const todayDate = new Date();
                  todayDate.setHours(0,0,0,0);
                  const slotDate = new Date(slotYear, slot.month, slot.day);
                  
                  const isToday = slotDate.getTime() === todayDate.getTime();
                  const isPastDay = slotDate < todayDate; 
                  
                  const isCurrentMonth = slot.currentMonth;
                  const dayOfWeek = slotDate.getDay(); 
                  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                  const isAdmin = currentUser?.role === "ADMIN";
                  
                  const isBlockedForUser = (isPastDay && !isAdmin) || (isWeekend && !isAdmin);

                  return (
                    <div 
                      key={i}
                      onClick={() => {
                        if (!isCurrentMonth) return;

                        if (isWeekend && !isAdmin) {
                            toast.error("Indisponível", {
                                description: "Não é possível realizar agendamentos aos fins de semana.",
                                icon: <AlertCircle className="h-4 w-4 text-red-500" />
                            })
                            return;
                        }

                        if (isPastDay && !isAdmin) {
                              toast.error("Data Retroativa", {
                                description: "Não é possível realizar agendamentos em dias passados.",
                                icon: <Lock className="h-4 w-4 text-red-500" />
                            })
                            return;
                        }

                        handleDayClick(slot.day, slot.month)
                      }}
                      className={cn(
                        "relative border-b border-r p-2 transition-all flex flex-col gap-1 min-h-[100px] select-none",
                        
                        isPastDay && !isAdmin && "bg-zinc-100/50 dark:bg-zinc-900/80 cursor-not-allowed opacity-60",
                        isPastDay && isAdmin && "bg-zinc-50/50 dark:bg-zinc-900/50 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800",

                        !isCurrentMonth && "bg-zinc-50/60 dark:bg-zinc-900/50 opacity-40 grayscale pointer-events-none",
                        
                        isCurrentMonth && isWeekend && !isAdmin ? "bg-red-50 dark:bg-red-950/10 cursor-not-allowed hover:bg-red-100/50 dark:hover:bg-red-900/20" : 
                        (isCurrentMonth && !isBlockedForUser && !isPastDay && "bg-background cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50")
                      )}
                    >
                      <div className="flex items-center justify-between">
                          <span className={cn(
                            "text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full transition-colors",
                            isToday && isCurrentMonth ? "bg-primary text-primary-foreground shadow-md font-bold" : "text-zinc-600 dark:text-zinc-400",
                             isWeekend && isCurrentMonth && "text-red-400 dark:text-red-400/70"
                          )}>
                              {slot.day}
                          </span>
                          
                          {isPastDay && isCurrentMonth && (
                             <Lock className="h-3 w-3 text-zinc-300 dark:text-zinc-700" />
                          )}

                           {isWeekend && isCurrentMonth && !isAdmin && !isPastDay && (
                             <Lock className="h-3 w-3 text-red-200 dark:text-red-900" />
                          )}
                      </div>

                      {(!isWeekend || isAdmin) && (
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

        <DayDetailsDialog 
          isOpen={!!selectedDayDetails}
          onClose={() => setSelectedDayDetails(null)}
          data={selectedDayDetails}
          monthName={monthName}
          onAddClick={(periodo: Periodo) => handleOpenAddForm(periodo, false)}
          onDelete={handleDeleteAppointment}
          onApprove={handleApproveAppointment}
          currentUser={currentUser}
        />

        <AppointmentFormDialog 
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          formData={formInitialDate}
          onSave={handleSaveAppointment}
          laboratorios={laboratorios} 
          currentUser={currentUser}
          isRangeMode={isRangeMode} 
        />

        <Toaster />
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
    const isSeries = !!app.groupId;

    return (
      <div 
        className={cn(
            "text-[11px] px-2 py-1 rounded-md border flex items-start gap-1.5 shadow-sm transition-all hover:opacity-80 min-h-[28px]", 
            bgStyles[app.status]
        )}
      >
        <div className={cn("w-1.5 h-1.5 rounded-full shrink-0 mt-1", dotColors[app.periodo])} />
        
        <div className="flex flex-col overflow-hidden leading-tight flex-1">
            <span className="truncate font-semibold">
                {app.docente}
            </span>
            {app.disciplina && (
                <span className="truncate text-[9px] opacity-80 font-normal">
                    {app.disciplina}
                </span>
            )}
        </div>

        {isSeries && (
            <div title="Série recorrente">
                <Layers className="h-3 w-3 opacity-60" /> 
            </div>
        )}
      </div>
    )
}
  
function DayDetailsDialog({ isOpen, onClose, data, monthName, onAddClick, onDelete, onApprove, currentUser }: any) {
    const [confirmationState, setConfirmationState] = React.useState<{
        isOpen: boolean;
        type: 'delete' | 'approve';
        item: { id: number, groupId?: string };
        step: 'select-scope' | 'confirm';
        scope: 'single' | 'series' | null;
    } | null>(null);

    React.useEffect(() => {
        if (!isOpen) {
            setConfirmationState(null);
        }
    }, [isOpen]);

    if (!data) return null
    const periodosOrder: Periodo[] = ["Manhã", "Tarde", "Noite"]
    const isAdmin = currentUser?.role === "ADMIN"

    const badgeColors: Record<string, string> = {
        Manhã: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 hover:bg-amber-100/80",
        Tarde: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-100/80",
        Noite: "bg-zinc-950 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950 hover:bg-zinc-900 dark:hover:bg-zinc-100"
    }

    const statusBadgeStyles = {
        disponivel: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-100/80",
        encerrado: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100/80",
        pendente: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 hover:bg-orange-100/80",
        confirmado: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 hover:bg-emerald-100/80",
    }

    const isPeriodExpired = (period: Periodo) => {
        const selectedDate = new Date(data.year, data.month, data.day);
        const today = new Date();
        today.setHours(0,0,0,0);

        if (selectedDate < today) return true;
        if (selectedDate > today) return false;

        const currentHour = new Date().getHours();
        if (period === 'Manhã' && currentHour >= 12) return true;
        if (period === 'Tarde' && currentHour >= 18) return true;
        if (period === 'Noite' && currentHour >= 21) return true; 

        return false;
    }

    const handleInitialAction = (type: 'delete' | 'approve', app: Agendamento) => {
        const hasSeries = !!app.groupId;
        
        setConfirmationState({
            isOpen: true,
            type: type,
            item: { id: app.id, groupId: app.groupId },
            step: hasSeries ? 'select-scope' : 'confirm',
            scope: hasSeries ? null : 'single'
        });
    }

    const confirmAction = () => {
        if (!confirmationState) return;
        const isSeries = confirmationState.scope === 'series';
        
        if (confirmationState.type === 'delete') {
            onDelete(confirmationState.item.id, isSeries);
        } else {
            onApprove(confirmationState.item.id, isSeries);
        }
        setConfirmationState(null);
    }

    const isDelete = confirmationState?.type === 'delete';
    const actionColorClass = isDelete 
        ? "bg-red-600 hover:bg-red-700" 
        : "bg-emerald-600 hover:bg-emerald-700";
    
    const actionTextClass = isDelete 
        ? "text-red-600 dark:text-red-400" 
        : "text-emerald-600 dark:text-emerald-400";
    
    const actionHoverClass = isDelete 
        ? "hover:bg-red-50 dark:hover:bg-red-950/20 border-red-100 dark:border-red-900/50" 
        : "hover:bg-emerald-50 dark:hover:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50";

    return (
      <>
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
                    const expired = isPeriodExpired(periodo);

                    return (
                        <div 
                            key={periodo} 
                            className={cn(
                                "group relative flex flex-col gap-1 rounded-xl border p-4 transition-all duration-200",
                                agendamento 
                                    ? "bg-card shadow-sm border-zinc-200 dark:border-zinc-800" 
                                    : expired 
                                        ? "bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 opacity-70"
                                        : "bg-zinc-50/50 border-dashed border-zinc-200 hover:border-zinc-300 dark:bg-zinc-900/50 dark:border-zinc-800"
                            )}
                        >
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Badge 
                                    variant="secondary" 
                                    className={cn("w-24 justify-center px-2.5 py-0.5 text-sm font-medium border-0", badgeColors[periodo])}
                                >
                                    <Clock className="mr-1.5 h-3.5 w-3.5" />{periodo}
                                </Badge>
                                
                                {!agendamento && (
                                    <Badge 
                                        variant="secondary" 
                                        className={cn("px-2.5 py-0.5 text-xs font-medium border-0", expired ? statusBadgeStyles.encerrado : statusBadgeStyles.disponivel)}
                                    >
                                        {expired ? <Lock className="mr-1.5 h-3 w-3"/> : <Unlock className="mr-1.5 h-3 w-3" />}
                                        {expired ? "Encerrado" : "Disponível"}
                                    </Badge>
                                )}

                                {agendamento && (
                                    <Badge 
                                        variant="secondary" 
                                        className={cn("px-2.5 py-0.5 text-xs font-medium border-0", agendamento.status === 'confirmado' ? statusBadgeStyles.confirmado : statusBadgeStyles.pendente)}
                                    >
                                        {agendamento.status === 'confirmado' ? <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> : <AlertCircle className="mr-1.5 h-3.5 w-3.5" />}
                                        <span className="uppercase">{agendamento.status}</span>
                                    </Badge>
                                )}

                                {agendamento && agendamento.groupId && (
                                    <div 
                                        className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-[10px] text-zinc-500 font-medium border border-zinc-200 dark:border-zinc-700" 
                                        title="Este item faz parte de uma série"
                                    >
                                        <Layers className="h-3 w-3" />
                                        <span>Série</span>
                                    </div>
                                )}

                                {agendamento && agendamento.observacao && (
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-500 hover:text-blue-700 hover:bg-blue-50">
                                                <Info className="h-4 w-4" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-64 text-sm text-zinc-700 dark:text-zinc-300">
                                            <p className="font-semibold mb-1">Observação:</p>
                                            {agendamento.observacao}
                                        </PopoverContent>
                                    </Popover>
                                )}
                            </div>
                            
                            <div className="flex items-center gap-1">
                                {agendamento && isAdmin && agendamento.status === 'pendente' && (
                                    <Button 
                                            variant="ghost" size="icon" 
                                            className="h-6 w-6 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                                            onClick={() => handleInitialAction('approve', agendamento)} 
                                            title="Aprovar Agendamento"
                                    >
                                            <Check className="h-4 w-4" />
                                    </Button>
                                )}

                                {agendamento && isAdmin && (
                                    <Button 
                                            variant="ghost" size="icon" 
                                            className="h-6 w-6 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                                            onClick={() => handleInitialAction('delete', agendamento)} 
                                            title="Remover Agendamento"
                                    >
                                            <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                        
                        {agendamento ? (
                            <div className="pl-1">
                                <div className="flex items-center gap-2 mt-1">
                                <div className="bg-zinc-100 dark:bg-zinc-800 p-2 rounded-full"><User className="h-4 w-4" /></div>
                                <div>
                                    <span className="block font-bold text-lg text-zinc-800 dark:text-zinc-100 leading-none">{agendamento.docente}</span>
                                    {agendamento.disciplina && (
                                        <div className="text-xs text-muted-foreground mt-0.5">
                                            <span>{agendamento.disciplina}</span>
                                        </div>
                                    )}
                                </div>
                                </div>
                            </div>
                        ) : (
                            !expired && (
                                <div className="mt-2 flex justify-center opacity-60 group-hover:opacity-100 transition-opacity">
                                    <Button 
                                        variant="ghost" 
                                        onClick={() => onAddClick(periodo)} 
                                        className="w-full border-2 border-dashed border-transparent hover:border-primary/20 hover:bg-primary/5 text-primary"
                                    >
                                        <Plus className="mr-2 h-4 w-4" /> Agendar Horário
                                    </Button>
                                </div>
                            )
                        )}
                        </div>
                    )
                })}
                </div>
            </ScrollArea>
            </DialogContent>
        </Dialog>

        <AlertDialog open={!!confirmationState} onOpenChange={(val) => !val && setConfirmationState(null)}>
            <AlertDialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg sm:rounded-lg">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-4 top-4 h-6 w-6 text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-sm z-10"
                    onClick={() => setConfirmationState(null)}
                >
                    <X className="h-4 w-4" />
                </Button>

                {confirmationState?.step === 'select-scope' && (
                    <div className="pt-2">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-center">
                                {isDelete ? "Remover" : "Aprovar"} Agendamento em Série
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-center">
                                Este agendamento se repete em outros dias. O que você deseja {isDelete ? "remover" : "aprovar"}?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                            <Button 
                                variant="outline" 
                                className="h-auto py-4 px-3 flex flex-col gap-1 items-center justify-center text-center hover:bg-zinc-50 dark:hover:bg-zinc-800"
                                onClick={() => setConfirmationState(prev => prev ? ({ ...prev, scope: 'single', step: 'confirm' }) : null)}
                            >
                                <span className="font-semibold text-foreground text-base">Apenas este dia</span>
                                <span className="text-xs text-muted-foreground font-normal">
                                    {isDelete ? "Mantém os outros dias." : "Aprova somente hoje."}
                                </span>
                            </Button>
                            
                            <Button 
                                variant="outline" 
                                className={cn("h-auto py-4 px-3 flex flex-col gap-1 items-center justify-center text-center", actionHoverClass)}
                                onClick={() => setConfirmationState(prev => prev ? ({ ...prev, scope: 'series', step: 'confirm' }) : null)}
                            >
                                <span className={cn("font-semibold text-base", actionTextClass)}>Toda a série</span>
                                <span className="text-xs text-muted-foreground font-normal">
                                    {isDelete ? "Exclui todos os vinculados." : "Aprova todos de uma vez."}
                                </span>
                            </Button>
                        </div>
                    </div>
                )}

                {confirmationState?.step === 'confirm' && (
                    <div className="pt-2">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-center">Confirmação Final</AlertDialogTitle>
                            <AlertDialogDescription className="text-center">
                                Tem certeza que deseja {isDelete ? "remover" : "aprovar"} <strong>{confirmationState.scope === 'series' ? 'todos os agendamentos da série' : 'este agendamento'}</strong>?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-6 sm:justify-center">
                            <AlertDialogAction 
                                className={cn("w-full sm:w-auto min-w-[150px]", actionColorClass)}
                                onClick={confirmAction}
                            >
                                Confirmar {isDelete ? "Exclusão" : "Aprovação"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </div>
                )}
            </AlertDialogContent>
        </AlertDialog>
      </>
    )
}

function AppointmentFormDialog({ isOpen, onClose, formData, onSave, laboratorios, currentUser, isRangeMode }: any) {
    // REMOVIDO o useState 'docente' para garantir que nunca fique com dado antigo
    const [disciplina, setDisciplina] = React.useState("")
    const [labId, setLabId] = React.useState("")
    const [observacao, setObservacao] = React.useState("")
    
    const [startDate, setStartDate] = React.useState<Date | undefined>(undefined)
    const [endDate, setEndDate] = React.useState<Date | undefined>(undefined)

    const [selectedPeriodos, setSelectedPeriodos] = React.useState<Periodo[]>([])
    
    const today = new Date();
    today.setHours(0,0,0,0);
  
    React.useEffect(() => {
        if(isOpen && formData) {
            setDisciplina("")
            setLabId(formData.labIdPre || "")
            setObservacao("") 
            
            if (formData.periodoPre) {
                setSelectedPeriodos([formData.periodoPre])
            } else {
                setSelectedPeriodos([])
            }

            const y = formData.year;
            const initialDate = new Date(y, formData.month, formData.day);
            setStartDate(initialDate);
            
            if (isRangeMode) {
                const nextDay = new Date(initialDate);
                nextDay.setDate(nextDay.getDate() + 1);
                setEndDate(nextDay);
            } else {
                setEndDate(initialDate);
            }
        }
    }, [isOpen, formData, isRangeMode])

    const handleStartDateSelect = (date: Date | undefined) => {
        if (!date) return;
        setStartDate(date);
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        if (!endDate || endDate < nextDay) {
            setEndDate(nextDay);
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if(!labId || selectedPeriodos.length === 0 || !startDate || !endDate) {
            toast.error("Preencha todos os campos obrigatórios.")
            return
        }

        const yEnd = endDate.getFullYear();
        const mEnd = String(endDate.getMonth() + 1).padStart(2, '0');
        const dEnd = String(endDate.getDate()).padStart(2, '0');
        const endDateFormatted = `${yEnd}-${mEnd}-${dEnd}`;
        
        onSave({ 
            // FORÇA o envio do nome atual do usuário. 
            // Se 'currentUser' estiver correto no Dialog (como você disse que aparece visualmente), 
            // isso garantirá que o payload enviado também esteja correto.
            docente: currentUser?.nome || "", 
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
        
        const startZero = new Date(startDate);
        startZero.setHours(0, 0, 0, 0);

        if (startZero > today) return true;
        if (startZero < today) return false;

        const currentHour = new Date().getHours();

        if (turno === 'Manhã' && currentHour >= 12) return false;
        if (turno === 'Tarde' && currentHour >= 18) return false;
        if (turno === 'Noite' && currentHour >= 22) return false; 

        return true;
    }

    const togglePeriodo = (p: Periodo) => {
        if (!isRangeMode && !isTurnoDisponivel(p)) return; 
        
        // CORREÇÃO: UM POR VEZ
        setSelectedPeriodos(prev => 
            prev.includes(p) ? [] : [p]
        )
    }
  
    if (!formData) return null
  
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>{isRangeMode ? "Novo Agendamento" : "Agendar para o dia"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
             {isRangeMode ? (
                <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="startDate" className="text-xs text-muted-foreground uppercase font-semibold">Data Inicial</Label>
                         <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !startDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {startDate ? format(startDate, "PPP", { locale: ptBR }) : <span>Selecione...</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={startDate}
                              onSelect={handleStartDateSelect}
                              initialFocus
                              locale={ptBR}
                              disabled={(date) => date < today}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label htmlFor="endDate" className="text-xs text-muted-foreground uppercase font-semibold">Data Final</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !endDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {endDate ? format(endDate, "PPP", { locale: ptBR }) : <span>Selecione...</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={endDate}
                              onSelect={setEndDate}
                              initialFocus
                              locale={ptBR}
                              disabled={(date) => !startDate || date <= startDate}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                </div>
             ) : (
                <div className="flex flex-col gap-2">
                    <Label className="text-xs text-muted-foreground uppercase font-semibold">Data do Agendamento</Label>
                    <div className="flex items-center justify-center p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-md border text-sm font-medium w-full text-zinc-600 dark:text-zinc-400 cursor-not-allowed">
                        <CalendarDays className="mr-2 h-4 w-4 opacity-50"/>
                        {formData.day}/{formData.month + 1}/{formData.year}
                    </div>
                </div>
             )}
             
             <div className="flex flex-col gap-2">
                <Label className="text-xs text-muted-foreground uppercase font-semibold mb-1">Turnos</Label>
                <div className="flex gap-2">
                    {(["Manhã", "Tarde", "Noite"] as Periodo[]).map((p) => {
                        const isSelected = selectedPeriodos.includes(p);
                        const isAvailable = isRangeMode ? true : isTurnoDisponivel(p);

                        return (
                            <div 
                                key={p}
                                onClick={() => togglePeriodo(p)}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 p-2.5 rounded-md border transition-all select-none text-sm font-medium",
                                    !isAvailable && "opacity-40 cursor-not-allowed bg-zinc-100 dark:bg-zinc-800",
                                    isAvailable && "cursor-pointer",
                                    isAvailable && isSelected 
                                        ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                                        : isAvailable && "bg-background hover:bg-zinc-50 dark:hover:bg-zinc-800 border-dashed"
                                )}
                                title={!isAvailable ? "Horário indisponível para hoje" : ""}
                            >
                                {isSelected ? <CheckCircle2 className="h-4 w-4"/> : <div className="w-4 h-4 rounded-full border border-zinc-300 dark:border-zinc-600"/>}
                                {p}
                            </div>
                        )
                    })}
                </div>
             </div>
             
             <Separator className="my-2"/>

             <div className="grid gap-2">
                <Label htmlFor="docente">Nome do Docente</Label>
                <div className="relative">
                    {/* Leitura direta da prop, garantindo que o que você vê é o que será enviado */}
                    <Input 
                        id="docente" 
                        value={currentUser?.nome || ""} 
                        readOnly={true} 
                        className="bg-muted text-muted-foreground cursor-not-allowed border-dashed focus-visible:ring-0"
                        tabIndex={-1}
                        required 
                    />
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                        <span className="text-xs text-muted-foreground bg-background px-1 border rounded shadow-sm">Seu nome</span>
                    </div>
                </div>
             </div>

             <div className="grid gap-2 w-full">
                <Label htmlFor="lab">Laboratório</Label>
                <div className="relative">
                    <Select value={labId} onValueChange={setLabId} disabled>
                      <SelectTrigger className="w-full bg-muted text-muted-foreground opacity-100 cursor-not-allowed">
                        <SelectValue placeholder="Laboratório" />
                      </SelectTrigger>
                      <SelectContent>
                        {laboratorios.map((lab: any) => (<SelectItem key={lab.id} value={String(lab.id)}>{lab.nome}</SelectItem>))}
                      </SelectContent>
                    </Select>
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                        <span className="text-xs text-muted-foreground bg-background px-1 border rounded shadow-sm">Sala desejada</span>
                    </div>
                </div>
             </div>

             <div className="grid gap-2">
                <Label htmlFor="disciplina">Disciplina / Curso <span className="text-xs font-normal text-muted-foreground ml-2">(Opcional)</span></Label>
                <Input id="disciplina" placeholder="Ex: Algoritmos e Lógica" value={disciplina} onChange={(e) => setDisciplina(e.target.value)} />
             </div>

             <div className="grid gap-2">
                <Label htmlFor="obs">Observação <span className="text-xs font-normal text-muted-foreground ml-2">(Opcional)</span></Label>
                <textarea 
                    id="obs" 
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Adicione observações, justificativas ou detalhes extras..." 
                    value={observacao} 
                    onChange={(e) => setObservacao(e.target.value)} 
                />
            </div>
             
             <div className="grid grid-cols-2 gap-4 pt-4">
                 <Button type="button" variant="outline" onClick={onClose} className="w-full">
                   Cancelar
                 </Button>
                 <Button type="submit" className="w-full">
                   Confirmar
                 </Button>
             </div>
          </form>
        </DialogContent>
      </Dialog>
    )
}